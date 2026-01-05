'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import HomeButton from '@/app/ui/home-button';
import { createNewDraft, getCurrentDraft, deleteDraft } from '@/app/lib/draft-actions';

export default function AdminDraftPage() {
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRounds, setTotalRounds] = useState(10);
  const [showResetOptions, setShowResetOptions] = useState(false);
  
  // NFL season year logic: If we're in Jan-July, use previous year (season started previous September)
  const now = new Date();
  const currentYear = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();

  const loadDraft = useCallback(async () => {
    setLoading(true);
    try {
      const draftData = await getCurrentDraft(currentYear);
      setDraft(draftData);
      if (draftData) {
        setTotalRounds(draftData.totalRounds);
      }
    } catch (err) {
      setError('Failed to load draft');
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  async function handleCreateDraft() {
    if (draft && !showResetOptions && !confirm('This will clear all rosters and create a new draft. Continue?')) {
      return;
    }

    setCreating(true);
    setError(null);

    const result = await createNewDraft(currentYear, totalRounds);

    if (result.error) {
      setError(result.error);
      setCreating(false);
    } else {
      await loadDraft();
      setCreating(false);
      setShowResetOptions(false);
    }
  }

  async function handleDeleteDraft() {
    if (!confirm('This will permanently delete the draft and clear all rosters. This cannot be undone. Continue?')) {
      return;
    }

    setDeleting(true);
    setError(null);

    const result = await deleteDraft(currentYear);

    if (result.error) {
      setError(result.error);
      setDeleting(false);
    } else {
      await loadDraft();
      setDeleting(false);
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
          <h1 className={`${lusitana.className} text-white text-2xl md:text-4xl`}>
            <span className="md:hidden">Draft Admin</span>
            <span className="hidden md:inline">Draft Administration</span>
          </h1>
          <HomeButton />
        </div>
      </div>

      <div className="mt-6 max-w-4xl">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Draft Setup - {currentYear} Season</h2>

          {!draft ? (
            <div>
              <p className="text-gray-600 mb-6">
                No draft has been created for this season yet. Create a new draft to:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>Clear all existing rosters</li>
                <li>Generate a random draft order</li>
                <li>Set the number of draft rounds</li>
              </ul>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Draft Rounds
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(parseInt(e.target.value))}
                  className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                onClick={handleCreateDraft}
                disabled={creating}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating Draft...' : 'Create New Draft'}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Rounds</p>
                    <p className="text-2xl font-semibold">{draft.totalRounds}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-2xl font-semibold">
                      {draft.isComplete ? (
                        <span className="text-green-600">Complete</span>
                      ) : (
                        <span className="text-blue-600">In Progress</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Round</p>
                    <p className="text-2xl font-semibold">{draft.currentRound}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Pick</p>
                    <p className="text-2xl font-semibold">{draft.currentPick}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Draft Order</h3>
                <div className="space-y-2">
                  {draft.draftOrder?.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-semibold text-sm">
                          {entry.pickOrder}
                        </span>
                        <span className="font-medium">{entry.participantName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                {!showResetOptions ? (
                  <>
                    <button
                      onClick={() => setShowResetOptions(true)}
                      disabled={creating || deleting}
                      className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset Draft
                    </button>
                    
                    <button
                      onClick={handleDeleteDraft}
                      disabled={creating || deleting}
                      className="rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? 'Deleting...' : 'Delete Draft'}
                    </button>
                  </>
                ) : (
                  <div className="w-full">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
                      <h3 className="font-semibold text-orange-900 mb-3">Reset Draft Options</h3>
                      <p className="text-sm text-orange-800 mb-4">
                        This will clear all picks and rosters. You can change the number of rounds.
                      </p>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Draft Rounds
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={totalRounds}
                          onChange={(e) => setTotalRounds(parseInt(e.target.value))}
                          className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleCreateDraft}
                          disabled={creating}
                          className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {creating ? 'Resetting...' : 'Confirm Reset'}
                        </button>
                        <button
                          onClick={() => {
                            setShowResetOptions(false);
                            setTotalRounds(draft.totalRounds);
                          }}
                          disabled={creating}
                          className="rounded-lg bg-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {!showResetOptions && !draft.isComplete && (
                  <Link
                    href="/draft"
                    className="rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500"
                  >
                    Go to Draft Board
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
