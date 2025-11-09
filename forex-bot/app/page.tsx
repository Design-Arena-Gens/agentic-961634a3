import { Suspense } from 'react';
import { BotDashboard } from '../components/BotDashboard';

export default function Page() {
  return (
    <main>
      <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading bot dashboard...</div>}>
        <BotDashboard />
      </Suspense>
    </main>
  );
}
