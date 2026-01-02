const urlParams = new URLSearchParams(window.location.search);
const ssoToken = urlParams.get('token');
const returnUrl = urlParams.get('returnUrl');
const ssoStatusDiv = document.getElementById('sso-status');

console.log('[login.js] Current URL:', window.location.href);
console.log('[login.js] Received returnUrl from query params:', returnUrl);

function handleGoogleSignIn(event) {
    event.preventDefault();
    const finalUrl = returnUrl
        ? `/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`
        : '/auth/google';
    console.log('[login.js] Navigating to:', finalUrl);
    window.location.href = finalUrl;
}

// Legacy: Update Google Sign In button to include returnUrl (for non-JS fallback)
if (returnUrl) {
    const googleBtn = document.getElementById('google-signin-btn');
    if (googleBtn) {
        googleBtn.href = `/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
        console.log('[login.js] Set Google button href:', googleBtn.href);
    }
}

if (ssoToken) {
    ssoStatusDiv.innerHTML = '<div class="loading"></div> Verifying SSO token...';
    ssoStatusDiv.className = 'sso-status processing';

    verifySSOToken(ssoToken);
}

async function verifySSOToken(token) {
    try {
        const response = await fetch('/auth/sso/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            ssoStatusDiv.innerHTML = 'SSO login successful! Redirecting...';
            ssoStatusDiv.className = 'sso-status success';

            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            ssoStatusDiv.innerHTML = `SSO login failed: ${data.error || 'Unknown error'}`;
            ssoStatusDiv.className = 'sso-status error';
        }
    } catch (error) {
        console.error('Error verifying SSO token:', error);
        ssoStatusDiv.innerHTML = 'SSO verification failed. Please try regular login.';
        ssoStatusDiv.className = 'sso-status error';
    }
}

async function checkIfAlreadyLoggedIn() {
    try {
        const response = await fetch('/auth/status', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.authenticated) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

if (!ssoToken) {
    checkIfAlreadyLoggedIn();
}
