# Authentication Testing Guide

This guide provides step-by-step instructions to test the complete Clerk authentication flow in LearnTrack MVP.

## Prerequisites

1. **Clerk Dashboard Configuration**
   - Follow the [Clerk Configuration Guide](./clerk-configuration.md)
   - Ensure Backend Token Template "fastapi" is created
   - Webhook endpoint is configured (optional for basic testing)

2. **Environment Setup**
   - Backend `.env` file configured with Clerk variables
   - Frontend `.env.local` file configured with publishable key
   - MongoDB running locally or accessible

## Testing Steps

### 1. Start the Applications

```bash
# Terminal 1 - Backend
cd backend
source .venv/Scripts/activate  # Windows: source .venv/Scripts/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Verify both are running:
- Backend: http://localhost:8000/docs
- Frontend: http://localhost:3000

### 2. Test Unauthenticated Access

1. **Visit Homepage**
   - Go to http://localhost:3000
   - Should see the landing page with "Get Started" and "Sign In" buttons
   - No automatic redirects should occur

2. **Test Protected Routes**
   - Try accessing http://localhost:3000/dashboard directly
   - Should redirect to sign-in page

3. **Test API Health Check**
   - Visit http://localhost:8000/health
   - Should return: `{"status": "healthy", ...}`

### 3. Test Sign-Up Flow

1. **Create New Account**
   - Click "Get Started" or "Sign Up"
   - Fill in email and password
   - Complete email verification if required
   - Should redirect to `/role-setup`

2. **Role Selection**
   - Choose a role (Tutor, Student, or Parent)
   - Click "Continue as [Role]"
   - Should redirect to `/dashboard`

3. **Verify Dashboard Access**
   - Should see role-specific dashboard content
   - Check browser dev tools for any console errors

### 4. Test API Authentication

1. **Check User Profile Endpoint**
   - Open browser dev tools (F12)
   - Go to Network tab
   - Refresh the dashboard page
   - Look for calls to `/api/v1/users/me`
   - Verify:
     - Request has `Authorization: Bearer <jwt-token>` header
     - Response returns real user data (not mock data)
     - Status code is 200

2. **Test JWT Token**
   - Copy the JWT token from the Authorization header
   - Go to [jwt.io](https://jwt.io)
   - Paste the token to decode it
   - Verify claims include:
     - `sub`: User ID
     - `email`: User email
     - `public_metadata.role`: Selected role
     - `iss`: Your Clerk instance URL
     - `aud`: "fastapi"

### 5. Test Role-Based Access

1. **Tutor Role Testing**
   - Sign up/in as a tutor
   - Navigate to `/students`
   - Should see student management interface
   - Try creating a student (if implemented)

2. **Student Role Testing**
   - Sign up/in as a student
   - Navigate to `/assignments`
   - Should see student assignment view
   - Should NOT have access to student management

3. **Parent Role Testing**
   - Sign up/in as a parent
   - Should see parent dashboard
   - Should have limited access compared to tutors

### 6. Test Sign-Out and Re-Authentication

1. **Sign Out**
   - Use Clerk's sign-out functionality
   - Should redirect to homepage
   - Verify protected routes are no longer accessible

2. **Sign In Again**
   - Click "Sign In"
   - Enter credentials
   - Should redirect to `/dashboard`
   - Should maintain the same role

### 7. Test Backend Endpoints Directly

Using a tool like Postman or curl:

1. **Get JWT Token**
   - Sign in through the frontend
   - Copy JWT token from browser dev tools

2. **Test Protected Endpoint**
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        http://localhost:8000/api/v1/users/me
   ```
   Should return user profile data.

3. **Test Without Token**
   ```bash
   curl http://localhost:8000/api/v1/users/me
   ```
   Should return 401 Unauthorized.

4. **Test Invalid Token**
   ```bash
   curl -H "Authorization: Bearer invalid_token" \
        http://localhost:8000/api/v1/users/me
   ```
   Should return 401 Unauthorized.

## Expected Results

### ✅ Success Indicators

- [ ] Sign-up flow completes without errors
- [ ] Role selection saves to Clerk metadata
- [ ] Dashboard renders role-specific content
- [ ] API calls include valid JWT tokens
- [ ] `/api/v1/users/me` returns real user data (not mock)
- [ ] Protected routes require authentication
- [ ] JWT tokens contain correct claims
- [ ] Role-based access control works
- [ ] Sign-out/sign-in cycle works

### ❌ Common Issues

1. **"Missing Publishable Key" Error**
   - Check frontend `.env.local` file
   - Restart frontend dev server

2. **JWT Verification Fails**
   - Verify `CLERK_JWT_ISSUER` in backend `.env`
   - Check token template configuration in Clerk dashboard
   - Ensure audience matches ("fastapi")

3. **Mock Data Still Returned**
   - Verify users endpoint imports from `enhanced_auth`
   - Check for any remaining mock imports
   - Restart backend server

4. **CORS Errors**
   - Check `BACKEND_CORS_ORIGINS` in backend config
   - Ensure frontend URL is included

5. **Database Connection Issues**
   - Verify MongoDB is running
   - Check `MONGODB_URL` in backend `.env`

## Debug Commands

### Check Backend Logs
```bash
cd backend
python -m uvicorn app.main:app --reload --log-level debug
```

### Check Frontend Network Requests
1. Open browser dev tools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for API calls and their headers/responses

### Verify Environment Variables
```bash
# Backend
cd backend
python -c "from app.core.config import settings; print(f'Issuer: {settings.CLERK_JWT_ISSUER}'); print(f'Audience: {settings.CLERK_JWT_AUDIENCE}')"

# Frontend
cd frontend
npm run dev -- --debug
```

## Next Steps After Successful Testing

1. **Set up webhook endpoint** for production user synchronization
2. **Configure production environment variables**
3. **Set up proper error handling** for authentication failures
4. **Implement refresh token logic** if needed
5. **Add role-based UI components** throughout the application
