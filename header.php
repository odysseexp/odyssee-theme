<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="preload" href="<?php echo esc_url( get_template_directory_uri() . '/assets/vendor/font-awesome/webfonts/Ubuntu-Bold.woff2' ); ?>" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="<?php echo esc_url( get_template_directory_uri() . '/assets/vendor/font-awesome/webfonts/Ubuntu-Regular.woff2' ); ?>" as="font" type="font/woff2" crossorigin>

    <link rel="dns-prefetch" href="https://img.youtube.com">
    <link rel="dns-prefetch" href="https://wa.me">
    
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

    <script nonce="<?php echo function_exists('odyssee_generate_csp_nonce') ? esc_attr( odyssee_generate_csp_nonce() ) : ''; ?>">
        (function() {
            const body = document.body;
            function getSafe(item) { try { return localStorage.getItem(item); } catch(e) { return null; } }
            function storageAvailable() { try { const k = '__storagetest__'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch(e) { return false; } }
            const savedTheme = getSafe('userTheme') || 'dark';
            let savedColor = getSafe('userColor') || 'purple';
            if (savedColor !== 'purple' && savedColor !== 'red') {
                savedColor = 'purple';
            }
            body.classList.add(savedTheme === 'dark' ? 'theme-dark' : 'theme-light');
            body.classList.add(`color-${savedColor}`);
            
            const onboardingDone = storageAvailable() && getSafe('onboardingFeito') === 'sim';
            if (!onboardingDone) {
                if (storageAvailable()) {
                    body.classList.add('modo-onboarding');
                } else {
                    body.classList.remove('modo-onboarding');
                }
            } else {
                body.classList.remove('modo-onboarding');
            }
        })();
    </script>

    <div class="onboarding-aurora">
        <div class="g1"></div>
        <div class="g2"></div>
        <div class="g3"></div>
        <div class="g4"></div>
        <div class="g5"></div>
    </div>

    <div id="onboarding-container">
        <img src="<?php echo esc_url( home_url( '/wp-content/uploads/2025/11/typewhite.webp' ) ); ?>" alt="Odyssee Logo" class="onboarding-logo">
        <h4 class="onboarding-subtitle" data-key="subtitulo">mais que um portfólio, uma experiência web criativa</h4>
        <div class="step-wrapper">
            <div id="step-language" class="onboarding-step">
                <p data-key="escolha-idioma">Escolha um idioma de preferência</p>
                <div class="button-group lang-button-group">
                    <button id="lang-pt" data-lang="pt" class="lang-btn"><img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/flags/br.svg' ); ?>" alt="Brasil" class="flag-icon" width="22" height="15"> <span>Português Brasileiro</span></button>
                    <button id="lang-en" data-lang="en" class="lang-btn"><img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/flags/gb.svg' ); ?>" alt="English" class="flag-icon" width="22" height="15"> <span>Inglês</span></button>
                </div>
            </div>
            <div id="step-theme" class="onboarding-step">
                <p data-key="escolha-tema">Escolha um tema para começar a navegar</p>
                <div class="theme-picker">
                    <button id="btn-light" aria-label="Tema claro" title="Tema Claro">
                        <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM4 10.5H1v3h3zm9-9.95h-3v3.95h3zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5v3h3v-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h3v-3.95h-3zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41z"/></svg>
                    </button>
                    <button id="btn-dark" aria-label="Tema escuro" title="Tema Escuro">
                        <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                    </button>
                </div>
                <p style="font-size: 0.88rem; color: var(--color-subtitle); margin: 0.5rem 0 0.8rem; opacity: 0.85;">Cor em destaque (botões e detalhes):</p>
                <div class="color-picker-grid" style="grid-template-columns: repeat(2, 1fr); max-width: 260px; margin: 0 auto;">
                    <button class="color-option-btn" data-color="purple">
                        <span class="color-dot purple"></span>
                        <span class="color-name" data-key="cor-roxo">Roxo</span>
                    </button>
                    <button class="color-option-btn" data-color="red">
                        <span class="color-dot red"></span>
                        <span class="color-name" data-key="cor-vermelho">Vermelho</span>
                    </button>
                </div>
                <p class="note">Você pode alterar isso depois nas <svg class="icon-svg small" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.11-.65l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.066 7.066 0 00-1.62-.94l-.36-2.54A.5.5 0 0013.4 2h-2.8a.5.5 0 00-.5.42l-.36 2.54c-.57.21-1.11.5-1.62.94L5.6 5.96a.5.5 0 00-.6.22L3.08 9.5a.5.5 0 00.11.65l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L3.19 15.2a.5.5 0 00-.11.65l1.92 3.32c.14.24.44.34.68.22l2.39-.96c.5.44 1.05.8 1.62.94l.36 2.54c.05.28.28.48.5.48h2.8c.28 0 .46-.2.5-.48l.36-2.54c.57-.21 1.11-.5 1.62-.94l2.39.96c.24.12.54.02.68-.22l1.92-3.32a.5.5 0 00-.11-.65l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z"/></svg> configurações.</p>
                <button id="btn-continuar" data-key="continuar">Continuar &rarr;</button>
            </div>
        </div> 
    </div> 

    <div id="site-principal">
        
        <header class="main-header transparent">
            <div class="header-left">
                <a href="<?php echo esc_url( home_url() ); ?>" class="logo-link">
                    <img src="<?php echo esc_url( home_url( '/wp-content/uploads/2025/11/typeblack.webp' ) ); ?>" alt="Odyssee Hawk" class="header-logo" id="header-logotype">
                </a>
                <div class="header-mobile-buttons">
                    <a href="<?php echo esc_url( home_url( '/sobre-mim/' ) ); ?>" class="btn-header-about" aria-label="Sobre Mim">
                        <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> <span data-key="sobre-mim">Sobre Mim</span>
                    </a>
                    <a href="<?php echo esc_url( home_url( '/servicos' ) ); ?>" class="btn-header-about" aria-label="Serviços">
                        <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg> <span data-key="servicos">Serviços</span>
                    </a>
                    <a href="<?php echo esc_url( home_url( '/posts' ) ); ?>" class="btn-header-about" aria-label="Posts">
                        <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg> <span data-key="todos-posts">Posts</span>
                    </a>
                </div>
            </div>

            <nav class="main-nav desktop-only">
                <a href="<?php echo esc_url( home_url( '/#design-grafico' ) ); ?>" data-key="design-grafico">Design</a>
                <a href="<?php echo esc_url( home_url( '/#edicao-video' ) ); ?>" data-key="edicao-video">Vídeo</a>
                <a href="<?php echo esc_url( home_url( '/#motion' ) ); ?>" data-key="motion">Motion</a>
                <a href="<?php echo esc_url( home_url( '/#ilustracao' ) ); ?>" data-key="ilustracao">Ilustração</a>
                <a href="<?php echo esc_url( home_url( '/#impressos' ) ); ?>" data-key="impressos">Impressos</a>
                <a href="<?php echo esc_url( home_url( '/servicos' ) ); ?>" data-key="servicos" class="nav-highlight">Serviços</a>
                <a href="<?php echo esc_url( home_url( '/posts' ) ); ?>" data-key="todos-posts" class="nav-highlight">Blog</a>
                <a href="<?php echo esc_url( home_url( '/sobre-mim/' ) ); ?>" class="nav-highlight" aria-label="Sobre Mim">
                    <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> <span data-key="sobre-mim">Sobre Mim</span>
                </a>
            </nav>

            <div class="secondary-nav desktop-only">
                <a href="<?php echo esc_url( home_url( '/faq' ) ); ?>" id="btn-faq" class="btn-header-icon" aria-label="FAQ">
                    <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm.25 17h-1.5v-1.5h1.5V19zm1.34-7.03c-.24.24-.41.48-.53.71-.18.35-.27.73-.26 1.21h-1.5c0-.84.21-1.56.63-2.16.25-.35.6-.7 1.03-1.06.31-.25.55-.49.72-.73.17-.25.26-.56.26-.94 0-.6-.22-1.1-.66-1.49-.44-.4-1.02-.6-1.74-.6-1.02 0-1.93.38-2.72 1.13l-.96-1.11C9.32 6.1 10.68 5.4 12 5.4c1.06 0 1.87.34 2.45 1.03.58.69.87 1.53.87 2.5 0 .86-.24 1.56-.74 2.03z"/></svg>
                </a>
                <button id="btn-settings" class="btn-header-settings" aria-label="Configurações">
                    <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.11-.65l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.066 7.066 0 00-1.62-.94l-.36-2.54A.5.5 0 0013.4 2h-2.8a.5.5 0 00-.5.42l-.36 2.54c-.57.21-1.11.5-1.62.94L5.6 5.96a.5.5 0 00-.6.22L3.08 9.5a.5.5 0 00.11.65l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L3.19 15.2a.5.5 0 00-.11.65l1.92 3.32c.14.24.44.34.68.22l2.39-.96c.5.44 1.05.8 1.62.94l.36 2.54c.05.28.28.48.5.48h2.8c.28 0 .46-.2.5-.48l.36-2.54c.57-.21 1.11-.5 1.62-.94l2.39.96c.24.12.54.02.68-.22l1.92-3.32a.5.5 0 00-.11-.65l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z"/></svg>
                </button>
            </div>

            <button id="btn-mobile-menu" class="mobile-menu-toggle" aria-label="Abrir menu">
                <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>
            </button>

            <div id="mobile-menu-overlay">
                <div class="mobile-menu-header">
                    <span class="mobile-menu-title" data-key="menu">Menu</span>
                    <button id="close-mobile-menu" aria-label="Fechar menu">&times;</button>
                </div>
                <nav class="mobile-nav-links">
                    <a href="<?php echo esc_url( home_url( '/#design-grafico' ) ); ?>" class="mobile-link" data-key="design-grafico">Design Gráfico</a>
                    <a href="<?php echo esc_url( home_url( '/#edicao-video' ) ); ?>" class="mobile-link" data-key="edicao-video">Edição de Vídeo</a>
                    <a href="<?php echo esc_url( home_url( '/#motion' ) ); ?>" class="mobile-link" data-key="motion">Motion</a>
                    <a href="<?php echo esc_url( home_url( '/#ilustracao' ) ); ?>" class="mobile-link" data-key="ilustracao">Ilustração Digital</a>
                    <a href="<?php echo esc_url( home_url( '/#impressos' ) ); ?>" class="mobile-link" data-key="impressos">Impressos</a>
                    <a href="<?php echo esc_url( home_url( '/servicos' ) ); ?>" class="mobile-link nav-highlight" data-key="servicos">Serviços</a>
                    <a href="<?php echo esc_url( home_url( '/posts' ) ); ?>" class="mobile-link nav-highlight" data-key="todos-posts">Blog</a>
                    <a href="<?php echo esc_url( home_url( '/sobre-mim/' ) ); ?>" class="mobile-link" data-key="sobre-mim">Sobre Mim</a>
                </nav>
                <div class="mobile-menu-footer">
                    <a href="<?php echo esc_url( home_url( '/faq' ) ); ?>" class="btn-mobile-faq">
                        <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1 .45-1.7 1.17-2.42l1.24-1.26c.37-.36.59-.86.59-1.42 0-1-.82-1.5-1.5-1.5-.9 0-1.5.64-1.5 1.5H8c0-1.98 1.5-3.5 4-3.5 1.98 0 4 1.22 4 3.5 0 1.5-.7 2.28-1.93 3.25z"/></svg> <span data-key="faq">FAQ</span>
                    </a>
                    <button id="btn-settings-mobile" class="btn-mobile-settings">
                        <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.11-.65l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.066 7.066 0 00-1.62-.94l-.36-2.54A.5.5 0 0013.4 2h-2.8a.5.5 0 00-.5.42l-.36 2.54c-.57.21-1.11.5-1.62.94L5.6 5.96a.5.5 0 00-.6.22L3.08 9.5a.5.5 0 00.11.65l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L3.19 15.2a.5.5 0 00-.11.65l1.92 3.32c.14.24.44.34.68.22l2.39-.96c.5.44 1.05.8 1.62.94l.36 2.54c.05.28.28.48.5.48h2.8c.28 0 .46-.2.5-.48l.36-2.54c.57-.21 1.11-.5 1.62-.94l2.39.96c.24.12.54.02.68-.22l1.92-3.32a.5.5 0 00-.11-.65l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z"/></svg> <span data-key="configuracoes">Configurações</span>
                    </button>
                </div>
            </div>
        </header>

        <script nonce="<?php echo function_exists('odyssee_generate_csp_nonce') ? esc_attr( odyssee_generate_csp_nonce() ) : ''; ?>">
        (function() {
            const logotype = document.getElementById('header-logotype');
            const header = document.querySelector('.main-header');
            if (!logotype || !header) return;
            
            const logos = {
                transparent: {
                    light: '<?php echo esc_url( home_url( "/wp-content/uploads/2025/11/typecolorblack.webp" ) ); ?>',
                    dark: '<?php echo esc_url( home_url( "/wp-content/uploads/2025/11/typecolorwhite.webp" ) ); ?>'
                },
                scrolled: {
                    light: '<?php echo esc_url( home_url( "/wp-content/uploads/2025/11/typecolorblack.webp" ) ); ?>',
                    dark: '<?php echo esc_url( home_url( "/wp-content/uploads/2025/11/typecolorwhite.webp" ) ); ?>'
                }
            };
            
            function updateLogo() {
                const isTransparent = header.classList.contains('transparent');
                const isDark = document.body.classList.contains('theme-dark');
                const state = isTransparent ? 'transparent' : 'scrolled';
                const theme = isDark ? 'dark' : 'light';
                logotype.src = logos[state][theme];
            }
            
            window.addEventListener('scroll', updateLogo);
            const observer = new MutationObserver(updateLogo);
            observer.observe(document.body, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
            updateLogo();
        })();
        </script>

        <main class="main-content no-padding">
