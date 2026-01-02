# Website 2 - SSO Consumer

Example application that consumes SSO authentication from Website 1 (SSO Provider).

## Features

- SSO token verification
- Session management
- No direct authentication - relies on SSO provider
- Independent application server

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
SESSION_SECRET=generate_a_random_secret_here
WEBSITE2_PORT=3001
SSO_SERVICE_URL=http://localhost:3000
```

**Important:** Make sure Website 1 (SSO Provider) is running at the `SSO_SERVICE_URL`.

### 3. Run the Application

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The application will run on `http://localhost:3001`

## API Endpoints

- `GET /auth/status` - Check authentication status
- `POST /auth/sso/verify` - Verify SSO token from main service
- `GET /auth/logout` - Logout current user
- `GET /sso-login` - SSO login page

## How to Use

### SSO Login

#### Method 1: Token Verification Page
1. Get an SSO token from Website 1 (http://localhost:3000)
2. Go to `http://localhost:3001/sso-login`
3. Paste the token and click "Verify Token"
4. You'll be automatically signed in

#### Method 2: Direct Link
1. After getting a token from Website 1, use the URL:
   ```
   http://localhost:3001/sso-login?token=YOUR_TOKEN_HERE
   ```
2. The token will be automatically verified

## How SSO Works

1. User authenticates on Website 1 (SSO Provider)
2. Website 1 generates a short-lived SSO token
3. User provides token to Website 2 (this application)
4. Website 2 verifies the token with Website 1
5. Website 2 creates its own session for the user
6. User is now authenticated on Website 2

## Security Notes

- Tokens expire after 5 minutes
- Tokens are single-use only
- Sessions are independent between Website 1 and Website 2
- This website never sees user passwords (handled by Google OAuth on Website 1)

## Troubleshooting

### "Invalid or expired token"
- Tokens expire after 5 minutes - generate a new one
- Tokens are single-use - you cannot reuse them

### Cannot connect to SSO service
- Ensure Website 1 is running at the `SSO_SERVICE_URL`
- Check that the `SSO_SERVICE_URL` in `.env` is correct
- Verify network connectivity between the services
