export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runComplianceSweep } = await import('@/lib/rulesEngine');
    const cron = (await import('node-cron')).default;

    // Run compliance sweep on server startup
    try {
      console.log('[AICTE Regulatory Sentinel] Running startup compliance sweep...');
      await runComplianceSweep();
      console.log('[AICTE Regulatory Sentinel] Startup compliance sweep complete.');
    } catch (e) {
      console.error('[AICTE Regulatory Sentinel] Startup sweep error:', e);
    }

    // Schedule recurring sweep every 15 minutes in dev
    cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('[AICTE Regulatory Sentinel] Running scheduled 15-min compliance sweep...');
        await runComplianceSweep();
      } catch (e) {
        console.error('[AICTE Regulatory Sentinel] Cron sweep error:', e);
      }
    });
    console.log('[AICTE Regulatory Sentinel] node-cron 15-minute compliance sweep initialized.');
  }
}
