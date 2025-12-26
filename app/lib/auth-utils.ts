import { UserProfile } from '@auth0/nextjs-auth0/client';

// Custom namespace for Auth0 custom claims
// Must match what you set in Auth0 Action
export const ROLES_CLAIM = 'https://fantasyplayofffootball.vercel.app/roles';

export function getUserRoles(user: UserProfile | undefined): string[] {
  if (!user) return [];
  return (user[ROLES_CLAIM] as string[]) || [];
}

export function isAdmin(user: UserProfile | undefined): boolean {
  const roles = getUserRoles(user);
  return roles.includes('fpf_admin');
}

export function hasRole(user: UserProfile | undefined, role: string): boolean {
  const roles = getUserRoles(user);
  return roles.includes(role);
}
