
(function () {
    
    const categoryBanners = {
        'design-grafico': {
            'theme-dark color-red': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_1.webp',
            'theme-dark color-blue': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_5.webp',
            'theme-dark color-green': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_3.webp',
            'theme-dark color-yellow': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_2.webp',
            'theme-dark color-purple': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_4.webp',
            'theme-light color-red': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_6.webp',
            'theme-light color-yellow': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_7.webp',
            'theme-light color-green': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_8.webp',
            'theme-light color-purple': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_9.webp',
            'theme-light color-blue': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_10.webp'
        },
        'edicao-video': {
            'theme-dark color-red': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_11.webp',
            'theme-dark color-yellow': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_12.webp',
            'theme-dark color-green': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_13.webp',
            'theme-dark color-purple': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_14.webp',
            'theme-dark color-blue': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_15.webp',
            'theme-light color-red': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_16.webp',
            'theme-light color-yellow': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_17.webp',
            'theme-light color-green': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_18.webp',
            'theme-light color-purple': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_19.webp',
            'theme-light color-blue': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_20.webp'
        },
        'motion': {
            'theme-dark color-red': 'http://localhost:8881/wp-content/uploads/2025/12/motiondarkred.gif',
            'theme-dark color-yellow': 'http://localhost:8881/wp-content/uploads/2025/12/motiondarkyellow.gif',
            'theme-dark color-green': 'http://localhost:8881/wp-content/uploads/2025/12/motiondarkgreen.gif',
            'theme-dark color-purple': 'http://localhost:8881/wp-content/uploads/2025/12/motiondarkpurple.gif',
            'theme-dark color-blue': 'http://localhost:8881/wp-content/uploads/2025/12/motiondarkblue.gif',
            'theme-light color-red': 'http://localhost:8881/wp-content/uploads/2025/12/motionlightred.gif',
            'theme-light color-yellow': 'http://localhost:8881/wp-content/uploads/2025/12/motionlightyellow.gif',
            'theme-light color-green': 'http://localhost:8881/wp-content/uploads/2025/12/motionlightgreen.gif',
            'theme-light color-purple': 'http://localhost:8881/wp-content/uploads/2025/12/motionlightpurple.gif',
            'theme-light color-blue': 'http://localhost:8881/wp-content/uploads/2025/12/motionlightblue.gif'
        },
        'ilustracao': {
            'theme-dark color-red': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_21.webp',
            'theme-dark color-yellow': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_22.webp',
            'theme-dark color-green': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_23.webp',
            'theme-dark color-purple': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_24.webp',
            'theme-dark color-blue': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_25.webp',
            'theme-light color-red': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_26.webp',
            'theme-light color-yellow': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_27.webp',
            'theme-light color-green': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_28.webp',
            'theme-light color-purple': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_29.webp',
            'theme-light color-blue': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_30.webp'
        },
        'impressos': {
            'theme-dark color-red': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_31.webp',
            'theme-dark color-yellow': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_32.webp',
            'theme-dark color-green': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_33.webp',
            'theme-dark color-purple': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_34.webp',
            'theme-dark color-blue': 'http://localhost:8881/wp-content/uploads/2025/12/banner-dg_35.webp',
            'theme-light color-red': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_36.webp',
            'theme-light color-yellow': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_37.webp',
            'theme-light color-green': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_38.webp',
            'theme-light color-purple': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_39.webp',
            'theme-light color-blue': 'http://localhost:8881/wp-content/uploads/2026/05/banner-dg_40.webp'
        }
    };

    function getCurrentTheme() {
        const body = document.body;
        const isDark = body.classList.contains('theme-dark');
        const themeClass = isDark ? 'theme-dark' : 'theme-light';

        let colorClass = 'color-purple'; 
        const classList = Array.from(body.classList);
        const colorMatch = classList.find(cls => cls.startsWith('color-'));
        if (colorMatch) {
            colorClass = colorMatch;
        }

        return `${themeClass} ${colorClass}`;
    }

    function updateCategoryBanner(category) {
        const banner = document.getElementById(`banner-${category}`);
        if (!banner) return;

        const currentTheme = getCurrentTheme();
        const bannerUrl = categoryBanners[category] && categoryBanners[category][currentTheme];

        if (bannerUrl) {
            banner.src = bannerUrl;
            banner.style.display = 'block';
        } else {
            
            banner.style.display = 'none';
        }
    }

    function updateAllBanners() {
        Object.keys(categoryBanners).forEach(category => {
            updateCategoryBanner(category);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateAllBanners);
    } else {
        updateAllBanners();
    }

    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.attributeName === 'class') {
                updateAllBanners();
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
})();
