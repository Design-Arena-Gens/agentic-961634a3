import { NextRequest, NextResponse } from 'next/server';
import { getBotState, setBotState, updateBotState } from '../../../lib/state';
import { logger } from '../../../lib/logger';
import { TradingEngine } from '../../../lib/tradingEngine';

export const runtime = 'nodejs';

function createEngine() {
  return new TradingEngine({});
}

export async function GET() {
  const state = getBotState();
  return NextResponse.json({ state });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body?.action as string;

  if (!['start', 'stop', 'cycle'].includes(action)) {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }

  if (action === 'start') {
    updateBotState({ running: true, lastError: undefined });
    logger.info('Trading bot started');
    return NextResponse.json({ state: getBotState() });
  }

  if (action === 'stop') {
    updateBotState({ running: false });
    logger.info('Trading bot stopped');
    return NextResponse.json({ state: getBotState() });
  }

  try {
    const engine = createEngine();
    const state = await engine.runCycle();
    return NextResponse.json({ state });
  } catch (error) {
    logger.error('Cycle execution failed', { error });
    const state = getBotState();
    setBotState({ ...state, lastError: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Cycle failed', details: state.lastError }, { status: 500 });
  }
}
