'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import HomeButton from '@/app/ui/home-button';
import { syncProjectionsFromSleeper, getCurrentNFLWeek } from '@/app/lib/projections-actions';

export default function SyncProjectionsPage() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; updated?: number; skipped?: number; error?: string } | null>(null);
  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState(currentYear);
  const [week, setWeek] = useState(getCurrentNFLWeek());

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    
    const response = await syncProjectionsFromSleeper(season, week);
    setResult(response);
    setSyncing(false);
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-3xl md:text-4xl`}>
            Sync Player Projections
          </h1>
          <HomeButton />
        </div>
      </div>

      <div className="mt-6 max-w-2xl">
        <div className="rounded-lg bg-gray-50 p-6">
          <h2 className="text-xl font-semibold mb-4">Update Projections from Sleeper</h2>
          
          <div className="mb-6 space-y-4">
            <div>
              <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
                Season Year
              </label>
              <input
                type="number"
                id="season"
                value={season}
                onChange={(e) => setSeason(parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-4 py-2"
                min={2020}
                max={2030}
              />
            </div>

            <div>
              <label htmlFor="week" className="block text-sm font-medium text-gray-700 mb-2">
                NFL Week
              </label>
              <input
                type="number"
                id="week"
                value={week}
                onChange={(e) => setWeek(parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-4 py-2"
                min={1}
                max={22}
              />
              <p className="text-sm text-gray-500 mt-1">
                Regular season: weeks 1-18, Playoffs: weeks 19-22
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">About Projections</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Projections are fetched from Sleeper's API</li>
                  <li>• Uses Half PPR scoring to match your league settings</li>
                  <li>• Projections may be limited or unavailable for playoff weeks</li>
                  <li>• Sync once per week or when matchups change</li>
                  <li>• This will update projections for all players in your database</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full rounded-md bg-purple-600 px-4 py-3 text-white font-medium hover:bg-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {syncing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing Projections...
              </span>
            ) : (
              'Sync Projections'
            )}
          </button>

          {result && (
            <div className={`mt-6 rounded-md p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mt-0.5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-green-800 mb-1">Sync Complete!</h3>
                    <p className="text-sm text-green-700">
                      Updated {result.updated} players with projections
                    </p>
                    {result.skipped > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        Skipped {result.skipped} players (no projection available or no ESPN ID)
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-600 mt-0.5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800 mb-1">Sync Failed</h3>
                    <p className="text-sm text-red-700">{result.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">How It Works</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Fetches all NFL players from Sleeper API</li>
            <li>Fetches projections for the specified week</li>
            <li>Matches Sleeper players to your database using ESPN IDs</li>
            <li>Updates projected points for each player (Half PPR scoring)</li>
            <li>Projections appear on the Scores page next to live stats</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
