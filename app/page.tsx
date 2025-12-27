'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { lusitana } from '@/app/ui/fonts';
import { getStandings, claimParticipantAccount } from '@/app/lib/actions';
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

  useEffect(() => {
    loadStandings();
  }, []);

  const loadStandings = async () => {
    try {
      const data = await getStandings();
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
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-52">
        <h1 className={`${lusitana.className} text-white text-4xl md:text-5xl`}>
          Fantasy Playoffs
        </h1>
      </div>
      
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <h2 className={`${lusitana.className} text-2xl`}>Participants</h2>
        <div className="flex gap-2 items-center">
          <Link
            href="/scores"
            className="flex h-10 items-center rounded-lg bg-purple-600 px-4 text-sm font-medium text-white transition-colors hover:bg-purple-500"
          >
            Live Scores
          </Link>
          <Link
            href="/participants/create"
            className="flex h-10 items-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-500"
          >
            Add Participant
          </Link>
          <UserDisplay />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
            <table className="hidden min-w-full text-gray-900 md:table">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                    Rank
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Participant
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Total Points
                  </th>
                  <th scope="col" className="relative py-3 pl-6 pr-3">
                    <span className="sr-only">View Roster</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {standings.map((participant, index) => (
                  <tr
                    key={participant.participantId}
                    className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                  >
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      {index + 1}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {participant.participantName}
                      {!participant.auth0Id && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
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
                          className="rounded-md border p-2 hover:bg-gray-100"
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
                  className="mb-2 w-full rounded-md bg-white p-4"
                >
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <div className="mb-2 flex items-center">
                        <span className="text-xl font-bold mr-2">#{index + 1}</span>
                        <p className="text-lg font-medium">
                          {participant.participantName}
                        </p>
                        {!participant.auth0Id && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                            Unclaimed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {participant.totalPoints.toFixed(2)} points
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-end gap-2 pt-4">
                    <Link
                      href={`/roster/${participant.participantId}`}
                      className="rounded-md border p-2 hover:bg-gray-100"
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
