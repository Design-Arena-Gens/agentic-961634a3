import { NextResponse } from 'next/server';
import { TradingEngine } from '../../../lib/tradingEngine';
import { logger } from '../../../lib/logger';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const engine = new TradingEngine({});
    const state = await engine.runCycle();
    return NextResponse.json({ status: 'ok', state });
  } catch (error) {
    logger.error('Cron cycle failed', { error });
    return NextResponse.json({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
