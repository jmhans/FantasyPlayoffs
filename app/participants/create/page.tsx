'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { lusitana } from '@/app/ui/fonts';
import { createParticipant } from '@/app/lib/participant-actions';
import { useState } from 'react';

export default function CreateParticipantPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);
    
    const result = await createParticipant(formData);
    
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push('/');
    }
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-32">
        <div className="flex items-center justify-between w-full">
          <h1 className={`${lusitana.className} text-white text-3xl md:text-4xl`}>
            Add New Participant
          </h1>
          <Link
            href="/"
            className="flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-100"
          >
            Back to Standings
          </Link>
        </div>
      </div>

      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 p-6 md:p-8">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}
            <form action={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter participant name"
                  required
                  className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address (optional)"
                  className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
                />
              </div>

              {!isLoading && user && (
                <div className="mb-6">
                  <label htmlFor="auth0Id" className="mb-2 block text-sm font-medium">
                    Auth0 ID (Optional)
                  </label>
                  <input
                    id="auth0Id"
                    name="auth0Id"
                    type="text"
                    defaultValue={user.sub || ''}
                    placeholder="Leave empty if participant doesn't have an Auth0 account yet"
                    className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    You can edit or clear this field. Empty means the participant can claim their account later.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Participant'}
                </button>
                <Link
                  href="/"
                  className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
