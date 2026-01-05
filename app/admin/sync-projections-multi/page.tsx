'use client';

import { useState } from 'react';
import { syncMultipleWeeks } from '@/app/lib/projections-actions';
import HomeButton from '@/app/ui/home-button';

export default function SyncProjectionsMultiPage() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState(currentYear);
  const [startWeek, setStartWeek] = useState(19);
  const [endWeek, setEndWeek] = useState(22);

  async function handleSync() {
    setSyncing(true);
    setMessage('');

    try {
      const result = await syncMultipleWeeks(season, startWeek, endWeek);
      
      if (result.success) {
        const summary = result.results.map(r => 
          `Week ${r.week}: ${r.updated} projections, ${r.noProjection} no data, ${r.noMatch} no match`
        ).join('\n');
        
        const totalUpdated = result.results.reduce((sum, r) => sum + r.updated, 0);
        setMessage(`✅ Success! Synced weeks ${startWeek}-${endWeek}\n\n${summary}\n\nTotal: ${totalUpdated} player projections`);
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
      
      <h1 className="text-3xl font-bold mb-6">Sync Projections (Multiple Weeks)</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Week
            </label>
            <input
              type="number"
              min="1"
              max="22"
              value={startWeek}
              onChange={(e) => setStartWeek(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={syncing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Week
            </label>
            <input
              type="number"
              min="1"
              max="22"
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
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? 'Syncing...' : `Sync Weeks ${startWeek}-${endWeek}`}
        </button>
        
        {message && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{message}</pre>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">📋 Instructions</h2>
        <ul className="text-sm text-blue-900 space-y-1">
          <li>• This will sync projections for multiple weeks in sequence</li>
          <li>• Weeks 19-22 are playoff weeks (Wild Card, Divisional, Conference, Super Bowl)</li>
          <li>• Takes approximately 20-30 seconds per week</li>
          <li>• Check the terminal output for detailed progress</li>
        </ul>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <h2 className="font-semibold text-yellow-900 mb-2">⚠️ Note</h2>
        <ul className="text-sm text-yellow-900 space-y-1">
          <li>• Playoff projections may be limited or unavailable</li>
          <li>• Not all players will have projections (backups, inactive players)</li>
          <li>• Projections are updated in the database even if they are 0</li>
        </ul>
      </div>
    </div>
  );
}
