import Link from 'next/link';
import { notFound } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import { getParticipantById, getRosterWithScores } from '@/app/lib/actions';

export const dynamic = 'force-dynamic';

export default async function RosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idString } = await params;
  const id = parseInt(idString);
  
  if (isNaN(id)) {
    notFound();
  }

  const participant = await getParticipantById(id);
  
  if (!participant) {
    notFound();
  }

  const rosterWithScores = await getRosterWithScores(id);

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-3xl md:text-4xl`}>
            {participant.name}&apos;s Roster
          </h1>
          <div className="flex gap-2">
            <Link
              href={`/roster/${id}/add-player`}
              className="flex h-10 items-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-500"
            >
              Add Player
            </Link>
            <Link
              href="/"
              className="flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-100"
            >
              Back to Standings
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
            <table className="hidden min-w-full text-gray-900 md:table">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                    Player
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Position
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Team
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium text-center">
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
              <tbody className="bg-white">
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
                  className="mb-2 w-full rounded-md bg-white p-4"
                >
                  <div className="mb-4 border-b pb-2">
                    <p className="text-lg font-bold">{entry.playerName}</p>
                    <p className="text-sm text-gray-500">
                      {entry.position || 'N/A'} - {entry.team || 'N/A'}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center mb-2">
                    <div>
                      <p className="text-xs text-gray-500">Week 1</p>
                      <p className="font-medium">{entry.weeklyScores[1] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Week 2</p>
                      <p className="font-medium">{entry.weeklyScores[2] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Week 3</p>
                      <p className="font-medium">{entry.weeklyScores[3] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Week 4</p>
                      <p className="font-medium">{entry.weeklyScores[4] || 0}</p>
                    </div>
                  </div>
                  <div className="border-t pt-2 text-right">
                    <span className="text-sm text-gray-500">Total: </span>
                    <span className="font-bold text-lg">{entry.totalPoints}</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 rounded-md bg-gray-100 p-4 text-right">
                <span className="text-lg font-bold">
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
