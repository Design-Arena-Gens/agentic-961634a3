import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBotState, setBotState } from '../../../lib/state';
import { logger } from '../../../lib/logger';

export const runtime = 'nodejs';

const symbolSchema = z.object({
  symbol: z.string(),
  timeframe: z.string(),
  maxSimultaneousTrades: z.number().min(1).max(10),
  riskPerTrade: z.number().min(0.001).max(0.05),
  minConfidence: z.number().min(0.1).max(1)
});

const configSchema = z.object({
  symbols: z.array(symbolSchema).min(1),
  maxDailyLossPercent: z.number().min(1).max(20),
  maxDrawdownPercent: z.number().min(5).max(50),
  maxTotalExposurePercent: z.number().min(1).max(100),
  tradeCooldownMinutes: z.number().min(1).max(240)
});

export async function GET() {
  const state = getBotState();
  return NextResponse.json({ config: state.config });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid configuration', issues: parsed.error.issues }, { status: 400 });
  }
  const state = getBotState();
  setBotState({ ...state, config: parsed.data });
  logger.info('Bot configuration updated');
  return NextResponse.json({ config: parsed.data });
}
