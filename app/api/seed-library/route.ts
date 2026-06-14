import { NextResponse } from 'next/server';
import { getGlobalSeeds, isGlobalSeedLibraryConfigured } from '../../lib/globalSeedLibrary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configured = isGlobalSeedLibraryConfigured();
    const seeds = configured ? await getGlobalSeeds(120) : [];

    return NextResponse.json({
      configured,
      seeds,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: isGlobalSeedLibraryConfigured(),
        seeds: [],
        error: error instanceof Error ? error.message : 'Could not load global seed library.'
      },
      { status: 500 }
    );
  }
}
