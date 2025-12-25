import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import { getStandings } from '@/app/lib/actions';

export default async function Home() {
  const standings = await getStandings();

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-52">
        <h1 className={`${lusitana.className} text-white text-4xl md:text-5xl`}>
          Fantasy Playoffs
        </h1>
      </div>
      
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <h2 className={`${lusitana.className} text-2xl`}>Participants</h2>
        <div className="flex gap-2">
          <a
            href="/api/auth/login"
            className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Login
          </a>
        </div>
      </div>

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
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {participant.totalPoints}
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <Link
                        href={`/roster/${participant.participantId}`}
                        className="rounded-md border p-2 hover:bg-gray-100"
                      >
                        View Roster
                      </Link>
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
                      </div>
                      <p className="text-sm text-gray-500">
                        {participant.totalPoints} points
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-end pt-4">
                    <Link
                      href={`/roster/${participant.participantId}`}
                      className="rounded-md border p-2 hover:bg-gray-100"
                    >
                      View Roster
                    </Link>
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
