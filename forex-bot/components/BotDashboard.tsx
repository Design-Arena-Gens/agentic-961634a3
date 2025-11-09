'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type AccountResponse = {
  account: {
    equity: number;
    balance: number;
    marginFree: number;
    openPositions: number;
    currency: string;
  };
  state: {
    running: boolean;
    lastRun?: string;
    lastError?: string;
    openTrades: unknown[];
    config: {
      symbols: {
        symbol: string;
        timeframe: string;
        maxSimultaneousTrades: number;
        riskPerTrade: number;
        minConfidence: number;
      }[];
    };
  };
};

type LogEntry = {
  id: string;
  ts: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
};

const fetchJson = async <T,>(url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}`);
  }
  return (await response.json()) as T;
};

export function BotDashboard() {
  const [accountData, setAccountData] = useState<AccountResponse | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [account, logResponse] = await Promise.all([
        fetchJson<AccountResponse>('/api/account', { cache: 'no-store' }),
        fetchJson<{ logs: LogEntry[] }>('/api/logs', { cache: 'no-store' })
      ]);
      setAccountData(account);
      setLogs(logResponse.logs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleAction = useCallback(async (action: 'start' | 'stop' | 'cycle') => {
    try {
      setLoading(true);
      await fetchJson(`/api/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bot action failed');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const statusColor = useMemo(() => {
    if (!accountData?.state.running) return 'bg-slate-800 text-slate-200';
    return 'bg-success/20 text-success border border-success/40';
  }, [accountData?.state.running]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Gemini Forex Autobot</h1>
          <p className="text-sm text-slate-400">Autonomous Gemini-powered MetaTrader 5 execution engine</p>
        </div>
        <div className={`badge ${statusColor}`}>
          {accountData?.state.running ? 'Running' : 'Stopped'}
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-danger">
          {error}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-3">
        <div className="card p-6 space-y-2">
          <div className="text-xs uppercase text-slate-400">Equity</div>
          <div className="text-3xl font-semibold">
            {accountData ? `${accountData.account.currency} ${accountData.account.equity.toFixed(2)}` : '---'}
          </div>
        </div>
        <div className="card p-6 space-y-2">
          <div className="text-xs uppercase text-slate-400">Free Margin</div>
          <div className="text-3xl font-semibold">
            {accountData ? `${accountData.account.currency} ${accountData.account.marginFree.toFixed(2)}` : '---'}
          </div>
        </div>
        <div className="card p-6 space-y-2">
          <div className="text-xs uppercase text-slate-400">Open Positions</div>
          <div className="text-3xl font-semibold">
            {accountData ? accountData.account.openPositions : '---'}
          </div>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleAction('start')}
            disabled={loading || accountData?.state.running}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Bot
          </button>
          <button
            onClick={() => handleAction('stop')}
            disabled={loading || !accountData?.state.running}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Stop Bot
          </button>
          <button
            onClick={() => handleAction('cycle')}
            disabled={loading}
            className="rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:bg-success/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Run Cycle Now
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase text-slate-500">Last Run</div>
            <div className="text-sm text-slate-300">
              {accountData?.state.lastRun ? new Date(accountData.state.lastRun).toLocaleString() : 'Never'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Last Error</div>
            <div className="text-sm text-slate-300">
              {accountData?.state.lastError ?? 'None'}
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Trading Universe</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {accountData?.state.config.symbols.map((symbol) => (
            <div key={symbol.symbol} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-lg font-semibold">{symbol.symbol}</div>
              <div className="text-xs uppercase text-slate-400">Timeframe</div>
              <div className="text-sm text-slate-300">{symbol.timeframe}</div>
              <div className="mt-2 text-xs uppercase text-slate-400">Risk / Trade</div>
              <div className="text-sm text-slate-300">{(symbol.riskPerTrade * 100).toFixed(2)}%</div>
              <div className="mt-2 text-xs uppercase text-slate-400">Confidence Threshold</div>
              <div className="text-sm text-slate-300">{(symbol.minConfidence * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Execution Log</h2>
          <button onClick={refresh} className="text-xs uppercase text-primary hover:underline">
            Refresh
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0 && <div className="text-sm text-slate-400">No log entries yet.</div>}
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{new Date(log.ts).toLocaleString()}</span>
                <span className="uppercase tracking-wide">{log.level}</span>
              </div>
              <div className="mt-2 text-sm text-slate-200">{log.message}</div>
              {log.context && (
                <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-2 text-xs text-slate-400">
                  {JSON.stringify(log.context, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
