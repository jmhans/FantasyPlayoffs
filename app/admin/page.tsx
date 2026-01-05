'use client';

import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { lusitana } from '@/app/ui/fonts';
import { isAdmin } from '@/app/lib/auth-utils';
import HomeButton from '@/app/ui/home-button';

export default function AdminPage() {
  const { user, isLoading } = useUser();
  const userIsAdmin = user ? isAdmin(user) : false;

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  if (!user || !userIsAdmin) {
    return (
      <main className="flex min-h-screen flex-col p-6">
        <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
          <div className="flex items-center justify-between w-full">
            <h1 className={`${lusitana.className} text-white text-3xl md:text-4xl`}>
              Admin Dashboard
            </h1>
            <HomeButton />
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-800 font-medium">Access Denied</p>
          <p className="mt-2 text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-2xl md:text-4xl`}>
            <span className="md:hidden">Admin</span>
            <span className="hidden md:inline">Admin Dashboard</span>
          </h1>
          <HomeButton />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Import Players Card */}
        <Link
          href="/admin/import-players"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                Import Players
              </h2>
              <p className="text-sm text-gray-500">
                Select teams and positions
              </p>
            </div>
          </div>
        </Link>

        {/* Sync Players Card */}
        <Link
          href="/admin/sync-players"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                Sync Players
              </h2>
              <p className="text-sm text-gray-500">
                Update NFL player database
              </p>
            </div>
          </div>
        </Link>

        {/* Draft Management Card */}
        <Link
          href="/admin/draft"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                Draft Management
              </h2>
              <p className="text-sm text-gray-500">
                Create and manage drafts
              </p>
            </div>
          </div>
        </Link>

        {/* Sync Projections Card */}
        <Link
          href="/admin/sync-projections"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                Sync Projections
              </h2>
              <p className="text-sm text-gray-500">
                Single week sync
              </p>
            </div>
          </div>
        </Link>

        {/* Sync Projections Multi Card */}
        <Link
          href="/admin/sync-projections-multi"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                Sync Multiple Weeks
              </h2>
              <p className="text-sm text-gray-500">
                Batch sync projections
              </p>
            </div>
          </div>
        </Link>

        {/* Sync Weekly Actuals Card */}
        <Link
          href="/admin/sync-actuals"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                Sync Weekly Actuals
              </h2>
              <p className="text-sm text-gray-500">
                Historical stats (weeks 1-17)
              </p>
            </div>
          </div>
        </Link>

        {/* Calculate Roster Scores Card */}
        <Link
          href="/admin/calculate-scores"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                Calculate Roster Scores
              </h2>
              <p className="text-sm text-gray-500">
                Calculate fantasy points from actuals
              </p>
            </div>
          </div>
        </Link>

        {/* Draft Eligibility Card */}
        <Link
          href="/admin/eligibility"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                Draft Eligibility
              </h2>
              <p className="text-sm text-gray-500">
                Manage playoff team eligibility
              </p>
            </div>
          </div>
        </Link>

        {/* Future Admin Features */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm opacity-60">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-gray-400">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-500">
                More Coming Soon
              </h2>
              <p className="text-sm text-gray-400">
                Additional admin features
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-blue-50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Tips</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Sync players before creating a new draft to get the latest NFL roster</li>
          <li>Sync projections weekly to update projected fantasy points from Sleeper</li>
          <li>Draft management allows you to create drafts and reset if needed</li>
          <li>Only users with admin role can access these features</li>
        </ul>
      </div>
    </main>
  );
}
