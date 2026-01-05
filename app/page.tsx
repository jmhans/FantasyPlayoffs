'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { lusitana } from '@/app/ui/fonts';
import { getStandings, claimParticipantAccount } from '@/app/lib/actions';
import { isAdmin } from '@/app/lib/auth-utils';
import UserDisplay from '@/app/ui/user-display';

interface Participant {
  participantId: number;
  participantName: string;
  auth0Id: string | null;
  totalPoints: number;
}

export default function Home() {
  const { user } = useUser();
  const [standings, setStandings] = useState<Participant[]>([]);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadStandings();
  }, []);

  const loadStandings = async () => {
    try {
      console.log('[Client] Loading standings...');
      const data = await getStandings();
      console.log('[Client] Received data:', data);
      setStandings(data);
    } catch (err) {
      console.error('Error loading standings:', err);
    }
  };

  const handleClaimAccount = async (participantId: number) => {
    if (!user?.sub) {
      setError('You must be logged in to claim an account');
      return;
    }

    setClaiming(participantId);
    setError(null);

    const result = await claimParticipantAccount(participantId, user.sub);

    if (result.error) {
      setError(result.error);
    } else {
      // Reload standings to reflect the change
      await loadStandings();
    }

    setClaiming(null);
  };

  return (
    <main className="flex min-h-screen flex-col p-6 bg-white dark:bg-gray-900">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 dark:bg-blue-600 p-4 md:h-52">
        <h1 className={`${lusitana.className} text-white text-3xl md:text-5xl`}>
          Fantasy Playoffs
        </h1>
      </div>
      
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <h2 className={`${lusitana.className} text-2xl dark:text-white`}>Participants</h2>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 items-center">
          <Link
            href="/draft"
            className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Draft
          </Link>
          <Link
            href="/scores"
            className="flex h-10 items-center rounded-lg bg-purple-600 px-4 text-sm font-medium text-white transition-colors hover:bg-purple-500"
          >
            Live Scores
          </Link>
          {user && isAdmin(user) && (
            <Link
              href="/admin"
              className="flex h-10 items-center rounded-lg bg-orange-600 px-4 text-sm font-medium text-white transition-colors hover:bg-orange-500"
            >
              Admin
            </Link>
          )}
          {user && (
            <Link
              href="/participants/create"
              className="flex h-10 items-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-500"
            >
              Add Participant
            </Link>
          )}
          <UserDisplay />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <UserDisplay />
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-10">
                <div className="py-1" role="menu">
                  <Link
                    href="/draft"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setMenuOpen(false)}
                  >
                    Draft
                  </Link>
                  <Link
                    href="/scores"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setMenuOpen(false)}
                  >
                    Live Scores
                  </Link>
                  {user && isAdmin(user) && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  {user && (
                    <Link
                      href="/participants/create"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Add Participant
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2 md:pt-0">
            <table className="hidden min-w-full text-gray-900 dark:text-gray-100 md:table">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-medium sm:pl-6 dark:text-gray-300">
                    Rank
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium dark:text-gray-300">
                    Participant
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium dark:text-gray-300">
                    Total Points
                  </th>
                  <th scope="col" className="relative py-3 pl-6 pr-3">
                    <span className="sr-only">View Roster</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {standings.map((participant, index) => (
                  <tr
                    key={participant.participantId}
                    className="w-full border-b dark:border-gray-700 py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                  >
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      {index + 1}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {participant.participantName}
                      {!participant.auth0Id && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-600 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                          Unclaimed
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {participant.totalPoints.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/roster/${participant.participantId}`}
                          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          View Roster
                        </Link>
                        {!participant.auth0Id && user && (
                          <button
                            onClick={() => handleClaimAccount(participant.participantId)}
                            disabled={claiming === participant.participantId}
                            className="rounded-md border border-blue-500 bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed"
                          >
                            {claiming === participant.participantId ? 'Claiming...' : 'Claim Account'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile view */}
            <div className="md:hidden">
              {standings.map((participant, index) => (
                <div
                  key={participant.participantId}
                  className="mb-2 w-full rounded-md bg-white dark:bg-gray-700 p-3 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between pb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">#{index + 1}</span>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {participant.participantName}
                        </p>
                        {!participant.auth0Id && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-600 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                            Unclaimed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {participant.totalPoints.toFixed(2)} points
                      </p>
                    </div>
                    <Link
                      href={`/roster/${participant.participantId}`}
                      className="rounded-md border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 px-3 py-1.5 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-500 whitespace-nowrap"
                    >
                      View Roster
                    </Link>
                  </div>
                  {!participant.auth0Id && user && (
                    <button
                      onClick={() => handleClaimAccount(participant.participantId)}
                      disabled={claiming === participant.participantId}
                      className="w-full mt-2 rounded-md border border-blue-500 bg-blue-500 py-2 text-sm text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed"
                    >
                      {claiming === participant.participantId ? 'Claiming...' : 'Claim Account'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
