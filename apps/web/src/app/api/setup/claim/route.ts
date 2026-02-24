import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/setup/claim
 *
 * Generates a claim code for the install.sh polling flow.
 * No auth, no DB write — the code is just a random string.
 * The setup page will create the SetupToken with this claimCode
 * when the user completes the flow.
 */
export async function POST() {
  try {
    const claimCode = randomBytes(12).toString('hex'); // 24-char hex

    return NextResponse.json({
      claimCode,
      setupUrl: `https://tpmjs.com/setup?claim=${claimCode}`,
    });
  } catch (error) {
    console.error('[Setup] Error creating claim:', error);
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 });
  }
}
