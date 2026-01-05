'use client';

import { useState } from 'react';
import { syncMultipleWeeksActuals } from '@/app/lib/actuals-actions';
import HomeButton from '@/app/ui/home-button';

export default function SyncActualsPage() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState(currentYear);
  const [startWeek, setStartWeek] = useState(1);
  const [endWeek, setEndWeek] = useState(17);

  async function handleSync() {
    setSyncing(true);
    setMessage('');

    try {
      const result = await syncMultipleWeeksActuals(season, startWeek, endWeek);
      
      if (result.success) {
        const summary = result.results.map(r => 
          `Week ${r.week}: ${r.updated} players, ${r.skipped} skipped`
        ).join('\n');
        
        const totalUpdated = result.results.reduce((sum, r) => sum + r.updated, 0);
        setMessage(`✅ Success! Synced weeks ${startWeek}-${endWeek}\n\n${summary}\n\nTotal: ${totalUpdated} player-week records`);
      } else {
        setMessage('❌ Sync failed. Check console for details.');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <HomeButton />
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Sync Weekly Actuals</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Season
            </label>
            <input
              type="number"
              value={season}
              onChange={(e) => setSeason(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={syncing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Week
            </label>
            <input
              type="number"
              min="1"
              max="18"
              value={startWeek}
              onChange={(e) => setStartWeek(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={syncing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Week
            </label>
            <input
              type="number"
              min="1"
              max="18"
              value={endWeek}
              onChange={(e) => setEndWeek(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={syncing}
            />
          </div>
        </div>
        
        <button
          onClick={handleSync}
          disabled={syncing || startWeek > endWeek}
          className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? 'Syncing...' : `Sync Weeks ${startWeek}-${endWeek}`}
        </button>
        
        {message && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap dark:text-white">{message}</pre>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">📋 Instructions</h2>
        <ul className="text-sm text-blue-900 space-y-1">
          <li>• This syncs actual fantasy points scored by players each week from ESPN</li>
          <li>• Data is stored for analysis (e.g., projecting playoff performance)</li>
          <li>• Includes complete stats JSON for detailed analysis</li>
          <li>• Takes approximately 1-2 seconds per week (includes delays)</li>
        </ul>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <h2 className="font-semibold text-yellow-900 mb-2">⚠️ Note</h2>
        <ul className="text-sm text-yellow-900 space-y-1">
          <li>• Only players with ESPN IDs will be synced</li>
          <li>• Players without stats for a week will be skipped</li>
          <li>• Re-running will update existing records (safe to re-sync)</li>
          <li>• This table can be deleted later when analysis is complete</li>
        </ul>
      </div>
    </div>
  );
}
