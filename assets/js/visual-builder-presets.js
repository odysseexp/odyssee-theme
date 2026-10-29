/**
 * Odyssee Visual Studio — 21 Pre-Built Presets Catalog + Dynamic Initializers + Figma/Lunacy Exporter
 * Version: 26.10.7
 *
 * Includes:
 * - Presets Pequenos / Modulares (1 to 12)
 * - Presets Robustos / Telas & Estruturas Completas (13 to 21)
 * - Runtime initializers for Carousels (#5), 3D Floating Cards (#6), Subcategories (#4), FAQ (#15), SVG Banner (#12)
 * - Open-standard W3C Layered SVG Artboard (.svg) & Design Tokens (.tokens.json) exporter for Figma & Lunacy
 */
(function () {
    'use strict';

    const THEME_URI = (window.odysseeData && window.odysseeData.themeUri)
        ? window.odysseeData.themeUri
        : '/wp-content/themes/odyssee-next';

    const PRESETS_CATALOG = [
        // =========================================================================
        // PRESETS PEQUENOS / MODULARES (1 a 12)
        // =========================================================================
        {
            number: 1,
            id: 'preset-home-card',
            category: 'small',
            label: '1. Card para Home',
            desc: 'Card de portfólio idêntico aos da página inicial (.carousel-card), com imagem, data, título e descrição.',
            icon: '🃏',
            tag: 'a',
            className: 'carousel-card glass-effect ovb-preset-home-card',
            html: `
                <div class="card-image-wrapper">
                    <img src="${THEME_URI}/assets/images/backgrounds/2.webp" alt="Card Thumbnail" class="card-image" loading="lazy">
                </div>
                <div class="card-content">
                    <span class="card-date">29 de outubro de 2026</span>
                    <h3 class="card-title">Identidade Visual & Direção de Arte Odyssee</h3>
                    <p class="card-excerpt">Projeto autoral completo de branding, tipografia expressiva e composição visual imersiva.</p>
                </div>
            `
        },
        {
            number: 2,
            id: 'preset-product-card',
            category: 'small',
            label: '2. Card para Produto / Serviço',
            desc: 'Card de produto/serviço igual ao da página de Serviços (.service-card), com preço, descrição, CTA e tooltip.',
            icon: '🛍️',
            tag: 'div',
            className: 'service-card glass-effect',
            html: `
                <div class="service-card-image" style="background-image: url('${THEME_URI}/assets/images/backgrounds/4.webp')"></div>
                <div class="service-card-content">
                    <h4 class="service-title">Identidade Visual Completa</h4>
                    <div class="service-price">R$ 650,00</div>
                    <p class="service-desc">Criação de logotipo principal, variações, paleta de cores, tipografia e guia de aplicação da marca.</p>
                    <div class="service-actions">
                        <a href="/sobre-mim" class="btn service-btn-primary">Contratar</a>
                        <div class="service-info-wrapper">
                            <button type="button" class="btn service-btn-info" aria-label="Mais informações">i</button>
                            <div class="service-tooltip">Inclui até 3 rodadas de revisão e entrega dos arquivos vetoriais abertos (.SVG, .PDF, .PNG).</div>
                        </div>
                    </div>
                </div>
            `
        },
        {
            number: 3,
            id: 'preset-category-section',
            category: 'small',
            label: '3. Criação de Categorias (Home)',
            desc: 'Seção completa de categoria igual à da Home (.category-section), com título, banner interativo, carrossel e botões.',
            icon: '📂',
            tag: 'section',
            className: 'category-section',
            defaultConfig: {
                direction: 'clockwise',
                mode: 'infinite',
                cardsCount: 8,
                visibleCards: 0,
                speed: 0.2,
                category: 'Design Gráfico'
            },
            html: `
                <h2 class="section-title">Design Gráfico</h2>
                <div class="category-banner-wrapper">
                    <a href="/posts?tag=Design+Gráfico" class="category-banner" style="background-image: linear-gradient(135deg, rgba(16,28,58,0.85), rgba(139,92,246,0.45)), url('${THEME_URI}/assets/images/backgrounds/1.webp'); background-size: cover; background-position: center;">
                        <div class="banner-overlay"><span>Explorar Projetos</span></div>
                    </a>
                </div>
                <div class="carousel-wrapper" data-direction="clockwise" data-mode="infinite" data-cards-count="8" data-speed="0.2" data-category="Design Gráfico"></div>
                <div class="section-actions">
                    <a href="/posts?tag=Design+Gráfico" class="btn">Ver todos</a>
                    <a href="/servicos#design-grafico" class="btn">Contratar Serviço</a>
                </div>
            `
        },
        {
            number: 4,
            id: 'preset-subcategories-configurator',
            category: 'small',
            label: '4. Criação de Subcategorias (Ilustração)',
            desc: 'Configurador interativo em etapas igual ao de Serviços de Ilustração (Estilo → Tipo → Adicionais → Resumo de Preço).',
            icon: '🎨',
            tag: 'div',
            className: 'ilustracao-configurador',
            html: `
                <!-- 1. ESTILO -->
                <div class="config-step">
                    <h4 class="step-title">1. Escolha o Estilo</h4>
                    <div class="options-grid style-options">
                        <div class="option-card glass-effect active" data-price="90" data-name="Flat Color">
                            <div class="option-image" style="background-image: url('${THEME_URI}/assets/images/backgrounds/2.webp')"></div>
                            <div class="option-info">
                                <h5>Flat Color</h5>
                                <span class="price-badge">Base: R$ 90</span>
                                <p>Cores chapadas, linhas limpas e visual moderno.</p>
                            </div>
                        </div>
                        <div class="option-card glass-effect" data-price="160" data-name="Full Render">
                            <div class="option-image" style="background-image: url('${THEME_URI}/assets/images/backgrounds/4.webp')"></div>
                            <div class="option-info">
                                <h5>Full Render</h5>
                                <span class="price-badge">Base: R$ 160</span>
                                <p>Pintura completa detalhada com luz, sombra e textura.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 2. TIPO -->
                <div class="config-step">
                    <h4 class="step-title">2. Escolha o Enquadramento / Subcategoria</h4>
                    <div class="options-grid type-options">
                        <div class="option-card glass-effect active" data-mult="0.6" data-name="Ícone / Busto">
                            <div class="option-info">
                                <h5>Ícone / Busto</h5>
                                <span class="price-badge">60% do valor base</span>
                                <p>Foco no rosto e expressão do personagem.</p>
                            </div>
                        </div>
                        <div class="option-card glass-effect" data-mult="0.8" data-name="Meio Corpo">
                            <div class="option-info">
                                <h5>Meio Corpo</h5>
                                <span class="price-badge">80% do valor base</span>
                                <p>Da cintura para cima, ideal para poses dinâmicas.</p>
                            </div>
                        </div>
                        <div class="option-card glass-effect" data-mult="1.0" data-name="Corpo Inteiro">
                            <div class="option-info">
                                <h5>Corpo Inteiro</h5>
                                <span class="price-badge">100% do valor base</span>
                                <p>Personagem completo da cabeça aos pés.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 3. ADICIONAIS -->
                <div class="config-step">
                    <h4 class="step-title">3. Adicionais (Opcional)</h4>
                    <div class="options-grid addon-options">
                        <div class="option-card glass-effect addon-toggle" data-add="60" data-name="Cenário Detalhado">
                            <div class="option-info">
                                <h5>+ Cenário Detalhado</h5>
                                <span class="price-badge">+ R$ 60,00</span>
                            </div>
                        </div>
                        <div class="option-card glass-effect addon-toggle" data-add="50" data-name="Personagem Extra">
                            <div class="option-info">
                                <h5>+ Personagem Extra</h5>
                                <span class="price-badge">+ R$ 50,00</span>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- RESUMO -->
                <div class="config-summary glass-effect">
                    <div class="summary-details">
                        <h4>Resumo do Pedido</h4>
                        <p class="ovb-subcat-summary-text">Flat Color + Ícone / Busto</p>
                    </div>
                    <div class="summary-total">
                        <span>Total Estimado:</span>
                        <strong class="total-price ovb-subcat-total-price">R$ 54,00</strong>
                        <a href="/sobre-mim" class="btn service-btn-primary">Solicitar Orçamento</a>
                    </div>
                </div>
            `
        },
        {
            number: 5,
            id: 'preset-cards-carousel',
            category: 'small',
            label: '5. Carrossel de Cards Configurável',
            desc: 'Carrossel de cards com padrão Sentido Horário Infinito (igual ao site atual) + opções de Anti-Horário, Finito, Vai-e-Volta (Ping-Pong) e Quantos Cards.',
            icon: '🎠',
            tag: 'div',
            className: 'carousel-wrapper ovb-custom-carousel',
            defaultConfig: {
                direction: 'clockwise', // 'clockwise' (padrão atual) | 'counterclockwise'
                mode: 'infinite',       // 'infinite' (padrão atual) | 'finite' | 'pingpong'
                cardsCount: 8,          // quantos cards no ciclo infinito
                visibleCards: 0,        // 0 = largura original do tema; >0 = força N cards visíveis por vez
                speed: 0.2,             // velocidade padrão atual (0.2)
                category: ''            // vazio = todos os posts recentes
            },
            html: `<div class="carousel-track"></div>`
        },
        {
            number: 6,
            id: 'preset-floating-orbit',
            category: 'small',
            label: '6. Cards Flutuantes Interativos 3D (Orbit)',
            desc: 'Anéis orbitais WebGL interativos igual ao da Home (com controle de densidade, qtd de cards, velocidade, suavidade, sentido por anel, hover warp, aberração cromática e bloom).',
            icon: '🪐',
            tag: 'div',
            className: 'artcraft-orbit-container ovb-custom-orbit',
            defaultConfig: {
                totalCards: 44,
                density: 1.0,
                speedMult: 1.0,
                smoothness: 0.08,
                ring1Dir: 1,
                ring2Dir: -1,
                ring3Dir: 1,
                ring4Dir: -1,
                hoverWarp: 1.0,
                hoverTug: 25,
                chromaticAberration: 1.0,
                bloom: 0
            },
            html: ``
        },
        {
            number: 7,
            id: 'preset-nebulas',
            category: 'small',
            label: '7. Nébulas Animadas (Background Glow)',
            desc: 'Conjunto de 5 nébulas orgânicas animadas (.gradients-container com .g1 a .g5) exatamente como o fundo vivo do site.',
            icon: '🌌',
            tag: 'div',
            className: 'gradients-container ovb-preset-nebulas',
            html: `
                <div class="g1"></div>
                <div class="g2"></div>
                <div class="g3"></div>
                <div class="g4"></div>
                <div class="g5"></div>
            `
        },
        {
            number: 8,
            id: 'preset-gradient-bridge',
            category: 'small',
            label: '8. Degradê Quebra de Cortes Secos',
            desc: 'Faixa de transição suave em degradê (.gradient-fade-bottom) para eliminar cortes secos entre qualquer seção ou imagem do site.',
            icon: '🌈',
            tag: 'div',
            className: 'gradient-fade-bottom ovb-gradient-seam-breaker',
            defaultConfig: {
                gradientDirection: 'to bottom',
                colorStart: 'rgba(13, 21, 56, 0)',
                colorMid: 'rgba(13, 21, 56, 0.65)',
                colorEnd: 'rgb(13, 21, 56)',
                heightPx: 180
            },
            html: ``
        },
        {
            number: 9,
            id: 'preset-job-history',
            category: 'small',
            label: '9. Histórico de Empregos (Sobre Mim)',
            desc: 'Linha do tempo de experiências profissionais (section.cv-experience com .cv-timeline e .cv-job) idêntica à página Sobre Mim.',
            icon: '💼',
            tag: 'section',
            className: 'cv-section cv-experience',
            html: `
                <h2 class="cv-section-title">Experiência</h2>
                <div class="cv-timeline">
                    <div class="cv-job">
                        <div class="cv-job-header">
                            <h3>Designer Gráfico e Arte Finalista</h3>
                            <span class="cv-company">Gráfica / Estúdio Criativo</span>
                            <span class="cv-period">2023 — Presente</span>
                        </div>
                        <ul class="cv-job-tasks">
                            <li>Atendimento ao cliente para entendimento de demandas e criação de identidades visuais e materiais promocionais.</li>
                            <li>Fechamento e preparação técnica de arquivos para impressão digital, offset e grandes formatos.</li>
                            <li>Criação de artes para mídias sociais, logotipos, papelaria corporativa e embalagens.</li>
                        </ul>
                    </div>
                    <div class="cv-job">
                        <div class="cv-job-header">
                            <h3>Designer & Ilustrador Freelancer</h3>
                            <span class="cv-company">Odyssee Artcraft (Autônomo)</span>
                            <span class="cv-period">2020 — Presente</span>
                        </div>
                        <ul class="cv-job-tasks">
                            <li>Desenvolvimento de projetos autorais de identidade visual, ilustração digital, edição de vídeo e motion design.</li>
                            <li>Criação de assets visuais, overlays para criadores de conteúdo e direção criativa completa.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        {
            number: 10,
            id: 'preset-skills-proficiencies',
            category: 'small',
            label: '10. Skills e Proficiências (Sobre Mim)',
            desc: 'Seção completa de Competências, Idiomas, Softwares e Sistemas Operacionais (section.cv-skills) idêntica à página Sobre Mim.',
            icon: '⚡',
            tag: 'section',
            className: 'cv-section cv-skills',
            html: `
                <h2 class="cv-section-title">Habilidades &amp; Proficiências</h2>
                <div class="cv-grid-2col">
                    <div class="cv-card">
                        <h3>Competências Técnicas</h3>
                        <ul class="cv-list">
                            <li>Design Gráfico &amp; Identidade Visual</li>
                            <li>Arte Final &amp; Fechamento de Arquivo</li>
                            <li>Ilustração Digital &amp; Concept Art</li>
                            <li>Edição de Vídeo &amp; Motion Graphics</li>
                            <li>UI/UX Design &amp; Prototipagem</li>
                        </ul>
                    </div>
                    <div class="cv-card">
                        <h3>Idiomas</h3>
                        <ul class="cv-list">
                            <li><strong>Português:</strong> Nativo</li>
                            <li><strong>Inglês:</strong> Intermediário (Leitura e Escrita Técnica)</li>
                            <li><strong>Espanhol:</strong> Básico / Intermediário</li>
                        </ul>
                    </div>
                </div>
                <h3 class="cv-subsection-title">Proficiência em Softwares</h3>
                <div class="cv-software-grid">
                    <div class="cv-software-item">
                        <img src="${THEME_URI}/assets/images/sobre-mim/coreldraw.png" alt="CorelDRAW" class="cv-software-icon">
                        <div class="cv-software-info"><strong>CorelDRAW</strong><span>Avançado</span></div>
                    </div>
                    <div class="cv-software-item">
                        <img src="${THEME_URI}/assets/images/sobre-mim/photoshop.svg" alt="Photoshop" class="cv-software-icon">
                        <div class="cv-software-info"><strong>Adobe Photoshop</strong><span>Avançado</span></div>
                    </div>
                    <div class="cv-software-item">
                        <img src="${THEME_URI}/assets/images/sobre-mim/illustrator.svg" alt="Illustrator" class="cv-software-icon">
                        <div class="cv-software-info"><strong>Adobe Illustrator</strong><span>Intermediário</span></div>
                    </div>
                    <div class="cv-software-item">
                        <img src="${THEME_URI}/assets/images/sobre-mim/krita.svg" alt="Krita" class="cv-software-icon">
                        <div class="cv-software-info"><strong>Krita</strong><span>Avançado</span></div>
                    </div>
                    <div class="cv-software-item">
                        <img src="${THEME_URI}/assets/images/sobre-mim/davinci.png" alt="DaVinci Resolve" class="cv-software-icon">
                        <div class="cv-software-info"><strong>DaVinci Resolve</strong><span>Intermediário</span></div>
                    </div>
                    <div class="cv-software-item">
                        <img src="${THEME_URI}/assets/images/sobre-mim/inkscape.svg" alt="Inkscape" class="cv-software-icon">
                        <div class="cv-software-info"><strong>Inkscape</strong><span>Intermediário</span></div>
                    </div>
                </div>
            `
        },
        {
            number: 11,
            id: 'preset-summary-photo',
            category: 'small',
            label: '11. Resumo com Foto (Sobre Mim Hero)',
            desc: 'Cabeçalho de apresentação pessoal com foto, nome, cargo, bio e pílulas de contato (section.cv-hero) igual à página Sobre Mim.',
            icon: '👤',
            tag: 'section',
            className: 'cv-hero',
            html: `
                <div class="cv-avatar-wrapper">
                    <img src="${THEME_URI}/assets/images/sobre-mim/Foto-de-Perfil.webp" alt="Foto de Perfil" class="cv-avatar">
                </div>
                <div class="cv-intro">
                    <h1 class="cv-name">Everton "Odyssee"</h1>
                    <h2 class="cv-role">Designer Gráfico, Arte Finalista &amp; Ilustrador Digital</h2>
                    <p class="cv-bio">
                        Profissional criativo focado em transformar conceitos em experiências visuais marcantes.
                        Experiência sólida em design gráfico impresso e digital, criação de identidades visuais,
                        ilustração autoral e edição audiovisual.
                    </p>
                    <div class="cv-contact-bar">
                        <a href="mailto:contato@odyssee.art" class="cv-contact-pill">✉️ contato@odyssee.art</a>
                        <a href="https://instagram.com/odysseexp" target="_blank" rel="noopener" class="cv-contact-pill">📸 @odysseexp</a>
                        <span class="cv-contact-pill">📍 São Paulo, Brasil</span>
                    </div>
                </div>
            `
        },
        {
            number: 12,
            id: 'preset-svg-png-banner',
            category: 'small',
            label: '12. Banner de SVGs ou PNGs Interativo (Design Gráfico)',
            desc: 'Banner multicamadas 3D com ícones flutuantes em SVG/PNG, sombras e linhas em movimento igual ao da aba Design Gráfico na Home.',
            icon: '🖼️',
            tag: 'div',
            className: 'category-banner-wrapper ovb-svg-png-banner',
            html: `
                <a href="/posts?tag=Design+Gráfico" class="category-banner" id="banner-design-grafico-preset">
                    <div class="dg-banner">
                        <div class="dg-banner__bg"></div>
                        <div class="dg-banner__lines">
                            <span></span><span></span><span></span><span></span><span></span><span></span>
                        </div>
                        <div class="dg-banner__scene">
                            <div class="dg-icon dg-icon--1"><div class="dg-icon__float">
                                <svg class="dg-icon__shadow" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38"/></svg>
                                <svg class="dg-icon__main" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38"/></svg>
                            </div></div>
                            <div class="dg-icon dg-icon--2"><div class="dg-icon__float">
                                <svg class="dg-icon__shadow" viewBox="0 0 100 100"><polygon points="50,12 90,82 10,82" stroke-linejoin="round"/></svg>
                                <svg class="dg-icon__main" viewBox="0 0 100 100"><polygon points="50,12 90,82 10,82" stroke-linejoin="round"/></svg>
                            </div></div>
                            <div class="dg-icon dg-icon--5"><div class="dg-icon__float">
                                <svg class="dg-icon__shadow" viewBox="0 0 100 100"><rect x="18" y="18" width="64" height="64" rx="14"/></svg>
                                <svg class="dg-icon__main" viewBox="0 0 100 100"><rect x="18" y="18" width="64" height="64" rx="14"/></svg>
                            </div></div>
                            <div class="dg-icon dg-icon--7"><div class="dg-icon__float">
                                <svg class="dg-icon__shadow" viewBox="0 0 100 100"><path d="M50 10 L61 39 L90 50 L61 61 L50 90 L39 61 L10 50 L39 39 Z" stroke-linejoin="round"/></svg>
                                <svg class="dg-icon__main" viewBox="0 0 100 100"><path d="M50 10 L61 39 L90 50 L61 61 L50 90 L39 61 L10 50 L39 39 Z" stroke-linejoin="round"/></svg>
                            </div></div>
                        </div>
                    </div>
                    <div class="banner-overlay"><span>Explorar Projetos</span></div>
                </a>
            `
        },

        {
            number: 22,
            id: 'preset-popup-notice',
            category: 'small',
            label: '22. Pop-up de Aviso (estilo banner de cookies)',
            desc: 'Cartão flutuante em vidro fosco que desliza na tela, com título, texto e dois botões (aceitar / dispensar). Lembra a escolha do visitante.',
            icon: '💬',
            tag: 'div',
            className: 'ovb-popup-preset',
            html: `
                <div class="ovb-popup-card" role="dialog" aria-live="polite" data-popup-delay="1500" data-popup-remember="true">
                    <div class="ovb-popup-header">
                        <svg class="ovb-popup-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5zM8.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM9 15.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
                        <h3>Título do aviso</h3>
                    </div>
                    <div class="ovb-popup-content">
                        <p>Escreva aqui a mensagem do seu pop-up. Você pode editar textos, cores, botões e o comportamento de cada um.</p>
                    </div>
                    <div class="ovb-popup-actions">
                        <button type="button" class="ovb-popup-btn ovb-popup-btn-secondary" data-popup-close>Dispensar</button>
                        <button type="button" class="ovb-popup-btn ovb-popup-btn-primary" data-popup-close data-popup-accept>Aceitar</button>
                    </div>
                </div>
            `
        },

        // =========================================================================
        // PRESETS ROBUSTOS / TELAS & ESTRUTURAS COMPLETAS (13 a 21)
        // =========================================================================
        {
            number: 13,
            id: 'preset-robust-settings-sidebar',
            category: 'robust',
            label: '13. Aba de Settings para Customizar',
            desc: 'Painel lateral completo de Configurações do usuário (Temas de Fundo, Modo de Cor e Qualidade Gráfica) igual ao #settings-sidebar.',
            icon: '⚙️',
            tag: 'aside',
            className: 'settings-sidebar glass-effect ovb-robust-settings-preview',
            html: `
                <div class="sidebar-header">
                    <h3>Configurações</h3>
                    <button class="close-btn" type="button" aria-label="Fechar Configurações">&times;</button>
                </div>
                <div class="sidebar-content">
                    <div class="setting-group">
                        <h4>Tema de Fundo</h4>
                        <div class="theme-options">
                            <button class="theme-btn active" data-theme="default"><div class="theme-preview default-preview"></div><span>Nebulosa (Padrão)</span></button>
                            <button class="theme-btn" data-theme="bg1"><div class="theme-preview" style="background-image: url('${THEME_URI}/assets/images/backgrounds/1.webp');"></div><span>Tema 1</span></button>
                            <button class="theme-btn" data-theme="bg2"><div class="theme-preview" style="background-image: url('${THEME_URI}/assets/images/backgrounds/2.webp');"></div><span>Tema 2</span></button>
                        </div>
                    </div>
                    <div class="setting-group">
                        <h4>Modo de Cor</h4>
                        <div class="Segmented-control">
                            <button class="segment-btn" data-colormode="light">Claro</button>
                            <button class="segment-btn active" data-colormode="dark">Escuro</button>
                            <button class="segment-btn" data-colormode="amoled">AMOLED</button>
                        </div>
                    </div>
                    <div class="setting-group">
                        <h4>Qualidade Gráfica</h4>
                        <div class="Segmented-control quality-control">
                            <button class="segment-btn" data-quality="low">Baixa</button>
                            <button class="segment-btn" data-quality="medium">Média</button>
                            <button class="segment-btn active" data-quality="high">Alta</button>
                        </div>
                    </div>
                </div>
            `
        },
        {
            number: 14,
            id: 'preset-robust-onboarding',
            category: 'robust',
            label: '14. Primeira Tela de Boas-Vindas (Onboarding)',
            desc: 'Tela completa de Boas-Vindas (#onboarding-container) com Aurora animada, saudação multi-idiomas e seleção inicial de tema/qualidade.',
            icon: '👋',
            tag: 'section',
            className: 'ovb-robust-onboarding-screen',
            html: `
                <div class="onboarding-aurora" style="position:relative; min-height:520px; border-radius:24px; overflow:hidden; padding:40px; display:flex; align-items:center; justify-content:center;">
                    <div class="aurora-layer aurora-layer-1"></div>
                    <div class="aurora-layer aurora-layer-2"></div>
                    <div class="aurora-layer aurora-layer-3"></div>
                    <div class="onboarding-step active" style="position:relative; z-index:2; text-align:center; max-width:680px;">
                        <h1 class="hello-text" style="font-size:3.2rem; margin-bottom:16px;">Bem-vindo à Odyssee</h1>
                        <p class="onboarding-subtitle" style="font-size:1.15rem; opacity:0.88; margin-bottom:28px;">Escolha seu estilo visual e nível de efeitos gráficos para iniciar a experiência imersiva.</p>
                        <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
                            <button type="button" class="btn onboarding-next-btn">Começar Experiência</button>
                        </div>
                    </div>
                </div>
            `
        },
        {
            number: 15,
            id: 'preset-robust-faq-screen',
            category: 'robust',
            label: '15. Tela Completa de FAQ',
            desc: 'Página completa de Perguntas Frequentes (main.faq-page) com categorias, acordeões interativos e CTA de contato.',
            icon: '❓',
            tag: 'section',
            className: 'faq-page',
            html: `
                <section class="faq-hero">
                    <h1 class="faq-title">Perguntas Frequentes</h1>
                    <p class="faq-subtitle">Tire suas dúvidas sobre processos, prazos, pagamentos e entregas dos serviços criativos.</p>
                </section>
                <div class="faq-container">
                    <div class="faq-category">
                        <h2 class="faq-category-title">Sobre Encomendas &amp; Prazos</h2>
                        <div class="faq-accordion">
                            <div class="faq-item glass-effect">
                                <button class="faq-question" type="button" aria-expanded="false">
                                    <span>Como funciona o processo de criação de um projeto?</span>
                                    <span class="faq-icon">+</span>
                                </button>
                                <div class="faq-answer">
                                    <p>Iniciamos com um briefing detalhado para alinhar objetivos, seguido de rascunhos/conceitos, rodadas de revisão e entrega final em alta resolução.</p>
                                </div>
                            </div>
                            <div class="faq-item glass-effect">
                                <button class="faq-question" type="button" aria-expanded="false">
                                    <span>Quais são as formas de pagamento aceitas?</span>
                                    <span class="faq-icon">+</span>
                                </button>
                                <div class="faq-answer">
                                    <p>Aceitamos PIX, transferência bancária e cartão de crédito (50% de sinal no início do projeto e 50% na aprovação final).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="faq-cta glass-effect">
                        <h3>Ainda tem alguma dúvida?</h3>
                        <p>Entre em contato diretamente para conversarmos sobre o seu projeto.</p>
                        <a href="/sobre-mim" class="btn service-btn-primary">Falar Comigo</a>
                    </div>
                </div>
            `
        },
        {
            number: 16,
            id: 'preset-robust-home-screen',
            category: 'robust',
            label: '16. Home Screen Completa',
            desc: 'Estrutura completa da Página Inicial (.immersive-wrapper) com Hero Orbital 3D, Degradê, Destaques Recentes e Categorias.',
            icon: '🏠',
            tag: 'div',
            className: 'immersive-wrapper ovb-robust-home',
            html: `
                <section class="hero-section">
                    <div class="hero-carousel-wrapper">
                        <div class="artcraft-orbit-container" data-total-cards="44" data-density="1" data-speed-mult="1"></div>
                        <div class="gradient-fade-bottom"></div>
                    </div>
                    <div class="hero-center-logo">
                        <img src="${THEME_URI}/assets/images/logos/Odyssee_Logo_White_Default.svg" alt="Odyssee Logo" class="hero-logo-svg">
                    </div>
                </section>
                <div class="main-content">
                    <section class="recent-posts-section">
                        <h2 class="section-title">Destaques Recentes</h2>
                        <div class="carousel-wrapper" data-direction="clockwise" data-mode="infinite" data-cards-count="8" data-speed="0.2"></div>
                        <div class="section-actions">
                            <a href="/posts" class="btn">Ver todos os posts</a>
                        </div>
                    </section>
                </div>
            `
        },
        {
            number: 17,
            id: 'preset-robust-services-screen',
            category: 'robust',
            label: '17. Tela Completa de Serviços',
            desc: 'Estrutura completa da página de Serviços (.services-page-wrapper) com Design Gráfico, Ilustração Interativa e Edição de Vídeo.',
            icon: '🛠️',
            tag: 'div',
            className: 'services-page-wrapper ovb-robust-services',
            html: `
                <div class="services-header">
                    <h1 class="page-title">Nossos Serviços</h1>
                    <p class="services-subtitle">Soluções criativas sob medida para elevar sua marca, conteúdo ou projeto autoral.</p>
                </div>
                <section class="service-category-section">
                    <div class="category-header">
                        <h2 class="section-title">Design Gráfico</h2>
                        <p class="category-description">Identidades visuais, materiais impressos e design para mídias digitais.</p>
                    </div>
                    <div class="services-grid">
                        <div class="service-card glass-effect">
                            <div class="service-card-image" style="background-image: url('${THEME_URI}/assets/images/backgrounds/1.webp')"></div>
                            <div class="service-card-content">
                                <h4 class="service-title">Identidade Visual</h4>
                                <div class="service-price">R$ 650,00</div>
                                <p class="service-desc">Logotipo, paleta de cores, tipografia e manual básico da marca.</p>
                                <div class="service-actions"><a href="/sobre-mim" class="btn service-btn-primary">Contratar</a></div>
                            </div>
                        </div>
                        <div class="service-card glass-effect">
                            <div class="service-card-image" style="background-image: url('${THEME_URI}/assets/images/backgrounds/3.webp')"></div>
                            <div class="service-card-content">
                                <h4 class="service-title">Pacote Social Media</h4>
                                <div class="service-price">R$ 350,00</div>
                                <p class="service-desc">Artes estratégicas para feed, stories e campanhas digitais.</p>
                                <div class="service-actions"><a href="/sobre-mim" class="btn service-btn-primary">Contratar</a></div>
                            </div>
                        </div>
                    </div>
                </section>
            `
        },
        {
            number: 18,
            id: 'preset-robust-all-posts-screen',
            category: 'robust',
            label: '18. Tela Completa de Todos os Posts',
            desc: 'Catálogo completo de portfólio (/posts) com barra de pesquisa, pílulas de filtro por tags (.suggested-tags) e grade de posts (.post-grid).',
            icon: '📰',
            tag: 'section',
            className: 'main-content ovb-robust-all-posts',
            html: `
                <h1 class="page-title">Todos os Projetos</h1>
                <div class="search-section">
                    <div class="search-bar-wrapper glass-effect">
                        <input type="text" placeholder="Pesquisar por título, tag ou categoria..." class="search-input">
                    </div>
                    <div class="suggested-tags">
                        <button type="button" class="tag-pill active">Todos</button>
                        <button type="button" class="tag-pill">Design Gráfico</button>
                        <button type="button" class="tag-pill">Ilustração</button>
                        <button type="button" class="tag-pill">Edição de Vídeo</button>
                    </div>
                </div>
                <div class="post-grid">
                    <a href="#" class="carousel-card glass-effect">
                        <div class="card-image-wrapper"><img src="${THEME_URI}/assets/images/backgrounds/2.webp" alt="Post" class="card-image"></div>
                        <div class="card-content">
                            <span class="card-date">Outubro 2026</span>
                            <h3 class="card-title">Projeto em Destaque #1</h3>
                            <p class="card-excerpt">Exploração visual de design gráfico e direção de arte.</p>
                        </div>
                    </a>
                    <a href="#" class="carousel-card glass-effect">
                        <div class="card-image-wrapper"><img src="${THEME_URI}/assets/images/backgrounds/4.webp" alt="Post" class="card-image"></div>
                        <div class="card-content">
                            <span class="card-date">Outubro 2026</span>
                            <h3 class="card-title">Ilustração Autoral #2</h3>
                            <p class="card-excerpt">Pintura digital detalhada com iluminação dramática.</p>
                        </div>
                    </a>
                </div>
            `
        },
        {
            number: 19,
            id: 'preset-robust-single-post-screen',
            category: 'robust',
            label: '19. Tela Completa de Dentro do Post (Single)',
            desc: 'Estrutura interna completa de um Post (article.single-post-content) com cabeçalho, data, categorias, imagem destacada, corpo e tags.',
            icon: '📄',
            tag: 'article',
            className: 'single-post-content glass-effect',
            html: `
                <header class="single-post-header">
                    <div class="single-post-meta">
                        <span class="post-date">29 de outubro de 2026</span>
                        <span class="post-categories"><a href="/posts?tag=Design+Gráfico" class="category-tag">Design Gráfico</a></span>
                    </div>
                    <h1 class="single-post-title">Estudo de Caso: Identidade Visual &amp; Universo Gráfico Odyssee</h1>
                </header>
                <div class="single-post-featured-image">
                    <img src="${THEME_URI}/assets/images/backgrounds/1.webp" alt="Featured Image" style="width:100%; border-radius:16px;">
                </div>
                <div class="single-post-body">
                    <p>Este estudo de caso apresenta todo o processo criativo, desde a concepção tipográfica até os sistemas de iluminação, glassmorphism e composição tridimensional aplicados no projeto.</p>
                    <p>Cada detalhe foi projetado para manter harmonia visual, contraste acessível e fluidez em múltiplas telas.</p>
                </div>
                <footer class="single-post-footer">
                    <div class="post-tags">
                        <span class="tags-label">Tags:</span>
                        <a href="/posts?tag=Branding" class="tag-pill">Branding</a>
                        <a href="/posts?tag=UI+Design" class="tag-pill">UI Design</a>
                    </div>
                    <div class="post-navigation">
                        <a href="/posts" class="btn">&larr; Voltar para todos os posts</a>
                    </div>
                </footer>
            `
        },
        {
            number: 20,
            id: 'preset-robust-header-bar',
            category: 'robust',
            label: '20. Barra Header Completa',
            desc: 'Cabeçalho principal completo (header.main-header) com logotipo dinâmico, links de navegação desktop, botão de ajustes e menu mobile.',
            icon: '🧭',
            tag: 'header',
            className: 'main-header glass-effect ovb-robust-header',
            html: `
                <div class="header-left">
                    <a href="/" class="logo" aria-label="Odyssee Home">
                        <img src="${THEME_URI}/assets/images/logos/Odyssee_Logo_White_Header.svg" alt="Odyssee Logo" class="header-logo-svg">
                    </a>
                </div>
                <nav class="header-right desktop-nav">
                    <a href="/" class="nav-link">Início</a>
                    <a href="/posts" class="nav-link">Posts</a>
                    <a href="/servicos" class="nav-link">Serviços</a>
                    <a href="/faq" class="nav-link">FAQ</a>
                    <a href="/sobre-mim" class="nav-link">Sobre Mim</a>
                    <button class="icon-btn" type="button" aria-label="Abrir Configurações">⚙️</button>
                </nav>
            `
        },
        {
            number: 21,
            id: 'preset-robust-about-me-page',
            category: 'robust',
            label: '21. Preset de Página Completa de Sobre Mim',
            desc: 'Página completa de Currículo / Sobre Mim (main.cv-page) unindo Resumo com Foto, Experiência, Formação, Skills e Softwares.',
            icon: '🎓',
            tag: 'div',
            className: 'cv-page ovb-robust-about-page',
            html: `
                <div class="cv-container glass-effect">
                    <section class="cv-hero">
                        <div class="cv-avatar-wrapper">
                            <img src="${THEME_URI}/assets/images/sobre-mim/Foto-de-Perfil.webp" alt="Foto de Perfil" class="cv-avatar">
                        </div>
                        <div class="cv-intro">
                            <h1 class="cv-name">Everton "Odyssee"</h1>
                            <h2 class="cv-role">Designer Gráfico, Arte Finalista &amp; Ilustrador Digital</h2>
                            <p class="cv-bio">Profissional criativo focado em transformar conceitos em experiências visuais marcantes em design gráfico, arte final, ilustração e vídeo.</p>
                            <div class="cv-contact-bar">
                                <a href="mailto:contato@odyssee.art" class="cv-contact-pill">✉️ contato@odyssee.art</a>
                                <a href="https://instagram.com/odysseexp" target="_blank" rel="noopener" class="cv-contact-pill">📸 @odysseexp</a>
                            </div>
                        </div>
                    </section>
                    <hr class="cv-divider">
                    <section class="cv-section cv-experience">
                        <h2 class="cv-section-title">Experiência</h2>
                        <div class="cv-timeline">
                            <div class="cv-job">
                                <div class="cv-job-header">
                                    <h3>Designer Gráfico e Arte Finalista</h3>
                                    <span class="cv-company">Estúdio &amp; Gráfica</span>
                                    <span class="cv-period">2023 — Presente</span>
                                </div>
                                <ul class="cv-job-tasks">
                                    <li>Criação de identidades visuais, materiais impressos e fechamento técnico de arquivos.</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>
            `
        }
    ];

    window.ODYSSEE_VB_PRESETS_CATALOG = PRESETS_CATALOG;

    // =========================================================================
    // RUNTIME INITIALIZER FOR INSERTED OR CONFIGURED PRESET ELEMENTS
    // =========================================================================
    function initSubcategoryConfigurator(rootEl) {
        if (!rootEl || rootEl.dataset.ovbSubcatBound === 'true') return;
        rootEl.dataset.ovbSubcatBound = 'true';

        function recalc() {
            const activeStyle = rootEl.querySelector('.style-options .option-card.active');
            const activeType = rootEl.querySelector('.type-options .option-card.active');
            const activeAddons = Array.from(rootEl.querySelectorAll('.addon-options .option-card.active'));

            const basePrice = activeStyle ? parseFloat(activeStyle.dataset.price || '90') : 90;
            const styleName = activeStyle ? (activeStyle.dataset.name || 'Estilo') : 'Estilo';
            const mult = activeType ? parseFloat(activeType.dataset.mult || '1') : 1;
            const typeName = activeType ? (activeType.dataset.name || 'Tipo') : 'Tipo';

            let addonsTotal = 0;
            const addonNames = [];
            activeAddons.forEach(a => {
                addonsTotal += parseFloat(a.dataset.add || '0');
                if (a.dataset.name) addonNames.push(a.dataset.name);
            });

            const finalPrice = Math.round(basePrice * mult + addonsTotal);
            const summaryTextEl = rootEl.querySelector('.ovb-subcat-summary-text') || rootEl.querySelector('.summary-details p');
            const totalPriceEl = rootEl.querySelector('.ovb-subcat-total-price') || rootEl.querySelector('.total-price');

            if (summaryTextEl) {
                summaryTextEl.textContent = `${styleName} + ${typeName}` + (addonNames.length ? ` (${addonNames.join(', ')})` : '');
            }
            if (totalPriceEl) {
                totalPriceEl.textContent = `R$ ${finalPrice.toFixed(2).replace('.', ',')}`;
            }
        }

        rootEl.querySelectorAll('.style-options .option-card').forEach(card => {
            card.addEventListener('click', () => {
                rootEl.querySelectorAll('.style-options .option-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                recalc();
            });
        });

        rootEl.querySelectorAll('.type-options .option-card').forEach(card => {
            card.addEventListener('click', () => {
                rootEl.querySelectorAll('.type-options .option-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                recalc();
            });
        });

        rootEl.querySelectorAll('.addon-options .option-card').forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('active');
                recalc();
            });
        });

        recalc();
    }

    function initFaqAccordions(rootEl) {
        const questions = rootEl.classList && rootEl.classList.contains('faq-question')
            ? [rootEl]
            : Array.from(rootEl.querySelectorAll('.faq-question'));
        questions.forEach(btn => {
            if (btn.dataset.ovbFaqBound === 'true') return;
            btn.dataset.ovbFaqBound = 'true';
            btn.addEventListener('click', () => {
                const item = btn.closest('.faq-item');
                if (!item) return;
                const isOpen = item.classList.toggle('active');
                btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        });
    }

    function initPopupNotices(rootEl) {
        const cards = rootEl.classList && rootEl.classList.contains('ovb-popup-card')
            ? [rootEl]
            : Array.from(rootEl.querySelectorAll('.ovb-popup-card'));
        cards.forEach(card => {
            if (card.dataset.ovbPopupBound === 'true') return;
            card.dataset.ovbPopupBound = 'true';
            const host = card.closest('.ovb-popup-preset') || card.parentElement;
            const key = 'ovb_popup_' + ((host && host.id) || 'default');
            const inEditor = document.body.classList.contains('ovb-editor-active');
            const remember = card.getAttribute('data-popup-remember') !== 'false';

            let dismissed = false;
            try { dismissed = !inEditor && remember && localStorage.getItem(key) === '1'; } catch (e) {}
            if (dismissed) { card.classList.add('ovb-popup-hidden'); return; }

            const delay = inEditor ? 0 : (parseInt(card.getAttribute('data-popup-delay'), 10) || 0);
            setTimeout(() => card.classList.add('show'), delay);

            card.addEventListener('click', ev => {
                const btn = ev.target.closest('[data-popup-close]');
                if (!btn) return;
                if (inEditor) return;
                card.classList.remove('show');
                if (remember) { try { localStorage.setItem(key, '1'); } catch (e) {} }
                setTimeout(() => card.classList.add('ovb-popup-hidden'), 650);
            });
        });
    }

    function initSvgBannerParallax(rootEl) {
        const banners = rootEl.classList && rootEl.classList.contains('dg-banner')
            ? [rootEl]
            : Array.from(rootEl.querySelectorAll('.dg-banner'));
        banners.forEach(banner => {
            if (banner.dataset.ovbParallaxBound === 'true') return;
            banner.dataset.ovbParallaxBound = 'true';
            const scene = banner.querySelector('.dg-banner__scene');
            if (!scene) return;
            banner.addEventListener('mousemove', (e) => {
                const rect = banner.getBoundingClientRect();
                const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
                const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
                scene.style.transform = `rotateY(${nx * 10}deg) rotateX(${-ny * 8}deg)`;
            });
            banner.addEventListener('mouseleave', () => {
                scene.style.transform = 'rotateY(0deg) rotateX(0deg)';
            });
        });
    }

    window.odysseeVBApplyElementConfig = function (el, cfg) {
        if (!el || !cfg || typeof cfg !== 'object') return;

        // 1. Carousel configuration (#5 or inside #3 / #16)
        const carousels = el.classList.contains('carousel-wrapper')
            ? [el]
            : Array.from(el.querySelectorAll('.carousel-wrapper'));

        carousels.forEach(cw => {
            if (cfg.direction !== undefined) cw.dataset.direction = cfg.direction;
            if (cfg.mode !== undefined) cw.dataset.mode = cfg.mode;
            if (cfg.cardsCount !== undefined) cw.dataset.cardsCount = String(cfg.cardsCount);
            if (cfg.visibleCards !== undefined) cw.dataset.visibleCards = String(cfg.visibleCards);
            if (cfg.speed !== undefined) cw.dataset.speed = String(cfg.speed);
            if (cfg.category !== undefined) cw.dataset.category = cfg.category;
            if (typeof window.odysseeInitCarousel === 'function') {
                window.odysseeInitCarousel(cw, cfg.category || null);
            }
        });

        // 2. Floating Orbit 3D Hero configuration (#6 or #artcraft-orbit-container)
        const orbits = (el.classList.contains('artcraft-orbit-container') || el.id === 'artcraft-orbit-container')
            ? [el]
            : Array.from(el.querySelectorAll('.artcraft-orbit-container, #artcraft-orbit-container'));

        orbits.forEach(orb => {
            if (cfg.totalCards !== undefined) orb.dataset.totalCards = String(cfg.totalCards);
            if (cfg.density !== undefined) orb.dataset.density = String(cfg.density);
            if (cfg.speedMult !== undefined) orb.dataset.speedMult = String(cfg.speedMult);
            if (cfg.smoothness !== undefined) orb.dataset.smoothness = String(cfg.smoothness);
            if (cfg.ring1Dir !== undefined) orb.dataset.ring1Dir = String(cfg.ring1Dir);
            if (cfg.ring2Dir !== undefined) orb.dataset.ring2Dir = String(cfg.ring2Dir);
            if (cfg.ring3Dir !== undefined) orb.dataset.ring3Dir = String(cfg.ring3Dir);
            if (cfg.ring4Dir !== undefined) orb.dataset.ring4Dir = String(cfg.ring4Dir);
            if (cfg.hoverWarp !== undefined) orb.dataset.hoverWarp = String(cfg.hoverWarp);
            if (cfg.hoverTug !== undefined) orb.dataset.hoverTug = String(cfg.hoverTug);
            if (cfg.chromaticAberration !== undefined) orb.dataset.chromaticAberration = String(cfg.chromaticAberration);
            if (cfg.bloom !== undefined) orb.dataset.bloom = String(cfg.bloom);
            if (typeof window.odysseeInitOrbitHero === 'function') {
                window.odysseeInitOrbitHero(orb);
            }
        });

        // 3. Gradient Seam Breaker (#8)
        if (el.classList.contains('gradient-fade-bottom') || el.classList.contains('ovb-gradient-seam-breaker')) {
            if (cfg.colorStart || cfg.colorMid || cfg.colorEnd || cfg.gradientDirection) {
                const dir = cfg.gradientDirection || 'to bottom';
                const c1 = cfg.colorStart || 'rgba(13, 21, 56, 0)';
                const c2 = cfg.colorMid || 'rgba(13, 21, 56, 0.65)';
                const c3 = cfg.colorEnd || 'rgb(13, 21, 56)';
                el.style.background = `linear-gradient(${dir}, ${c1} 0%, ${c2} 55%, ${c3} 100%)`;
            }
            if (cfg.heightPx) {
                el.style.height = `${cfg.heightPx}px`;
            }
        }

        // 4. Interactive Subcategories (#4), FAQ (#15), SVG Banner (#12)
        if (el.classList.contains('ilustracao-configurador')) {
            initSubcategoryConfigurator(el);
        } else {
            el.querySelectorAll('.ilustracao-configurador').forEach(initSubcategoryConfigurator);
        }
        initFaqAccordions(el);
        initSvgBannerParallax(el);
        initPopupNotices(el);
    };

    // =========================================================================
    // FIGMA & LUNACY LAYERED W3C SVG ARTBOARD EXPORTER + W3C DESIGN TOKENS
    // 100% Open Standards — Legal & Natively Editable in Figma and Lunacy
    // =========================================================================
    function escapeXml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function parseRgbaToSvg(colorStr) {
        if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') {
            return null;
        }
        const m = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
        if (!m) return { fill: colorStr, opacity: 1 };
        const r = parseInt(m[1], 10);
        const g = parseInt(m[2], 10);
        const b = parseInt(m[3], 10);
        const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
        if (a <= 0.01) return null;
        const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        return { fill: hex, opacity: Number(a.toFixed(3)) };
    }

    window.odysseeVBExportFigmaLunacySVG = function (targetSelector, formatTarget = 'figma') {
        const rootEl = targetSelector
            ? (document.querySelector(targetSelector) || document.body)
            : document.body;

        const rootRect = rootEl.getBoundingClientRect();
        const artboardW = Math.max(320, Math.round(rootRect.width || window.innerWidth || 1440));
        const artboardH = Math.max(240, Math.min(12000, Math.round(rootRect.height || window.innerHeight || 900)));

        const layers = [];
        let nodeCounter = 0;

        function walkNode(el, depth) {
            if (!el || el.nodeType !== 1 || depth > 14) return;
            if (el.id === 'ovb-selection-box' || el.id === 'ovb-hover-box' || el.id === 'wpadminbar') return;

            const cs = window.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') <= 0.01) return;

            const rect = el.getBoundingClientRect();
            const x = Math.round(rect.left - rootRect.left);
            const y = Math.round(rect.top - rootRect.top);
            const w = Math.round(rect.width);
            const h = Math.round(rect.height);

            if (w <= 1 || h <= 1 || y > artboardH + 400 || y + h < -200) return;

            nodeCounter++;
            const rawName = el.getAttribute('data-ovb-id')
                || el.id
                || (typeof el.className === 'string' && el.className.trim() ? el.className.trim().split(/\s+/)[0] : '')
                || el.tagName.toLowerCase();
            const layerId = `${el.tagName.toLowerCase()}_${rawName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${nodeCounter}`;
            const indent = '  '.repeat(Math.min(depth + 1, 8));

            const bg = parseRgbaToSvg(cs.backgroundColor);
            const borderW = parseFloat(cs.borderTopWidth || '0');
            const borderCol = borderW > 0 ? parseRgbaToSvg(cs.borderTopColor) : null;
            const radius = Math.min(w / 2, h / 2, parseFloat(cs.borderTopLeftRadius || '0') || 0);

            const childLines = [];

            // Background / Frame Rect
            if (bg || borderCol) {
                const fillAttr = bg ? `fill="${bg.fill}" fill-opacity="${bg.opacity}"` : `fill="none"`;
                const strokeAttr = borderCol ? `stroke="${borderCol.fill}" stroke-opacity="${borderCol.opacity}" stroke-width="${borderW}"` : '';
                const rxAttr = radius > 0 ? `rx="${Math.round(radius)}" ry="${Math.round(radius)}"` : '';
                childLines.push(`${indent}  <rect id="${escapeXml(layerId)}_bg" x="${x}" y="${y}" width="${w}" height="${h}" ${ rxAttr } ${fillAttr} ${strokeAttr} />`);
            }

            // Image elements
            if (el.tagName === 'IMG' && el.src) {
                childLines.push(`${indent}  <image id="${escapeXml(layerId)}_img" x="${x}" y="${y}" width="${w}" height="${h}" href="${escapeXml(el.src)}" preserveAspectRatio="xMidYMid slice" />`);
            }

            // Direct text content
            let directText = '';
            for (let i = 0; i < el.childNodes.length; i++) {
                if (el.childNodes[i].nodeType === 3) {
                    directText += el.childNodes[i].nodeValue;
                }
            }
            directText = directText.replace(/\s+/g, ' ').trim();
            if (directText) {
                const textCol = parseRgbaToSvg(cs.color) || { fill: '#ffffff', opacity: 1 };
                const fontSize = parseFloat(cs.fontSize || '16') || 16;
                const fontWeight = cs.fontWeight || '400';
                const fontFamily = (cs.fontFamily || 'Inter, sans-serif').split(',')[0].replace(/['"]/g, '').trim();
                const textY = Math.round(y + Math.min(h - 4, fontSize * 1.15));
                childLines.push(
                    `${indent}  <text id="${escapeXml(layerId)}_text" x="${x + (parseFloat(cs.paddingLeft) || 0)}" y="${textY}" fill="${textCol.fill}" fill-opacity="${textCol.opacity}" font-family="${escapeXml(fontFamily)}" font-size="${Math.round(fontSize)}" font-weight="${escapeXml(fontWeight)}">${escapeXml(directText.slice(0, 180))}</text>`
                );
            }

            if (childLines.length > 0) {
                layers.push(`${indent}<g id="${escapeXml(layerId)}" data-name="${escapeXml(rawName)}">\n${childLines.join('\n')}\n${indent}</g>`);
            }

            Array.from(el.children).forEach(child => walkNode(child, depth + 1));
        }

        walkNode(rootEl, 1);

        const toolMeta = formatTarget === 'lunacy'
            ? 'Lunacy / Sketch Vector Artboard (Open W3C SVG 1.1)'
            : 'Figma Editable Layered Artboard (Open W3C SVG 1.1)';

        return [
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<!-- Exported by Odyssee Visual Studio v26.10.7 — ${toolMeta} -->`,
            `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${artboardW}" height="${artboardH}" viewBox="0 0 ${artboardW} ${artboardH}">`,
            `  <g id="Artboard_${escapeXml(formatTarget.toUpperCase())}_OdysseeXP" data-name="OdysseeXP Artboard (${artboardW}x${artboardH})">`,
            `    <rect id="Canvas_Background" x="0" y="0" width="${artboardW}" height="${artboardH}" fill="#0d1538" />`,
            layers.join('\n'),
            `  </g>`,
            `</svg>`
        ].join('\n');
    };
})();
