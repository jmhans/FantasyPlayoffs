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
          <h1 className={`${lusitana.className} text-white text-3xl md:text-4xl`}>
            Admin Dashboard
          </h1>
          <HomeButton />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                Update player projections
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
