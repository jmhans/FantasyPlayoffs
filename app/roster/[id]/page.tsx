'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import { getParticipantById, getRosterWithScores } from '@/app/lib/actions';
import HomeButton from '@/app/ui/home-button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { isAdmin } from '@/app/lib/auth-utils';

type Participant = {
  id: number;
  name: string;
  auth0Id: string | null;
};

type RosterEntry = {
  id: number;
  playerName: string;
  position: string | null;
  team: string | null;
  weeklyScores: { [week: number]: number };
  totalPoints: number;
};

export default function RosterPage() {
  const params = useParams();
  const { user } = useUser();
  const idString = params.id as string;
  const id = parseInt(idString);
  
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [rosterWithScores, setRosterWithScores] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isNaN(id)) {
      notFound();
    }

    async function loadData() {
      const participantData = await getParticipantById(id);
      
      if (!participantData) {
        notFound();
      }

      const rosterData = await getRosterWithScores(id);
      
      setParticipant(participantData);
      setRosterWithScores(rosterData);
      setLoading(false);
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col p-6">
        <div className="flex justify-center items-center h-screen">
          <div className="text-gray-600">Loading...</div>
        </div>
      </main>
    );
  }

  if (!participant) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-3xl md:text-4xl`}>
            {participant.name}&apos;s Roster
          </h1>
          <div className="flex gap-2">
            {user && isAdmin(user) && (
              <Link
                href={`/roster/${id}/add-player`}
                className="flex h-10 items-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-500"
              >
                Add Player
              </Link>
            )}
            <HomeButton />
          </div>
        </div>
      </div>

      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2 md:pt-0">
            <table className="hidden min-w-full text-gray-900 dark:text-gray-100 md:table">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-medium sm:pl-6 dark:text-gray-300">
                    Player
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium dark:text-gray-300">
                    Position
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium dark:text-gray-300">
                    Team
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium text-center dark:text-gray-300">
                    Week 1
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium text-center">
                    Week 2
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium text-center">
                    Week 3
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium text-center">
                    Week 4
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {rosterWithScores.map((entry) => (
                  <tr
                    key={entry.id}
                    className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                  >
                    <td className="whitespace-nowrap py-3 pl-6 pr-3 font-medium">
                      {entry.playerName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {entry.position || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {entry.team || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      {entry.weeklyScores[1] || 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      {entry.weeklyScores[2] || 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      {entry.weeklyScores[3] || 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      {entry.weeklyScores[4] || 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-bold">
                      {entry.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan={7} className="px-4 py-3 pl-6 text-right font-bold">
                    Grand Total:
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-lg">
                    {rosterWithScores.reduce((sum, entry) => sum + entry.totalPoints, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Mobile view */}
            <div className="md:hidden">
              {rosterWithScores.map((entry) => (
                <div
                  key={entry.id}
                  className="mb-2 w-full rounded-md bg-white dark:bg-gray-700 p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="mb-4 border-b dark:border-gray-600 pb-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{entry.playerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      {entry.position || 'N/A'} - {entry.team || 'N/A'}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center mb-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Week 1</p>
                      <p className="font-medium text-gray-900 dark:text-white">{entry.weeklyScores[1] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Week 2</p>
                      <p className="font-medium text-gray-900 dark:text-white">{entry.weeklyScores[2] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Week 3</p>
                      <p className="font-medium text-gray-900 dark:text-white">{entry.weeklyScores[3] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Week 4</p>
                      <p className="font-medium text-gray-900 dark:text-white">{entry.weeklyScores[4] || 0}</p>
                    </div>
                  </div>
                  <div className="border-t dark:border-gray-600 pt-2 text-right">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total: </span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{entry.totalPoints}</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 rounded-md bg-gray-100 dark:bg-gray-700 p-4 text-right border border-gray-200 dark:border-gray-600">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Grand Total: {rosterWithScores.reduce((sum, entry) => sum + entry.totalPoints, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
