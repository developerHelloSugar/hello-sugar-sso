async function loadEmbeddedWebsite2() {
    console.log('[embed] Loading Website 2 with SSO...');
    const loadingOverlay = document.getElementById('loading-overlay');
    const iframe = document.getElementById('website2-iframe');

    try {
        // Generate SSO token
        const response = await fetch('/auth/generate-sso-for-site', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            console.log('[embed] SSO token generated:', data.token);

            // Load Website 2 with the SSO token
            const website2Url = `http://localhost:3001/sso-login?token=${data.token}`;
            iframe.src = website2Url;

            // Hide loading overlay after iframe loads
            iframe.onload = () => {
                console.log('[embed] Website 2 loaded successfully');
                setTimeout(() => {
                    loadingOverlay.classList.add('hidden');
                }, 500);
            };
        } else {
            console.error('[embed] Failed to generate SSO token');
            loadingOverlay.innerHTML = `
                <div style="text-align: center;">
                    <p style="margin-bottom: 20px;">Failed to generate SSO token. Please sign in first.</p>
                    <a href="/" style="color: white; text-decoration: underline;">Go back to Website 1</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('[embed] Error loading embedded website:', error);
        loadingOverlay.innerHTML = `
            <div style="text-align: center;">
                <p style="margin-bottom: 20px;">Error loading Website 2. Please try again.</p>
                <a href="/" style="color: white; text-decoration: underline;">Go back to Website 1</a>
            </div>
        `;
    }
}

// Check if user is authenticated before loading
async function checkAuth() {
    try {
        const response = await fetch('/auth/status', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.authenticated) {
            loadEmbeddedWebsite2();
        } else {
            // Not authenticated, redirect to SSO login with return URL
            window.location.href = '/sso-login?returnTo=/embed';
        }
    } catch (error) {
        console.error('[embed] Error checking auth status:', error);
        window.location.href = '/sso-login?returnTo=/embed';
    }
}

checkAuth();
