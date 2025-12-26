'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

export default function UserDisplay() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return null;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {user.name || user.email || user.nickname || user.sub}
        </span>
        <a
          href="/api/auth/logout"
          className="flex h-10 items-center rounded-lg bg-gray-600 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-500"
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    <a
      href="/api/auth/login"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
    >
      Login
    </a>
  );
}
