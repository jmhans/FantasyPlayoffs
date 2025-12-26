'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import { syncPlayersFromESPN } from '@/app/lib/player-actions';

export default function SyncPlayersPage() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; count?: number; error?: string } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    
    const response = await syncPlayersFromESPN();
    setResult(response);
    setSyncing(false);
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-3xl md:text-4xl`}>
            Sync NFL Players
          </h1>
          <Link
            href="/"
            className="flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-100"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <div className="mt-6 max-w-2xl">
        <div className="rounded-lg bg-gray-50 p-6">
          <h2 className="text-lg font-semibold mb-4">Import Player Data from ESPN</h2>
          <p className="text-sm text-gray-600 mb-6">
            This will fetch all NFL players from ESPN and sync them to your database.
            This may take a few minutes to complete.
          </p>

          {result && result.success && (
            <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">
              Successfully synced {result.count} players!
            </div>
          )}

          {result && result.error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {result.error}
            </div>
          )}

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing Players...' : 'Sync Players from ESPN'}
          </button>
        </div>
      </div>
    </main>
  );
}
