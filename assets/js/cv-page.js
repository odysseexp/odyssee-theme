

const profileImages = {
    'light-blue': 'http://localhost:8881/wp-content/uploads/2025/11/harley-the-sky.webp',
    'light-purple': 'http://localhost:8881/wp-content/uploads/2025/11/harley-purpur.webp',
    'light-red': 'http://localhost:8881/wp-content/uploads/2025/11/harley-crimson.webp',
    'light-yellow': 'http://localhost:8881/wp-content/uploads/2025/11/harley-oak.webp',
    'light-green': 'http://localhost:8881/wp-content/uploads/2025/11/harley-greenfroglight.webp',
    'dark-blue': 'http://localhost:8881/wp-content/uploads/2025/11/harley-nightsky.webp',
    'dark-purple': 'http://localhost:8881/wp-content/uploads/2025/11/harley-netherportal.webp',
    'dark-red': 'http://localhost:8881/wp-content/uploads/2025/11/harley-redstone.webp',
    'dark-yellow': 'http://localhost:8881/wp-content/uploads/2025/11/harley-honeycomb.webp',
    'dark-green': 'http://localhost:8881/wp-content/uploads/2025/11/harley-grass-alpha.webp'
};

function updateProfileImage() {
    const body = document.body;
    const profileImg = document.getElementById('profile-image');
    
    if (!profileImg) return;

    let theme = 'light';
    if (body.classList.contains('theme-dark')) {
        theme = 'dark';
    }

    let color = 'blue'; 
    const colors = ['blue', 'purple', 'red', 'yellow', 'green'];
    for (const c of colors) {
        if (body.classList.contains(`color-${c}`)) {
            color = c;
            break;
        }
    }

    const key = `${theme}-${color}`;

    if (profileImages[key]) {
        profileImg.src = profileImages[key];
    }
}

const cvTranslations = {
    pt: {
        'cv-title': 'Designer Gráfico - Ilustrador Digital - Editor de Vídeo',
        'profile-image-alt': 'Renato "Harley" Paiva',
        'cv-intro-1': 'Tenho 24 anos, sou designer gráfico graduado. Atuo principalmente nas áreas de design gráfico, edição de vídeo, ilustração digital e motion design.',
        'cv-intro-2': 'Trabalho bem em equipe, presencialmente ou remotamente. Consigo atender bem a propostas de briefing, lido bem com diferentes tipos de identidade visual e segmentos.',

        'cv-experience-title': 'Experiência profissional',

        'exp-odysseexp-title': 'Designer Gráfico, Editor de Vídeo e Ilustrador Digital | Autônomo',
        'exp-odysseexp-company-title': 'Odyssee Experience',
        'exp-odysseexp-1': 'Desenvolvimento e criação de banners para o blog.',
        'exp-odysseexp-2': 'Redator de matérias e revisor das demais matérias publicadas.',
        'exp-odysseexp-3': 'Auxiliar no desenvolvimento da UX/UI do blog.',
        'exp-odysseexp-4': 'Auxiliar na criação e desenvolvimento da identidade visual do site.',

        'exp-mm-title': 'Designer Gráfico e Redator | Freelance',
        'exp-mm-company-title': 'Mobile Minecraft (O site foi encerrado em 2018)',
        'exp-mm-1': 'Desenvolvimento e criação de banners para o blog.',
        'exp-mm-2': 'Redator de matérias e revisor das demais matérias publicadas.',
        'exp-mm-3': 'Auxiliar no desenvolvimento da UX/UI do blog.',
        'exp-mm-4': 'Auxiliar na criação e desenvolvimento da identidade visual do site.',
        
        'exp-fleury-title': 'Recepcionista | CLT',
        'exp-fleury-company-title': 'Grupo Fleury',
        'exp-fleury-1': 'Atendimento e abertura de ficha de exames médicos.',
        'exp-fleury-2': 'Agendamento de procedimentos médicos laboratoriais.',
        'exp-fleury-3': 'Tratativa comercial com convênios credenciados em planilhas.',
        'exp-fleury-4': 'Treinador de novos trabalhadores para a recepção e abertura de ficha.',
        'exp-fleury-5': 'Armazenador de arquivos da unidade de atendimento.',
        'exp-fleury-6': 'Gestão backoffice e resolução de problemas financeiros em planilhas.',
        
        'exp-anymous-title': 'Designer Gráfico | Estágio',
        'exp-anymous-company-title': 'ANYMOUS (atualmente falida, seguindo apenas com a submarca BioSec Pet.)',
        'exp-anymous-1': 'Criação e elaboração de posts e carrosséis para Instagram.',
        'exp-anymous-2': 'Criação e elaboração de reels para Instagram.',
        'exp-anymous-3': 'Redator e tratamento de fotos de produtos para marketplace.',
        'exp-anymous-4': 'UX/UI do site. Gestão de ícones, símbolos e acessibilidade da página.',
        
        'exp-divterm-title': 'Supervisor de fábrica de corte de letras-caixa | Informal',
        'exp-divterm-company-title': 'Div Term Tecnomoldura',
        'exp-divterm-1': 'Gerar arquivos escalonados e compatíveis para recorte em máquina laser, fio quente e MDF.',
        'exp-divterm-2': 'Elaborar aproveitamento de material em software para recorte em máquinas.',
        'exp-divterm-3': 'Operação de corte laser e de corte a fio quente.',
        'exp-divterm-4': 'Elaborar tipografias e adapta-las para corte em máquinas de acordo com suas limitações.',
        'exp-divterm-5': 'Supervisionar operadores de máquinas para garantir qualidade do recorte e evitar gastos excessivos com matéria-prima.',
        
        'exp-atento-title': 'Especialista em atendimento | CLT',
        'exp-atento-company-title': 'Atento',
        'exp-atento-1': 'Atendimento voz receptivo para clientes do plano do grupo de faculdades Cogna (grupo de faculdades da Anhanguera)',
        'exp-atento-2': 'Atendimento receptivo via WhatsApp e e-mail, 5 telas.',
        'exp-atento-3': 'Sanar dúvidas relativas a faturas, grades de aula, site, campus, contrato e regularizações de débitos.',

        'exp-first-title': 'Designer Gráfico Pleno | Temporário',
        'exp-first-company-title': 'First Publicidade',
        'exp-first-1': 'Criação e elaboração de posts e carrosséis para Instagram de diversas identidades visuais.',
        'exp-first-2': 'Criação de posts para as campanhas políticas de candidatos vereadores e prefeitos do estado de São Paulo.',
        'exp-first-3': 'Branding de posts trends e interativos para redes sociais.',
        'exp-first-4': 'Material offline para campanhas políticas (banners, flyers, adesivos, etc.).',
        
        'exp-neobpo-title': 'Especialista em atendimento | CLT',
        'exp-neobpo-company-title': 'NeoBPO (atualmente NeoHype)',
        'exp-neobpo-1': 'Atendimento receptivo para clientes do plano de saúde Amil.',
        'exp-neobpo-2': 'Agendamento de exames médicos e consultas.',
        'exp-neobpo-3': 'Sanar dúvidas relativas a unidades, agendas, procedimentos médicos.',

        'exp-percons-title': 'Designer Gráfico Jr. | PJ',
        'exp-percons-company-title': 'Percons - Pernamcubo Conservadora',
        'exp-percons-1': 'Criação de artes para posts em redes sociais.',
        'exp-percons-2': 'Redigir documentos internos com a identidade visual da empresa.',
        'exp-percons-3': 'Criar e fechar arquivos para impressos (material offiline).',
        'exp-percons-4': 'Elaborar e criar identidades visuais e logos para marcas.',
        'exp-percons-5': 'Design de apresentações empresariais.',

        'exp-blackco-title': 'Designer Gráfico Pleno | Voluntário',
        'exp-blackco-company-title': 'Black&CO',
        'exp-blackco-1': 'Elaboração de copy-writhing da arte.',
        'exp-blackco-2': 'Elaboração de tema.',
        'exp-blackco-3': 'Criação de artes para carrosséis no Instagram.',

        'cv-education-title': 'Formação e cursos',
        'edu-caution-title': 'Curso - Caution Pontocom',
        'edu-caution-1': 'Curso de informática e inglês',
        'edu-caution-2': '194h/aula',
        'edu-unicid-title': 'Faculdade - UNICID',
        'edu-unicid-1': 'CST em Design Gráfico',
        'edu-unicid-2': '4 semestres',

        'cv-skills-title': 'Idiomas e outras habilidades',
        'lang-reading-title': 'Idiomas - Escrita e Leitura',
        'lang-pt-native': 'Português Brasileiro - Nativo',
        'lang-en-advanced': 'Inglês - Avançado',
        'lang-de-basic': 'Alemão - Básico',
        'lang-speaking-title': 'Idiomas - Comunicação Verbal',
        'lang-pt-native-speaking': 'Português Brasileiro - Nativo',
        'lang-en-intermediate': 'Inglês - Intermediário',
        'lang-de-basic-speaking': 'Alemão - Básico',
        
        'skill-communication-title': 'Comunicação inclusiva e acessível',
        'skill-communication-desc': 'Me comunico de acordo com o perfil de cada pessoa, uso linguajar de uma forma que ela possa entender a mensagem que quero passar e se sentir confortável em se expressar a forma como ela faz normalmente.',
        'skill-tech-title': 'Afinidade tecnológica',
        'skill-tech-desc': 'Isso é algo bem nítido logo abaixo com os softwares e sistemas que eu uso frequentemente. Mas, possuo uma habilidade muito rápida de aprender novos softwares, interfaces, códigos e sistemas operacionais. Mesmo que eu não saiba determinada ferramenta, eu consigo aprender muito rapidamente. Uma afinidade com tecnologia eu diria.',
        
        'software-skills-title': 'Habilidades em Softwares',
        'software-creative-title': 'Softwares de Criativos',
        'software-office-title': 'Softwares de Escritório',
        'software-programming-title': 'Programação e suas linguagens',
        'software-os-title': 'Sistemas Operacionais',
        'cv-expectativa-title': 'O que almejo',

        'level-advanced': 'Avançado',
        'level-intermediate': 'Intermediário',
        'level-basic': 'Básico',
        
        'cv-quote': '"Intelligence is the ability to avoid doing work, yet getting the work done."',
        'cv-quote-author': '~Linus Torvalds'
    },
    en: {
        'cv-title': 'Graphic Designer - Digital Illustrator - Video Editor',
        'profile-image-alt': 'Portrait of Renato Harley Paiva',
        'cv-intro-1': "I'm 24 years old, a graduate graphic designer. I work mainly in the areas of graphic design, video editing, digital illustration and motion design.",
        'cv-intro-2': 'I work well in teams, on-site or remotely. I can handle briefing proposals well, and deal with different types of visual identity and segments.',

        'cv-experience-title': 'Professional Experience',

        'exp-odysseexp-title': 'Graphic Designer, Video Editor and Digital Illustrator | Freelance',
        'exp-odysseexp-company-title': 'Odyssee Experience',
        'exp-odysseexp-1': 'Development and creation of banners for the blog.',
        'exp-odysseexp-2': 'Writer and reviewer of articles published on the blog.',
        'exp-odysseexp-3': 'Assist in the UX/UI development of the blog.',
        'exp-odysseexp-4': 'Assist in the creation and development of the site\'s visual identity.',

        'exp-mm-title': 'Graphic Designer and Writer | Freelance',
        'exp-mm-company-title': 'Mobile Minecraft (Website closed in 2018)',
        'exp-mm-1': 'Development and creation of banners for the blog.',
        'exp-mm-2': 'Writer and reviewer of articles published on the blog.',
        'exp-mm-3': 'Assist in the UX/UI development of the blog.',
        'exp-mm-4': 'Assist in the creation and development of the site\'s visual identity.',
        
        'exp-fleury-title': 'Receptionist | CLT (Full-time)',
        'exp-fleury-company-title': 'Grupo Fleury',
        'exp-fleury-1': 'Customer service and opening of medical exam records.',
        'exp-fleury-2': 'Scheduling of laboratory medical procedures.',
        'exp-fleury-3': 'Commercial negotiations with accredited health plans in spreadsheets.',
        'exp-fleury-4': 'Trainer of new workers for reception and record opening.',
        'exp-fleury-5': 'Storage of service unit files.',
        'exp-fleury-6': 'Backoffice management and resolution of financial problems in spreadsheets.',
        
        'exp-anymous-title': 'Graphic Designer | Internship',
        'exp-anymous-company-title': 'ANYMOUS (currently bankrupt, continuing only with the BioSec Pet sub-brand)',
        'exp-anymous-1': 'Creation and development of posts and carousels for Instagram.',
        'exp-anymous-2': 'Creation and development of reels for Instagram.',
        'exp-anymous-3': 'Writer and product photo editor for marketplace.',
        'exp-anymous-4': 'Website UX/UI. Management of icons, symbols and page accessibility.',
        
        'exp-divterm-title': 'Box Letter Cutting Factory Supervisor | Informal',
        'exp-divterm-company-title': 'Div Term Tecnomoldura',
        'exp-divterm-1': 'Generate scaled and compatible files for laser cutting, hot-wire cutting and MDF.',
        'exp-divterm-2': 'Develop material optimization in software for machine cutting.',
        'exp-divterm-3': 'Laser cutting and hot wire cutting operation.',
        'exp-divterm-4': 'Develop typography and adapt it for cutting in machinery according to its limitations.',
        'exp-divterm-5': 'Supervise machine operators to ensure cutting quality and avoid excessive raw material expenses.',
        
        'exp-atento-title': 'Customer Service Specialist | CLT (Full-time)',
        'exp-atento-company-title': 'Atento',
        'exp-atento-1': 'Inbound voice service for customers of the Cogna college group plan (Anhanguera college group)',
        'exp-atento-2': 'Inbound service via WhatsApp and e-mail, 5 screens.',
        'exp-atento-3': 'Resolve doubts regarding invoices, class schedules, website, campus, contract and debt regularizations.',

        'exp-first-title': 'Mid-level Graphic Designer | Temporary',
        'exp-first-company-title': 'First Publicidade',
        'exp-first-1': 'Creation and development of posts and carousels for Instagram with various visual identities.',
        'exp-first-2': 'Creation of posts for political campaigns of city council and mayor candidates in São Paulo state.',
        'exp-first-3': 'Branding of trendy and interactive posts for social media.',
        'exp-first-4': 'Offline material for political campaigns (banners, flyers, stickers, etc.).',
        
        'exp-neobpo-title': 'Customer Service Specialist | CLT (Full-time)',
        'exp-neobpo-company-title': 'NeoBPO (currently NeoHype)',
        'exp-neobpo-1': 'Inbound customer service for Amil health plan clients.',
        'exp-neobpo-2': 'Scheduling of medical exams and appointments.',
        'exp-neobpo-3': 'Resolve doubts regarding units, schedules, medical procedures.',

        'exp-percons-title': 'Junior Graphic Designer | PJ (Contractor)',
        'exp-percons-company-title': 'Percons - Pernamcubo Conservadora',
        'exp-percons-1': 'Creating artwork for social media posts.',
        'exp-percons-2': 'Write internal documents with the company\'s visual identity.',
        'exp-percons-3': 'Create and prepare print-ready files (offline material).',
        'exp-percons-4': 'Design and create visual identities and logos for brands.',
        'exp-percons-5': 'Corporate presentation design.',

        'exp-blackco-title': 'Mid-level Graphic Designer | Volunteer',
        'exp-blackco-company-title': 'Black&CO',
        'exp-blackco-1': 'Copywriting for artwork.',
        'exp-blackco-2': 'Theme development.',
        'exp-blackco-3': 'Creation of artwork for Instagram carousels.',

        'cv-education-title': 'Education and Courses',
        'edu-caution-title': 'Course - Caution Pontocom',
        'edu-caution-1': 'Computer science and English course',
        'edu-caution-2': '194 hours',
        'edu-unicid-title': 'College - UNICID',
        'edu-unicid-1': 'Associate Degree in Graphic Design',
        'edu-unicid-2': '4 semesters',

        'cv-skills-title': 'Languages and Other Skills',
        'lang-reading-title': 'Languages - Writing and Reading',
        'lang-pt-native': 'Brazilian Portuguese - Native',
        'lang-en-advanced': 'English - Advanced',
        'lang-de-basic': 'German - Basic',
        'lang-speaking-title': 'Languages - Verbal Communication',
        'lang-pt-native-speaking': 'Brazilian Portuguese - Native',
        'lang-en-intermediate': 'English - Intermediate',
        'lang-de-basic-speaking': 'German - Basic',
        
        'skill-communication-title': 'Inclusive and Accessible Communication',
        'skill-communication-desc': 'I communicate according to each person\'s profile, using language in a way that they can understand the message I want to convey and feel comfortable expressing themselves the way they normally do.',
        'skill-tech-title': 'Tech Affinity',
        'skill-tech-desc': 'This is quite clear below with the software and systems I use frequently. However, I have a very fast ability to learn new software, interfaces, code and operating systems. Even if I don\'t know a particular tool, I can learn very quickly. A tech affinity, I would say.',
        
        'software-skills-title': 'Software Skills',
        'software-creative-title': 'Creative Software',
        'software-office-title': 'Office Software',
        'software-programming-title': 'Programming and Languages',
        'software-os-title': 'Operating Systems',
        'cv-expectativa-title': 'What I Aim For',

        'level-advanced': 'Advanced',
        'level-intermediate': 'Intermediate',
        'level-basic': 'Basic',
        
        'cv-quote': '"Intelligence is the ability to avoid doing work, yet getting the work done."',
        'cv-quote-author': '~Linus Torvalds'
    }
};

function translateCVPage() {
    
    const currentLang = (window.safeStorage && window.safeStorage.getItem('userLang')) || localStorage.getItem('userLang') || 'pt';
    
    console.log('[CV-PAGE] Traduzindo para idioma:', currentLang);
    
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (cvTranslations[currentLang] && cvTranslations[currentLang][key]) {
            element.textContent = cvTranslations[currentLang][key];
        }
    });

    const profileImg = document.getElementById('profile-image');
    if (profileImg && cvTranslations[currentLang] && cvTranslations[currentLang]['profile-image-alt']) {
        profileImg.alt = cvTranslations[currentLang]['profile-image-alt'];
    }

    document.querySelectorAll('.cv-software-item span').forEach(span => {
        const text = span.textContent.trim();
        if (text === 'Avançado' || text === 'Advanced') {
            span.textContent = cvTranslations[currentLang]['level-advanced'];
        } else if (text === 'Intermediário' || text === 'Intermediate') {
            span.textContent = cvTranslations[currentLang]['level-intermediate'];
        } else if (text === 'Básico' || text === 'Basic') {
            span.textContent = cvTranslations[currentLang]['level-basic'];
        }
    });
}

function initCVPage() {
    console.log('[CV-PAGE] Inicializando página...');
    updateProfileImage();
    translateCVPage();

    window.addEventListener('storage', (e) => {
        if (e.key === 'userLang') {
            console.log('[CV-PAGE] storage event - traduzindo');
            translateCVPage();
        }
    });

    window.addEventListener('odyssee-storage', (e) => {
        if (e.detail && e.detail.key === 'userLang') {
            console.log('[CV-PAGE] odyssee-storage event - traduzindo');
            translateCVPage();
        }
    });

    const observerTheme = new MutationObserver(updateProfileImage);
    observerTheme.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['class'] 
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCVPage);
} else {
    
    initCVPage();
}
