'use client';

import { useState } from 'react';
import { calculateRosterScoresMultiWeek } from '@/app/lib/roster-scoring-actions';
import { lusitana } from '@/app/ui/fonts';
import HomeButton from '@/app/ui/home-button';

export default function CalculateScoresPage() {
  const [season, setSeason] = useState(2025);
  const [startWeek, setStartWeek] = useState(18);
  const [endWeek, setEndWeek] = useState(18);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCalculate = async () => {
    setLoading(true);
    setMessage('Calculating roster scores...');
    
    try {
      const result = await calculateRosterScoresMultiWeek(season, startWeek, endWeek);
      
      if (result.success) {
        const summary = result.summary.split('\n').map(line => `• ${line}`).join('\n');
        setMessage(`✅ Success! Calculated scores for weeks ${startWeek}-${endWeek}\n\n${summary}\n\nTotal: ${result.totalUpdated} roster entries updated`);
      } else {
        setMessage('❌ Failed to calculate scores');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-2xl md:text-4xl`}>
            <span className="md:hidden">Calc Scores</span>
            <span className="hidden md:inline">Calculate Roster Scores</span>
          </h1>
          <HomeButton />
        </div>
      </div>

      <div className="mt-6 rounded-md bg-gray-50 p-6 max-w-2xl">
        <p className="mb-4 text-sm text-gray-600">
          This tool calculates fantasy points for each roster entry based on the player stats 
          stored in weeklyActuals. Run this after syncing actuals for a week.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="season" className="block text-sm font-medium mb-1">
              Season Year
            </label>
            <input
              id="season"
              type="number"
              value={season}
              onChange={(e) => setSeason(parseInt(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startWeek" className="block text-sm font-medium mb-1">
                Start Week
              </label>
              <input
                id="startWeek"
                type="number"
                min="1"
                max="22"
                value={startWeek}
                onChange={(e) => setStartWeek(parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="endWeek" className="block text-sm font-medium mb-1">
                End Week
              </label>
              <input
                id="endWeek"
                type="number"
                min="1"
                max="22"
                value={endWeek}
                onChange={(e) => setEndWeek(parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? 'Calculating...' : 'Calculate Scores'}
          </button>
        </div>

        {message && (
          <div className="mt-6 rounded-md bg-white dark:bg-gray-700 p-4 border border-gray-200 dark:border-gray-600">
            <pre className="text-sm whitespace-pre-wrap text-gray-900 dark:text-white">{message}</pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-semibold text-sm mb-2">Workflow:</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>First, sync actuals from ESPN (admin/sync-actuals)</li>
            <li>Then, run this tool to calculate roster scores</li>
            <li>View updated scores on the roster pages</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
