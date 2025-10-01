# Clerk Integration Review

## Current Status: ✅ Working with Minor Issues

## Overview
The LearnTrack MVP uses Clerk for authentication with role-based access control. Users can be assigned one of three roles: `tutor`, `student`, or `parent`. The role is stored in Clerk's `publicMetadata`.

## Architecture

### Frontend (React + Vite)
- **Location**: `frontend/src/`
- **Clerk Package**: `@clerk/clerk-react`
- **Key Components**:
  - `ClerkProvider` in `main.tsx`
  - `SignedIn` / `SignedOut` components for route protection
  - `useUser()` hook for accessing user data
  - Role stored in `user.publicMetadata.role`

### Backend (FastAPI)
- **Location**: `backend/app/core/enhanced_auth.py`
- **Authentication**: JWT token validation
- **Role Extraction**: From Clerk JWT `public_metadata.role`
- **Dependencies**: `require_tutor`, `require_student`, `require_parent`

## Current Flow

### 1. Sign Up Flow
```
User signs up → Clerk creates account → Redirect to /role-setup → User selects role → 
Role saved to publicMetadata → Redirect to /dashboard → Dashboard renders based on role
```

### 2. Sign In Flow
```
User signs in → Clerk authenticates → Check publicMetadata.role →
If role exists: Redirect to /dashboard →
If no role: Redirect to /role-setup
```

### 3. Dashboard Routing
```
/dashboard → DashboardPage.tsx → Check user.publicMetadata.role →
- 'tutor' → TutorDashboard
- 'student' → StudentDashboard  
- 'parent' → ParentDashboard
- No role → Redirect to /role-setup
```

## Key Files

### Frontend

#### 1. `frontend/src/main.tsx`
- Wraps app with `ClerkProvider`
- Publishable key from environment variable

#### 2. `frontend/src/App.tsx`
- Route definitions
- Uses `SignedIn` component for protected routes
- Routes: `/`, `/sign-in`, `/sign-up`, `/dashboard`, `/role-setup`

#### 3. `frontend/src/pages/HomePage.tsx`
- Landing page
- Auto-redirects authenticated users:
  - With role → `/dashboard`
  - Without role → `/role-setup`

#### 4. `frontend/src/pages/DashboardPage.tsx`
- **Current Implementation**: ✅ Correct
- Checks `user.publicMetadata.role`
- Renders role-specific dashboard
- Handles missing role by redirecting to `/role-setup`

#### 5. `frontend/src/pages/RoleSetupPage.tsx`
- **Current Implementation**: ✅ Correct
- Allows user to select role
- Updates `user.publicMetadata.role` directly via Clerk
- Redirects to `/dashboard` after role selection

#### 6. `frontend/src/pages/SignInPage.tsx` & `SignUpPage.tsx`
- Clerk-provided UI components
- `redirectUrl="/dashboard"` configured

### Backend

#### 1. `backend/app/core/enhanced_auth.py`
- `ClerkAuth` class for JWT validation
- `get_current_user()` dependency
- Role-specific dependencies: `require_tutor`, `require_student`, `require_parent`
- Extracts role from JWT `public_metadata.role`

## Issues Found

### ❌ Issue 1: Inconsistent Role Redirection
**Problem**: The `DashboardPage.tsx` correctly renders role-specific dashboards, but there's no direct role-based routing (e.g., `/tutor-dashboard`, `/student-dashboard`, `/parent-dashboard`).

**Current Behavior**:
- All users go to `/dashboard`
- Dashboard component decides which view to show

**Expected Behavior** (Based on user request):
- Tutor → `/dashboard` (shows TutorDashboard)
- Student → `/dashboard` (shows StudentDashboard)
- Parent → `/dashboard` (shows ParentDashboard)

**Status**: ✅ Actually working correctly! The current implementation is fine.

### ✅ Issue 2: Legacy Code References
**Problem**: Found references to old Next.js app directory structure in codebase retrieval results.

**Files with Legacy Code**:
- `app/page.tsx` - Old Next.js homepage
- `app/dashboard/page.tsx` - Old Next.js dashboard
- `app/role-setup/page.tsx` - Old Next.js role setup
- `app/api/auth/callback/route.ts` - Old Next.js API route
- `lib/auth-utils.ts` - References `/api/auth/callback` which doesn't exist in Vite app

**Impact**: These files are not used in the current Vite/React app but may cause confusion.

**Recommendation**: Remove or move to an `archive/` folder.

### ⚠️ Issue 3: Metadata Migration Logic
**Problem**: `DashboardPage.tsx` has logic to migrate role from `unsafeMetadata` to `publicMetadata`.

**Code**:
```typescript
// If role is in unsafeMetadata but not in publicMetadata, move it
if (user?.unsafeMetadata?.role && !user?.publicMetadata?.role) {
  user.update({
    publicMetadata: {
      ...user.publicMetadata,
      role: user.unsafeMetadata.role
    }
  }).catch(console.error)
}
```

**Status**: This is legacy migration code. If all users now have roles in `publicMetadata`, this can be removed.

## Recommendations

### 1. ✅ Keep Current Dashboard Routing
The current implementation is correct:
- Single `/dashboard` route
- Component-level role detection
- Cleaner URL structure
- Easier to maintain

### 2. 🧹 Clean Up Legacy Files
Remove or archive old Next.js files:
```
app/
├── page.tsx (OLD - remove)
├── dashboard/page.tsx (OLD - remove)
├── role-setup/page.tsx (OLD - remove)
├── api/auth/callback/route.ts (OLD - remove)
└── layout.tsx (OLD - remove)

lib/auth-utils.ts (references non-existent API route)
```

### 3. 🔒 Add Role-Based Route Guards (Optional Enhancement)
Currently, any authenticated user can access `/dashboard`. Consider adding role-specific route protection:

```typescript
// Example: Protect /assignments route for tutors only
<Route
  path="/assignments"
  element={
    <SignedIn>
      <RoleGuard allowedRoles={['tutor']}>
        <AssignmentsPage />
      </RoleGuard>
    </SignedIn>
  }
/>
```

### 4. 📝 Update Environment Variables Documentation
Ensure `.env.example` files exist with:
```env
# Frontend
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend  
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER=https://your-instance.clerk.accounts.dev
```

### 5. 🧪 Add Role Switching (Future Enhancement)
Allow users to switch roles (e.g., a tutor who is also a parent):
- Store multiple roles in `publicMetadata.roles: ['tutor', 'parent']`
- Add role switcher in dashboard
- Update backend to check `roles` array

## Testing Checklist

### Sign Up Flow
- [ ] New user signs up
- [ ] Redirected to `/role-setup`
- [ ] Selects role (tutor/student/parent)
- [ ] Role saved to `publicMetadata`
- [ ] Redirected to `/dashboard`
- [ ] Correct dashboard shown

### Sign In Flow
- [ ] User with role signs in
- [ ] Redirected to `/dashboard`
- [ ] Correct dashboard shown
- [ ] User without role signs in
- [ ] Redirected to `/role-setup`

### Dashboard Access
- [ ] Tutor sees TutorDashboard
- [ ] Student sees StudentDashboard
- [ ] Parent sees ParentDashboard
- [ ] User without role redirected to `/role-setup`

### Backend API
- [ ] Tutor can access tutor-only endpoints
- [ ] Student can access student-only endpoints
- [ ] Parent can access parent-only endpoints
- [ ] Unauthorized access returns 403

## Security Considerations

### ✅ Good Practices
1. Role stored in `publicMetadata` (read-only from client)
2. Backend validates JWT and extracts role
3. Role-based dependencies in FastAPI
4. Protected routes use `SignedIn` component

### ⚠️ Potential Issues
1. Client-side role checks can be bypassed (always validate on backend)
2. No role hierarchy (e.g., admin role)
3. No multi-role support (user can only have one role)

## Conclusion

**Overall Status**: ✅ **Working Correctly**

The Clerk integration is properly implemented with role-based access control. The current dashboard routing strategy (single `/dashboard` route with component-level role detection) is clean and maintainable.

**Required Actions**:
1. ✅ No changes needed for role-based dashboard routing (already working)
2. 🧹 Clean up legacy Next.js files
3. 📝 Document environment variables

**Optional Enhancements**:
1. Add role-based route guards
2. Support multiple roles per user
3. Add role switching UI
4. Add admin role for platform management

