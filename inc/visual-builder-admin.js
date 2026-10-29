/**
 * Odyssee Visual Studio — Admin Editor Controller (Elementor-like UI)
 */
(function ($) {
    'use strict';

    const adminCfg = window.odysseeVBAdmin || {
        ajaxurl: '',
        nonce: '',
        homeUrl: '/',
        initialData: { elements: {}, blocks: [], globalVars: {}, customCss: '' }
    };

    let state = deepClone(normalizeData(adminCfg.initialData));
    let history = [deepClone(state)];
    let historyIdx = 0;

    let currentSelector = null;
    let currentSnapshot = null;
    let currentBucket = 'desktop'; // 'desktop', 'hover', 'tablet', 'mobile', 'dark', 'light'
    let pageTree = [];

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj || {}));
    }

    function normalizeData(raw) {
        const d = raw && typeof raw === 'object' ? raw : {};
        return {
            elements: d.elements && typeof d.elements === 'object' && !Array.isArray(d.elements) ? d.elements : {},
            blocks: Array.isArray(d.blocks) ? d.blocks : [],
            globalVars: d.globalVars && typeof d.globalVars === 'object' && !Array.isArray(d.globalVars) ? d.globalVars : { all: {}, dark: {}, light: {} },
            customCss: typeof d.customCss === 'string' ? d.customCss : ''
        };
    }

    function pushHistory() {
        history = history.slice(0, historyIdx + 1);
        history.push(deepClone(state));
        if (history.length > 40) history.shift();
        historyIdx = history.length - 1;
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
        $('#ovb-btn-undo').prop('disabled', historyIdx <= 0);
        $('#ovb-btn-redo').prop('disabled', historyIdx >= history.length - 1);
    }

    function showToast(msg, isError) {
        const toast = $('#ovb-toast');
        toast.text(msg)
            .css('background', isError ? '#ef4444' : '#10b981')
            .addClass('show');
        clearTimeout(window._ovbToastTimer);
        window._ovbToastTimer = setTimeout(() => {
            toast.removeClass('show');
        }, 2600);
    }

    function postToPreview(payload) {
        const iframe = document.getElementById('ovb-preview-iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(payload, '*');
        }
    }

    function syncPreview() {
        postToPreview({
            type: 'OVB_SYNC_DATA',
            data: state
        });
        renderModifiedElementsList();
    }

    function ensureElementRecord(selector) {
        if (!selector) return null;
        if (!state.elements[selector]) {
            state.elements[selector] = {
                themeScope: 'all',
                content: {},
                styles: {
                    desktop: {},
                    hover: {},
                    tablet: {},
                    mobile: {},
                    dark: {},
                    light: {}
                },
                customCss: ''
            };
        }
        const rec = state.elements[selector];
        if (!rec.styles) rec.styles = {};
        if (!rec.styles[currentBucket]) rec.styles[currentBucket] = {};
        if (!rec.content) rec.content = {};
        return rec;
    }

    function getActiveStyleObj() {
        if (!currentSelector) return {};
        const rec = state.elements[currentSelector];
        if (!rec || !rec.styles || !rec.styles[currentBucket]) return {};
        return rec.styles[currentBucket];
    }

    function rgbToHex(rgb) {
        if (!rgb) return '#8b5cf6';
        if (rgb.startsWith('#')) return rgb.slice(0, 7);
        const m = rgb.match(/\d+/g);
        if (!m || m.length < 3) return '#8b5cf6';
        return '#' + m.slice(0, 3).map(x => parseInt(x, 10).toString(16).padStart(2, '0')).join('');
    }

    /**
     * Populates all sidebar inputs from the currently selected element & style bucket
     */
    function populateSidebarFromSelection() {
        const bannerLabel = $('#ovb-sel-label');
        const bannerSel = $('#ovb-sel-selector');

        if (!currentSelector) {
            bannerLabel.text('Nenhum elemento selecionado');
            bannerSel.text('Clique em qualquer item do site ao lado →');
            return;
        }

        bannerLabel.text((currentSnapshot && currentSnapshot.label) || 'Elemento Selecionado');
        bannerSel.text(currentSelector);
        $('#ovb-custom-selector-input').val(currentSelector);

        const rec = state.elements[currentSelector] || {};
        const st = (rec.styles && rec.styles[currentBucket]) || {};
        const dSt = (rec.styles && rec.styles.desktop) || {};
        const content = rec.content || {};
        const comp = (currentSnapshot && currentSnapshot.computed) || {};

        $('#ovb-theme-scope').val(rec.themeScope || 'all');

        // Content Tab
        const textVal = content.text !== undefined ? content.text : ((currentSnapshot && currentSnapshot.text) || '');
        $('#ovb-content-text').val(textVal);

        const srcVal = content.src !== undefined ? content.src : ((currentSnapshot && currentSnapshot.src) || '');
        $('#ovb-content-src').val(srcVal);

        const hrefVal = content.href !== undefined ? content.href : ((currentSnapshot && currentSnapshot.href) || '');
        $('#ovb-content-href').val(hrefVal);

        // If this is a custom block, show block controls
        const blockId = (currentSnapshot && currentSnapshot.blockId) || (currentSelector.startsWith('#ovb_blk_') ? currentSelector.slice(1) : null);
        const blockObj = blockId ? (state.blocks || []).find(b => b.id === blockId) : null;
        if (blockObj) {
            $('#ovb-custom-block-editor').show();
            $('#ovb-block-edit-html').val((blockObj.content && (blockObj.content.html || blockObj.content.text || blockObj.content.title)) || '');
        } else {
            $('#ovb-custom-block-editor').hide();
        }

        // Bind data-prop style fields
        $('[data-ovb-prop]').each(function () {
            const $el = $(this);
            const prop = $el.attr('data-ovb-prop');
            // Animation, Glow, Blend, Tilt properties live on desktop bucket primarily unless overridden
            const val = st[prop] !== undefined ? st[prop] : (dSt[prop] !== undefined ? dSt[prop] : '');

            if ($el.attr('type') === 'checkbox') {
                $el.prop('checked', !!val);
            } else if ($el.attr('type') === 'color') {
                if (val) {
                    $el.val(rgbToHex(val));
                } else if (prop === 'color' && comp.color) {
                    $el.val(rgbToHex(comp.color));
                } else if (prop === 'backgroundColor' && comp.backgroundColor && comp.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    $el.val(rgbToHex(comp.backgroundColor));
                }
            } else {
                $el.val(val !== undefined && val !== null ? val : '');
            }
        });

        // Sync range sliders with their partner number inputs
        $('.ovb-range[data-ovb-range-for]').each(function () {
            const prop = $(this).attr('data-ovb-range-for');
            const rawVal = st[prop] !== undefined ? st[prop] : (dSt[prop] !== undefined ? dSt[prop] : $(this).attr('data-default') || 0);
            const numeric = parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
            if (!isNaN(numeric)) {
                $(this).val(numeric);
            }
        });

        // Highlight active blend mode pill
        const activeBlend = st.blendMode || dSt.blendMode || 'normal';
        $('.ovb-blend-pill').removeClass('active');
        $(`.ovb-blend-pill[data-blend="${activeBlend}"]`).addClass('active');

        // Element Custom CSS
        $('#ovb-element-custom-css').val(rec.customCss || '');
    }

    /**
     * Updates a property on the current element and immediately syncs the live preview
     */
    let historyTimer = null;
    function updateElementStyleProp(prop, value) {
        if (!currentSelector) {
            showToast('Clique primeiro em um elemento do site ao lado para editá-lo!', true);
            return;
        }
        const rec = ensureElementRecord(currentSelector);
        if (value === '' || value === null || value === false) {
            delete rec.styles[currentBucket][prop];
        } else {
            rec.styles[currentBucket][prop] = value;
        }

        syncPreview();

        clearTimeout(historyTimer);
        historyTimer = setTimeout(() => {
            pushHistory();
        }, 400);
    }

    /**
     * Renders the Layer Navigator & Modified Elements lists in Tab 4
     */
    function renderNavigatorTree() {
        const container = $('#ovb-navigator-tree');
        container.empty();

        if (!pageTree || pageTree.length === 0) {
            container.html('<p style="color:#64748b;font-size:11.5px;">Carregando estrutura da página...</p>');
            return;
        }

        pageTree.forEach(item => {
            const isMod = !!state.elements[item.selector];
            const row = $(`
                <div class="ovb-tree-item ${isMod ? 'is-modified' : ''} ${item.isBlock ? 'is-block' : ''}" data-sel="${ $('<div>').text(item.selector).html() }">
                    <span><i class="fas ${item.isBlock ? 'fa-cube' : 'fa-layer-group'}" style="margin-right:6px;opacity:0.75;"></i>${ $('<div>').text(item.label).html() }</span>
                    <span style="font-size:10px;color:#94a3b8;">${isMod ? '● Editado' : ''}</span>
                </div>
            `);
            container.append(row);

            if (item.children && item.children.length > 0) {
                const childWrap = $('<div class="ovb-tree-children"></div>');
                item.children.forEach(ch => {
                    const chMod = !!state.elements[ch.selector];
                    const chRow = $(`
                        <div class="ovb-tree-item ${chMod ? 'is-modified' : ''} ${ch.isBlock ? 'is-block' : ''}" data-sel="${ $('<div>').text(ch.selector).html() }">
                            <span>${ $('<div>').text(ch.label).html() }</span>
                            <span style="font-size:10px;color:#a855f7;">${chMod ? '●' : ''}</span>
                        </div>
                    `);
                    childWrap.append(chRow);
                });
                container.append(childWrap);
            }
        });
    }

    function renderModifiedElementsList() {
        const list = $('#ovb-modified-list');
        list.empty();
        const keys = Object.keys(state.elements || {});
        if (keys.length === 0 && (!state.blocks || state.blocks.length === 0)) {
            list.html('<p style="color:#64748b;font-size:11.5px;margin:0;">Nenhuma customização ativa ainda.</p>');
            return;
        }

        keys.forEach(sel => {
            const item = $(`
                <div class="ovb-tree-item is-modified" data-sel="${ $('<div>').text(sel).html() }">
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px;" title="${ $('<div>').text(sel).html() }">${ $('<div>').text(sel).html() }</span>
                    <button type="button" class="ovb-mini-btn ovb-del-rule" data-sel="${ $('<div>').text(sel).html() }" title="Remover estilo deste seletor">✕</button>
                </div>
            `);
            list.append(item);
        });
    }

    /**
     * Inserts a new custom widget/block into the page
     */
    function insertNewBlock(type) {
        const targetSel = currentSelector || '#home';
        const pos = $('#ovb-insert-position').val() || 'after';
        const id = 'ovb_blk_' + Math.random().toString(36).substring(2, 8);

        const defaultContents = {
            'heading': { tag: 'h2', text: 'Título Criativo com Efeito' },
            'text': { html: '<p>Texto personalizado adicionado pelo Odyssee Studio. Clique para editar tipografia, cores, glow e animações.</p>' },
            'button': { text: 'Explorar Agora', url: '#contato', icon: 'fas fa-bolt' },
            'image': { src: '/wp-content/uploads/2025/11/typewhite.webp', alt: 'Imagem Odyssee' },
            'card': { icon: 'fas fa-wand-magic-sparkles', title: 'Card em Destaque', desc: 'Personalize este card com glassmorphism, glow neon, blend modes e tilt 3D.' },
            'glow-orb': {},
            'divider': {},
            'html': { html: '<div style="padding:1.5rem;text-align:center;border:1px dashed rgba(139,92,246,0.5);border-radius:12px;">Bloco HTML / SVG Livre</div>' }
        };

        const newBlock = {
            id: id,
            type: type,
            targetSelector: targetSel,
            position: pos,
            content: defaultContents[type] || {}
        };

        if (!Array.isArray(state.blocks)) state.blocks = [];
        state.blocks.push(newBlock);

        // If it's a glow orb, pre-populate cool additive glow settings on it
        if (type === 'glow-orb') {
            state.elements['#' + id] = {
                themeScope: 'all',
                content: {},
                styles: {
                    desktop: {
                        blendMode: 'plus-lighter',
                        loopAnim: 'ovbLoopFloat',
                        loopDuration: '4s'
                    }
                }
            };
        }

        pushHistory();
        syncPreview();

        setTimeout(() => {
            postToPreview({
                type: 'OVB_SELECT_SELECTOR',
                selector: '#' + id,
                scroll: true
            });
            postToPreview({ type: 'OVB_REQUEST_TREE' });
        }, 120);

        showToast('Novo bloco inserido! Você pode estilizá-lo livremente.');
    }

    /**
     * Populates Global Theme Variables inputs
     */
    function populateGlobalVariables() {
        const gv = state.globalVars || { all: {}, dark: {}, light: {} };
        $('[data-ovb-gvar]').each(function () {
            const scope = $(this).attr('data-ovb-gscope') || 'all';
            const varName = $(this).attr('data-ovb-gvar');
            const val = (gv[scope] && gv[scope][varName]) || '';
            if (val) {
                $(this).val(rgbToHex(val));
            }
        });
        $('#ovb-global-custom-css').val(state.customCss || '');
    }

    /**
     * Document Ready Initialization
     */
    $(document).ready(function () {
        populateGlobalVariables();
        renderModifiedElementsList();
        updateUndoRedoButtons();

        // Listen for messages from the preview iframe
        window.addEventListener('message', (event) => {
            const msg = event.data;
            if (!msg || typeof msg !== 'object' || !msg.type) return;

            switch (msg.type) {
                case 'OVB_PREVIEW_READY': {
                    pageTree = msg.tree || [];
                    renderNavigatorTree();
                    syncPreview();
                    break;
                }
                case 'OVB_ELEMENT_SELECTED': {
                    currentSelector = msg.selector;
                    currentSnapshot = msg.snapshot || {};
                    populateSidebarFromSelection();
                    break;
                }
                case 'OVB_PAGE_TREE': {
                    pageTree = msg.tree || [];
                    renderNavigatorTree();
                    break;
                }
                case 'OVB_OPEN_ADD_BLOCK': {
                    if (msg.targetSelector) {
                        currentSelector = msg.targetSelector;
                    }
                    $('.ovb-tab-btn[data-tab="tab-content"]').trigger('click');
                    break;
                }
                case 'OVB_RESET_ELEMENT': {
                    const sel = msg.selector || currentSelector;
                    if (sel && state.elements[sel]) {
                        delete state.elements[sel];
                        pushHistory();
                        syncPreview();
                        populateSidebarFromSelection();
                        showToast('Estilo do elemento restaurado para o original!');
                    }
                    break;
                }
            }
        });

        // Main Sidebar Tabs
        $(document).on('click', '.ovb-tab-btn', function () {
            const tabId = $(this).attr('data-tab');
            $('.ovb-tab-btn').removeClass('active');
            $(this).addClass('active');
            $('.ovb-tab-panel').removeClass('active');
            $('#' + tabId).addClass('active');
            if (tabId === 'tab-layers') {
                postToPreview({ type: 'OVB_REQUEST_TREE' });
            }
        });

        // Accordion Sections
        $(document).on('click', '.ovb-section-header', function () {
            $(this).closest('.ovb-section').toggleClass('collapsed');
        });

        // Page Switcher in Topbar
        $('#ovb-page-switcher').on('change', function () {
            const url = $(this).val();
            if (!url) return;
            const sep = url.indexOf('?') === -1 ? '?' : '&';
            $('#ovb-preview-iframe').attr('src', url + sep + 'odyssee_vb_preview=1');
        });

        // Responsive Device Switcher
        $(document).on('click', '.ovb-device-btn', function () {
            const dev = $(this).attr('data-device');
            $('.ovb-device-btn').removeClass('active');
            $(this).addClass('active');

            const container = $('#ovb-iframe-container');
            container.removeClass('device-desktop device-tablet device-mobile').addClass('device-' + dev);

            // Also switch editing bucket if user switches to tablet/mobile or back to desktop
            if (dev === 'tablet' || dev === 'mobile' || dev === 'desktop') {
                currentBucket = dev;
                $('#ovb-state-bucket').val(dev);
                populateSidebarFromSelection();
            }
        });

        // State Bucket Switcher (Normal / Hover / Tablet / Mobile / Dark / Light)
        $('#ovb-state-bucket').on('change', function () {
            currentBucket = $(this).val();
            populateSidebarFromSelection();
        });

        // Element Theme Scope (All / Dark only / Light only)
        $('#ovb-theme-scope').on('change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.themeScope = $(this).val();
            pushHistory();
            syncPreview();
        });

        // Preview Theme (Dark/Light) & Accent (Purple/Red) & Onboarding toggles in Topbar
        $(document).on('click', '.ovb-preview-theme-btn', function () {
            const theme = $(this).attr('data-theme');
            $('.ovb-preview-theme-btn').removeClass('active');
            $(this).addClass('active');
            postToPreview({ type: 'OVB_SET_PREVIEW_THEME', theme: theme });
        });

        $(document).on('click', '.ovb-preview-color-btn', function () {
            const color = $(this).attr('data-color');
            $('.ovb-preview-color-btn').removeClass('active');
            $(this).addClass('active');
            postToPreview({ type: 'OVB_SET_PREVIEW_THEME', color: color });
        });

        $('#ovb-toggle-onboarding').on('click', function () {
            $(this).toggleClass('active');
            const active = $(this).hasClass('active');
            postToPreview({ type: 'OVB_SET_PREVIEW_THEME', onboarding: active });
        });

        // Interactive Mode Toggle (Navigate vs Select)
        $('#ovb-toggle-interactive').on('click', function () {
            $(this).toggleClass('active');
            const interactive = $(this).hasClass('active');
            postToPreview({ type: 'OVB_SET_INTERACTIVE_MODE', interactive: interactive });
            showToast(interactive ? 'Modo Navegação Livre ativado (cliques normais no site)' : 'Modo Seleção de Elementos ativado');
        });

        // Select Parent Button
        $('#ovb-btn-select-parent').on('click', function () {
            postToPreview({ type: 'OVB_SELECT_PARENT' });
        });

        // Manual CSS Selector override
        $('#ovb-btn-apply-selector').on('click', function () {
            const customSel = $('#ovb-custom-selector-input').val().trim();
            if (!customSel) return;
            currentSelector = customSel;
            postToPreview({ type: 'OVB_SELECT_SELECTOR', selector: customSel, scroll: true });
            populateSidebarFromSelection();
        });

        // Reset Current Element
        $('#ovb-btn-reset-element').on('click', function () {
            if (!currentSelector) return;
            delete state.elements[currentSelector];
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            showToast('Elemento restaurado ao padrão original!');
        });

        // Content Overrides (Text, Image Src, Link Href)
        $('#ovb-content-text').on('input', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.content.text = $(this).val();
            syncPreview();
        });

        $('#ovb-content-src').on('input change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.content.src = $(this).val();
            syncPreview();
        });

        $('#ovb-content-href').on('input change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.content.href = $(this).val();
            syncPreview();
        });

        // Custom Block Content Edit & Delete
        $('#ovb-block-edit-html').on('input', function () {
            const blockId = (currentSnapshot && currentSnapshot.blockId) || (currentSelector && currentSelector.startsWith('#ovb_blk_') ? currentSelector.slice(1) : null);
            if (!blockId) return;
            const blockObj = (state.blocks || []).find(b => b.id === blockId);
            if (!blockObj) return;
            const val = $(this).val();
            if (blockObj.type === 'heading' || blockObj.type === 'button') {
                blockObj.content.text = val;
            } else if (blockObj.type === 'card') {
                blockObj.content.title = val;
            } else {
                blockObj.content.html = val;
            }
            syncPreview();
        });

        $('#ovb-btn-delete-block').on('click', function () {
            const blockId = (currentSnapshot && currentSnapshot.blockId) || (currentSelector && currentSelector.startsWith('#ovb_blk_') ? currentSelector.slice(1) : null);
            if (!blockId) return;
            state.blocks = (state.blocks || []).filter(b => b.id !== blockId);
            delete state.elements['#' + blockId];
            currentSelector = null;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            showToast('Bloco removido!');
        });

        // WordPress Media Library Picker
        $(document).on('click', '.ovb-media-btn', function (e) {
            e.preventDefault();
            const targetInput = $($(this).attr('data-target'));
            if (!window.wp || !window.wp.media) {
                showToast('Biblioteca de mídia não disponível', true);
                return;
            }
            const frame = window.wp.media({
                title: 'Selecionar Imagem',
                button: { text: 'Usar esta imagem' },
                multiple: false
            });
            frame.on('select', function () {
                const attachment = frame.state().get('selection').first().toJSON();
                if (attachment && attachment.url) {
                    targetInput.val(attachment.url).trigger('input').trigger('change');
                }
            });
            frame.open();
        });

        // Generic Style Inputs Binding ([data-ovb-prop])
        $(document).on('input change', '[data-ovb-prop]', function () {
            const $el = $(this);
            const prop = $el.attr('data-ovb-prop');
            let val = $el.attr('type') === 'checkbox' ? $el.is(':checked') : $el.val();

            // Sync partner slider if present
            const $slider = $(`.ovb-range[data-ovb-range-for="${prop}"]`);
            if ($slider.length) {
                const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
                if (!isNaN(num)) $slider.val(num);
            }

            updateElementStyleProp(prop, val);
        });

        // Range Sliders Binding ([data-ovb-range-for])
        $(document).on('input change', '.ovb-range[data-ovb-range-for]', function () {
            const prop = $(this).attr('data-ovb-range-for');
            const unit = $(this).attr('data-unit') || '';
            const val = $(this).val() + unit;
            $(`[data-ovb-prop="${prop}"]`).val(val);
            updateElementStyleProp(prop, val);
        });

        // Quick Blend Mode Pills
        $(document).on('click', '.ovb-blend-pill', function () {
            const blend = $(this).attr('data-blend');
            $('.ovb-blend-pill').removeClass('active');
            $(this).addClass('active');
            $('[data-ovb-prop="blendMode"]').val(blend).trigger('change');
        });

        // Quick Glow Presets
        $(document).on('click', '.ovb-glow-preset', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento primeiro!', true);
                return;
            }
            const c1 = $(this).attr('data-c1');
            const c2 = $(this).attr('data-c2');
            const mode = $(this).attr('data-mode') || 'box';
            const blur = $(this).attr('data-blur') || 28;

            $('[data-ovb-prop="glowEnabled"]').prop('checked', true);
            $('[data-ovb-prop="glowColor"]').val(c1);
            $('[data-ovb-prop="glowColor2"]').val(c2);
            $('[data-ovb-prop="glowMode"]').val(mode);
            $('[data-ovb-prop="glowBlur"]').val(blur);
            $('[data-ovb-prop="glowIntensity"]').val(85);
            $('[data-ovb-prop="glowLayers"]').val(2);

            const rec = ensureElementRecord(currentSelector);
            Object.assign(rec.styles[currentBucket], {
                glowEnabled: true,
                glowColor: c1,
                glowColor2: c2,
                glowMode: mode,
                glowBlur: blur,
                glowIntensity: 85,
                glowLayers: 2
            });
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        // Test Entrance Animation Button
        $('#ovb-btn-test-anim').on('click', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento primeiro!', true);
                return;
            }
            const anim = $('[data-ovb-prop="entranceAnim"]').val();
            const dur = $('[data-ovb-prop="entranceDuration"]').val() || '0.75s';
            const delay = $('[data-ovb-prop="entranceDelay"]').val() || '0s';
            const easing = $('[data-ovb-prop="entranceEasing"]').val() || 'cubic-bezier(0.22, 1, 0.36, 1)';
            if (!anim || anim === 'none') {
                showToast('Escolha uma animação de entrada primeiro!', true);
                return;
            }
            postToPreview({
                type: 'OVB_TEST_ANIMATION',
                selector: currentSelector,
                anim: anim,
                duration: dur,
                delay: delay,
                easing: easing
            });
        });

        // Insert Widget / Block Cards
        $(document).on('click', '.ovb-widget-card', function () {
            const type = $(this).attr('data-widget');
            insertNewBlock(type);
        });

        // Element Custom CSS
        $('#ovb-element-custom-css').on('input', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.customCss = $(this).val();
            syncPreview();
        });

        // Global Theme Variables
        $(document).on('input change', '[data-ovb-gvar]', function () {
            const scope = $(this).attr('data-ovb-gscope') || 'all';
            const varName = $(this).attr('data-ovb-gvar');
            if (!state.globalVars) state.globalVars = { all: {}, dark: {}, light: {} };
            if (!state.globalVars[scope]) state.globalVars[scope] = {};
            state.globalVars[scope][varName] = $(this).val();
            syncPreview();
        });

        $('#ovb-btn-reset-gvars').on('click', function () {
            state.globalVars = { all: {}, dark: {}, light: {} };
            pushHistory();
            syncPreview();
            showToast('Variáveis globais restauradas para o padrão do tema!');
        });

        // Global Custom CSS
        $('#ovb-global-custom-css').on('input', function () {
            state.customCss = $(this).val();
            syncPreview();
        });

        // Layer Tree Click to Select Element
        $(document).on('click', '.ovb-tree-item', function (e) {
            if ($(e.target).closest('.ovb-del-rule').length) return;
            const sel = $(this).attr('data-sel');
            if (!sel) return;
            postToPreview({
                type: 'OVB_SELECT_SELECTOR',
                selector: sel,
                scroll: true
            });
        });

        // Delete Single Selector Rule from Modified List
        $(document).on('click', '.ovb-del-rule', function (e) {
            e.stopPropagation();
            const sel = $(this).attr('data-sel');
            if (sel && state.elements[sel]) {
                delete state.elements[sel];
                pushHistory();
                syncPreview();
                if (currentSelector === sel) populateSidebarFromSelection();
                showToast('Regra removida!');
            }
        });

        // Undo / Redo
        $('#ovb-btn-undo').on('click', function () {
            if (historyIdx > 0) {
                historyIdx--;
                state = deepClone(history[historyIdx]);
                updateUndoRedoButtons();
                syncPreview();
                populateSidebarFromSelection();
                populateGlobalVariables();
            }
        });

        $('#ovb-btn-redo').on('click', function () {
            if (historyIdx < history.length - 1) {
                historyIdx++;
                state = deepClone(history[historyIdx]);
                updateUndoRedoButtons();
                syncPreview();
                populateSidebarFromSelection();
                populateGlobalVariables();
            }
        });

        $(document).on('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && !$(e.target).is('input, textarea')) {
                if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    $('#ovb-btn-undo').trigger('click');
                } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    $('#ovb-btn-redo').trigger('click');
                } else if (e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    $('#ovb-btn-save').trigger('click');
                }
            }
        });

        // Export JSON Backup
        $('#ovb-btn-export').on('click', function () {
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `odyssee-visual-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // Import JSON Backup
        $('#ovb-btn-import-trigger').on('click', function () {
            $('#ovb-import-file').trigger('click');
        });

        $('#ovb-import-file').on('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    const parsed = JSON.parse(ev.target.result);
                    state = normalizeData(parsed);
                    pushHistory();
                    syncPreview();
                    populateSidebarFromSelection();
                    populateGlobalVariables();
                    showToast('Backup importado com sucesso!');
                } catch (err) {
                    showToast('Arquivo JSON inválido', true);
                }
            };
            reader.readAsText(file);
        });

        // Reset Everything
        $('#ovb-btn-reset-all').on('click', function () {
            if (!confirm('Tem certeza que deseja limpar todas as personalizações visuais do Odyssee Studio? O tema original permanecerá intacto.')) {
                return;
            }
            state = { elements: {}, blocks: [], globalVars: { all: {}, dark: {}, light: {} }, customCss: '' };
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            populateGlobalVariables();
            showToast('Todas as customizações foram limpas. Clique em Salvar para confirmar.');
        });

        // Save & Publish via AJAX
        $('#ovb-btn-save').on('click', function () {
            const $btn = $(this);
            $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Salvando...');

            $.post(adminCfg.ajaxurl, {
                action: 'odyssee_vb_save',
                nonce: adminCfg.nonce,
                data: JSON.stringify(state)
            }).done(function (res) {
                if (res && res.success) {
                    showToast('✨ Alterações salvas e publicadas com sucesso!');
                } else {
                    showToast((res && res.data) || 'Erro ao salvar.', true);
                }
            }).fail(function () {
                showToast('Falha de conexão ao salvar.', true);
            }).always(function () {
                $btn.prop('disabled', false).html('<i class="fas fa-check-circle"></i> Salvar & Publicar');
            });
        });
    });
})(jQuery);
