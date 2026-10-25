import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const record = await prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ error: 'Uploaded file not found' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'uploads', record.fileName);
    try {
      const buffer = await fs.readFile(filePath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': record.mimeType,
          'Content-Disposition': `inline; filename="${record.originalName}"`,
          'X-File-SHA256': record.sha256Hash,
        },
      });
    } catch {
      return NextResponse.json({ error: 'Physical file not found on disk' }, { status: 404 });
    }
  } catch (err: any) {
    console.error('Error serving upload:', err);
    return NextResponse.json({ error: 'Failed to retrieve uploaded document' }, { status: 500 });
  }
}
