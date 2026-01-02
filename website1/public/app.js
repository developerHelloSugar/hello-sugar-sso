async function goToWebsite2WithSSO(event) {
    event.preventDefault();
    console.log('[website1] Generating SSO token for Website 2...');

    try {
        const response = await fetch('/auth/generate-sso-for-site', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            console.log('[website1] SSO token generated:', data.token);
            window.open(`http://localhost:3001/sso-login?token=${data.token}`, '_blank');
        } else {
            console.error('[website1] Failed to generate SSO token');
            window.open('http://localhost:3001', '_blank');
        }
    } catch (error) {
        console.error('[website1] Error generating SSO token:', error);
        window.open('http://localhost:3001', '_blank');
    }
}

const WEBSITE2_ORIGIN = 'http://localhost:3001';

let lastEmbedToken = null;
let embedListenerWired = false;
let embedHandshakeTimer = null;

function showEmbedSection() {
    const section = document.getElementById('embed-section');
    if (section) section.classList.remove('hidden');
}

function hideEmbedSection() {
    const section = document.getElementById('embed-section');
    if (section) section.classList.add('hidden');

    const iframe = document.getElementById('embed-iframe');
    if (iframe) {
        iframe.classList.remove('is-loading');
        iframe.src = 'about:blank';
    }

    lastEmbedToken = null;
}

function setEmbedLoading(isLoading, message) {
    const overlay = document.getElementById('embed-loading');
    if (!overlay) return;

    if (!isLoading) {
        overlay.classList.add('hidden');
        return;
    }

    overlay.classList.remove('hidden');
    if (message) {
        overlay.innerHTML = `<div style="text-align:center;"><div class="loading"></div>${message}</div>`;
    } else {
        overlay.innerHTML = `
            <div>
                <div class="loading"></div>
                Loading Website 2 with SSO...
            </div>
        `;
    }
}

function ensureEmbedListener() {
    if (embedListenerWired) return;
    embedListenerWired = true;

    window.addEventListener('message', (event) => {
        if (event.origin !== WEBSITE2_ORIGIN) return;
        const payload = event.data;
        if (!payload || payload.type !== 'EMBED_AUTH_STATUS' || payload.site !== 'website2') return;

        if (embedHandshakeTimer) {
            clearTimeout(embedHandshakeTimer);
            embedHandshakeTimer = null;
        }

        const iframe = document.getElementById('embed-iframe');
        if (payload.authenticated) {
            setEmbedLoading(false);
            if (iframe) iframe.classList.remove('is-loading');
        } else {
            setEmbedLoading(true, 'Website 2 is not authenticated. Open in new tab to sign in.');
            if (iframe) iframe.classList.add('is-loading');
        }
    });
}

async function generateWebsite2SSOToken() {
    const response = await fetch('/auth/generate-sso-for-site', {
        method: 'POST',
        credentials: 'include'
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.token || null;
}

async function loadWebsite2Embed(event) {
    if (event) event.preventDefault();

    ensureEmbedListener();
    showEmbedSection();
    setEmbedLoading(true);

    const iframe = document.getElementById('embed-iframe');
    if (!iframe) return;

    iframe.classList.add('is-loading');
    iframe.src = 'about:blank';

    try {
        const token = await generateWebsite2SSOToken();
        if (!token) {
            setEmbedLoading(true, 'Failed to generate SSO token. Please sign in first.');
            return;
        }

        lastEmbedToken = token;
        iframe.src = `${WEBSITE2_ORIGIN}/sso-login?token=${encodeURIComponent(token)}`;

        if (embedHandshakeTimer) clearTimeout(embedHandshakeTimer);
        embedHandshakeTimer = setTimeout(() => {
            setEmbedLoading(true, 'Still loading Website 2... (if it hangs, try "Open in new tab")');
        }, 6000);
    } catch (error) {
        console.error('[website1] Error embedding Website 2:', error);
        setEmbedLoading(true, 'Error loading Website 2. Please try again.');
    }
}

function popoutEmbeddedWebsite2() {
    if (lastEmbedToken) {
        window.open(`${WEBSITE2_ORIGIN}/sso-login?token=${encodeURIComponent(lastEmbedToken)}`, '_blank');
        return;
    }
    window.open(WEBSITE2_ORIGIN, '_blank');
}

function wireEmbedActions() {
    const reloadBtn = document.getElementById('embed-reload');
    if (reloadBtn) reloadBtn.onclick = () => loadWebsite2Embed();

    const popoutBtn = document.getElementById('embed-popout');
    if (popoutBtn) popoutBtn.onclick = () => popoutEmbeddedWebsite2();

    const hideBtn = document.getElementById('embed-hide');
    if (hideBtn) hideBtn.onclick = () => hideEmbedSection();
}

async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/status', {
            credentials: 'include'
        });
        const data = await response.json();

        const userInfoDiv = document.getElementById('user-info');
        const authButtonsDiv = document.getElementById('auth-buttons');

        if (data.authenticated) {
            userInfoDiv.innerHTML = `
                <div class="user-card">
                    <img src="${data.user.picture}" alt="${data.user.name}" class="user-avatar">
                    <div class="user-details">
                        <h2>${data.user.name}</h2>
                        <p>${data.user.email}</p>
                    </div>
                </div>
            `;

            authButtonsDiv.innerHTML = `
                <a href="#" onclick="goToWebsite2WithSSO(event)" class="btn btn-secondary">
                    <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                        Go to Website 2
                    </span>
                </a>
                <a href="#" onclick="loadWebsite2Embed(event)" class="btn btn-primary">
                    <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        Embed Website 2 Here
                    </span>
                </a>
                <a href="/auth/logout" class="btn btn-danger">Sign Out</a>
            `;

            wireEmbedActions();
        } else {
            userInfoDiv.innerHTML = '<p class="subtitle">You are not signed in</p>';
            authButtonsDiv.innerHTML = `
                <a href="/sso-login" class="btn btn-primary">Sign In with SSO</a>
                <a href="http://localhost:3001" class="btn btn-secondary" target="_blank">
                    <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                        Go to Website 2
                    </span>
                </a>
            `;
            hideEmbedSection();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

checkAuthStatus();
