# Clerk Configuration Guide for LearnTrack MVP

This guide explains how to configure Clerk for the LearnTrack MVP React + FastAPI architecture.

## 1. Clerk Dashboard Configuration

### Backend Token Template Setup

1. **Go to Clerk Dashboard**
   - Navigate to [https://dashboard.clerk.com](https://dashboard.clerk.com)
   - Select your LearnTrack application

2. **Create Backend Token Template**
   - Go to **JWT Templates** in the sidebar
   - Click **+ New template**
   - Set the following:
     - **Name**: `fastapi`
     - **Token lifetime**: `3600` seconds (1 hour)
     - **Signing algorithm**: `RS256` (recommended) or `HS256`
     - **Audience**: `fastapi`
     - **Issuer**: Your Clerk instance URL (e.g., `https://healthy-antelope-32.clerk.accounts.dev`)

3. **Configure Claims**
   Add these claims to include user metadata:
   ```json
   {
     "sub": "{{user.id}}",
     "email": "{{user.primary_email_address.email_address}}",
     "name": "{{user.first_name}} {{user.last_name}}",
     "given_name": "{{user.first_name}}",
     "family_name": "{{user.last_name}}",
     "public_metadata": "{{user.public_metadata}}"
   }
   ```

### Webhook Configuration

1. **Create Webhook Endpoint**
   - Go to **Webhooks** in the sidebar
   - Click **+ Add Endpoint**
   - Set **Endpoint URL**: `https://your-backend-domain.com/api/v1/webhooks/clerk`
   - For local development: `https://your-ngrok-url.ngrok.io/api/v1/webhooks/clerk`

2. **Configure Events**
   Subscribe to these events:
   - `user.created`
   - `user.updated`

3. **Copy Webhook Secret**
   - Copy the webhook signing secret
   - Add it to your backend `.env` as `CLERK_WEBHOOK_SECRET`

## 2. Environment Variables

### Frontend (.env.local)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_API_BASE_URL=http://localhost:8000
```

### Backend (.env)
```env
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_JWT_ISSUER=https://your-instance.clerk.accounts.dev
CLERK_JWT_AUDIENCE=fastapi
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
CLERK_FRONTEND_API=https://your-instance.clerk.accounts.dev
```

## 3. User Metadata Structure

LearnTrack uses Clerk's `public_metadata` to store user roles:

```json
{
  "role": "tutor" | "student" | "parent"
}
```

This metadata is set when users complete the role setup process in the frontend.

## 4. Testing the Configuration

1. **Start both applications**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   source .venv/Scripts/activate
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

2. **Test authentication flow**:
   - Visit http://localhost:3000
   - Sign up for a new account
   - Complete role setup
   - Verify you're redirected to the dashboard
   - Check that `/api/v1/users/me` returns your real user data

3. **Verify JWT token**:
   - Open browser dev tools
   - Check Network tab for API calls
   - Verify Authorization header contains `Bearer <jwt-token>`
   - Decode the JWT at [jwt.io](https://jwt.io) to verify claims

## 5. Troubleshooting

### Common Issues

1. **"Missing Publishable Key" error**
   - Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set in frontend/.env.local
   - Restart the frontend development server

2. **JWT verification fails**
   - Check that `CLERK_JWT_ISSUER` matches your Clerk instance URL exactly
   - Verify `CLERK_JWT_AUDIENCE` matches your token template audience
   - Ensure the token template name is "fastapi"

3. **Webhook verification fails**
   - Verify `CLERK_WEBHOOK_SECRET` is correct
   - Check that webhook URL is accessible (use ngrok for local development)

4. **User not found in database**
   - Check webhook is firing correctly
   - Verify webhook endpoint is processing `user.created` events
   - Check MongoDB connection and user collection

### Debug Mode

Enable debug logging in backend/.env:
```env
LOG_LEVEL=DEBUG
ENVIRONMENT=development
```

This will provide detailed logs for JWT verification and webhook processing.
