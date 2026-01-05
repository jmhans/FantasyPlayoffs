'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { lusitana } from '@/app/ui/fonts';
import HomeButton from '@/app/ui/home-button';
import { getCurrentDraft, getDraftPicks, makeDraftPick, getCurrentPicker } from '@/app/lib/draft-actions';
import { searchPlayers } from '@/app/lib/player-actions';
import { isAdmin } from '@/app/lib/auth-utils';

export default function DraftBoardPage() {
  const { user } = useUser();
  const [draft, setDraft] = useState<any>(null);
  const [picks, setPicks] = useState<any[]>([]);
  const [currentPicker, setCurrentPicker] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);
  const [adminPickingForId, setAdminPickingForId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Calculate NFL season year (Jan-Jul uses previous year)
  const now = new Date();
  const currentYear = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();

  const userIsAdmin = isAdmin(user);

  // Debug: Log user and admin status
  useEffect(() => {
    if (user) {
      console.log('User object:', user);
      console.log('User roles:', user['https://fantasyplayofffootball.vercel.app/roles']);
      console.log('Is admin?', userIsAdmin);
    }
  }, [user, userIsAdmin]);

  // Track picks length to only re-filter when it actually changes
  const [lastPicksCount, setLastPicksCount] = useState(0);

  const loadDraftData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const draftData = await getCurrentDraft(currentYear);
      
      if (!draftData) {
        setError('No active draft found. Contact admin to create a draft.');
        setLoading(false);
        return null;
      }

      setDraft(draftData);

      const picksData = await getDraftPicks(draftData.id);
      setPicks(picksData);

      const picker = await getCurrentPicker(draftData.id);
      setCurrentPicker(picker);
      
      return picksData; // Return picks for immediate use
    } catch (err) {
      setError('Failed to load draft');
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentYear]);

  const loadPlayers = useCallback(async (draftedPicks?: any[], silent = false) => {
    if (!silent) setSearching(true);
    try {
      const data = await searchPlayers(searchQuery);
      
      // Use passed picks or state picks
      const picksToUse = draftedPicks || picks;
      const draftedPlayerIds = picksToUse.map((p: any) => p.playerId).filter(Boolean); // Filter out undefined
      const availablePlayers = data.filter(player => !draftedPlayerIds.includes(player.id));
      
      console.log('Picks to use:', picksToUse.length, 'Player IDs:', draftedPlayerIds, 'Total players:', data.length, 'Available:', availablePlayers.length);
      
      setPlayers(availablePlayers);
    } catch (err) {
      console.error('Failed to load players:', err);
    } finally {
      if (!silent) setSearching(false);
    }
  }, [searchQuery, picks]);

  useEffect(() => {
    loadDraftData();
  }, [loadDraftData]);

  useEffect(() => {
    // Only search if we have draft loaded
    if (!draft) return;
    
    // Only search if we have picks loaded on first load
    if (picks.length === 0 && lastPicksCount === 0) {
      // First load after draft is fetched
      loadPlayers(undefined, true); // Silent initial load
      setLastPicksCount(picks.length);
      return;
    }

    // Only reload if picks count actually changed (a new pick was made)
    if (picks.length !== lastPicksCount) {
      loadPlayers(undefined, true); // Silent reload when picks change
      setLastPicksCount(picks.length);
    }
  }, [picks.length, draft, lastPicksCount, loadPlayers]);

  // Separate effect for search query changes
  useEffect(() => {
    if (!draft) return;
    if (searchQuery === '') return; // Don't search on empty query
    
    const delayDebounce = setTimeout(() => {
      loadPlayers(undefined, false); // Show searching indicator for user searches
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, draft, loadPlayers]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDraftData(true);
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadDraftData]);

  async function handleDraftPick(playerId: number) {
    if (!draft || !currentPicker) return;

    let participantIdToPick: number;

    if (userIsAdmin && adminPickingForId) {
      // Admin is picking for someone else
      participantIdToPick = adminPickingForId;
    } else {
      // Use the current picker's ID if it matches the logged-in user
      if (user?.sub === currentPicker.auth0Id) {
        participantIdToPick = currentPicker.participantId;
      } else {
        setError('It is not your turn to pick');
        return;
      }
    }

    setPicking(true);
    setError(null);

    const result = await makeDraftPick(draft.id, participantIdToPick, playerId, userIsAdmin && !!adminPickingForId);

    if (result.error) {
      setError(result.error);
    } else {
      const updatedPicks = await loadDraftData();
      if (updatedPicks) {
        await loadPlayers(updatedPicks, true); // Silent update, no searching indicator
      }
      setSearchQuery('');
      // Clear admin picker after successful pick
      if (userIsAdmin && adminPickingForId) {
        setAdminPickingForId(null);
      }
    }

    setPicking(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!draft) {
    return (
      <main className="flex min-h-screen flex-col p-6">
        <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
          <h1 className={`${lusitana.className} text-white text-3xl md:text-4xl`}>
            Draft Board
          </h1>
        </div>
        <div className="mt-6 rounded-lg bg-yellow-50 p-6 text-center">
          <p className="text-gray-600">No active draft found. Contact admin to create a draft.</p>
          <HomeButton className="mt-4 bg-blue-600 text-white hover:bg-blue-500" />
        </div>
      </main>
    );
  }

  const isMyTurn = currentPicker && user?.sub === currentPicker.auth0Id;
  const canPickNow = isMyTurn || userIsAdmin;

  // Filter picks by selected participant or show all
  const displayedPicks = selectedParticipantId 
    ? picks.filter(pick => {
        const pickParticipant = draft.draftOrder?.find((p: any) => p.participantName === pick.participantName);
        return pickParticipant?.participantId === selectedParticipantId;
      })
    : picks;

  const selectedParticipant = selectedParticipantId 
    ? draft.draftOrder?.find((p: any) => p.participantId === selectedParticipantId)
    : null;

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-2xl md:text-4xl`}>
            <span className="md:hidden">Draft - Rd {Math.min(draft.currentRound, draft.totalRounds)}</span>
            <span className="hidden md:inline">Draft Board - Round {Math.min(draft.currentRound, draft.totalRounds)}/{draft.totalRounds}</span>
          </h1>
          <HomeButton />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left Column - Draft Status & Order */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Pick Status */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Current Pick</h2>
            {draft.isComplete ? (
              <div className="text-center py-4">
                <p className="text-2xl font-bold text-green-600">Draft Complete!</p>
              </div>
            ) : (
              <div>
                <div className={`p-4 rounded-lg ${isMyTurn ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
                  <p className="text-sm text-gray-600 mb-1">Now Picking:</p>
                  <p className="text-xl font-bold">{currentPicker?.participantName || 'Loading...'}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Pick {draft.currentPick} of {draft.draftOrder?.length || 0}
                  </p>
                  {isMyTurn && (
                    <p className="text-sm font-semibold text-green-600 mt-2">
                      🎯 YOUR TURN!
                    </p>
                  )}
                </div>

                {/* Admin Picker Selector */}
                {userIsAdmin && !draft.isComplete && (
                  <div className="mt-4 p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 mb-2">👑 ADMIN MODE</p>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pick for:
                    </label>
                    <select
                      value={adminPickingForId || ''}
                      onChange={(e) => setAdminPickingForId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select participant...</option>
                      {draft.draftOrder?.map((entry: any) => (
                        <option key={entry.participantId} value={entry.participantId}>
                          {entry.participantName}
                        </option>
                      ))}
                    </select>
                    {adminPickingForId && (
                      <p className="text-xs text-purple-600 mt-2">
                        Picking as: {draft.draftOrder?.find((p: any) => p.participantId === adminPickingForId)?.participantName}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoRefresh" className="text-sm text-gray-600">
                    Auto-refresh every 3s
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Draft Order */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Draft Order</h2>
            <div className="space-y-2">
              {draft.draftOrder?.map((entry: any, index: number) => {
                const isCurrentPicker = currentPicker?.participantId === entry.participantId;
                const isSelected = selectedParticipantId === entry.participantId;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedParticipantId(isSelected ? null : entry.participantId)}
                    className={`w-full flex items-center gap-3 p-2 rounded transition ${
                      isSelected 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : isCurrentPicker 
                        ? 'bg-green-100 font-semibold hover:bg-green-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      isSelected ? 'bg-white text-blue-500' : 'bg-blue-500 text-white'
                    }`}>
                      {entry.pickOrder}
                    </span>
                    <span className="text-sm">{entry.participantName}</span>
                  </button>
                );
              })}
            </div>
            {selectedParticipantId && (
              <button
                onClick={() => setSelectedParticipantId(null)}
                className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Show All Picks
              </button>
            )}
          </div>
        </div>

        {/* Middle Column - Available Players */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Available Players</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {searching && (
                <p className="mt-2 text-xs text-gray-500">Searching...</p>
              )}
            </div>

            <div className="max-h-[600px] overflow-y-auto space-y-2">
              {players.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {searchQuery ? 'No players found' : 'Search for players'}
                </p>
              ) : (
                players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {player.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={player.imageUrl}
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{player.name}</p>
                        <p className="text-xs text-gray-600">
                          {player.position} - {player.team}
                          {player.avgPoints > 0 && (
                            <span className="ml-2 font-semibold text-blue-600">
                              {player.avgPoints.toFixed(1)} PPG
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {isMyTurn && !draft.isComplete && (
                      <button
                        onClick={() => handleDraftPick(player.id)}
                        disabled={picking}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {picking ? '...' : 'Draft'}
                      </button>
                    )}
                    {userIsAdmin && !draft.isComplete && adminPickingForId && (
                      <button
                        onClick={() => handleDraftPick(player.id)}
                        disabled={picking}
                        className="rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                        title="Admin draft for selected participant"
                      >
                        {picking ? '...' : '👑 Draft'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Draft Picks */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">
              {selectedParticipant 
                ? `${selectedParticipant.participantName}'s Team (${displayedPicks.length})` 
                : `Draft Picks (${picks.length})`}
            </h2>
            
            <div className="max-h-[700px] overflow-y-auto space-y-2">
              {displayedPicks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {selectedParticipant ? 'No picks yet for this participant' : 'No picks yet'}
                </p>
              ) : (
                displayedPicks.map((pick) => (
                  <div
                    key={pick.id}
                    className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-500">
                        Pick #{pick.pickNumber} (Rd {pick.round})
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(pick.pickedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{pick.playerName}</p>
                    <p className="text-xs text-gray-600">
                      {pick.playerPosition} - {pick.playerTeam}
                    </p>
                    {!selectedParticipant && (
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        {pick.participantName}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
