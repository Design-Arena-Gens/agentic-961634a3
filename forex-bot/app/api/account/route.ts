import { NextResponse } from 'next/server';
import { TradingEngine } from '../../../lib/tradingEngine';
import { getBotState } from '../../../lib/state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const engine = new TradingEngine({});
    const account = await engine.getAccountSummary();
    const state = getBotState();
    return NextResponse.json({ account, state });
  } catch (error) {
    return NextResponse.json(
      {
        account: null,
        state: getBotState(),
        error: error instanceof Error ? error.message : 'Unable to connect to MetaTrader'
      },
      { status: 200 }
    );
  }
}
