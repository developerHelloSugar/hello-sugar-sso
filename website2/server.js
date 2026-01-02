require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

const SESSION_SECRET = process.env.SESSION_SECRET || 'session-secret-change-in-production';
const SSO_SERVICE_URL = process.env.SSO_SERVICE_URL || 'http://localhost:3000';

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

app.use(express.static(path.join(__dirname, 'public')));

app.post('/auth/sso/verify', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${SSO_SERVICE_URL}/auth/sso/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      req.session.user = data.user;
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ error: 'Session save failed' });
        }
        res.json({ success: true, user: data.user });
      });
    } else {
      res.status(401).json({ error: data.error || 'SSO verification failed' });
    }
  } catch (error) {
    console.error('SSO verification error:', error);
    res.status(500).json({ error: 'SSO verification failed' });
  }
});

app.get('/auth/status', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect('/');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/sso-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sso-login.html'));
});

app.post('/auth/generate-sso-for-site', async (req, res) => {
  console.log('[website2 /auth/generate-sso-for-site] Request received');

  if (!req.session.user) {
    console.log('[website2] User not authenticated on website2');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${SSO_SERVICE_URL}/auth/sso/generate-from-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user: req.session.user })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[website2] SSO token generated for cross-site:', data.token);
      res.json(data);
    } else {
      console.error('[website2] Failed to generate SSO token:', data.error);
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('[website2] Error generating SSO token:', error);
    res.status(500).json({ error: 'Failed to generate SSO token' });
  }
});

const PORT = process.env.WEBSITE2_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Website 2 running on http://localhost:${PORT}`);
  console.log(`SSO Service URL: ${SSO_SERVICE_URL}`);
});
