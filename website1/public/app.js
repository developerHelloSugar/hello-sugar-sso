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
                <a href="/auth/logout" class="btn btn-danger">Sign Out</a>
            `;
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
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

checkAuthStatus();
