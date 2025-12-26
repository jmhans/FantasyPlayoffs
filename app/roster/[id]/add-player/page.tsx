'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import { addPlayerToRoster } from '@/app/lib/roster-actions';
import { searchPlayers } from '@/app/lib/player-actions';

export default function AddPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const participantId = parseInt(params.id as string);
  
  const [players, setPlayers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingPlayerId, setAddingPlayerId] = useState<number | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadPlayers();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  async function loadPlayers() {
    setSearching(true);
    try {
      const data = await searchPlayers(searchQuery);
      setPlayers(data);
    } catch (err) {
      setError('Failed to load players');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  async function handleAddPlayer(playerId: number) {
    setAddingPlayerId(playerId);
    setError(null);
    
    const result = await addPlayerToRoster(participantId, playerId);
    
    if (result.error) {
      setError(result.error);
      setAddingPlayerId(null);
    } else {
      router.push(`/roster/${participantId}`);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-3xl md:text-4xl`}>
            Add Player to Roster
          </h1>
          <Link
            href={`/roster/${participantId}`}
            className="flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-100"
          >
            Back to Roster
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by player name, team, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm"
          />
          {searching && (
            <p className="mt-2 text-sm text-gray-500">Searching...</p>
          )}
        </div>

        {players.length === 0 && !loading && !searching ? (
          <div className="rounded-lg bg-yellow-50 p-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              No players in database. Sync players from ESPN first.
            </p>
            <Link
              href="/admin/sync-players"
              className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Sync Players
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{player.name}</h3>
                    <p className="text-sm text-gray-600">
                      {player.position} - {player.team}
                    </p>
                    {player.jerseyNumber && (
                      <p className="text-xs text-gray-500">#{player.jerseyNumber}</p>
                    )}
                  </div>
                  {player.imageUrl && (
                    <img
                      src={player.imageUrl}
                      alt={player.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                </div>
                <button
                  onClick={() => handleAddPlayer(player.id)}
                  disabled={addingPlayerId === player.id}
                  className="mt-4 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingPlayerId === player.id ? 'Adding...' : 'Add to Roster'}
                </button>
              </div>
            ))}
          </div>
        )}

        {players.length === 0 && searchQuery && !searching && (
          <div className="text-center text-gray-500 py-8">
            No players match your search
          </div>
        )}
      </div>
    </main>
  );
}
