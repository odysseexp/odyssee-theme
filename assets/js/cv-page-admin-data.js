

(function() {
    'use strict';

    console.log('[CV-PAGE-ADMIN] Script iniciado');
    console.log('[CV-PAGE-ADMIN] odysseyCVData disponível:', typeof window.odysseyCVData !== 'undefined');

    if (typeof odysseyCVData === 'undefined') {
        console.warn('[CV-PAGE-ADMIN] AVISO: Dados do painel admin não encontrados (odysseyCVData é undefined)');
        console.warn('[CV-PAGE-ADMIN] Verificar se a função odyssee_cv_localize_frontend_data() está sendo chamada');
        return;
    }

    console.log('[CV-PAGE-ADMIN] ✓ Dados do painel admin encontrados');
    console.log('[CV-PAGE-ADMIN] Dados:', odysseyCVData);

    function loadDescription() {
        const currentLang = (window.safeStorage && window.safeStorage.getItem('userLang')) || localStorage.getItem('userLang') || 'pt';
        const langKey = currentLang === 'en' ? 'en_us' : 'pt_br';
        
        const descricao = odysseeCVData.descricao?.[langKey] || {};
        
        const intro1 = document.querySelector('[data-key="cv-intro-1"]');
        const intro2 = document.querySelector('[data-key="cv-intro-2"]');
        
        if (intro1 && descricao.intro_1) {
            intro1.textContent = descricao.intro_1;
        }
        
        if (intro2 && descricao.intro_2) {
            intro2.textContent = descricao.intro_2;
        }

        const expectativaContainer = document.querySelector('.cv-expectativa');
        if (expectativaContainer && descricao.expectativa) {
            const paragrafos = descricao.expectativa.split('\n').filter(p => p.trim() !== '');
            let expHtml = '';
            paragrafos.forEach((p, idx) => {
                expHtml += `<p>${escapeHtml(p.trim())}</p>`;
                if (idx < paragrafos.length - 1) {
                    expHtml += '<br>';
                }
            });
            expectativaContainer.innerHTML = expHtml;
        }

        const citacao = document.querySelector('[data-key="cv-quote"]');
        if (citacao && descricao.citacao) {
            citacao.textContent = '"' + descricao.citacao + '"';
        }

        const citacaoAutor = document.querySelector('[data-key="cv-quote-author"]');
        if (citacaoAutor && descricao.citacao_autor) {
            citacaoAutor.textContent = '~' + descricao.citacao_autor;
        }
    }

    function loadExperiences() {
        const currentLang = (window.safeStorage && window.safeStorage.getItem('userLang')) || localStorage.getItem('userLang') || 'pt';
        const descKey = currentLang === 'en' ? 'descricao_en' : 'descricao_pt';
        
        const experiencias = odysseyCVData.experiencias || [];
        const timelineContainer = document.querySelector('.cv-timeline');
        
        if (!timelineContainer || experiencias.length === 0) {
            return;
        }

        if (experiencias.length > 0) {
            
            const existingItems = timelineContainer.querySelectorAll('.cv-timeline-item');
            existingItems.forEach(item => item.remove());

            experiencias.forEach((exp) => {
                const item = document.createElement('div');
                item.className = 'cv-timeline-item';
                
                let descHTML = '';
                if (exp[descKey]) {
                    const items = exp[descKey].split('\n').filter(line => line.trim());
                    descHTML = '<ul>' + 
                        items.map(line => `<li>${escapeHtml(line.trim())}</li>`).join('') + 
                        '</ul>';
                }

                item.innerHTML = `
                    <div class="cv-year">${escapeHtml(exp.periodo || '')}</div>
                    <div class="cv-content">
                        <h3>${escapeHtml(exp.titulo || '')}</h3>
                        <h4>${escapeHtml(exp.empresa || '')}</h4>
                        ${descHTML}
                    </div>
                `;
                
                timelineContainer.appendChild(item);
            });
        }
    }

    function loadCourses() {
        const currentLang = (window.safeStorage && window.safeStorage.getItem('userLang')) || localStorage.getItem('userLang') || 'pt';
        const descKey = currentLang === 'en' ? 'descricao_en' : 'descricao_pt';
        
        const cursos = odysseyCVData.cursos || [];
        const educationSection = document.querySelector('.cv-education');
        
        if (!educationSection || cursos.length === 0) {
            return;
        }

        const educationList = educationSection.querySelector('.cv-education-list');
        
        if (!educationList) {
            return;
        }

        if (cursos.length > 0) {
            const existingItems = educationList.querySelectorAll('.cv-education-item');
            existingItems.forEach(item => item.remove());

            cursos.forEach((curso) => {
                const item = document.createElement('div');
                item.className = 'cv-education-item';
                
                let descHTML = '';
                if (curso[descKey]) {
                    descHTML = `<p>${escapeHtml(curso[descKey])}</p>`;
                }

                item.innerHTML = `
                    <div class="cv-education-period">${escapeHtml(curso.data_final || '')}</div>
                    <div class="cv-education-content">
                        <h4>${escapeHtml(curso.nome || '')}</h4>
                        <p class="cv-education-institution">${escapeHtml(curso.instituicao || '')}</p>
                        ${descHTML}
                    </div>
                `;
                
                educationList.appendChild(item);
            });
        }
    }

    function loadSkills() {
        
        if (!odysseyCVData || !odysseyCVData.habilidades) {
            console.log('[CV-PAGE-ADMIN] Sem dados de habilidades');
            return;
        }

        const habilidades = odysseyCVData.habilidades;

        const categoriasMapeadas = {
            'criativos': '#creative-software-grid',
            'office': '#office-software-grid',
            'programacao': '#programming-software-grid',
            'softwares': '#programming-software-grid', 
            'os': '#os-software-grid',
        };

        console.log('[CV-PAGE-ADMIN] Carregando habilidades:', Object.keys(habilidades));

        Object.entries(categoriasMapeadas).forEach(([categoria, selector]) => {
            const container = document.querySelector(selector);
            if (!container) {
                console.log(`[CV-PAGE-ADMIN] Seletor não encontrado: ${selector}`);
                return;
            }

            const items = habilidades[categoria] || [];
            
            console.log(`[CV-PAGE-ADMIN] ${categoria}: ${items.length} itens`);

            if (items.length > 0) {
                
                const existingItems = container.querySelectorAll('.cv-software-item, .cv-os-item');
                console.log(`[CV-PAGE-ADMIN] Removendo ${existingItems.length} itens existentes de ${categoria}`);
                existingItems.forEach(item => item.remove());

                items.forEach((skill, idx) => {
                    const itemClass = categoria === 'os' || categoria === 'softwares' ? 'cv-os-item' : 'cv-software-item';
                    const item = document.createElement('div');
                    item.className = itemClass;
                    
                    let iconHTML = '';
                    if (skill.icon_url) {
                        iconHTML = `<img src="${escapeHtml(skill.icon_url)}" alt="${escapeHtml(skill.nome || '')}" class="cv-software-icon" />`;
                    }

                    const nivel = (categoria !== 'os' && categoria !== 'softwares' && skill.nivel) ? ` <span>${escapeHtml(skill.nivel)}</span>` : '';
                    const nome = skill.nome ? escapeHtml(skill.nome) : '';

                    if (categoria === 'os' || categoria === 'softwares') {
                        item.innerHTML = iconHTML;
                    } else {
                        item.innerHTML = `
                            ${iconHTML}
                            <div class="cv-software-info">
                                ${nome ? `<strong>${nome}</strong>` : ''}
                                ${nivel}
                            </div>
                        `;
                    }
                    
                    container.appendChild(item);
                    console.log(`[CV-PAGE-ADMIN] Adicionado ${skill.nome || 'item'} em ${categoria}`);
                });
            }
        });
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    function loadAllData() {
        console.log('[CV-PAGE-ADMIN] Carregando todos os dados...');
        loadDescription();
        loadExperiences();
        loadCourses();
        loadSkills();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllData);
    } else {
        loadAllData();
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'userLang') {
            console.log('[CV-PAGE-ADMIN] Idioma mudou, atualizando dados...');
            loadAllData();
            if (typeof translateCVPage === 'function') setTimeout(translateCVPage, 50);
        }
    });

    window.addEventListener('odyssee-storage', (e) => {
        if (e.detail && e.detail.key === 'userLang') {
            console.log('[CV-PAGE-ADMIN] Idioma mudou, atualizando dados...');
            loadAllData();
            if (typeof translateCVPage === 'function') setTimeout(translateCVPage, 50);
        }
    });

})();
