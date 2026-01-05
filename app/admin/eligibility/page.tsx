'use client';

import { useState, useEffect } from 'react';
import { lusitana } from '@/app/ui/fonts';
import HomeButton from '@/app/ui/home-button';
import { 
  setTeamEligibility, 
  setAllPlayersEligibility, 
  getEligibilityStats 
} from '@/app/lib/eligibility-actions';

const NFL_TEAMS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS'
];

export default function EligibilityAdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    const data = await getEligibilityStats();
    setStats(data);
    setLoading(false);
  }

  const toggleTeam = (team: string) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(team)) {
      newSelected.delete(team);
    } else {
      newSelected.add(team);
    }
    setSelectedTeams(newSelected);
  };

  const selectAllTeams = () => {
    setSelectedTeams(new Set(NFL_TEAMS));
  };

  const clearSelection = () => {
    setSelectedTeams(new Set());
  };

  const handleSetEligible = async () => {
    if (selectedTeams.size === 0) {
      setMessage('❌ Please select at least one team');
      return;
    }

    setProcessing(true);
    setMessage('Setting teams as eligible...');

    const result = await setTeamEligibility(Array.from(selectedTeams), true);
    
    if (result.error) {
      setMessage(`❌ ${result.error}`);
    } else {
      setMessage(`✅ ${result.message}`);
      await loadStats();
    }
    
    setProcessing(false);
  };

  const handleSetIneligible = async () => {
    if (selectedTeams.size === 0) {
      setMessage('❌ Please select at least one team');
      return;
    }

    setProcessing(true);
    setMessage('Setting teams as ineligible...');

    const result = await setTeamEligibility(Array.from(selectedTeams), false);
    
    if (result.error) {
      setMessage(`❌ ${result.error}`);
    } else {
      setMessage(`✅ ${result.message}`);
      await loadStats();
    }
    
    setProcessing(false);
  };

  const handleResetAll = async (isEligible: boolean) => {
    if (!confirm(`Set ALL players to ${isEligible ? 'ELIGIBLE' : 'INELIGIBLE'}?`)) {
      return;
    }

    setProcessing(true);
    setMessage(`Setting all players to ${isEligible ? 'eligible' : 'ineligible'}...`);

    const result = await setAllPlayersEligibility(isEligible);
    
    if (result.error) {
      setMessage(`❌ ${result.error}`);
    } else {
      setMessage(`✅ ${result.message}`);
      await loadStats();
    }
    
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-6 bg-white dark:bg-gray-900">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 dark:bg-blue-600 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-2xl md:text-4xl`}>
            <span className="md:hidden">Eligibility</span>
            <span className="hidden md:inline">Draft Eligibility Management</span>
          </h1>
          <HomeButton />
        </div>
      </div>

      <div className="mt-6 max-w-6xl">
        {message && (
          <div className="mb-4 rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 text-sm dark:text-blue-200">
            {message}
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Current Status</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Players</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.eligible}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Eligible</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.ineligible}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ineligible</p>
              </div>
            </div>
          </div>
        )}

        {/* Team Selection */}
        <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Select Playoff Teams</h2>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAllTeams}
              className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear All
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-auto self-center">
              {selectedTeams.size} team(s) selected
            </span>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
            {NFL_TEAMS.map(team => {
              const teamStat = stats?.teamStats?.[team];
              const isSelected = selectedTeams.has(team);
              
              return (
                <button
                  key={team}
                  onClick={() => toggleTeam(team)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-bold text-sm dark:text-white">{team}</div>
                  {teamStat && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      <span className="text-green-600 dark:text-green-400">{teamStat.eligible}</span>
                      /
                      <span className="text-gray-400 dark:text-gray-500">{teamStat.total}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSetEligible}
              disabled={processing || selectedTeams.size === 0}
              className="rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Selected Teams as Eligible
            </button>
            <button
              onClick={handleSetIneligible}
              disabled={processing || selectedTeams.size === 0}
              className="rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Selected Teams as Ineligible
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Quick Actions</h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleResetAll(true)}
              disabled={processing}
              className="rounded-lg bg-blue-600 dark:bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 dark:hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Make All Players Eligible
            </button>
            <button
              onClick={() => handleResetAll(false)}
              disabled={processing}
              className="rounded-lg bg-gray-600 dark:bg-gray-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-500 dark:hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Make All Players Ineligible
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Use these to reset eligibility before setting up for a new season or playoffs.
          </p>
        </div>
      </div>
    </main>
  );
}
