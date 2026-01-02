# Website 1 - SSO Provider

SSO authentication provider built with Node.js, Express, and Google OAuth 2.0.

## Features

- Google OAuth 2.0 authentication
- SSO token generation for other websites
- Session management
- Secure token generation with 5-minute expiry
- CORS support for cross-origin requests

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
6. Copy your Client ID and Client Secret

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
CALLBACK_URL=http://localhost:3000/auth/google/callback

JWT_SECRET=generate_a_random_secret_here
SESSION_SECRET=generate_another_random_secret_here

WEBSITE1_PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 4. Run the Application

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The application will run on `http://localhost:3000`

## API Endpoints

- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/status` - Check authentication status
- `POST /auth/sso/generate` - Generate SSO token (requires authentication)
- `POST /auth/sso/verify` - Verify SSO token and create session
- `GET /auth/logout` - Logout current user

## How to Use

### Basic Login

1. Open `http://localhost:3000` in your browser
2. Click "Sign In"
3. Sign in with your Google account
4. You'll be redirected to the home page, showing your profile

### Generate SSO Token for Other Websites

1. After signing in, click "Generate SSO Token for Other Site"
2. Copy the token (it's automatically copied to clipboard)
3. Use this token to authenticate on other SSO-enabled websites
4. Tokens expire after 5 minutes

## Security Features

- SSO tokens expire after 5 minutes
- Session cookies are HTTP-only
- Secure cookies in production (HTTPS)
- CORS configuration for allowed origins
- JWT-based token generation
- Single-use SSO tokens

## Production Deployment

For production deployment:

1. Change `NODE_ENV=production` in `.env`
2. Use strong, randomly generated secrets for `JWT_SECRET` and `SESSION_SECRET`
3. Enable HTTPS and set `secure: true` for cookies
4. Update `CALLBACK_URL` to your production domain
5. Add your production domains to `ALLOWED_ORIGINS`
6. Use a proper session store (Redis, MongoDB) instead of in-memory storage

## Troubleshooting

### Google OAuth not working
- Verify your Client ID and Secret are correct
- Check that the callback URL matches exactly in Google Console
- Ensure the Google+ API is enabled

### CORS errors
- Add your website URL to `ALLOWED_ORIGINS` in `.env`
- Restart the server after changing environment variables
