import { NextResponse } from 'next/server';
import { FirestoreService } from '@/lib/firestore-service';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    if (secret !== process.env.ADMIN_RESET_SECRET || !secret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const result = await FirestoreService.purgeAllRemoteData();
    return NextResponse.json({
      success: true,
      message: 'All remote Firestore accounts, bands, invites, and data have been wiped clean.',
      deletedCount: result.deletedCount,
      details: result.details,
    });
  } catch (err: any) {
    console.error('Error during Firestore purge:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Purge failed' }, { status: 500 });
  }
}
