

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function decodeHtmlEntities(str) {
    if (!str || typeof str !== 'string') return '';
    try {
        
        const doc = new DOMParser().parseFromString(str, 'text/html');
        return doc.documentElement.textContent || '';
    } catch (e) {
        
        return str.replace(/&#8211;/g, '–').replace(/&amp;#/g, '&#');
    }
}

function createElement(tag, attrs = {}, content = '') {
    const el = document.createElement(tag);

    Object.keys(attrs).forEach(key => {
        if (key === 'class') {
            el.className = attrs[key];
        } else if (key === 'data' && typeof attrs[key] === 'object') {
            Object.keys(attrs[key]).forEach(dataKey => {
                el.dataset[dataKey] = attrs[key][dataKey];
            });
        } else if (key.startsWith('on')) {
            
            console.warn(`Atributo ${key} não permitido por segurança`);
        } else {
            el.setAttribute(key, attrs[key]);
        }
    });

    if (typeof content === 'string') {
        el.textContent = content;
    } else if (content instanceof HTMLElement) {
        el.appendChild(content);
    }

    return el;
}

function sanitizeUrl(url) {
    if (!url) return '';

    const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:', 'whatsapp:', '/'];
    const trimmed = url.trim().toLowerCase();

    const isSafe = safeProtocols.some(protocol => trimmed.startsWith(protocol));

    if (!isSafe) {
        console.warn(`URL insegura detectada e bloqueada: ${url}`);
        return '';
    }

    return url;
}

function sanitizeSearchInput(input) {
    if (!input) return '';

    let sanitized = input.replace(/<[^>]*>/g, '');

    sanitized = sanitized.replace(/[<>"{};]/g, '');

    if (sanitized.length > 200) {
        sanitized = sanitized.substring(0, 200);
    }

    return sanitized.trim();
}

const translations = {
    
    'pt': {
        'titulo': "Odyssee Experience",
        'subtitulo': "mais que um portfólio, uma experiência web criativa",
        'hero-slogan': 'Experiencie o Próximo Nível da Criatividade',
        'escolha-idioma': "Escolha um idioma de preferência",
        'escolha-tema': "Escolha um tema para começar a navegar",
        'aviso-tema': "Você pode alterar isso depois nas configurações.",
        'recentes': 'Trabalhos Recentes',
        'design-grafico': 'Design Gráfico',
        'edicao-video': 'Edição de Vídeo',
        'motion': 'Motion',
        'ilustracao': 'Ilustração Digital',
        'impressos': 'Impressos',
        'contato': 'Dúvidas?',
        'contato-sub': 'Entre em contato comigo.',
        'fale-whatsapp': 'Fale Comigo no WhatsApp',
        'servicos-precos': 'Serviços e Preços',
        'todos-posts': 'Todos os Posts',
        'carregando-projetos': 'Carregando projetos...',
        'buscar-placeholder': 'Buscar por título, tag, ou conteúdo...',
        'filtrar-por': 'Filtrar por:',
        'todos': 'Todos',
        'desenvolvido-em': 'Projeto desenvolvido em',
        'clique-detalhes': 'Clique para ver os detalhes completos deste trabalho.',
        'ver-detalhes': 'Ver Detalhes',
        'portfolio': 'portfolio',
        
        'carrossel': 'Carrossel',
        'video-curto': 'Vídeo Curto',
        'video-longo': 'Vídeo Longo',
        'identidade-visual': 'Identidade Visual',
        'logotipo-logo': 'Logotipo/Logo',
        'swipe': 'Deslize',
        'esboco-de-perfil': 'Esboço de Perfil',
        'fanart-anime': 'Fanart Anime',
        'fanart-cartoon': 'Fanart Cartoon',
        'fanart-chibi': 'Fanart Chibi',
        'servicos': 'Serviços',
        'servicos-titulo': 'Serviços e Preços',
        'servicos-subtitulo': 'Confira todos os nossos serviços e pacotes promocionais',
        'exemplo-produto': 'Exemplo de Produto',
        'exemplo-desc': 'Este é um exemplo visual de como seu produto pode ficar.',
        'ver-servicos': 'Ver Serviços e Preços'
    },
    
    'en': {
        'titulo': "Odyssee Experience",
        'subtitulo': "more than a portfolio, a creative web experience",
        'hero-slogan': 'Experience the Next Level of Creativity',
        'escolha-idioma': "Choose your preferred language",
        'escolha-tema': "Choose a theme to start browsing",
        'aviso-tema': "You can change this later in the settings.",
        'recentes': 'Recent Works',
        'design-grafico': 'Graphic Design',
        'edicao-video': 'Video Editing',
        'motion': 'Motion',
        'ilustracao': 'Digital Illustration',
        'impressos': 'Print',
        'contato': 'Questions?',
        'contato-sub': 'Get in touch with me.',
        'fale-whatsapp': 'Contact me on WhatsApp',
        'servicos-precos': 'Services & Pricing',
        'todos-posts': 'All Posts',
        'carregando-projetos': 'Loading projects...',
        'buscar-placeholder': 'Search by title, tag, or content...',
        'filtrar-por': 'Filter by:',
        'todos': 'All',
        'desenvolvido-em': 'Project developed on',
        'clique-detalhes': 'Click to see the complete details of this work.',
        'ver-detalhes': 'View Details',
        'portfolio': 'portfolio',
        
        'carrossel': 'Carousel',
        'video-curto': 'Short Video',
        'video-longo': 'Long Video',
        'identidade-visual': 'Visual Identity',
        'logotipo-logo': 'Logo/Branding',
        'swipe': 'Swipe',
        'esboco-de-perfil': 'Profile Sketch',
        'fanart-anime': 'Anime Fanart',
        'fanart-cartoon': 'Cartoon Fanart',
        'fanart-chibi': 'Chibi Fanart',
        'servicos': 'Services',
        'servicos-titulo': 'Services & Pricing',
        'servicos-subtitulo': 'Check out all our services and promotional packages',
        'exemplo-produto': 'Product Example',
        'exemplo-desc': 'This is a visual example of how your product could look.',
        'ver-servicos': 'View Services & Pricing'
    }
};

translations.pt['sobre-mim'] = 'Sobre Mim';
translations.en['sobre-mim'] = 'About Me';
translations.pt['configuracoes'] = 'Configurações';
translations.en['configuracoes'] = 'Settings';
translations.pt['idioma'] = 'Idioma';
translations.en['idioma'] = 'Language';
translations.pt['tema'] = 'Tema';
translations.en['tema'] = 'Theme';
translations.pt['cor-destaque'] = 'Cor de Destaque';
translations.en['cor-destaque'] = 'Accent Color';
translations.pt['cor-destaque-onboarding'] = 'Cor em destaque (botões e detalhes):';
translations.en['cor-destaque-onboarding'] = 'Accent color (buttons and details):';
translations.pt['cor-azul'] = 'Azul';
translations.en['cor-azul'] = 'Blue';
translations.pt['cor-roxo'] = 'Roxo';
translations.en['cor-roxo'] = 'Purple';
translations.pt['cor-vermelho'] = 'Vermelho';
translations.en['cor-vermelho'] = 'Red';
translations.pt['cor-amarelo'] = 'Amarelo';
translations.en['cor-amarelo'] = 'Yellow';
translations.pt['cor-verde'] = 'Verde';
translations.en['cor-verde'] = 'Green';
translations.pt['menu'] = 'Menu';
translations.en['menu'] = 'Menu';
translations.pt['continuar'] = 'Continuar →';
translations.en['continuar'] = 'Continue →';

translations.pt['you-save-prefix'] = 'Você economiza R$ ';
translations.en['you-save-prefix'] = 'You save R$ ';
translations.pt['consulte'] = 'Consulte';
translations.en['consulte'] = 'Contact';
translations.pt['no-results'] = 'Nenhum projeto encontrado com esses termos.';
translations.en['no-results'] = 'No projects found for these terms.';

translations.pt['pacotes-promocionais'] = 'Pacotes Promocionais';
translations.en['pacotes-promocionais'] = 'Promotional Packages';

translations.pt['ilustracao-tutorial'] = 'Você primeiro escolhe o estilo da arte e depois escolhe qual será o tipo da arte e por último adicionais. Após selecionar as opções, basta interagir com o botão contratar que você será redirecionado para contato com o ilustrador.';
translations.en['ilustracao-tutorial'] = 'First choose the art style, then choose the type of art, and finally the add-ons. After selecting the options, simply click the hire button to be redirected to contact the illustrator.';
translations.pt['ilustracao-estilo-label'] = 'Estilo da Arte:';
translations.en['ilustracao-estilo-label'] = 'Art Style:';
translations.pt['ilustracao-tipo-label'] = 'Tipo da Arte:';
translations.en['ilustracao-tipo-label'] = 'Art Type:';
translations.pt['ilustracao-adicionais-label'] = 'Adicionais:';
translations.en['ilustracao-adicionais-label'] = 'Add-ons:';
translations.pt['ilustracao-resumo-title'] = 'Seu Serviço';
translations.en['ilustracao-resumo-title'] = 'Your Service';

function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

const wpSlugToCategoryKey = {
    'design-grafico': 'design-grafico',
    'edicao-video': 'edicao-video',
    'edicao-de-video': 'edicao-video',
    'motion': 'motion',
    'motion-graphics': 'motion',
    'ilustracao': 'ilustracao',
    'ilustracao-digital': 'ilustracao',
    'impressos': 'impressos',
    
    'carrossel': 'carrossel',
    'video-curto': 'video-curto',
    'video-longo': 'video-longo',
    'identidade-visual': 'identidade-visual',
    'logotipo-logo': 'logotipo-logo',
    'esboco-de-perfil': 'esboco-de-perfil',
    'fanart-anime': 'fanart-anime',
    'fanart-cartoon': 'fanart-cartoon',
    'fanart-chibi': 'fanart-chibi'
};

const postTitleTranslations = {

};

function getPostTitleTranslation(postTitle, customMetaEN) {
    if (!postTitle) return '';

    if (customMetaEN && customMetaEN.trim()) {
        return customMetaEN;
    }

    if (postTitleTranslations[postTitle]) {
        return postTitleTranslations[postTitle];
    }

    return '';
}

const serviceTranslations = {
    'logotipologo': {
        pt: { title: 'Logotipo e Logo', desc: 'Uma logo única, criativa e estrategicamente feita para captar seu público alvo.' },
        en: { title: 'Logo and Branding', desc: 'A unique, creative logo strategically designed to reach your target audience.' }
    },
    'bannersocial': {
        pt: { title: 'Banner para redes sociais', desc: 'Banner para YouTube, Facebook, site, etc.' },
        en: { title: 'Social Media Banner', desc: 'Banners for YouTube, Facebook, websites, etc.' }
    },
    'visualid': {
        pt: { title: 'Identidade Visual', desc: 'Manual de identidade completa, mockups, brindes e mais!' },
        en: { title: 'Visual Identity', desc: 'Complete identity manual, mockups, swag and more!' }
    },
    'cartao_visitas': {
        pt: { title: 'Cartão de Visitas', desc: 'Design profissional para seu cartão de visitas.' },
        en: { title: 'Business Card', desc: 'Professional design for your business card.' }
    },
    'flyer': {
        pt: { title: 'Flyer', desc: 'Arte criativa para seu flyer promocional.' },
        en: { title: 'Flyer', desc: 'Creative artwork for your promotional flyer.' }
    },
    'convites': {
        pt: { title: 'Convites', desc: 'Design elegante para seus convites.' },
        en: { title: 'Invitations', desc: 'Elegant design for your invitations.' }
    },
    'banner': {
        pt: { title: 'Banner', desc: 'Arte para banners de qualquer tamanho (impresso).' },
        en: { title: 'Banner', desc: 'Artwork for banners of any size (print).' }
    },
    'botton': {
        pt: { title: 'Arte para Botton', desc: 'Arte simples para botton personalizado.' },
        en: { title: 'Button Art', desc: 'Simple artwork for custom buttons.' }
    },
    'adesivos': {
        pt: { title: 'Arte para Adesivos', desc: 'Design para adesivos personalizados.' },
        en: { title: 'Sticker Design', desc: 'Design for custom stickers.' }
    },

    'video_longo': { pt: { title: 'Vídeo Longo', desc: 'Um vídeo longo, perfeito para YouTube e outras plataformas.' }, en: { title: 'Long Video', desc: 'A long-format video, great for YouTube and other platforms.' } },
    'video_curto': { pt: { title: 'Vídeo Curto', desc: 'Um vídeo curto, ideal para redes sociais verticais e anúncios.' }, en: { title: 'Short Video', desc: 'Short video, ideal for vertical socials and ads.' } },
    'thumbnail': { pt: { title: 'Thumbnail', desc: 'Thumbnail personalizada para seu vídeo.' }, en: { title: 'Thumbnail', desc: 'Custom thumbnail for your video.' } },

    'intro_animada': { pt: { title: 'Intro Animada', desc: 'Uma intro simples e criativa com elementos 2D' }, en: { title: 'Animated Intro', desc: 'A simple and creative 2D intro.' } },
    'logomotion': { pt: { title: 'Logo/logotipo Animado', desc: 'Logo animado para vídeos e apresentações' }, en: { title: 'Animated Logo', desc: 'Animated logo for videos and presentations.' } },
    'motionmoldura': { pt: { title: 'Moldura Animada', desc: 'Moldura animada para vídeos e transmissões ao vivo' }, en: { title: 'Animated Frame', desc: 'Animated frame for videos and streams.' } },
    'waitscreen': { pt: { title: 'Tela de Espera', desc: 'Animação em looping para telas de espera' }, en: { title: 'Waitscreen', desc: 'Looping animation for waiting screens.' } },
    'motionbanner': { pt: { title: 'Banner animado', desc: 'O banner da sua marca animado para chamar atenção' }, en: { title: 'Animated Banner', desc: 'Animated banner for your brand to attract attention.' } },

    'fanart_anime': { pt: { title: 'Arte Estilo Anime', desc: 'Arte digital de personagem no estilo anime personalizada para você' }, en: { title: 'Anime-style Art', desc: 'Character art in anime style, custom made for you.' } },
    'fanart_cartoon': { pt: { title: 'Arte Estilo Cartoon', desc: 'Arte digital de personagem no estilo cartoon personalizada para você' }, en: { title: 'Cartoon-style Art', desc: 'Character art in cartoon style, custom made for you.' } },
    'fanart_chibi': { pt: { title: 'Arte Estilo Chibi', desc: 'Arte digital de personagem no estilo chibi personalizada para você' }, en: { title: 'Chibi-style Art', desc: 'Chibi-style character art, custom made.' } },
    'personagem_rpg': { pt: { title: 'Personagem token RPG', desc: 'Arte de personagem para RPG no estilo token de tabuleiro' }, en: { title: 'RPG Character Token', desc: 'Character art for RPG in token style.' } },
    'ilustracao_perfil': { pt: { title: 'Ilustração de perfil', desc: 'Arte digital de perfil nos estilos cartoon, anime ou realista' }, en: { title: 'Profile Illustration', desc: 'Digital profile art in cartoon, anime or realistic styles.' } },
    'esboco_rapido': { pt: { title: 'Esboço Rápido', desc: 'Um esboço rápido e simples de sua ideia ou personagem' }, en: { title: 'Quick Sketch', desc: 'A quick, simple sketch of your idea or character.' } },
    'cenario_digital': { pt: { title: 'Cenário digital', desc: 'Um cenário digital detalhado para livros, jogos ou projetos pessoais' }, en: { title: 'Digital Scene', desc: 'A detailed digital scene for books, games or personal projects.' } },
};

const packageTranslations = {
    'designmegapackage': { pt: { title: 'Mega Pacote', items: ['10 posts', '10 stories criativos', '10 carrosséis'] }, en: { title: 'Mega Package', items: ['10 posts', '10 creative stories', '10 carousels'] } },
    'designpremiumpackage': { pt: { title: 'Pacote Premium', items: ['5 posts', '5 stories', '5 carrosséis'] }, en: { title: 'Premium Package', items: ['5 posts', '5 stories', '5 carousels'] } },
    'postpackage': { pt: { title: 'Pacote Posts', items: ['5 posts'] }, en: { title: 'Posts Package', items: ['5 posts'] } },
    'storiepackage': { pt: { title: 'Pacote Stories', items: ['5 stories'] }, en: { title: 'Stories Package', items: ['5 stories'] } },
    'carrosselpackage': { pt: { title: 'Pacote Carrosséis', items: ['5 carrosséis'] }, en: { title: 'Carousel Package', items: ['5 carousels'] } },

    'mega_pacote': { pt: { title: 'Mega Pacote', items: ['5 vídeos longos', '10 vídeos curtos', '15 thumbnails'] }, en: { title: 'Mega Package', items: ['5 long videos', '10 short videos', '15 thumbnails'] } },
    'pacote_premium_a': { pt: { title: 'Pacote Premium A', items: ['5 vídeos longos', '5 thumbnails'] }, en: { title: 'Premium Package A', items: ['5 long videos', '5 thumbnails'] } },
    'pacote_premium_b': { pt: { title: 'Pacote Premium B', items: ['5 vídeos curtos', '5 thumbnails'] }, en: { title: 'Premium Package B', items: ['5 short videos', '5 thumbnails'] } },
    'cinco_videos_longos': { pt: { title: 'Cinco Vídeos Longos', items: ['5 vídeos longos'] }, en: { title: 'Five Long Videos', items: ['5 long videos'] } },
    'cinco_videos_curtos': { pt: { title: 'Cinco Vídeos Curtos', items: ['5 vídeos curtos'] }, en: { title: 'Five Short Videos', items: ['5 short videos'] } },
    'cinco_thumbnails': { pt: { title: 'Cinco Thumbnails', items: ['5 thumbnails'] }, en: { title: 'Five Thumbnails', items: ['5 thumbnails'] } },
    'dez_thumbnails': { pt: { title: 'Dez Thumbnails', items: ['10 thumbnails'] }, en: { title: 'Ten Thumbnails', items: ['10 thumbnails'] } },
};

function getServiceTitle(id) {
    return (serviceTranslations[id] && serviceTranslations[id][currentLanguage] && serviceTranslations[id][currentLanguage].title) || (() => {
        
        const s = designServices.concat(videoServices, motionGraphicsServices, ilustracaoDigitalServices).find(x => x.id === id);
        return s ? s.title : id;
    })();
}

function getServiceDesc(id) {
    return (serviceTranslations[id] && serviceTranslations[id][currentLanguage] && serviceTranslations[id][currentLanguage].desc) || '';
}

function getServiceInfo(id) {
    if (typeof odysseeOverrides !== 'undefined' && odysseeOverrides[id] && odysseeOverrides[id].informativo) {
        return odysseeOverrides[id].informativo;
    }
    return '';
}

function getPackageTitle(id) {
    return (packageTranslations[id] && packageTranslations[id][currentLanguage] && packageTranslations[id][currentLanguage].title) || id;
}

function getPackageItems(id) {
    return (packageTranslations[id] && packageTranslations[id][currentLanguage] && packageTranslations[id][currentLanguage].items) || [];
}

let allPosts = (typeof odysseeInitialPosts !== 'undefined' && Array.isArray(odysseeInitialPosts) && odysseeInitialPosts.length > 0)
    ? odysseeInitialPosts
    : (function () {
        try {
            const cacheKey = 'odyssee_posts_cache';
            const cached = (window.safeStorage && window.safeStorage.getItem(cacheKey)) || (typeof localStorage !== 'undefined' ? localStorage.getItem(cacheKey) : null);
            return cached ? JSON.parse(cached) : [];
        } catch (e) { return []; }
    })(); 

const wpConfig = {
    baseUrl: (typeof window !== 'undefined' ? window.location.origin : ''),
    postsPerPage: 100,
    cacheExpire: 5 * 60 * 1000
};

function extractExcerpt(htmlContent, maxLength = 150) {
    if (!htmlContent) return '';

    let text = htmlContent.replace(/<[^>]*>/g, '');

    text = text.replace(/\s+/g, ' ').trim();

    if (text.length > maxLength) {
        text = text.substring(0, maxLength).trim() + '...';
    }

    return text;
}

function extractYoutubeThumbnail(content) {
    
    const iframeRegex = /src=["']https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/;
    let match = content.match(iframeRegex);

    if (match && match[1]) {
        console.log('[YOUTUBE] ID extraído de iframe:', match[1]);
        return `https://img.youtube.com/vi/${match[1]}/maxresdefault.webp`;
    }

    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    match = content.match(youtubeRegex);

    if (match && match[1]) {
        console.log('[YOUTUBE] ID extraído de URL:', match[1]);
        return `https://img.youtube.com/vi/${match[1]}/maxresdefault.webp`;
    }

    return null;
}

async function fetchRealPosts() {
    try {
        console.log('[API] Buscando posts atualizados...');

        const restBaseUrl = (typeof odysseeSecure !== 'undefined' && odysseeSecure.restUrl)
            ? odysseeSecure.restUrl
            : wpConfig.baseUrl + '/wp-json/';

        const url = restBaseUrl + 'wp/v2/posts?_embed&per_page=' + wpConfig.postsPerPage;
        
        let response;
        try {
            response = await fetch(url);
        } catch (fetchErr) {
            console.warn('[API] Falha de rede ao buscar posts. Tentando fallback local...', fetchErr);
            
            const cacheKey = 'odyssee_posts_cache';
            const cached = (window.safeStorage && window.safeStorage.getItem(cacheKey)) || (typeof localStorage !== 'undefined' ? localStorage.getItem(cacheKey) : null);
            if (cached) {
                allPosts = JSON.parse(cached);
                console.log('[CACHE] Posts carregados via fallback local offline');
                return;
            }
            throw fetchErr;
        }

        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const data = await response.json();
        console.log('[API] Posts recebidos:', data.length);

        allPosts = data.map(post => {
            
            let imgUrl = null;

            if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
                imgUrl = post._embedded['wp:featuredmedia'][0].source_url;
            }

            if (!imgUrl) {
                const youtubeThumb = extractYoutubeThumbnail(post.content.rendered);
                if (youtubeThumb) {
                    imgUrl = youtubeThumb;
                    console.log('[API] Usando thumbnail do YouTube para:', post.title.rendered);
                }
            }

            if (!imgUrl) {
                imgUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23ccc"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23999" text-anchor="middle" dy=".3em"%3ESem Imagem%3C/text%3E%3C/svg%3E';
            }

            let categoryList = ['geral']; 
            let subCategoryList = []; 

            if (post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0]) {
                const terms = post._embedded['wp:term'][0];

                const parentCats = [];
                const childCats = [];

                terms.forEach(cat => {
                    const urlMatch = cat.link.match(/\/category\/([^\/]+)\/([^\/]+)\//);
                    if (urlMatch) {
                        
                        childCats.push(cat);
                    } else {
                        
                        parentCats.push(cat);
                    }
                });

                if (parentCats.length > 0) {
                    categoryList = parentCats.map(cat => cat.slug);
                } else if (terms.length > 0) {
                    categoryList = terms.map(t => t.slug);
                }

                if (childCats.length > 0) {
                    subCategoryList = childCats.map(cat => cat.slug);
                }
            }

            const decodedTitle = decodeHtmlEntities(post.title && post.title.rendered ? post.title.rendered : '');
            const decodedContent = decodeHtmlEntities(post.content && post.content.rendered ? post.content.rendered : '');
            const decodedTitleEN = post.meta && post.meta.post_title_en ? decodeHtmlEntities(post.meta.post_title_en) : '';

            const postMapped = {
                title: decodedTitle,
                titleEN: decodedTitleEN, 
                categories: categoryList, 
                category: categoryList[0], 
                subCategories: subCategoryList, 
                subCategory: subCategoryList[0] || '', 
                image: imgUrl,
                date: post.date,
                link: post.link,
                content: decodedContent 
            };

            if (postMapped.category === 'motion') {
                console.log('[API] Post Motion encontrado:', postMapped.title, '| Imagem:', postMapped.image.substring(0, 50) + '...');
            }

            return postMapped;
        });

        console.log("[API] ✅ Posts carregados com sucesso:", allPosts.length);

        allPosts = allPosts.filter(post => post && post.title && post.image && post.date);
        console.log("[API] Posts válidos após filtro:", allPosts.length);

        try {
            if (window.safeStorage) {
                window.safeStorage.setItem(cacheKey, JSON.stringify(allPosts));
                window.safeStorage.setItem(cacheKey + '_time', now.toString());
            } else {
                try { localStorage.setItem(cacheKey, JSON.stringify(allPosts)); localStorage.setItem(cacheKey + '_time', now.toString()); } catch (e) { }
            }
            console.log('[CACHE] Posts salvos em cache local');
        } catch (e) {
            console.warn('[CACHE] Erro ao salvar cache:', e.message);
        }

        try {
            const cats = new Set();
            const subcats = new Set();
            allPosts.forEach(p => { if (p.category) cats.add(p.category); if (p.subCategory) subcats.add(p.subCategory); });
            console.log('[API] Categorias detectadas:', Array.from(cats).join(', '));
            console.log('[API] Subcategorias detectadas:', Array.from(subcats).join(', '));
        } catch (e) {  }

        renderAllCarousels();

        if (typeof renderBlog === 'function') renderBlog();

    } catch (err) {
        console.error("[API] ❌ Erro ao buscar posts:", err);
        console.error("[API] URL tentada:", wpConfig.baseUrl + '/wp-json/wp/v2/posts');
    }
}

const defaultPrices = {
    
    'design_post': 20.00,
    'design_storie': 22.00,
    'design_carrossel': 60.00,
    'logotipologo': 49.00,
    'bannersocial': 79.00,
    'visualid': 599.00,
    'cartao_visitas': 24.00,
    'flyer': 29.00,
    'convites': 23.00,
    'banner': 100.00,
    'botton': 19.00,
    'adesivos': 19.00,

    'designmegapackage': 1250.00,
    'designpremiumpackage': 679.00,
    'postpackage': 89.00,
    'storiepackage': 105.00,
    'carrosselpackage': 449.00,

    'video_longo': 350.00,
    'video_curto': 100.00,
    'thumbnail': 20.00,

    'mega_pacote': 2650.00,
    'pacote_premium_a': 1650.00,
    'pacote_premium_b': 475.00,
    'cinco_videos_longos': 1599.00,
    'cinco_videos_curtos': 399.00,
    'cinco_thumbnails': 89.00,
    'dez_thumbnails': 169.00,

    'intro_animada': 200.00,
    'artmotion': 250.00,
    'logomotion': 100.00,
    'motionmoldura': 140.00,
    'waitscreen': 175.00,
    'motionbanner': 300.00,

    'fanart_anime': 120.00,
    'fanart_cartoon': 180.00,
    'fanart_chibi': 50.00,
    'fanart_pixelart': 80.00,
    'fanart_vetorial': 100.00,
    'personagem_rpg': 250.00,
    'ilustracao_perfil': 150.00,
    'ilustracao_corpo_inteiro': 250.00,
    'storyboard': 300.00,
    'cenario_digital': 375.00,
    'esboco_rapido': 25.00,

};

const defaultUnitPrices = {
    'design_post': 20.00,
    'design_storie': 22.00,
    'design_carrossel': 60.00,
    'video_longo': 380.00,
    'video_curto': 120.00,
    'thumbnail': 30.00
};

function parseWpPrices(obj) {
    if (!obj || typeof obj !== 'object') return {};
    const parsed = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const num = parseFloat(obj[key]);
            if (!isNaN(num) && num > 0) {
                parsed[key] = num;
            }
        }
    }
    return parsed;
}
const allPrices = Object.assign({}, defaultPrices,
    (typeof odysseePrecos !== 'undefined' && odysseePrecos.prices) ? parseWpPrices(odysseePrecos.prices) : {}
);
const unitPrices = Object.assign({}, defaultUnitPrices,
    (typeof odysseePrecos !== 'undefined' && odysseePrecos.unitPrices) ? parseWpPrices(odysseePrecos.unitPrices) : {}
);

const customProducts = (function () {
    if (typeof odysseeProdutos === 'undefined') return [];
    
    const arr = [];
    for (const key in odysseeProdutos) {
        if (odysseeProdutos.hasOwnProperty(key) && typeof odysseeProdutos[key] === 'object') {
            const p = odysseeProdutos[key];
            const tipo = p.tipo || 'servico';
            const itensRaw = p.itens || '';
            const itensArr = itensRaw ? itensRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];
            arr.push({
                id: p.id || 'custom_' + key,
                title: p.nome || '',
                desc: p.descricao || '',
                informativo: p.informativo || '',
                image: p.thumbnail || '',
                icon: '',
                category: p.categoria || 'design-grafico',
                tipo: tipo,
                items: itensArr,
                price: parseFloat(p.preco) || 0
            });
            
            if (p.id && parseFloat(p.preco) > 0) {
                allPrices[p.id] = parseFloat(p.preco);
            }
        }
    }
    return arr;
})();

const categoryMap = {
    'design-grafico': { label: 'Design Gráfico', gridId: 'design-services-grid', packageGridId: 'design-packages-grid' },
    'edicao-de-video': { label: 'Edição de Vídeo', gridId: 'video-services-grid', packageGridId: 'video-packages-grid' },
    'motion': { label: 'Motion Graphics', gridId: 'motion-graphics-services-grid', packageGridId: 'motion-graphics-services-grid' },
    'ilustracao': { label: 'Ilustração Digital', gridId: 'ilustracao-estilos', packageGridId: 'ilustracao-estilos' },
};

function renderCustomProducts() {
    if (!customProducts.length) return;

    customProducts.forEach(product => {
        const catInfo = categoryMap[product.category];
        if (!catInfo) return;

        const isPacote = product.tipo === 'pacote';
        const gridId = isPacote ? catInfo.packageGridId : catInfo.gridId;
        const grid = document.getElementById(gridId);
        if (!grid) return;

        const price = allPrices[product.id] || product.price;
        const priceString = price > 0
            ? `R$ ${price.toFixed(2).replace('.', ',')}`
            : (translations[currentLanguage] && translations[currentLanguage]['consulte'] ? translations[currentLanguage]['consulte'] : 'Consulte');

        const hireLabel = translations[currentLanguage] && translations[currentLanguage]['btn-hire']
            ? translations[currentLanguage]['btn-hire'] : 'Contratar';

        const cleanTitle = product.title.replace(/<[^>]*>/g, '');
        const whatsappMsg = encodeURIComponent(`Olá, gostaria de apresentar a minha ideia e solicitar um orçamento para o produto/serviço: *${catInfo.label} - ${cleanTitle}*.`);
        const whatsappLink = `https://wa.me/5511963208691?text=${whatsappMsg}`;

        if (isPacote) {
            
            const itemsHTML = product.items.map(item => `<li><i class="fa fa-check-circle"></i> ${item}</li>`).join('');
            grid.innerHTML += `
                <div class="service-card package-card">
                    <h3>${cleanTitle}</h3>
                    <ul class="package-items">${itemsHTML}</ul>
                    <p>${priceString}</p>
                    <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer"><button>${hireLabel}</button></a>
                </div>
            `;
        } else {
            
            const thumbnailHTML = product.image
                ? `<img class="service-thumb-img" src="${product.image}" alt="${cleanTitle}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22180%22%3E%3Crect width=%22300%22 height=%22180%22 fill=%22%23ccc%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESem%20Imagem%3C/text%3E%3C/svg%3E';">`
                : '';

            grid.innerHTML += `
                <div class="service-card">
                    <div class="service-thumbnail">${thumbnailHTML}</div>
                    <div class="service-content">
                        <h3>${cleanTitle}</h3>
                        <p class="service-price">${priceString}</p>
                        <span class="service-desc">${product.desc}</span>
                        <div class="service-actions">
                            <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer"><button>${hireLabel}</button></a>
                            <div class="info-icon-wrapper">
                                <i class="fas fa-info-circle info-icon"></i>
                                <div class="info-tooltip">${product.informativo || 'Clique em Contratar para solicitar orçamento.'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });
}

const designServices = [
    { id: 'design_post', icon: 'fas fa-file-image', image: '/wp-content/uploads/2026/01/art-card-services.webp', title: 'Post', desc: 'Arte individual para post em redes sociais (Instagram, Facebook, LinkedIn).' },
    { id: 'design_storie', icon: 'fas fa-bolt', image: '/wp-content/uploads/2026/01/art-card-services-1.webp', title: 'Storie', desc: 'Arte individual para stories em redes sociais (Instagram, WhatsApp).' },
    { id: 'design_carrossel', icon: 'fas fa-images', image: '/wp-content/uploads/2026/01/art-card-services-2.webp', title: 'Carrossel', desc: 'Arte para carrossel contínuo ou informativo para redes sociais.' },
    { id: 'logotipologo', icon: 'fas fa-id-card', image: '/wp-content/uploads/2025/09/Artboard-3-1-e1757565255458.webp', title: 'Logotipo e Logo', desc: 'Uma logo única, criativa e estrategicamente feita para captar seu público alvo.' },
    { id: 'bannersocial', icon: 'fas fa-scroll', image: '/wp-content/uploads/2025/07/Screenshot-2025-06-30-184152.webp', title: 'Banner para redes sociais', desc: 'Banner para YouTube, Facebook, site, etc.' },
    { id: 'cartao_visitas', icon: 'fas fa-palette', image: '/wp-content/uploads/2025/12/art-card-services.webp', title: 'Cartão de Visitas', desc: 'Design profissional para seu cartão de visitas.' },
    { id: 'flyer', icon: 'fas fa-newspaper', image: '/wp-content/uploads/2025/12/art-card-services-2.webp', title: 'Flyer', desc: 'Arte criativa para seu flyer promocional.' },
    { id: 'convites', icon: 'fas fa-envelope-open-text', image: '/wp-content/uploads/2025/12/art-card-services-5.webp', title: 'Convites', desc: 'Design elegante para seus convites.' },
    { id: 'banner', icon: 'fas fa-scroll', image: '/wp-content/uploads/2025/12/art-card-services-4.webp', title: 'Banner', desc: 'Arte para banners de qualquer tamanho (impresso).' },
    { id: 'botton', image: '/wp-content/uploads/2025/12/art-card-services-1.webp', title: 'Arte para Botton', desc: 'Arte simples para botton personalizado.' },
    { id: 'adesivos', icon: 'fas fa-sticky-note', image: '/wp-content/uploads/2025/12/art-card-services-3.webp', title: 'Arte para Adesivos', desc: 'Design para adesivos personalizados.' },
    { id: 'visualid', icon: 'fas fa-palette', image: '/wp-content/uploads/2025/05/Untitled-1-11.webp', title: 'Identidade Visual', desc: 'Manual de identidade completa, mockups, brindes e mais!' },
];

const designPackages = [
    { id: 'designmegapackage', icon: 'fas fa-star', title: 'Mega Pacote', items: ['10 posts', '10 stories criativos', '10 carrosséis'], quantities: { post: 10, storie: 10, carrossel: 10 } },
    { id: 'designpremiumpackage', icon: 'fas fa-crown', title: 'Pacote Premium', items: ['5 posts', '5 stories', '5 carrosséis'], quantities: { post: 5, storie: 5, carrossel: 5 } },
    { id: 'postpackage', icon: 'fas fa-file-image', title: 'Pacote Posts', items: ['5 posts'], quantities: { post: 5 } },
    { id: 'storiepackage', icon: 'fas fa-bolt', title: 'Pacote Stories', items: ['5 stories'], quantities: { storie: 5 } },
    { id: 'carrosselpackage', icon: 'fas fa-images', title: 'Pacote Carrosséis', items: ['5 carrosséis'], quantities: { carrossel: 5 } }
];

const videoServices = [
    { id: 'video_longo', icon: 'fas fa-film', image: '/wp-content/uploads/2026/01/art-card-services.webp', title: 'Vídeo Longo', desc: 'Um vídeo longo, perfeito para YouTube e outras plataformas.' },
    { id: 'video_curto', icon: 'fas fa-mobile-alt', image: '/wp-content/uploads/2026/01/art-card-services-1.webp', title: 'Vídeo Curto', desc: 'Um vídeo curto, ideal para redes sociais verticais e anúncios.' },
    { id: 'thumbnail', icon: 'fas fa-image', image: '/wp-content/uploads/2026/01/art-card-services-2.webp', title: 'Thumbnail', desc: 'Thumbnail personalizada para seu vídeo.' },
];

const videoPackages = [
    { id: 'mega_pacote', icon: 'fas fa-gem', title: 'Mega Pacote', items: ['5 vídeos longos', '10 vídeos curtos', '15 thumbnails'], quantities: { longo: 5, curto: 10, thumbnail: 15 } },
    { id: 'pacote_premium_a', icon: 'fas fa-star', title: 'Pacote Premium A', items: ['5 vídeos longos', '5 thumbnails'], quantities: { longo: 5, thumbnail: 5 } },
    { id: 'pacote_premium_b', icon: 'far fa-star', title: 'Pacote Premium B', items: ['5 vídeos curtos', '5 thumbnails'], quantities: { curto: 5, thumbnail: 5 } },
    { id: 'cinco_videos_longos', icon: 'fas fa-film', title: 'Cinco Vídeos Longos', items: ['5 vídeos longos'], quantities: { longo: 5 } },
    { id: 'cinco_videos_curtos', icon: 'fas fa-mobile-alt', title: 'Cinco Vídeos Curtos', items: ['5 vídeos curtos'], quantities: { curto: 5 } },
    { id: 'cinco_thumbnails', icon: 'far fa-images', title: 'Cinco Thumbnails', items: ['5 thumbnails'], quantities: { thumbnail: 5 } },
    { id: 'dez_thumbnails', icon: 'fas fa-images', title: 'Dez Thumbnails', items: ['10 thumbnails'], quantities: { thumbnail: 10 } },
];

const motionGraphicsServices = [
    { id: 'intro_animada', icon: 'fas fa-play-circle fa-bounce', image: '/wp-content/uploads/2026/01/FalaAiWillcomsom-ezgif.com-optimize.gif', title: 'Intro Animada', desc: 'Uma intro simples e criativa com elementos 2D' },
    { id: 'artmotion', icon: 'fas fa-scroll', image: '/wp-content/uploads/2025/06/harley-animated-.gif', title: 'Arte Animada', desc: 'Sua arte animada com elementos 2D' },
    { id: 'logomotion', icon: 'fas fa-scroll', image: '/wp-content/uploads/2025/12/art-card-services-motion.webp', title: 'Logo/logotipo Animado', desc: 'Logo animado para vídeos e apresentações' },
    { id: 'motionmoldura', icon: 'fas fa-expand fa-fade', image: '/wp-content/uploads/2025/12/art-card-services-motion.webp', title: 'Moldura Animada', desc: 'Moldura animada para vídeos e transmissões ao vivo' },
    { id: 'waitscreen', icon: 'fas fa-spinner fa-spin', image: '/wp-content/uploads/2025/12/art-card-services-motion.webp', title: 'Tela de Espera', desc: 'Animação em looping para telas de espera' },
    { id: 'motionbanner', icon: 'fas fa-newspaper', image: '/wp-content/uploads/2025/12/art-card-services-motion.webp', title: 'Banner animado', desc: 'O banner da sua marca animado para chamar atenção' },
];

const ilustracaoDigitalServices = [
    { id: 'fanart_anime', icon: 'fas fa-female', image: '/wp-content/uploads/2026/01/art-card-services_14.webp', title: 'Arte Estilo Anime', desc: 'Arte digital de personagem no estilo anime personalizada para você' },
    { id: 'fanart_cartoon', icon: 'fas fa-walking', image: '/wp-content/uploads/2026/01/art-card-services_13.webp', title: 'Arte Estilo Cartoon', desc: 'Arte digital de personagem no estilo cartoon personalizada para você' },
    { id: 'fanart_chibi', icon: 'fab fa-github-alt', image: '/wp-content/uploads/2026/01/art-card-services_15.webp', title: 'Arte Estilo Chibi', desc: 'Arte digital de personagem no estilo chibi personalizada para você' },
    { id: 'fanart_pixelart', icon: 'fas fa-pixel', image: '/wp-content/uploads/2026/01/art-card-services_12.webp', title: 'Arte Estilo Pixel Art', desc: 'Arte digital de personagem no estilo pixel art personalizada para você' },
    { id: 'fanart_vetorial', icon: 'fas fa-vector-square', image: '/wp-content/uploads/2025/05/Jinx-Powder-Vector-lightroom-scaled-e1747298364610.webp', title: 'Arte Estilo Vetorial', desc: 'Arte digital de personagem no estilo vetorial personalizada para você' },
    { id: 'personagem_rpg', icon: 'fas fa-dice-d20', image: '/wp-content/uploads/2025/12/art-card-services-motion.webp', title: 'Personagem token RPG', desc: 'Arte de personagem para RPG no estilo token de tabuleiro.' },
    { id: 'ilustracao_perfil', icon: 'fas fa-id-badge', image: '/wp-content/uploads/2026/01/art-card-services_11.webp', title: 'Ilustração de perfil/busto', desc: 'Arte digital de perfil nos estilos cartoon, anime, chibi e pixel art' },
    { id: 'ilustracao_corpo_inteiro', icon: 'fas fa-user', image: '/wp-content/uploads/2026/01/art-card-services_8.webp', title: 'Ilustração corpo inteiro', desc: 'Arte digital de corpo inteiro nos estilos cartoon, anime, chibi e pixel art' },
    { id: 'esboco_rapido', icon: '\tfar fa-id-badge', image: '/wp-content/uploads/2026/01/art-card-services_10.webp', title: 'Esboço Rápido', desc: 'Um esboço rápido e simples de sua ideia ou personagem' },
    { id: 'storyboard', icon: 'fas fa-landmark', image: '/wp-content/uploads/2026/01/art-card-services_9.webp', title: 'Storyboard', desc: 'Storyboard cena a cena para seu projeto' },
];

if (typeof odysseeOverrides !== 'undefined') {
    const allServiceArrays = [designServices, designPackages, videoServices, videoPackages, motionGraphicsServices, ilustracaoDigitalServices];
    allServiceArrays.forEach(function (arr) {
        arr.forEach(function (svc, idx) {
            const override = odysseeOverrides[svc.id];
            if (override) {
                if (override.nome) svc.title = override.nome;
                if (override.descricao) svc.desc = override.descricao;
                if (override.thumbnail) svc.image = override.thumbnail;
                if (override.ordem !== undefined && override.ordem !== '') {
                    svc.ordem = parseInt(override.ordem, 10);
                } else {
                    svc.ordem = idx + 1;
                }
                if (override.oculto === '1' || override.oculto === 1 || override.oculto === true) {
                    svc.oculto = true;
                }
            } else {
                svc.ordem = idx + 1;
            }
        });
        
        arr.sort(function (a, b) {
            return (a.ordem || 999) - (b.ordem || 999);
        });
    });
}

function calculateDiscount(packagePrice, unitQuantities) {
    let bruteTotal = 0;
    bruteTotal += (unitQuantities.post || 0) * (allPrices.design_post || unitPrices.design_post || 20);
    bruteTotal += (unitQuantities.storie || 0) * (allPrices.design_storie || unitPrices.design_storie || 22);
    bruteTotal += (unitQuantities.carrossel || 0) * (allPrices.design_carrossel || unitPrices.design_carrossel || 100);
    bruteTotal += (unitQuantities.longo || 0) * (allPrices.video_longo || unitPrices.video_longo || 380);
    bruteTotal += (unitQuantities.curto || 0) * (allPrices.video_curto || unitPrices.video_curto || 120);
    bruteTotal += (unitQuantities.thumbnail || 0) * (allPrices.thumbnail || unitPrices.thumbnail || 30);
    const discount = bruteTotal - packagePrice;

    if (discount > 0) {
        const prefix = translations[currentLanguage] && translations[currentLanguage]['you-save-prefix'] ? translations[currentLanguage]['you-save-prefix'] : 'Você economiza R$ ';
        
        const amount = currentLanguage === 'en' ? discount.toFixed(2) : discount.toFixed(2).replace('.', ',');
        return `<span class="service-discount">${prefix}${amount}</span>`;
    }
    return ''; 
}

function renderDesignServices() {
    const servicesGrid = document.getElementById('design-services-grid');
    const packagesGrid = document.getElementById('design-packages-grid');

    if (servicesGrid) {
        servicesGrid.innerHTML = ''; 
        designServices.filter(s => !s.oculto).forEach(service => {
            const price = allPrices[service.id];
            const priceString = price ? `R$ ${price.toFixed(2).replace('.', ',')}` : (translations[currentLanguage] && translations[currentLanguage]['consulte'] ? translations[currentLanguage]['consulte'] : 'Consulte');

            const svcTitle = getServiceTitle(service.id);
            const svcDesc = getServiceDesc(service.id) || service.desc || '';
            const hireLabel = translations[currentLanguage] && translations[currentLanguage]['btn-hire'] ? translations[currentLanguage]['btn-hire'] : 'Contratar';
            const whatsappMsg = encodeURIComponent(`Olá, gostaria de apresentar a minha ideia e solicitar um orçamento para o produto/serviço: *Design Gráfico - ${svcTitle.replace(/<[^>]*>/g, '')}*.`);
            const whatsappLink = `https://wa.me/5511963208691?text=${whatsappMsg}`;
            const infoText = getServiceInfo(service.id) || 'Tempo de entrega: 3-5 dias úteis. Inclui 2 revisões. Formato final em alta resolução.';
            const thumbnailHTML = service.image ? `<img class="service-thumb-img" src="${service.image}" alt="${svcTitle}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22180%22%3E%3Crect width=%22300%22 height=%22180%22 fill=%22%23ccc%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESem%20Imagem%3C/text%3E%3C/svg%3E';">` : (service.icon ? `<i class="${service.icon}"></i>` : '');
            servicesGrid.innerHTML += `
                    <div class="service-card">
                        <div class="service-thumbnail">${thumbnailHTML}</div>
                        <div class="service-content">
                            <h3>${svcTitle}</h3>
                            <p class="service-price">${priceString}</p>
                            <span class="service-desc">${svcDesc}</span>
                            <div class="service-actions">
                                <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer"><button>${hireLabel}</button></a>
                                <div class="info-icon-wrapper">
                                    <i class="fas fa-info-circle info-icon"></i>
                                    <div class="info-tooltip">${infoText}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
        });
    }

    if (packagesGrid) {
        packagesGrid.innerHTML = ''; 
        designPackages.filter(p => !p.oculto).forEach(pkg => {
            const price = allPrices[pkg.id];
            const priceString = price ? `R$ ${price.toFixed(2).replace('.', ',')}` : (translations[currentLanguage] && translations[currentLanguage]['consulte'] ? translations[currentLanguage]['consulte'] : 'Consulte');
            const discountHTML = calculateDiscount(price, pkg.quantities);

            const itemsHTML = pkg.items.map(item => `<li><i class="fa fa-check-circle"></i> ${item}</li>`).join('');

            const pkgTitle = getPackageTitle(pkg.id) || pkg.title;
            const pkgItems = getPackageItems(pkg.id).length ? getPackageItems(pkg.id) : pkg.items;
            const itemsHTMLTranslated = pkgItems.map(item => `<li><i class="fa fa-check-circle"></i> ${item}</li>`).join('');
            const hireLabelPkg = translations[currentLanguage] && translations[currentLanguage]['btn-hire'] ? translations[currentLanguage]['btn-hire'] : 'Contratar';
            const whatsappMsgPkg = encodeURIComponent(`Olá, gostaria de apresentar a minha ideia e solicitar um orçamento para o produto/serviço: *Design Gráfico - ${pkgTitle.replace(/<[^>]*>/g, '')}*.`);
            const whatsappLinkPkg = `https://wa.me/5511963208691?text=${whatsappMsgPkg}`;
            const pkgIconHTML = pkg.icon ? (`<i class="${pkg.icon} package-icon-inline" aria-hidden="true"></i>` + `<svg class="package-icon-svg icon-svg small" role="img" aria-hidden="true" style="display:none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7"/></svg>`) : (pkg.iconImage ? `<img class="package-icon" src="${pkg.iconImage}" alt="${pkgTitle.replace(/<[^>]*>/g, '')}">` : '');
            packagesGrid.innerHTML += `
                    <div class="service-card package-card">
                        <h3>${pkgIconHTML} ${pkgTitle}</h3>
                        <ul class="package-items">${itemsHTMLTranslated}</ul>
                        <p>${priceString}</p>
                        ${discountHTML} <a href="${whatsappLinkPkg}" target="_blank" rel="noopener noreferrer"><button>${hireLabelPkg}</button></a>
                    </div>
                `;
        });
    }
}

function renderVideoServices() {
    const servicesGrid = document.getElementById('video-services-grid');
    const packagesGrid = document.getElementById('video-packages-grid');

    if (servicesGrid) {
        servicesGrid.innerHTML = ''; 
        videoServices.filter(s => !s.oculto).forEach(service => {
            const price = allPrices[service.id];
            const priceString = price ? `R$ ${price.toFixed(2).replace('.', ',')}` : (translations[currentLanguage] && translations[currentLanguage]['consulte'] ? translations[currentLanguage]['consulte'] : 'Consulte');

            const svcTitle = getServiceTitle(service.id);
            const svcDesc = getServiceDesc(service.id) || service.desc || '';
            const hireLabel = translations[currentLanguage] && translations[currentLanguage]['btn-hire'] ? translations[currentLanguage]['btn-hire'] : 'Contratar';
            const whatsappMsg = encodeURIComponent(`Olá, gostaria de apresentar a minha ideia e solicitar um orçamento para o produto/serviço: *Edição de Vídeo - ${svcTitle.replace(/<[^>]*>/g, '')}*.`);
            const whatsappLink = `https://wa.me/5511963208691?text=${whatsappMsg}`;
            const infoText = getServiceInfo(service.id) || 'Prazo: 5-7 dias úteis. Inclui correção de cor, áudio e efeitos. Até 3 revisões incluídas.';
            const thumbnailHTML = service.image ? `<img class="service-thumb-img" src="${service.image}" alt="${svcTitle}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22180%22%3E%3Crect width=%22300%22 height=%22180%22 fill=%22%23ccc%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESem%20Imagem%3C/text%3E%3C/svg%3E';">` : (service.icon ? `<i class="${service.icon}"></i>` : '');
            servicesGrid.innerHTML += `
                <div class="service-card">
                    <div class="service-thumbnail">${thumbnailHTML}</div>
                    <div class="service-content">
                        <h3>${svcTitle}</h3>
                        <p class="service-price">${priceString}</p>
                        <span class="service-desc">${svcDesc}</span>
                        <div class="service-actions">
                            <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer"><button>${hireLabel}</button></a>
                            <div class="info-icon-wrapper">
                                <i class="fas fa-info-circle info-icon"></i>
                                <div class="info-tooltip">${infoText}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    if (packagesGrid) {
        packagesGrid.innerHTML = ''; 
        videoPackages.filter(p => !p.oculto).forEach(pkg => {
            const price = allPrices[pkg.id];
            const priceString = price ? `R$ ${price.toFixed(2).replace('.', ',')}` : (translations[currentLanguage] && translations[currentLanguage]['consulte'] ? translations[currentLanguage]['consulte'] : 'Consulte');
            const discountHTML = calculateDiscount(price, pkg.quantities);

            const itemsHTML = pkg.items.map(item => `<li><i class="fa fa-check-circle"></i> ${item}</li>`).join('');

            const pkgTitle = getPackageTitle(pkg.id) || pkg.title;
            const pkgItems = getPackageItems(pkg.id).length ? getPackageItems(pkg.id) : pkg.items;
            const itemsHTMLTranslated = pkgItems.map(item => `<li><i class="fa fa-check-circle"></i> ${item}</li>`).join('');
            const hireLabelPkg = translations[currentLanguage] && translations[currentLanguage]['btn-hire'] ? translations[currentLanguage]['btn-hire'] : 'Contratar';
            const whatsappMsgPkg = encodeURIComponent(`Olá, gostaria de apresentar a minha ideia e solicitar um orçamento para o produto/serviço: *Edição de Vídeo - ${pkgTitle.replace(/<[^>]*>/g, '')}*.`);
            const whatsappLinkPkg = `https://wa.me/5511963208691?text=${whatsappMsgPkg}`;
            const pkgIconHTML = pkg.icon ? (`<i class="${pkg.icon} package-icon-inline" aria-hidden="true"></i>` + `<svg class="package-icon-svg icon-svg small" role="img" aria-hidden="true" style="display:none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7"/></svg>`) : (pkg.iconImage ? `<img class="package-icon" src="${pkg.iconImage}" alt="${pkgTitle.replace(/<[^>]*>/g, '')}">` : '');
            packagesGrid.innerHTML += `
                <div class="service-card package-card">
                    <h3>${pkgIconHTML} ${pkgTitle}</h3>
                    <ul class="package-items">${itemsHTMLTranslated}</ul>
                    <p>${priceString}</p>
                    ${discountHTML} <a href="${whatsappLinkPkg}" target="_blank" rel="noopener noreferrer"><button>${hireLabelPkg}</button></a>
                </div>
            `;
        });
    }
}

function rendermotionGraphicsServices() {
    const servicesGrid = document.getElementById('motion-graphics-services-grid');

    if (servicesGrid) {
        servicesGrid.innerHTML = ''; 
        motionGraphicsServices.filter(s => !s.oculto).forEach(service => {
            const price = allPrices[service.id];
            const priceString = price ? `R$ ${price.toFixed(2).replace('.', ',')}` : (translations[currentLanguage] && translations[currentLanguage]['consulte'] ? translations[currentLanguage]['consulte'] : 'Consulte');

            const svcTitle = getServiceTitle(service.id);
            const svcDesc = getServiceDesc(service.id) || service.desc || '';
            const hireLabel = translations[currentLanguage] && translations[currentLanguage]['btn-hire'] ? translations[currentLanguage]['btn-hire'] : 'Contratar';
            const whatsappMsg = encodeURIComponent(`Olá, gostaria de apresentar a minha ideia e solicitar um orçamento para o produto/serviço: *Motion Graphics - ${svcTitle.replace(/<[^>]*>/g, '')}*.`);
            const whatsappLink = `https://wa.me/5511963208691?text=${whatsappMsg}`;
            const infoText = getServiceInfo(service.id) || 'Duração: até 15 segundos. Entrega em 4-6 dias úteis. Formatos: MP4, MOV. 2 revisões incluídas.';
            const thumbnailHTML = service.image ? `<img class="service-thumb-img" src="${service.image}" alt="${svcTitle}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22180%22%3E%3Crect width=%22300%22 height=%22180%22 fill=%22%23ccc%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESem%20Imagem%3C/text%3E%3C/svg%3E';">` : (service.icon ? `<i class="${service.icon}"></i>` : '');
            servicesGrid.innerHTML += `
                <div class="service-card">
                    <div class="service-thumbnail">${thumbnailHTML}</div>
                    <div class="service-content">
                        <h3>${svcTitle}</h3>
                        <p class="service-price">${priceString}</p>
                        <span class="service-desc">${svcDesc}</span>
                        <div class="service-actions">
                            <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer"><button>${hireLabel}</button></a>
                            <div class="info-icon-wrapper">
                                <i class="fas fa-info-circle info-icon"></i>
                                <div class="info-tooltip">${infoText}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
}

const ilustracaoConfigurador = {
    estilos: ['fanart_anime', 'fanart_cartoon', 'fanart_pixelart', 'fanart_chibi', 'fanart_vetorial'],       
    tipos: ['ilustracao_perfil', 'ilustracao_corpo_inteiro', 'personagem_rpg', 'esboco_rapido', 'storyboard'], 
    adicionais: ['nenhum', 'artmotion']  
};

let ilustracaoSelecionada = {
    estilo: null,
    tipo: null,
    adicional: null
};

function renderilustracaoConfigurador() {
    
    const estiloscont = document.getElementById('ilustracao-estilos');
    if (estiloscont) {
        estiloscont.innerHTML = '';
        ilustracaoConfigurador.estilos.forEach(estiloId => {
            const serviceData = ilustracaoDigitalServices.find(s => s.id === estiloId);
            if (!serviceData) return;

            const isActive = ilustracaoSelecionada.estilo === estiloId;
            const card = document.createElement('div');
            card.className = `service-card ${isActive ? 'active' : ''}`;
            card.dataset.id = estiloId;
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => selecionarEstiloIlustracao(estiloId));

            const thumbnailHTML = serviceData.image ? `<img class="service-thumb-img" src="${serviceData.image}" alt="${serviceData.title}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22180%22%3E%3Crect width=%22300%22 height=%22180%22 fill=%22%23ccc%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESem%20Imagem%3C/text%3E%3C/svg%3E';">` : '';

            card.innerHTML = `
                <div class="service-thumbnail">${thumbnailHTML}</div>
                <div class="service-content">
                    <h3>${getTranslation(serviceData.title)}</h3>
                    <p class="service-price">R$ ${allPrices[estiloId].toFixed(2).replace('.', ',')}</p>
                    <span class="service-desc">${serviceData.desc}</span>
                </div>
            `;
            estiloscont.appendChild(card);
        });
    }

    const tiposGroup = document.getElementById('ilustracao-tipos-group');
    const tiposcont = document.getElementById('ilustracao-tipos');
    if (tiposcont && tiposGroup) {
        if (ilustracaoSelecionada.estilo) {
            tiposGroup.style.display = 'block';
            tiposcont.innerHTML = '';
            ilustracaoConfigurador.tipos.forEach(tipoId => {
                const serviceData = ilustracaoDigitalServices.find(s => s.id === tipoId);
                if (!serviceData) return;

                const isActive = ilustracaoSelecionada.tipo === tipoId;
                const card = document.createElement('div');
                card.className = `service-card ${isActive ? 'active' : ''}`;
                card.dataset.id = tipoId;
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => selecionarTipoIlustracao(tipoId));

                const thumbnailHTML = serviceData.image ? `<img class="service-thumb-img" src="${serviceData.image}" alt="${serviceData.title}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22180%22%3E%3Crect width=%22300%22 height=%22180%22 fill=%22%23ccc%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESem%20Imagem%3C/text%3E%3C/svg%3E';">` : '';

                card.innerHTML = `
                    <div class="service-thumbnail">${thumbnailHTML}</div>
                    <div class="service-content">
                        <h3>${getTranslation(serviceData.title)}</h3>
                        <p class="service-price">R$ ${allPrices[tipoId].toFixed(2).replace('.', ',')}</p>
                        <span class="service-desc">${serviceData.desc}</span>
                    </div>
                `;
                tiposcont.appendChild(card);
            });
        } else {
            tiposGroup.style.display = 'none';
        }
    }

    const adicionaiscont = document.getElementById('ilustracao-adicionais');
    const adicionaisgroup = document.getElementById('ilustracao-adicionais-group');
    if (adicionaiscont && adicionaisgroup) {
        if (ilustracaoSelecionada.tipo) {
            adicionaisgroup.style.display = 'block';
            adicionaiscont.innerHTML = '';
            ilustracaoConfigurador.adicionais.forEach(adicionalId => {
                let serviceData = null;
                let title = '';
                let desc = '';
                let image = '';

                if (adicionalId === 'nenhum') {
                    title = 'Sem adicionais';
                    desc = 'Mantém o preço base sem acréscimos';
                } else if (adicionalId === 'artmotion') {
                    serviceData = ilustracaoDigitalServices.find(s => s.id === 'artmotion' || (s.id === 'intro_animada'));
                    if (!serviceData) {
                        
                        const motionService = motionGraphicsServices && motionGraphicsServices.find(s => s.id === 'artmotion');
                        if (motionService) {
                            title = motionService.title;
                            desc = motionService.desc;
                            image = motionService.image;
                        } else {
                            title = 'Arte Animada';
                            desc = 'Adiciona animação à sua ilustração (tipo motion)';
                            image = '/wp-content/uploads/2025/12/art-card-services-motion.webp';
                        }
                    } else {
                        title = serviceData.title;
                        desc = serviceData.desc;
                        image = serviceData.image;
                    }
                } else {
                    serviceData = ilustracaoDigitalServices.find(s => s.id === adicionalId);
                    if (serviceData) {
                        title = serviceData.title;
                        desc = serviceData.desc;
                        image = serviceData.image;
                    }
                }

                const isActive = ilustracaoSelecionada.adicional === adicionalId;
                const card = document.createElement('div');
                card.className = `service-card ${isActive ? 'active' : ''}`;
                card.dataset.id = adicionalId;
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => selecionarAdicionalIlustracao(adicionalId));

                const thumbnailHTML = image ? `<img class="service-thumb-img" src="${image}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22180%22%3E%3Crect width=%22300%22 height=%22180%22 fill=%22%23ccc%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESem%20Imagem%3C/text%3E%3C/svg%3E';">` : '';

                const price = adicionalId === 'nenhum' ? 0 : (allPrices[adicionalId] || 0);

                card.innerHTML = `
                    <div class="service-thumbnail">${thumbnailHTML}</div>
                    <div class="service-content">
                        <h3>${getTranslation(title)}</h3>
                        <p class="service-price">R$ ${price.toFixed(2).replace('.', ',')}</p>
                        <span class="service-desc">${desc}</span>
                    </div>
                `;
                adicionaiscont.appendChild(card);
            });
        } else {
            adicionaisgroup.style.display = 'none';
        }
    }
}

function getTranslation(text) {
    
    const translations_config = {
        pt: {
            'Arte Estilo Anime': 'Arte Estilo Anime',
            'Arte Estilo Cartoon': 'Arte Estilo Cartoon',
            'Arte Estilo Pixel Art': 'Arte Estilo Pixel Art',
            'Arte Estilo Chibi': 'Arte Estilo Chibi',
            'Arte Estilo Vetorial': 'Arte Estilo Vetorial',
            'Personagem perfil/busto': 'Personagem perfil/busto',
            'Personagem corpo inteiro': 'Personagem corpo inteiro',
            'Personagem token RPG': 'Personagem token RPG',
            'Esboço rápido': 'Esboço rápido',
            'Story board': 'Story board',
            'Sem adicionais': 'Sem adicionais',
            'Arte Animada': 'Arte Animada'
        },
        en: {
            'Arte Estilo Anime': 'Anime Art Style',
            'Arte Estilo Cartoon': 'Cartoon Art Style',
            'Arte Estilo Pixel Art': 'Pixel Art Style',
            'Arte Estilo Chibi': 'Chibi Art Style',
            'Arte Estilo Vetorial': 'Vector Art Style',
            'Personagem perfil/busto': 'Character Profile/Bust',
            'Personagem corpo inteiro': 'Full Body Character',
            'Personagem token RPG': 'RPG Token Character',
            'Esboço rápido': 'Quick Sketch',
            'Story board': 'Story Board',
            'Sem adicionais': 'No Addons',
            'Arte Animada': 'Animated Art'
        }
    };

    const lang = currentLanguage || 'pt';
    return translations_config[lang] && translations_config[lang][text] ? translations_config[lang][text] : text;
}

function selecionarEstiloIlustracao(estiloId) {
    ilustracaoSelecionada.estilo = estiloId;
    ilustracaoSelecionada.tipo = null;
    ilustracaoSelecionada.adicional = null;
    renderilustracaoConfigurador();
}

function selecionarTipoIlustracao(tipoId) {
    ilustracaoSelecionada.tipo = tipoId;
    ilustracaoSelecionada.adicional = null;
    renderilustracaoConfigurador();
    mostrarResumoIlustracao();
}

function selecionarAdicionalIlustracao(adicionalId) {
    ilustracaoSelecionada.adicional = adicionalId;
    renderilustracaoConfigurador();
    mostrarResumoIlustracao();
}

function mostrarResumoIlustracao() {
    const resumoBox = document.getElementById('ilustracao-resumo');
    const resumoTexto = document.getElementById('ilustracao-resumo-texto');
    const resumoPreco = document.getElementById('ilustracao-resumo-preco');
    const btnContratar = document.getElementById('ilustracao-btn-contratar');

    if (!ilustracaoSelecionada.estilo || !ilustracaoSelecionada.tipo || !ilustracaoSelecionada.adicional) {
        resumoBox.style.display = 'none';
        return;
    }

    const estiloData = ilustracaoDigitalServices.find(s => s.id === ilustracaoSelecionada.estilo);
    const tipoData = ilustracaoDigitalServices.find(s => s.id === ilustracaoSelecionada.tipo);

    const estiloTitle = estiloData ? estiloData.title : '';
    const tipoTitle = tipoData ? tipoData.title : '';

    let priceEstilo = allPrices[ilustracaoSelecionada.estilo] || 0;
    let priceBase = allPrices[ilustracaoSelecionada.tipo] || 0;
    let priceAdicional = ilustracaoSelecionada.adicional === 'artmotion' ? allPrices['artmotion'] : 0;
    let totalPrice = priceEstilo + priceBase + priceAdicional;

    let resumoText = `${getTranslation(estiloTitle)} - ${getTranslation(tipoTitle)}`;
    if (ilustracaoSelecionada.adicional !== 'nenhum') {
        let adicionalTitle = 'Arte Animada';
        if (ilustracaoSelecionada.adicional === 'artmotion') {
            const motionData = ilustracaoDigitalServices.find(s => s.id === 'intro_animada');
            adicionalTitle = motionData ? motionData.title : 'Arte Animada';
        }
        resumoText += ` + ${getTranslation(adicionalTitle)}`;
    }

    const priceFormatted = currentLanguage === 'en' ? totalPrice.toFixed(2) : totalPrice.toFixed(2).replace('.', ',');

    resumoTexto.textContent = resumoText;
    resumoPreco.innerHTML = `<strong>R$ ${priceFormatted}</strong>`;

    const whatsappMsg = encodeURIComponent(
        `Olá, gostaria de solicitar um orçamento para uma ilustração digital com as seguintes características:\n\n*Estilo:* ${getTranslation(estiloTitle)}\n*Tipo:* ${getTranslation(tipoTitle)}\n*Adicionais:* ${ilustracaoSelecionada.adicional === 'nenhum' ? 'Nenhum' : 'Arte Animada'}\n*Preço base:* R$ ${priceFormatted}`
    );
    btnContratar.href = `https://wa.me/5511963208691?text=${whatsappMsg}`;

    resumoBox.style.display = 'block';
}

function renderilustracaoDigitalServices() {
    
    renderilustracaoConfigurador();
}

let currentLanguage = (window.safeStorage && window.safeStorage.getItem('userLang')) || (typeof localStorage !== 'undefined' ? localStorage.getItem('userLang') : null) || 'pt';
const body = document.body;
const container = document.getElementById('onboarding-container');
const sidebar = document.getElementById('settings-sidebar');
const backdrop = document.getElementById('settings-backdrop');
const settingsBtn = document.getElementById('btn-settings');
const closeSettingsBtn = document.getElementById('close-settings-btn');

function translatePage() {
    document.documentElement.lang = currentLanguage;
    const elements = document.querySelectorAll('[data-key]');
    elements.forEach(element => {
        const key = element.dataset.key;
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });

    document.querySelectorAll('.section-title').forEach(el => {
        const section = el.closest('section');
        if (section && translations[currentLanguage] && translations[currentLanguage][section.id]) {
            el.textContent = translations[currentLanguage][section.id];
        }
    });

    document.querySelectorAll('.main-nav a').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#')) {
            const id = href.replace('#', '');
            if (translations[currentLanguage] && translations[currentLanguage][id]) a.textContent = translations[currentLanguage][id];
        } else if (href.includes('/posts')) {
            if (translations[currentLanguage] && translations[currentLanguage]['todos-posts']) a.textContent = translations[currentLanguage]['todos-posts'];
        }
    });

    document.querySelectorAll('.mobile-nav-links a').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#')) {
            const id = href.replace('#', '');
            if (translations[currentLanguage] && translations[currentLanguage][id]) a.textContent = translations[currentLanguage][id];
        } else if (href.includes('/posts')) {
            if (translations[currentLanguage] && translations[currentLanguage]['todos-posts']) a.textContent = translations[currentLanguage]['todos-posts'];
        }
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput && translations[currentLanguage] && translations[currentLanguage]['buscar-placeholder']) {
        searchInput.placeholder = translations[currentLanguage]['buscar-placeholder'];
    }

    const onboardingTitle = document.querySelector('.onboarding-title');
    if (onboardingTitle && translations[currentLanguage] && translations[currentLanguage]['titulo']) onboardingTitle.textContent = translations[currentLanguage]['titulo'];
    const onboardingSubtitle = document.querySelector('.onboarding-subtitle');
    if (onboardingSubtitle && translations[currentLanguage] && translations[currentLanguage]['subtitulo']) onboardingSubtitle.textContent = translations[currentLanguage]['subtitulo'];
    const stepLang = document.querySelector('#step-language p');
    if (stepLang && translations[currentLanguage] && translations[currentLanguage]['escolha-idioma']) stepLang.textContent = translations[currentLanguage]['escolha-idioma'];
    const stepTheme = document.querySelector('#step-theme p');
    if (stepTheme && translations[currentLanguage] && translations[currentLanguage]['escolha-tema']) stepTheme.textContent = translations[currentLanguage]['escolha-tema'];
    const note = document.querySelector('#step-theme .note');
    if (note && translations[currentLanguage] && translations[currentLanguage]['aviso-tema']) note.textContent = translations[currentLanguage]['aviso-tema'];

    const contato = document.querySelector('#contato h2');
    if (contato && translations[currentLanguage] && translations[currentLanguage]['contato']) contato.textContent = translations[currentLanguage]['contato'];
    const faleBtn = document.querySelector('.footer-section .btn-primary');
    if (faleBtn && translations[currentLanguage] && translations[currentLanguage]['fale-whatsapp']) faleBtn.textContent = translations[currentLanguage]['fale-whatsapp'];

    try { if (typeof renderDesignServices === 'function') renderDesignServices(); } catch (e) { console.error('[RENDER] renderDesignServices error:', e); }
    try { if (typeof renderVideoServices === 'function') renderVideoServices(); } catch (e) { console.error('[RENDER] renderVideoServices error:', e); }
    try { if (typeof rendermotionGraphicsServices === 'function') rendermotionGraphicsServices(); } catch (e) { console.error('[RENDER] rendermotionGraphicsServices error:', e); }
    try { if (typeof renderilustracaoDigitalServices === 'function') renderilustracaoDigitalServices(); } catch (e) { console.error('[RENDER] renderilustracaoDigitalServices error:', e); }
    
    try { if (typeof renderCustomProducts === 'function') renderCustomProducts(); } catch (e) { console.error('[RENDER] renderCustomProducts error:', e); }

    try { if (typeof renderTagPills === 'function') renderTagPills(); } catch (e) { console.error('[RENDER] renderTagPills error:', e); }

    const grid = document.querySelector('.post-grid');
    if (grid && grid.children.length > 0) {
        try { renderBlog(); } catch (e) { console.error('[RENDER] renderBlog error:', e); }
    }

    try {
        if (typeof enableServiceGridMobileScrollHints === 'function') {
            
            setTimeout(enableServiceGridMobileScrollHints, 120);
        }
    } catch (e) { console.error('[RENDER] enableServiceGridMobileScrollHints error:', e); }
}

function enableServiceGridMobileScrollHints() {
    
    const grids = document.querySelectorAll('[id$="-services-grid"], [id$="-packages-grid"]');
    if (!grids || grids.length === 0) return;

    grids.forEach(grid => {
        
        grid.classList.add('mobile-h-scroll');

        if (getComputedStyle(grid).position === 'static') grid.style.position = 'relative';

        const existing = grid.querySelector('.swipe-hint');
        if (existing) existing.remove();

        if (grid.scrollWidth > grid.clientWidth + 10) {
            const hint = document.createElement('div');
            hint.className = 'swipe-hint';
            hint.innerHTML = `<span class="swipe-text">${(translations[currentLanguage] && translations[currentLanguage]['swipe']) ? translations[currentLanguage]['swipe'] : 'Swipe'}</span> <span class="swipe-chevron"><i class="fas fa-chevron-right"></i></span>`;
            grid.appendChild(hint);

            const hideHint = () => {
                hint.style.opacity = '0';
                setTimeout(() => { try { hint.remove(); } catch (e) { } }, 300);
                grid.removeEventListener('touchstart', hideHint);
                grid.removeEventListener('scroll', hideHint);
            };

            grid.addEventListener('touchstart', hideHint, { once: true });
            grid.addEventListener('scroll', hideHint, { once: true });
        }
    });
}

function selectLanguage(lang) {
    currentLanguage = lang;
    if (window.safeStorage) { window.safeStorage.setItem('userLang', lang); } else { try { localStorage.setItem('userLang', lang); } catch (e) { } }
    translatePage();
    if (container) container.classList.add('show-theme');
}

function finalizarOnboarding() {
    body.classList.remove('modo-onboarding');
    if (window.safeStorage) { window.safeStorage.setItem('onboardingFeito', 'sim'); } else { try { localStorage.setItem('onboardingFeito', 'sim'); } catch (e) { } }
}

function openSettings() {
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) {
        backdrop.style.display = "block";
        setTimeout(() => backdrop.classList.add('visible'), 10);
    }
}

function closeSettings() {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) {
        backdrop.classList.remove('visible');
        setTimeout(() => backdrop.style.display = "none", 300);
    }
}

function toggleSocial() {
    const socialLinks = document.getElementById('social-links');
    if (socialLinks) socialLinks.classList.toggle('hidden');
}

function createCard(post) {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    let isDragging = false;

    card.innerHTML = `
        <img src="${escapeHtml(post.image)}" class="carousel-img" alt="${escapeHtml(post.title)}" draggable="false" loading="lazy" decoding="async">
        <div class="carousel-info">
            <h4 class="carousel-title">${escapeHtml(post.title)}</h4>
            <span class="carousel-date">${new Date(post.date).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-BR')}</span>
        </div>
    `;

    let startPos = 0;
    card.addEventListener('mousedown', (e) => {
        startPos = e.pageX;
        isDragging = false;
    });

    card.addEventListener('mousemove', (e) => {
        if (Math.abs(e.pageX - startPos) > 5) {
            isDragging = true;
        }
    });

    card.addEventListener('click', (e) => {
        if (!isDragging && post.link) {
            const safeLink = sanitizeUrl(post.link);
            if (safeLink) window.location.href = safeLink;
        }
        isDragging = false;
    });

    card.style.cursor = 'pointer';
    return card;
}

function renderAllCarousels() {
    const carousels = [
        ['carousel-recentes', null],
        ['carousel-design-grafico', 'design-grafico'],
        ['carousel-edicao-video', 'edicao-de-video'],
        ['carousel-motion', 'motion'],
        ['carousel-ilustracao', 'ilustracao-digital'],
        ['carousel-impressos', 'impressos']
    ];

    carousels.forEach(([id, filterCat]) => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = '';
            renderCarousel(id, filterCat);
        }
    });
}

function renderCarousel(containerId, filterCategory = null) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    if (container._odysseeCarouselRAF) {
        cancelAnimationFrame(container._odysseeCarouselRAF);
        container._odysseeCarouselRAF = null;
    }

    const effectiveCategory = filterCategory !== null ? filterCategory : (container.dataset.category || null);
    const direction = container.dataset.direction || 'clockwise'; // 'clockwise' (default) | 'counterclockwise'
    const mode = container.dataset.mode || 'infinite'; // 'infinite' (default) | 'finite' | 'pingpong'
    const cardsCount = Math.max(1, parseInt(container.dataset.cardsCount || '8', 10) || 8);
    const visibleCards = parseFloat(container.dataset.visibleCards || '0') || 0;
    const baseSpeed = Math.max(0, parseFloat(container.dataset.speed ?? '0.2'));

    let filteredPosts = Array.isArray(allPosts) ? [...allPosts].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
    if (effectiveCategory) {
        filteredPosts = filteredPosts.filter(post =>
            post.categories && post.categories.includes(effectiveCategory)
        );
    }

    if (filteredPosts.length === 0 && Array.isArray(allPosts) && allPosts.length > 0) {
        filteredPosts = [...allPosts].slice(0, cardsCount);
    }

    const basePosts = filteredPosts.slice(0, cardsCount);

    container.innerHTML = '';
    const track = document.createElement('div');
    track.className = 'carousel-track';

    const postsToRender = (mode === 'infinite' && basePosts.length > 0)
        ? [...basePosts, ...basePosts, ...basePosts]
        : [...basePosts];

    postsToRender.forEach(post => {
        const cardEl = createCard(post);
        if (visibleCards > 0) {
            const gapPx = 25;
            cardEl.style.flex = `0 0 calc((100% - ${(visibleCards - 1) * gapPx}px) / ${visibleCards})`;
            cardEl.style.maxWidth = `calc((100% - ${(visibleCards - 1) * gapPx}px) / ${visibleCards})`;
        }
        track.appendChild(cardEl);
    });
    container.appendChild(track);

    let position = 0;
    let speed = baseSpeed;
    let dirSign = direction === 'counterclockwise' ? 1 : -1;
    let isDown = false;
    let isHovering = false;
    let initialized = false;
    let singleSetWidth = 0;
    let finiteStopped = false;

    function animate() {
        const currentDirection = container.dataset.direction || direction;
        const currentMode = container.dataset.mode || mode;
        const currentSpeed = Math.max(0, parseFloat(container.dataset.speed ?? speed));
        speed = currentSpeed;

        const totalWidth = track.scrollWidth;
        const containerWidth = container.clientWidth || 1;

        if (currentMode === 'infinite') {
            let calculatedWidth = totalWidth / 3;
            try {
                const children = track.children;
                const baseLen = basePosts.length;
                if (baseLen > 0 && children.length >= baseLen * 2) {
                    const startB = children[baseLen];
                    const startC = children[baseLen * 2];
                    const rectB = startB.getBoundingClientRect();
                    const rectC = startC.getBoundingClientRect();
                    calculatedWidth = Math.round(rectC.left - rectB.left);
                }
            } catch (e) { }

            singleSetWidth = calculatedWidth;

            if (!initialized && totalWidth > 0 && singleSetWidth > 0) {
                position = -singleSetWidth;
                initialized = true;
            }

            if (!isDown && !isHovering && initialized) {
                const step = (currentDirection === 'counterclockwise' ? 1 : -1) * speed;
                position += step;

                if (position <= -(singleSetWidth * 2)) {
                    position += singleSetWidth;
                } else if (position >= 0) {
                    position -= singleSetWidth;
                }
            }
        } else {
            // Finite or Ping-Pong bounds
            const maxNegative = -Math.max(0, totalWidth - containerWidth);
            if (!initialized && totalWidth > 0) {
                position = currentDirection === 'counterclockwise' ? maxNegative : 0;
                dirSign = currentDirection === 'counterclockwise' ? 1 : -1;
                initialized = true;
            }

            if (!isDown && !isHovering && initialized && !finiteStopped) {
                position += dirSign * speed;

                if (position <= maxNegative) {
                    position = maxNegative;
                    if (currentMode === 'finite') {
                        finiteStopped = true;
                    } else if (currentMode === 'pingpong') {
                        dirSign = 1;
                    }
                } else if (position >= 0) {
                    position = 0;
                    if (currentMode === 'finite') {
                        finiteStopped = true;
                    } else if (currentMode === 'pingpong') {
                        dirSign = -1;
                    }
                }
            }
        }

        track.style.transform = `translateX(${position}px)`;
        container._odysseeCarouselRAF = requestAnimationFrame(animate);
    }

    const totalWidth = track.scrollWidth;
    if (mode === 'infinite') {
        let initialSingleWidth = totalWidth / 3;
        if (totalWidth > 0 && initialSingleWidth > 0) {
            position = -initialSingleWidth;
            initialized = true;
        }
    }
    container._odysseeCarouselRAF = requestAnimationFrame(animate);

    let dragStartX = 0;
    let dragStartPosition = 0;

    function handleDragStart(clientX) {
        isDown = true;
        isHovering = true;
        finiteStopped = false;
        dragStartX = clientX;
        dragStartPosition = position;
        track.style.cursor = 'grabbing';
        track.classList.add('active');
    }

    function handleDragMove(clientX) {
        if (!isDown) return;
        const deltaX = clientX - dragStartX;
        position = dragStartPosition + deltaX;
    }

    function handleDragEnd() {
        if (!isDown) return;
        isDown = false;
        track.style.cursor = 'grab';
        track.classList.remove('active');
        setTimeout(() => { isHovering = false; }, 500);
    }

    track.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleDragStart(e.clientX);
    });

    const throttledMouseMove = throttle((clientX) => {
        if (isDown) {
            handleDragMove(clientX);
        }
    }, 16);

    window.addEventListener('mousemove', (e) => {
        throttledMouseMove(e.clientX);
    });

    window.addEventListener('mouseup', () => {
        handleDragEnd();
    });

    track.addEventListener('touchstart', (e) => {
        handleDragStart(e.touches[0].clientX);
    }, { passive: true });

    const throttledTouchMove = throttle((clientX) => {
        if (isDown) {
            handleDragMove(clientX);
        }
    }, 16);

    track.addEventListener('touchmove', (e) => {
        throttledTouchMove(e.touches[0].clientX);
    }, { passive: true });

    track.addEventListener('touchend', () => {
        handleDragEnd();
    }, { passive: true });

    track.addEventListener('mouseenter', () => {
        if (!isDown) isHovering = true;
    });

    track.addEventListener('mouseleave', () => {
        if (!isDown) isHovering = false;
    });
}
window.odysseeInitCarousel = renderCarousel;


const mainHeaderEl = document.querySelector('.main-header');
let lastHeaderScrolled = null;
window.addEventListener('scroll', () => {
    if (!mainHeaderEl) return;
    const isScrolled = window.scrollY > 50;
    if (isScrolled !== lastHeaderScrolled) {
        lastHeaderScrolled = isScrolled;
        if (isScrolled) {
            mainHeaderEl.classList.add('scrolled');
            mainHeaderEl.classList.remove('transparent');
        } else {
            mainHeaderEl.classList.add('transparent');
            mainHeaderEl.classList.remove('scrolled');
        }
    }
}, { passive: true });

if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSettings();
    });
}
if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
if (backdrop) backdrop.addEventListener('click', closeSettings);

const btnLight = document.getElementById('btn-light');
const btnDark = document.getElementById('btn-dark');
const setLight = document.getElementById('set-theme-light');
const setDark = document.getElementById('set-theme-dark');
const colorDots = document.querySelectorAll('.color-dot');

function applyTheme(theme) {
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${theme}`);
    if (window.safeStorage) { window.safeStorage.setItem('userTheme', theme); } else { try { localStorage.setItem('userTheme', theme); } catch (e) { } }
}

if (btnLight) btnLight.addEventListener('click', () => applyTheme('light'));
if (btnDark) btnDark.addEventListener('click', () => applyTheme('dark'));
if (setLight) setLight.addEventListener('click', () => applyTheme('light'));
if (setDark) setDark.addEventListener('click', () => applyTheme('dark'));

if (setLight && !setLight.querySelector('svg')) {
    setLight.insertAdjacentHTML('afterbegin', '<svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM4 10.5H1v3h3zm9-9.95h-3v3.95h3zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5v3h3v-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h3v-3.95h-3zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41z"/></svg>');
}
if (setDark && !setDark.querySelector('svg')) {
    setDark.insertAdjacentHTML('afterbegin', '<svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>');
}

document.querySelectorAll('#mobile-menu-overlay .mobile-menu-footer .btn-mobile-faq, #mobile-menu-overlay .mobile-menu-footer .btn-mobile-settings').forEach(el => {
    if (!el.querySelector('svg')) {
        
        if (el.classList.contains('btn-mobile-settings')) {
            el.insertAdjacentHTML('afterbegin', '<svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.11-.65l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.066 7.066 0 00-1.62-.94l-.36-2.54A.5.5 0 0013.4 2h-2.8a.5.5 0 00-.5.42l-.36 2.54c-.57.21-1.11.5-1.62.94L5.6 5.96a.5.5 0 00-.6.22L3.08 9.5a.5.5 0 00.11.65l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L3.19 15.2a.5.5 0 00-.11.65l1.92 3.32c.14.24.44.34.68.22l2.39-.96c.5.44 1.05.8 1.62.94l.36 2.54c.05.28.28.48.5.48h2.8c.28 0 .46-.2.5-.48l.36-2.54c.57-.21 1.11-.5 1.62-.94l2.39.96c.24.12.54.02.68-.22l1.92-3.32a.5.5 0 00-.11-.65l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z"/></svg>');
        } else if (el.classList.contains('btn-mobile-faq')) {
            el.insertAdjacentHTML('afterbegin', '<svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm.25 17h-1.5v-1.5h1.5V19zm1.34-7.03c-.24.24-.41.48-.53.71-.18.35-.27.73-.26 1.21h-1.5c0-.84.21-1.56.63-2.16.25-.35.6-.7 1.03-1.06.31-.25.55-.49.72-.73.17-.25.26-.56.26-.94 0-.6-.22-1.1-.66-1.49-.44-.4-1.02-.6-1.74-.6-1.02 0-1.93.38-2.72 1.13l-.96-1.11C9.32 6.1 10.68 5.4 12 5.4c1.06 0 1.87.34 2.45 1.03.58.69.87 1.53.87 2.5 0 .86-.24 1.56-.74 2.03z"/></svg>');
        }
    }
});

console.debug('theme icons:', { setLightHasSVG: !!(setLight && setLight.querySelector('svg')), setDarkHasSVG: !!(setDark && setDark.querySelector('svg')) });
document.querySelectorAll('.color-dot, .color-option-btn').forEach(dot => {
    dot.addEventListener('click', (e) => {
        const target = e.currentTarget;
        let newColor = target.dataset.color;
        if (!newColor && target.querySelector('.color-dot')) {
            const innerDot = target.querySelector('.color-dot');
            newColor = innerDot.classList[1];
        } else if (!newColor && target.classList.contains('color-dot')) {
            newColor = target.classList[1];
        }
        if (newColor) {
            body.classList.remove('color-blue', 'color-purple', 'color-red', 'color-yellow', 'color-green');
            body.classList.add(`color-${newColor}`);
            if (window.safeStorage) { window.safeStorage.setItem('userColor', newColor); } else { try { localStorage.setItem('userColor', newColor); } catch (e) { } }
        }
    });
});

document.getElementById('set-lang-pt')?.addEventListener('click', () => {
    currentLanguage = 'pt';
    if (window.safeStorage) { window.safeStorage.setItem('userLang', 'pt'); } else { try { localStorage.setItem('userLang', 'pt'); } catch (e) { } }
    translatePage();
    
    try { window.dispatchEvent(new CustomEvent('odyssee-storage', { detail: { key: 'userLang', value: 'pt' } })); } catch (e) { }
});
document.getElementById('set-lang-en')?.addEventListener('click', () => {
    currentLanguage = 'en';
    if (window.safeStorage) { window.safeStorage.setItem('userLang', 'en'); } else { try { localStorage.setItem('userLang', 'en'); } catch (e) { } }
    translatePage();
    
    try { window.dispatchEvent(new CustomEvent('odyssee-storage', { detail: { key: 'userLang', value: 'en' } })); } catch (e) { }
});

const socialBtn = document.getElementById('social-media-btn');
if (socialBtn) socialBtn.addEventListener('click', toggleSocial);

const btnMobile = document.getElementById('btn-mobile-menu');
const mobileMenu = document.getElementById('mobile-menu-overlay');
const closeMobile = document.getElementById('close-mobile-menu');
const btnSettingsMobile = document.getElementById('btn-settings-mobile');

console.debug('UI elements:', {
    settingsBtn: !!settingsBtn,
    btnMobile: !!btnMobile,
    btnSettingsMobile: !!btnSettingsMobile,
    btnFaq: !!document.getElementById('btn-faq')
});

if (btnMobile) btnMobile.addEventListener('click', () => mobileMenu.classList.add('open'));
if (closeMobile) closeMobile.addEventListener('click', () => mobileMenu.classList.remove('open'));
document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});
if (btnSettingsMobile) {
    btnSettingsMobile.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        setTimeout(openSettings, 300);
    });
}

window.addEventListener('error', (ev) => { try { console.error('[GLOBAL ERROR]', ev.message || ev.error || ev); } catch (e) { } });
window.addEventListener('unhandledrejection', (ev) => { try { console.error('[UNHANDLED REJECTION]', ev.reason); } catch (e) { } });

document.addEventListener('click', function (e) {
    const link = e.target.closest('a[target="_blank"]');
    if (link && !link.getAttribute('rel')) {
        link.setAttribute('rel', 'noopener noreferrer');
    } else if (link && link.getAttribute('rel') && !link.getAttribute('rel').includes('noreferrer')) {
        link.setAttribute('rel', link.getAttribute('rel') + ' noreferrer');
    }
}, true);

translatePage();

function renderBlog(searchTerm = '', categoryFilter = '') {
    const grid = document.querySelector('.post-grid');
    if (!grid) return; 

    grid.innerHTML = ''; 

    const filtered = allPosts.filter(post => {
        
        const textMatch = searchTerm === '' ||
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.categories && post.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())));

        const catMatch = categoryFilter === '' ||
            (post.categories && post.categories.includes(categoryFilter));

        return textMatch && catMatch;
    });

    if (filtered.length === 0) {
        const noResults = translations[currentLanguage] && translations[currentLanguage]['no-results'] ? translations[currentLanguage]['no-results'] : 'Nenhum projeto encontrado com esses termos.';
        const p = document.createElement('p');
        p.style.gridColumn = '1/-1';
        p.style.textAlign = 'center';
        p.style.opacity = '0.7';
        p.style.fontSize = '1.2rem';
        p.textContent = noResults;
        grid.appendChild(p);
        return;
    }

    filtered.forEach(post => {
        
        if (!post || !post.image || !post.date || !post.title) {
            console.warn('[BLOG] Post inválido:', post);
            return;
        }

        const card = document.createElement('div');
        card.className = 'post-card';

        const dateStr = new Date(post.date).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-BR');

        const verDetalhes = translations[currentLanguage]['ver-detalhes'] || 'Ver Detalhes';
        const portfolioText = translations[currentLanguage]['portfolio'] || 'portfolio';

        const categoriesTranslated = post.categories.map(cat => {
            const categoryKey = wpSlugToCategoryKey[cat] || cat;
            return translations[currentLanguage][categoryKey] ||
                cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        });

        let subCategoriesTranslated = [];
        if (post.subCategories && post.subCategories.length > 0) {
            subCategoriesTranslated = post.subCategories.map(subCat => {
                const subCategoryKey = wpSlugToCategoryKey[subCat] || subCat;
                return translations[currentLanguage][subCategoryKey] ||
                    subCat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            });
        }

        let postTitle = post.title;
        if (currentLanguage === 'en') {
            
            const translatedTitle = getPostTitleTranslation(post.title, post.titleEN);
            if (translatedTitle) {
                postTitle = translatedTitle;
            } else {
                
                console.log(`[TRADUÇÃO] Título não traduzido: "${post.title}" → adicione em postTitleTranslations ou no custom field 'post_title_en'`);
            }
        }

        const excerptText = extractExcerpt(post.content, 150);

        const categoriesHTML = categoriesTranslated.map(cat => `<span class="post-category">${escapeHtml(cat)}</span>`).join('');
        const subCategoriesHTML = subCategoriesTranslated.map(subCat => `<span class="post-sub-category">${escapeHtml(subCat)}</span>`).join('');

        card.innerHTML = `
            <img src="${escapeHtml(post.image)}" class="post-thumbnail" alt="${escapeHtml(postTitle)}">
            <div class="post-content">
                <div class="post-categories">
                    ${categoriesHTML}
                    ${subCategoriesHTML}
                </div>
                <h3 class="post-title">${escapeHtml(postTitle)}</h3>
                <p class="post-excerpt">${escapeHtml(excerptText)}</p>
                <button class="btn-primary">${verDetalhes}</button>
            </div>
        `;

        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            if (post.link) {
                const safeLink = sanitizeUrl(post.link);
                if (safeLink) window.location.href = safeLink;
            }
        });

        grid.appendChild(card);
    });
}

function renderTagPills() {
    const suggestedTags = document.querySelector('.suggested-tags');
    if (!suggestedTags) return;

    const existingPills = suggestedTags.querySelectorAll('.tag-pill');
    existingPills.forEach(pill => pill.remove());

    const categories = [
        { id: '', label: 'todos' },
        { id: 'design-grafico', label: 'design-grafico' },
        { id: 'edicao-de-video', label: 'edicao-video' },
        { id: 'motion', label: 'motion' },
        { id: 'ilustracao-digital', label: 'ilustracao' },
        { id: 'impressos', label: 'impressos' }
    ];

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'tag-pill';
        btn.dataset.tag = cat.id;

        const translation = translations[currentLanguage][cat.label] || cat.label;
        btn.textContent = translation;

        suggestedTags.appendChild(btn);

        btn.addEventListener('click', () => {
            
            document.querySelectorAll('.tag-pill').forEach(b => b.style.backgroundColor = '');

            btn.style.backgroundColor = 'var(--color-accent)';
            btn.style.color = '#fff';

            renderBlog('', cat.id);
        });
    });
}

const searchInput = document.getElementById('search-input');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        let searchValue = e.target.value;

        searchValue = sanitizeSearchInput(searchValue);

        if (searchValue !== e.target.value) {
            e.target.value = searchValue;
        }

        renderBlog(searchValue);
    });
}

function detectFontAwesomeAndEnableSvgFallback() {
    
    const temp = document.createElement('i');
    temp.className = 'fas fa-star test-fa';
    temp.style.position = 'absolute';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    let faAvailable = false;
    try {
        const content = window.getComputedStyle(temp, '::before').getPropertyValue('content');
        if (content && content !== 'none' && content !== '""') faAvailable = true;
    } catch (e) {
        
        faAvailable = false;
    }
    temp.remove();

    if (!faAvailable) {
        
        document.querySelectorAll('.package-icon-svg').forEach(svg => {
            svg.style.display = 'inline-flex';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const langPtBtn = document.getElementById('lang-pt');
    const langEnBtn = document.getElementById('lang-en');

    if (langPtBtn) {
        langPtBtn.addEventListener('click', () => selectLanguage('pt'));
    }
    if (langEnBtn) {
        langEnBtn.addEventListener('click', () => selectLanguage('en'));
    }

    const btnContinuar = document.getElementById('btn-continuar');
    if (btnContinuar) {
        btnContinuar.addEventListener('click', finalizarOnboarding);
    }

    renderTagPills();
    detectFontAwesomeAndEnableSvgFallback();
});

function initUI() {
    if (!allPosts || allPosts.length === 0) return;

    try { renderAllCarousels(); } catch (e) { console.error('[UI] Carousel error:', e); }
    try { renderTagPills(); } catch (e) { }

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const categoriaParam = urlParams.get('categoria');
        if (categoriaParam) {
            document.querySelectorAll('.tag-pill').forEach(pill => {
                if (pill.dataset.tag === categoriaParam) {
                    pill.style.backgroundColor = 'var(--color-accent)';
                    pill.style.color = '#fff';
                }
            });
            renderBlog('', categoriaParam);
        } else {
            renderBlog();
        }
    } catch (e) { }
}

function initHeroTilt() {
    if (typeof VanillaTilt !== 'undefined') {
        const el = document.querySelector('.hero-logo-container');
        if (el && !el.vanillaTilt) {
            VanillaTilt.init(el, {
                reverse: true,
                max: 20,
                speed: 150,
                scale: 1.06,
                "full-page-listening": true,
                gyroscope: true,
                gyroscopeMinAngleX: -25,
                gyroscopeMaxAngleX: 25,
                gyroscopeMinAngleY: -25,
                gyroscopeMaxAngleY: 25
            });
        }
    }
}

function initBannerParallax() {
    const banner = document.querySelector('.category-banner-wrapper');
    if (!banner) return;
    let ticking = false;
    banner.addEventListener('mousemove', (e) => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const rect = banner.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
                const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
                const svg = banner.querySelector('.dg-banner-svg');
                if (svg) {
                    svg.style.transform = `perspective(1000px) rotateX(${-y * 0.4}deg) rotateY(${x * 0.4}deg)`;
                }
                ticking = false;
            });
            ticking = true;
        }
    });
    banner.addEventListener('mouseleave', () => {
        const svg = banner.querySelector('.dg-banner-svg');
        if (svg) {
            svg.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            svg.style.transform = '';
            setTimeout(() => {
                if (svg) svg.style.transition = '';
            }, 600);
        }
    });
}

function initCategoryBannerAnimations() {
    const banners = document.querySelectorAll('.category-banner-wrapper');
    if (!banners.length) return;

    let ticking = false;

    function checkVisibility() {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        banners.forEach(b => {
            const svg = b.querySelector('.dg-banner-svg');
            if (!svg) return;
            const rect = b.getBoundingClientRect();
            
            const isCompletelyOutOfView = rect.bottom < -30 || rect.top > vh + 30;
            const isExitingTop = rect.bottom > 0 && rect.bottom < vh * 0.16;
            const isExitingBottom = rect.top < vh && rect.top > vh * 0.88;
            const isNearExit = isExitingTop || isExitingBottom;

            if (isCompletelyOutOfView) {
                svg.classList.remove('dg-in-view');
                svg.classList.remove('dg-exiting');
            } else if (isNearExit) {
                if (svg.classList.contains('dg-in-view')) {
                    svg.classList.remove('dg-in-view');
                    svg.classList.add('dg-exiting');
                }
            } else {
                svg.classList.remove('dg-exiting');
                svg.classList.add('dg-in-view');
            }
        });
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(checkVisibility);
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener('resize', () => {
        if (!ticking) {
            requestAnimationFrame(checkVisibility);
            ticking = true;
        }
    }, { passive: true });

    checkVisibility();
}

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initHeroTilt();
    initBannerParallax();
    initCategoryBannerAnimations();

    fetchRealPosts().then(() => {
        initUI();
    }).catch(err => {
    });

    try { detectFontAwesomeAndEnableSvgFallback(); } catch(e){}
});

window.addEventListener('load', () => {
    initUI();
    initHeroTilt();
    initBannerParallax();
    initCategoryBannerAnimations();
});