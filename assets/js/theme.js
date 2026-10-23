

(function() {
    'use strict';

    const THEME_KEY = 'odyssee_theme';
    const ACCENT_KEY = 'odyssee_accent';

    const DEFAULT_THEME = 'dark';
    const DEFAULT_ACCENT = 'purple';

    function getStored(key, fallback) {
        try {
            return localStorage.getItem(key) || fallback;
        } catch (e) {
            return fallback;
        }
    }

    function setStored(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {}
    }

    function applyPreferences(theme, accent) {
        const body = document.body;
        if (!body) return;

        body.classList.remove('theme-light', 'theme-dark');
        body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');

        body.classList.remove('accent-purple', 'accent-red');
        body.classList.add(accent === 'red' ? 'accent-red' : 'accent-purple');

        updateBrandLogo(theme);

        updateConfigUI(theme, accent);
    }

    function updateBrandLogo(theme) {
        const logos = document.querySelectorAll('.header-logo, .footer-logo img, .brand-logo img');
        logos.forEach(logo => {
            const darkSrc = logo.dataset.darkSrc || logo.src;
            const lightSrc = logo.dataset.lightSrc || logo.src;
            logo.src = theme === 'dark' ? darkSrc : lightSrc;
        });
    }

    function updateConfigUI(currentTheme, currentAccent) {
        
        document.querySelectorAll('.theme-card-option').forEach(btn => {
            const isMatch = btn.dataset.theme === currentTheme;
            btn.classList.toggle('active', isMatch);
        });

        document.querySelectorAll('.accent-card-option').forEach(btn => {
            const isMatch = btn.dataset.accent === currentAccent;
            btn.classList.toggle('active', isMatch);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const currentTheme = getStored(THEME_KEY, DEFAULT_THEME);
        const currentAccent = getStored(ACCENT_KEY, DEFAULT_ACCENT);

        applyPreferences(currentTheme, currentAccent);

        const overlay = document.getElementById('configOverlay');
        const openBtns = document.querySelectorAll('.btn-config-trigger, [data-action="open-config"]');
        const closeBtns = document.querySelectorAll('.btn-close-config, #btnConfigClose');

        function openConfig() {
            if (overlay) {
                overlay.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeConfig() {
            if (overlay) {
                overlay.classList.remove('open');
                document.body.style.overflow = '';
            }
        }

        openBtns.forEach(btn => btn.addEventListener('click', (e) => {
            e.preventDefault();
            openConfig();
        }));

        closeBtns.forEach(btn => btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeConfig();
        }));

        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeConfig();
                }
            });
        }

        document.querySelectorAll('.theme-card-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedTheme = btn.dataset.theme;
                setStored(THEME_KEY, selectedTheme);
                const activeAccent = getStored(ACCENT_KEY, DEFAULT_ACCENT);
                applyPreferences(selectedTheme, activeAccent);
            });
        });

        document.querySelectorAll('.accent-card-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedAccent = btn.dataset.accent;
                setStored(ACCENT_KEY, selectedAccent);
                const activeTheme = getStored(THEME_KEY, DEFAULT_THEME);
                applyPreferences(activeTheme, selectedAccent);
            });
        });

        document.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.faq-item');
                const isActive = item.classList.contains('active');

                document.querySelectorAll('.faq-item').forEach(other => {
                    if (other !== item) other.classList.remove('active');
                });

                item.classList.toggle('active', !isActive);
            });
        });

        const mobileToggle = document.getElementById('mobileMenuToggle');
        const mobileNav = document.getElementById('mobileNav');
        if (mobileToggle && mobileNav) {
            mobileToggle.addEventListener('click', () => {
                mobileNav.classList.toggle('open');
            });
        }
    });
})();
