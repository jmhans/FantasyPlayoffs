# Auth0 Admin Role Setup

This guide explains how to configure admin roles in Auth0 for the Fantasy Playoffs app.

## Step 1: Create the Admin Role

1. Go to your Auth0 Dashboard: https://manage.auth0.com
2. Navigate to **User Management** → **Roles**
3. Click **Create Role**
4. Enter:
   - **Name**: `fpf_admin`
   - **Description**: `Fantasy Playoffs Administrator`
5. Click **Create**

## Step 2: Assign Users to Admin Role

1. In **User Management** → **Users**
2. Click on a user you want to make an admin
3. Go to the **Roles** tab
4. Click **Assign Roles**
5. Select the `fpf_admin` role
6. Click **Assign**

## Step 3: Add Roles to JWT Token

You need to create an Auth0 Action to include roles in the user token.

1. Go to **Actions** → **Flows** → **Login**
2. Click **+ Custom** (or the **+** button)
3. Name it: `Add Roles to Token`
4. Add this code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://fantasyplayofffootball.vercel.app';
  
  if (event.authorization) {
    // Get user roles
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  }
};
```

5. Click **Deploy**
6. Drag the action into the **Login** flow (between Start and Complete)
7. Click **Apply**

## Step 4: Verify It Works

1. Log out and log back into your Fantasy Playoffs app
2. If you're an admin, you should see:
   - **👑 ADMIN MODE** section on the draft board
   - Ability to pick for any participant
   - Purple "👑 Draft" buttons instead of disabled buttons

## Troubleshooting

### Roles not showing up?

1. **Clear browser cache** and log out/in again
2. Check that the Action is deployed and in the Login flow
3. Verify the namespace matches: `https://fantasyplayofffootball.vercel.app/roles`
4. Check browser console for the user object: `console.log(user)`

### Need to test locally?

You can temporarily hardcode admin status in development:
```typescript
// In app/lib/auth-utils.ts (REMOVE BEFORE PRODUCTION)
export function isAdmin(user: UserProfile | undefined): boolean {
  if (process.env.NODE_ENV === 'development') {
    return user?.email === 'your-email@example.com';
  }
  const roles = getUserRoles(user);
  return roles.includes('admin');
}
```

## Security Notes

- Roles are verified server-side in the draft actions
- The `isAdminOverride` parameter in `makeDraftPick` bypasses turn validation
- Always validate permissions on the server, never trust client-side checks alone
- Consider adding API-level role checks for sensitive admin endpoints

## Admin Capabilities

Current admin powers:
- ✅ Pick for any participant during the draft
- ✅ Bypass turn order restrictions
- ✅ Access to `/admin/draft` page
- ✅ Access to `/admin/sync-players` page

Future considerations:
- Add role-based page protection middleware
- Create separate "commissioner" role for league management
- Add audit logging for admin actions
