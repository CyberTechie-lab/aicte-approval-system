import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const entityType = (formData.get('entityType') as string) || 'GENERAL';
    const entityId = (formData.get('entityId') as string) || 'unknown';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum permitted statutory limit of 10 MB.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF, JPEG, and PNG statutory documents are permitted.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Compute SHA-256 hash
    const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Generate safe storage filename
    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.png');
    const randomName = `${crypto.randomUUID()}${ext}`;
    const uploadsDir = path.join(process.cwd(), 'uploads');

    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, randomName);
    await fs.writeFile(filePath, buffer);

    // Record in DB
    const record = await prisma.uploadedFile.create({
      data: {
        originalName: file.name,
        fileName: randomName,
        fileSize: file.size,
        mimeType: file.type,
        sha256Hash,
        uploadedBy: user.name,
        entityType,
        entityId,
      },
    });

    return NextResponse.json({
      success: true,
      fileId: record.id,
      originalName: record.originalName,
      fileUrl: `/api/uploads/${record.id}`,
      sha256Hash,
    });
  } catch (err: any) {
    console.error('Error handling upload:', err);
    return NextResponse.json({ error: 'Failed to process document upload' }, { status: 500 });
  }
}
