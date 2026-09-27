import { NextResponse } from 'next/server';
import { FirestoreService } from '@/lib/firestore-service';

export async function POST(req: Request) {
  try {
    const result = await FirestoreService.purgeAllRemoteData();
    return NextResponse.json({
      success: true,
      message: 'All remote Firestore accounts, bands, invites, and data have been wiped clean.',
      deletedCount: result.deletedCount,
    });
  } catch (err: any) {
    console.error('Error during Firestore purge:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Purge failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const result = await FirestoreService.purgeAllRemoteData();
    return NextResponse.json({
      success: true,
      message: 'All remote Firestore accounts, bands, invites, and data have been wiped clean.',
      deletedCount: result.deletedCount,
    });
  } catch (err: any) {
    console.error('Error during Firestore purge:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Purge failed' }, { status: 500 });
  }
}
