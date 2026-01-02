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
                <button onclick="generateSSOToken()" class="btn btn-primary">
                    Generate SSO Token for Other Sites
                </button>
                <a href="/auth/logout" class="btn btn-danger">Sign Out</a>
            `;
        } else {
            userInfoDiv.innerHTML = '<p class="subtitle">You are not signed in</p>';
            authButtonsDiv.innerHTML = `
                <a href="/login" class="btn btn-primary">Sign In</a>
            `;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

async function generateSSOToken() {
    try {
        const response = await fetch('/auth/sso/generate', {
            method: 'POST',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to generate SSO token');
        }

        const data = await response.json();

        alert(`SSO Token generated: ${data.token}\n\nUse this token on Website 1 or Website 2 within 5 minutes.\n\nToken will be copied to clipboard.`);

        if (navigator.clipboard) {
            await navigator.clipboard.writeText(data.token);
        }

        console.log('SSO Token:', data.token);
        console.log('Use this URL to test SSO:');
        console.log(`Website 1: http://localhost:3000/sso-login?token=${data.token}`);
        console.log(`Website 2: http://localhost:3001/sso-login?token=${data.token}`);
    } catch (error) {
        console.error('Error generating SSO token:', error);
        alert('Failed to generate SSO token');
    }
}

checkAuthStatus();
