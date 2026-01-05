'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import { getLivePlayerStats } from '@/app/lib/scoring-actions';
import HomeButton from '@/app/ui/home-button';

interface PlayerStats {
  playerId: number | null;
  playerName: string;
  espnId: string;
  team: string;
  position: string;
  passingYards: number;
  passingTouchdowns: number;
  interceptions: number;
  rushingYards: number;
  rushingTouchdowns: number;
  receptions: number;
  receivingYards: number;
  receivingTouchdowns: number;
  fantasyPoints: number;
  projectedPoints: number | null;
  gameStatus: 'pre' | 'in' | 'post';
  lastUpdated: Date;
}

export default function ScoresPage() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(18); // Default to week 18
  const [mounted, setMounted] = useState(false);
  
  // NFL season year logic: If we're in Jan-July, use previous year (season started previous September)
  const now = new Date();
  const currentYear = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      console.log(`[Client] Loading stats for year ${currentYear}, week ${selectedWeek || 'live'}`);
      const data = await getLivePlayerStats(currentYear, selectedWeek);
      console.log(`[Client] Received ${data.length} player stats:`, data);
      setStats(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('[Client] Error loading stats:', err);
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [currentYear, selectedWeek]);

  useEffect(() => {
    loadStats();
    
    // Only auto-refresh if viewing live (no week specified)
    if (!selectedWeek) {
      const interval = setInterval(() => {
        loadStats();
      }, 120000);

      return () => clearInterval(interval);
    }
  }, [selectedWeek, loadStats]);

  const formatStatLine = (player: PlayerStats) => {
    const parts = [];
    
    if (player.passingYards > 0) {
      parts.push(`${player.passingYards} pass yds, ${player.passingTouchdowns} TD, ${player.interceptions} INT`);
    }
    if (player.rushingYards > 0) {
      parts.push(`${player.rushingYards} rush yds, ${player.rushingTouchdowns} TD`);
    }
    if (player.receptions > 0) {
      parts.push(`${player.receptions} rec, ${player.receivingYards} rec yds, ${player.receivingTouchdowns} TD`);
    }
    
    return parts.join(' | ') || 'No stats';
  };

  const toggleRow = (espnId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(espnId)) {
      newExpanded.delete(espnId);
    } else {
      newExpanded.add(espnId);
    }
    setExpandedRows(newExpanded);
  };

  const sortedStats = [...stats].sort((a, b) => b.fantasyPoints - a.fantasyPoints);

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-2xl md:text-4xl`}>
            <span className="md:hidden">Live Stats</span>
            <span className="hidden md:inline">Live Player Stats</span>
          </h1>
          <HomeButton />
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {mounted && lastUpdate && (
            <p className="text-sm text-gray-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
          {mounted && !lastUpdate && (
            <p className="text-sm text-gray-600">
              Loading...
            </p>
          )}
          <div className="flex items-center gap-2">
            <label htmlFor="week-select" className="text-sm text-gray-700 font-medium">
              Week:
            </label>
            <select
              id="week-select"
              value={selectedWeek || 'live'}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedWeek(value === 'live' ? undefined : parseInt(value));
                setLoading(true);
              }}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="live">Live</option>
              {[...Array(18)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Week {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-gray-300"
        >
          {loading ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && stats.length === 0 ? (
        <div className="mt-6 text-center">
          <p className="text-gray-600">Loading stats...</p>
        </div>
      ) : stats.length === 0 ? (
        <div className="mt-6 rounded-lg bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No stats available yet. Players may not have started playing.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pos
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStats.map((player) => (
                <>
                  <tr key={player.espnId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRow(player.espnId)}
                          className="md:hidden text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className={`h-4 w-4 transition-transform ${expandedRows.has(player.espnId) ? 'rotate-90' : ''}`}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M9 5l7 7-7 7"></path>
                          </svg>
                        </button>
                        {player.playerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.team}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.position}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-500">
                      {formatStatLine(player)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      {player.fantasyPoints.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        player.gameStatus === 'in' 
                          ? 'bg-green-100 text-green-800'
                          : player.gameStatus === 'post'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {player.gameStatus === 'in' ? 'Live' : player.gameStatus === 'post' ? 'Final' : 'Scheduled'}
                      </span>
                    </td>
                  </tr>
                  {expandedRows.has(player.espnId) && (
                    <tr className="md:hidden bg-gray-50">
                      <td colSpan={5} className="px-6 py-3 text-sm text-gray-700">
                        <div className="font-medium text-gray-500 text-xs uppercase mb-1">Stats</div>
                        {formatStatLine(player)}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
