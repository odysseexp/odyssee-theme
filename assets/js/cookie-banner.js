document.addEventListener('DOMContentLoaded', () => {
    const cookieBanner = document.getElementById('lgpd-cookie-banner');
    if (!cookieBanner) return;

    const btnAccept = document.getElementById('cookie-btn-accept');
    const btnReject = document.getElementById('cookie-btn-reject');

    const consent = localStorage.getItem('odyssee_cookie_consent');

    if (!consent) {
        
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 800);
    } else if (consent === 'accepted') {
        
        initializeTracking();
    }

    const hideBanner = () => {
        cookieBanner.classList.remove('show');
        setTimeout(() => {
            cookieBanner.style.display = 'none';
        }, 600); 
    };

    if (btnAccept) {
        btnAccept.addEventListener('click', () => {
            localStorage.setItem('odyssee_cookie_consent', 'accepted');
            hideBanner();
            initializeTracking();
        });
    }

    if (btnReject) {
        btnReject.addEventListener('click', () => {
            localStorage.setItem('odyssee_cookie_consent', 'rejected');
            hideBanner();
        });
    }

    function initializeTracking() {
        window.odysseeCookiesAccepted = true;

        window.dispatchEvent(new Event('odyssee_cookies_accepted'));

    }
});
