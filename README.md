# Hello Sugar SSO - Single Sign-On Demo

A demonstration of Single Sign-On (SSO) authentication using Google OAuth, featuring a centralized authentication service and multiple independent client applications.

## Architecture Overview

This project consists of three separate applications:

### Website3-SSO (Port 3002) - Centralized SSO Authentication Service
- **Purpose**: Central authentication provider that handles Google OAuth
- **Has Google OAuth credentials**: YES - This is the only service that talks to Google
- **Responsibilities**:
  - Authenticates users via Google OAuth
  - Generates short-lived SSO tokens (5-minute expiration)
  - Verifies SSO tokens from client applications
  - Maintains user sessions for the SSO service itself

### Website1 (Port 3000) - SSO Client Application
- **Purpose**: Example client application that uses SSO for authentication
- **Has Google OAuth credentials**: NO - Uses SSO service for authentication
- **Responsibilities**:
  - Redirects users to Website3-SSO for login
  - Verifies SSO tokens with Website3-SSO
  - Maintains its own user sessions after SSO verification

### Website2 (Port 3001) - SSO Client Application
- **Purpose**: Another example client application demonstrating SSO across multiple sites
- **Has Google OAuth credentials**: NO - Uses SSO service for authentication
- **Responsibilities**:
  - Redirects users to Website3-SSO for login
  - Verifies SSO tokens with Website3-SSO
  - Maintains its own user sessions after SSO verification

## Project Structure

```
hello-sugar-sso/
├── website3-sso/              # Centralized SSO Service (Port 3002)
│   ├── server.js              # Express server with Google OAuth
│   ├── package.json
│   ├── .env.example
│   └── public/
│       ├── index.html         # SSO service dashboard
│       ├── login.html         # Google OAuth login page
│       ├── app.js
│       ├── login.js
│       └── styles.css
│
├── website1/                  # SSO Client Application 1 (Port 3000)
│   ├── server.js              # Express server (SSO client)
│   ├── package.json
│   ├── .env.example
│   └── public/
│       ├── index.html
│       ├── sso-login.html
│       ├── app.js
│       └── styles.css
│
└── website2/                  # SSO Client Application 2 (Port 3001)
    ├── server.js              # Express server (SSO client)
    ├── package.json
    ├── .env.example
    └── public/
        ├── index.html
        ├── sso-login.html
        ├── app.js
        └── styles.css
```

## Key Principles

- **Centralized Authentication**: Only Website3-SSO needs Google OAuth credentials
- **Complete Independence**: Each website has its own dependencies and configuration
- **No Shared Code**: Zero code dependencies between websites
- **Token-Based SSO**: Websites communicate only through SSO token-based authentication
- **Separate Deployments**: Each website can be on different servers or hosting providers

## Quick Start

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3002/auth/google/callback`
7. Copy your Client ID and Client Secret

### 2. Website3-SSO (SSO Provider)

```bash
cd website3-sso
npm install
cp .env.example .env
# Edit .env with your Google OAuth credentials
npm start
# Runs on http://localhost:3002
```

Required environment variables:
```env
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
CALLBACK_URL=http://localhost:3002/auth/google/callback
SESSION_SECRET=your_random_session_secret
SSO_PORT=3002
```

### 3. Website1 (SSO Client)

```bash
cd website1
npm install
cp .env.example .env
# Edit .env with SSO_SERVICE_URL
npm start
# Runs on http://localhost:3000
```

Required environment variables:
```env
SESSION_SECRET=your_random_session_secret
WEBSITE1_PORT=3000
SSO_SERVICE_URL=http://localhost:3002
```

### 4. Website2 (SSO Client)

```bash
cd website2
npm install
cp .env.example .env
# Edit .env with SSO_SERVICE_URL
npm start
# Runs on http://localhost:3001
```

Required environment variables:
```env
SESSION_SECRET=your_random_session_secret
WEBSITE2_PORT=3001
SSO_SERVICE_URL=http://localhost:3002
```

## How SSO Works

### Authentication Flow:

1. **User visits Website1 or Website2** (not logged in)
2. **Clicks "Sign In with SSO"**
3. **Redirected to Website3-SSO** (localhost:3002)
4. **Clicks "Sign in with Google"** on Website3-SSO
5. **Google OAuth flow** completes on Website3-SSO
6. **Website3-SSO generates SSO token** (valid for 5 minutes)
7. **Token sent back to Website1/Website2**
8. **Client website verifies token** with Website3-SSO
9. **User is logged in** on the client website

### Token Flow Diagram

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│  Website1   │         │ Website3-SSO │         │   Google   │
│  (Client)   │         │  (Provider)  │         │   OAuth    │
└─────────────┘         └──────────────┘         └────────────┘
       │                        │                        │
       │   1. Redirect to SSO   │                        │
       │───────────────────────>│                        │
       │                        │   2. OAuth Request     │
       │                        │───────────────────────>│
       │                        │   3. User Authenticates│
       │                        │<───────────────────────│
       │  4. Generate SSO Token │                        │
       │<───────────────────────│                        │
       │  5. Verify Token       │                        │
       │───────────────────────>│                        │
       │  6. Token Valid        │                        │
       │<───────────────────────│                        │
       │  7. Create Session     │                        │
```

## Features

- **Google OAuth 2.0 authentication** (only in Website3-SSO)
- **Token-based SSO** with 5-minute expiry
- **Single-use security tokens**
- **Independent session management** per website
- **CORS-enabled** for cross-origin requests
- **No direct Google integration** for client apps (Website1 & Website2)

## Why This Architecture?

### Before (Old Architecture):
- Website1 had Google OAuth credentials
- Website2 connected to Website1 for SSO
- Tight coupling between websites

### After (New Architecture):
- **Website3-SSO** is the dedicated authentication service
- **Website1** and **Website2** are pure client applications
- Both client apps use the same SSO flow
- Better separation of concerns
- Easier to add more client applications

## Use Cases

This architecture is suitable for:
- **Microservices** with centralized authentication
- **Multiple applications** sharing a central auth provider
- **SaaS platforms** with separate customer portals
- **Organizations** with multiple web properties
- **Enterprise applications** requiring single sign-on

## Security Features

- **HTTPS in Production**: All cookies are marked secure in production mode
- **HttpOnly Cookies**: Session cookies are httpOnly to prevent XSS attacks
- **Short-lived SSO Tokens**: Tokens expire after 5 minutes
- **Session Management**: Each application maintains separate sessions
- **CORS Configuration**: Controlled cross-origin access
- **Single-use Tokens**: Each SSO token can only be used once

## Troubleshooting

### "Invalid OAuth credentials"
- Verify your Google Client ID and Secret in website3-sso/.env
- Check that the callback URL matches Google Cloud Console

### "SSO verification failed"
- Ensure Website3-SSO is running on port 3002
- Check that SSO_SERVICE_URL is correctly set to http://localhost:3002
- Verify network connectivity between services

### "Session not persisting"
- Check that cookies are enabled in your browser
- Verify SESSION_SECRET is set in all .env files
- Clear browser cookies and try again

## License

ISC
