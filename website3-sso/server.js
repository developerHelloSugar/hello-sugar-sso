require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');

const app = express();

const SESSION_SECRET = process.env.SESSION_SECRET || 'session-secret-change-in-production';

const ssoTokens = new Map();

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
    if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || 'http://localhost:3002/auth/google/callback'
  },
  function(accessToken, refreshToken, profile, cb) {
    const user = {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos[0]?.value
    };
    return cb(null, user);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/auth/google', (req, res, next) => {
  const returnUrl = req.query.returnUrl || '';
  console.log('[/auth/google] Received returnUrl:', returnUrl);
  const state = Buffer.from(JSON.stringify({ returnUrl })).toString('base64');
  console.log('[/auth/google] Encoded state:', state);
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state
  })(req, res, next);
});

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    let returnUrl;
    try {
      const state = req.query.state;
      console.log('[/auth/google/callback] Received state from Google:', state);
      if (state) {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        returnUrl = decoded.returnUrl;
        console.log('[/auth/google/callback] Decoded returnUrl:', returnUrl);
      }
    } catch (e) {
      console.error('[/auth/google/callback] Error decoding state:', e);
      returnUrl = null;
    }

    console.log('[/auth/google/callback] Final returnUrl:', returnUrl);
    console.log('[/auth/google/callback] User authenticated:', req.user);

    // Save session explicitly to ensure it persists on the SSO service
    req.session.save((err) => {
      if (err) {
        console.error('[/auth/google/callback] Session save error:', err);
      }

      if (returnUrl && returnUrl.startsWith('http://localhost:')) {
        // Generate SSO token and redirect to the return URL
        const token = uuidv4();
        const expiresAt = Date.now() + (5 * 60 * 1000);

        ssoTokens.set(token, {
          user: req.user,
          expiresAt
        });

        setTimeout(() => {
          ssoTokens.delete(token);
        }, 5 * 60 * 1000);

        try {
          const parsed = new URL(returnUrl);
          if (parsed.pathname.endsWith('/sso-login')) {
            parsed.searchParams.set('token', token);
            res.redirect(parsed.toString());
          } else {
            res.redirect(`${parsed.origin}/sso-login?token=${encodeURIComponent(token)}`);
          }
        } catch (e) {
          console.error('[/auth/google/callback] Invalid returnUrl:', returnUrl, e);
          res.redirect('/');
        }
      } else {
        res.redirect('/');
      }
    });
  }
);

app.get('/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: req.user
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

app.post('/auth/sso/generate', (req, res) => {
  console.log('[/auth/sso/generate] Request received');
  console.log('[/auth/sso/generate] Origin:', req.headers.origin);
  console.log('[/auth/sso/generate] Authenticated:', req.isAuthenticated());
  console.log('[/auth/sso/generate] User:', req.user);
  console.log('[/auth/sso/generate] Session:', req.session);

  if (!req.isAuthenticated()) {
    console.log('[/auth/sso/generate] User not authenticated, returning 401');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = uuidv4();
  const expiresAt = Date.now() + (5 * 60 * 1000);

  ssoTokens.set(token, {
    user: req.user,
    expiresAt
  });

  setTimeout(() => {
    ssoTokens.delete(token);
  }, 5 * 60 * 1000);

  console.log('[/auth/sso/generate] Token generated:', token);
  res.json({ token });
});

app.post('/auth/sso/generate-from-user', (req, res) => {
  console.log('[/auth/sso/generate-from-user] Request received');
  const { user } = req.body;

  if (!user || !user.email) {
    console.log('[/auth/sso/generate-from-user] Invalid user data');
    return res.status(400).json({ error: 'Invalid user data' });
  }

  const token = uuidv4();
  const expiresAt = Date.now() + (5 * 60 * 1000);

  ssoTokens.set(token, {
    user: user,
    expiresAt
  });

  setTimeout(() => {
    ssoTokens.delete(token);
  }, 5 * 60 * 1000);

  console.log('[/auth/sso/generate-from-user] Token generated:', token, 'for user:', user.email);
  res.json({ token });
});

app.post('/auth/sso/verify', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  const ssoData = ssoTokens.get(token);

  if (!ssoData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (Date.now() > ssoData.expiresAt) {
    ssoTokens.delete(token);
    return res.status(401).json({ error: 'Token expired' });
  }

  ssoTokens.delete(token);

  res.json({
    success: true,
    user: ssoData.user
  });
});

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect('/');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.SSO_PORT || 3002;
app.listen(PORT, () => {
  console.log(`SSO Service running on http://localhost:${PORT}`);
});
