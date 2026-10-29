/**
 * Odyssee Visual Studio — Full Admin Editor Controller
 * Supports interactive canvas Drag-to-Move, 8-point Resize, DOM Reordering, Clones, and All Computed Styles
 */
(function ($) {
    'use strict';

    const adminCfg = window.odysseeVBAdmin || {
        ajaxurl: '',
        nonce: '',
        homeUrl: '/',
        initialData: { presetName: 'OdysseeXP', uiStyle: 'odysseexp', iconPack: 'default', blankMode: false, elements: {}, blocks: [], domMoves: [], clones: [], globalVars: {}, customCss: '', customJs: '' },
        presets: {}
    };

    let savedPresets = adminCfg.presets || {};
    let state = deepClone(normalizeData(adminCfg.initialData));
    let history = [deepClone(state)];
    let historyIdx = 0;
    let latestCompiledCss = '';

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
            presetName: typeof d.presetName === 'string' && d.presetName ? d.presetName : 'OdysseeXP',
            uiStyle: typeof d.uiStyle === 'string' && d.uiStyle ? d.uiStyle : 'odysseexp',
            iconPack: typeof d.iconPack === 'string' && d.iconPack ? d.iconPack : 'default',
            blankMode: !!d.blankMode,
            elements: d.elements && typeof d.elements === 'object' && !Array.isArray(d.elements) ? d.elements : {},
            blocks: Array.isArray(d.blocks) ? d.blocks : [],
            domMoves: Array.isArray(d.domMoves) ? d.domMoves : [],
            clones: Array.isArray(d.clones) ? d.clones : [],
            globalVars: d.globalVars && typeof d.globalVars === 'object' && !Array.isArray(d.globalVars) ? d.globalVars : { all: {}, dark: {}, light: {} },
            customCss: typeof d.customCss === 'string' ? d.customCss : '',
            customJs: typeof d.customJs === 'string' ? d.customJs : ''
        };
    }

    function pushHistory() {
        history = history.slice(0, historyIdx + 1);
        history.push(deepClone(state));
        if (history.length > 50) history.shift();
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
                content: { attrs: {} },
                styles: {
                    desktop: { rawCssProps: {} },
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
        if (!rec.styles[currentBucket].rawCssProps) rec.styles[currentBucket].rawCssProps = {};
        if (!rec.content) rec.content = {};
        if (!rec.content.attrs) rec.content.attrs = {};
        return rec;
    }

    function rgbToHex(rgb) {
        if (!rgb) return '#8b5cf6';
        rgb = String(rgb).trim();
        if (rgb.startsWith('#')) {
            if (rgb.length === 4) {
                return '#' + rgb.slice(1).split('').map(c => c + c).join('');
            }
            return rgb.slice(0, 7);
        }
        const m = rgb.match(/\d+/g);
        if (!m || m.length < 3) return '#8b5cf6';
        return '#' + m.slice(0, 3).map(x => parseInt(x, 10).toString(16).padStart(2, '0')).join('');
    }

    /**
     * Populates all sidebar inputs from the currently selected element & its live computed styles
     */
    function populateSidebarFromSelection() {
        const bannerLabel = $('#ovb-sel-label');
        const bannerSel = $('#ovb-sel-selector');

        if (!currentSelector) {
            bannerLabel.text('Nenhum elemento selecionado');
            bannerSel.text('Clique ou arraste qualquer item do site ao lado →');
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

        // Content Tab (PT + EN text, Image URLs, Href, Attributes)
        const textVal = content.text !== undefined ? content.text : ((currentSnapshot && currentSnapshot.text) || '');
        $('#ovb-content-text').val(textVal);
        $('#ovb-content-text-en').val(content.textEn || '');

        const srcVal = content.src !== undefined ? content.src : ((currentSnapshot && currentSnapshot.src) || '');
        $('#ovb-content-src').val(srcVal);
        $('#ovb-content-src-dark').val(content.srcDark || '');
        $('#ovb-content-src-light').val(content.srcLight || '');

        const hrefVal = content.href !== undefined ? content.href : ((currentSnapshot && currentSnapshot.href) || '');
        $('#ovb-content-href').val(hrefVal);

        // Native Attributes Inspector Table
        renderAttributesList(content.attrs || {}, (currentSnapshot && currentSnapshot.attrs) || {});

        // Computed Styles & Custom Raw CSS Properties Table
        renderComputedInspector(st.rawCssProps || {}, comp);

        // Custom Block or Clone Controls
        const blockId = (currentSnapshot && currentSnapshot.blockId) || (currentSelector.startsWith('#ovb_blk_') ? currentSelector.slice(1) : null);
        const blockObj = blockId ? (state.blocks || []).find(b => b.id === blockId) : null;
        if (blockObj) {
            $('#ovb-custom-block-editor').show();
            $('#ovb-block-edit-html').val((blockObj.content && (blockObj.content.html || blockObj.content.text || blockObj.content.title)) || '');
        } else {
            $('#ovb-custom-block-editor').hide();
        }

        // Bind all [data-ovb-prop] fields, falling back to live computed values so every pre-existing style is visible!
        $('[data-ovb-prop]').each(function () {
            const $el = $(this);
            const prop = $el.attr('data-ovb-prop');
            const savedVal = st[prop] !== undefined ? st[prop] : dSt[prop];
            const compVal = comp[prop];
            const effectiveVal = savedVal !== undefined ? savedVal : (compVal !== undefined ? compVal : '');

            if ($el.attr('type') === 'checkbox') {
                $el.prop('checked', !!savedVal);
            } else if ($el.attr('type') === 'color') {
                if (effectiveVal && effectiveVal !== 'rgba(0, 0, 0, 0)' && effectiveVal !== 'transparent' && effectiveVal !== 'none') {
                    $el.val(rgbToHex(effectiveVal));
                }
            } else {
                $el.val(effectiveVal !== undefined && effectiveVal !== null ? effectiveVal : '');
            }
        });

        // Sync range sliders with their partner inputs or computed values
        $('.ovb-range[data-ovb-range-for]').each(function () {
            const prop = $(this).attr('data-ovb-range-for');
            const savedVal = st[prop] !== undefined ? st[prop] : dSt[prop];
            const compVal = comp[prop];
            const rawVal = savedVal !== undefined ? savedVal : (compVal !== undefined ? compVal : ($(this).attr('data-default') || 0));
            const numeric = parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
            if (!isNaN(numeric)) {
                $(this).val(numeric);
            }
        });

        // Highlight active blend mode pill
        const activeBlend = st.blendMode || dSt.blendMode || comp.mixBlendMode || 'normal';
        $('.ovb-blend-pill').removeClass('active');
        $(`.ovb-blend-pill[data-blend="${activeBlend}"]`).addClass('active');

        // Element Custom CSS (both sidebar & Code IDE Drawer)
        $('#ovb-element-custom-css').val(rec.customCss || '');
        $('#ovb-code-el-css-editor').val(rec.customCss || '');
        $('#ovb-code-el-label').text(currentSelector);

        // Element Raw innerHTML in Code IDE Drawer
        const rawHtml = content.innerHTML !== undefined ? content.innerHTML : ((currentSnapshot && currentSnapshot.innerHTML) || '');
        $('#ovb-code-el-html-editor').val(rawHtml);
    }

    /**
     * Renders the editable HTML/SVG Attributes table for the selected element
     */
    function renderAttributesList(savedAttrs, liveAttrs) {
        const container = $('#ovb-attrs-list');
        container.empty();

        const merged = Object.assign({}, liveAttrs, savedAttrs);
        const entries = Object.entries(merged);

        if (entries.length === 0) {
            container.html('<p style="color:#64748b;font-size:11px;margin:0;">Nenhum atributo extra neste elemento.</p>');
            return;
        }

        entries.forEach(([attrName, attrVal]) => {
            const row = $(`
                <div class="ovb-field-row" style="margin-bottom:4px;">
                    <span style="font-family:monospace;font-size:11px;color:#38bdf8;width:115px;overflow:hidden;text-overflow:ellipsis;" title="${$('<div>').text(attrName).html()}">${$('<div>').text(attrName).html()}</span>
                    <input type="text" class="ovb-input ovb-attr-input" data-attr-name="${$('<div>').text(attrName).html()}" value="${$('<div>').text(attrVal).html()}" style="flex:1;padding:3px 6px !important;font-size:11px !important;">
                </div>
            `);
            container.append(row);
        });
    }

    /**
     * Renders the Full Computed Styles Inspector so the user can see and edit ANY CSS property
     */
    function renderComputedInspector(rawCssProps, comp) {
        const container = $('#ovb-computed-inspector-list');
        container.empty();

        const keyProps = [
            ['display', comp.display],
            ['position', comp.position],
            ['translate', `${comp.translateX || '0px'} ${comp.translateY || '0px'}`],
            ['width', comp.width],
            ['height', comp.height],
            ['font-size', comp.fontSize],
            ['font-weight', comp.fontWeight],
            ['color', comp.color],
            ['background-color', comp.backgroundColor],
            ['border-radius', comp.borderRadius],
            ['mix-blend-mode', comp.mixBlendMode],
            ['filter', comp.filter || 'none'],
            ['box-shadow', comp.boxShadow || 'none']
        ];

        // Merge any custom rawCssProps added by user
        Object.entries(rawCssProps || {}).forEach(([k, v]) => {
            const existing = keyProps.find(p => p[0] === k);
            if (existing) {
                existing[1] = v;
            } else {
                keyProps.unshift([k, v]);
            }
        });

        keyProps.forEach(([propName, propVal]) => {
            const isOverridden = rawCssProps && rawCssProps[propName] !== undefined;
            const row = $(`
                <div class="ovb-field-row" style="margin-bottom:4px;">
                    <span style="font-family:monospace;font-size:10.5px;color:${isOverridden ? '#c084fc' : '#94a3b8'};width:115px;overflow:hidden;text-overflow:ellipsis;" title="${propName}">${propName}</span>
                    <input type="text" class="ovb-input ovb-raw-css-input" data-css-prop="${propName}" value="${$('<div>').text(propVal || '').html()}" style="flex:1;padding:3px 6px !important;font-size:11px !important;">
                </div>
            `);
            container.append(row);
        });
    }

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
     * Renders the Complete Categorized Base Elements Tree in Tab 4 (with live search filter)
     */
    function renderNavigatorTree() {
        const container = $('#ovb-navigator-tree');
        const filterText = ($('#ovb-tree-search').val() || '').toLowerCase().trim();
        container.empty();

        if (!pageTree || pageTree.length === 0) {
            container.html('<p style="color:#64748b;font-size:11.5px;">Carregando elementos base da página...</p>');
            return;
        }

        pageTree.forEach(group => {
            const groupMatch = !filterText || group.label.toLowerCase().includes(filterText) || (group.selector && group.selector.toLowerCase().includes(filterText));
            const matchingChildren = (group.children || []).filter(ch =>
                !filterText || ch.label.toLowerCase().includes(filterText) || (ch.selector && ch.selector.toLowerCase().includes(filterText))
            );

            if (!groupMatch && matchingChildren.length === 0) return;

            const isMod = !!state.elements[group.selector];
            const groupBox = $('<div style="margin-bottom:8px;"></div>');
            const headerRow = $(`
                <div class="ovb-tree-item ${isMod ? 'is-modified' : ''}" data-sel="${$('<div>').text(group.selector).html()}" style="font-weight:700;background:#161f33;">
                    <span>${$('<div>').text(group.label).html()}</span>
                    <span style="font-size:10px;color:#c084fc;">${isMod ? '● Editado' : `${matchingChildren.length} itens`}</span>
                </div>
            `);
            groupBox.append(headerRow);

            if (matchingChildren.length > 0) {
                const childWrap = $('<div class="ovb-tree-children"></div>');
                matchingChildren.forEach(ch => {
                    const chMod = !!state.elements[ch.selector];
                    const chRow = $(`
                        <div class="ovb-tree-item ${chMod ? 'is-modified' : ''} ${ch.isBlock ? 'is-block' : ''}" data-sel="${$('<div>').text(ch.selector).html()}">
                            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${$('<div>').text(ch.label).html()}</span>
                            <span style="font-size:10px;color:#a855f7;">${chMod ? '●' : ''}</span>
                        </div>
                    `);
                    childWrap.append(chRow);
                });
                groupBox.append(childWrap);
            }

            container.append(groupBox);
        });
    }

    function renderModifiedElementsList() {
        const list = $('#ovb-modified-list');
        list.empty();
        const keys = Object.keys(state.elements || {});
        if (keys.length === 0 && (!state.blocks || state.blocks.length === 0) && (!state.domMoves || state.domMoves.length === 0)) {
            list.html('<p style="color:#64748b;font-size:11.5px;margin:0;">Nenhuma customização ativa ainda.</p>');
            return;
        }

        keys.forEach(sel => {
            const item = $(`
                <div class="ovb-tree-item is-modified" data-sel="${$('<div>').text(sel).html()}">
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px;" title="${$('<div>').text(sel).html()}">${$('<div>').text(sel).html()}</span>
                    <button type="button" class="ovb-mini-btn ovb-del-rule" data-sel="${$('<div>').text(sel).html()}" title="Restaurar este elemento">✕</button>
                </div>
            `);
            list.append(item);
        });
    }

    function insertNewBlock(type) {
        const targetSel = currentSelector || '#home';
        const pos = $('#ovb-insert-position').val() || 'after';
        const id = 'ovb_blk_' + Math.random().toString(36).substring(2, 8);

        const defaultContents = {
            'heading': { tag: 'h2', text: 'Título Criativo com Efeito' },
            'text': { html: '<p>Texto personalizado adicionado pelo Odyssee Studio. Clique e arraste para mover ou edite tipografia, cores, glow e animações.</p>' },
            'button': { text: 'Explorar Agora', url: '#contato', icon: 'fas fa-bolt' },
            'image': { src: '/wp-content/uploads/2025/11/typewhite.webp', alt: 'Imagem Odyssee' },
            'card': { icon: 'fas fa-wand-magic-sparkles', title: 'Card em Destaque', desc: 'Personalize este card com glassmorphism, glow neon, blend modes e tilt 3D.' },
            'shape-square': {},
            'shape-circle': {},
            'shape-bar': {},
            'shape-squircle': {},
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

        showToast('Novo elemento inserido! Arraste-o com o mouse para posicionar onde quiser.');
    }

    function updateCompiledCodeDisplay() {
        const header = `/* ==========================================================================\n` +
            ` * PREDEFINIÇÃO ATIVA: ${state.presetName || 'OdysseeXP'}\n` +
            ` * DESIGN SYSTEM UI:   ${state.uiStyle || 'odysseexp'}\n` +
            ` * PACOTE DE ÍCONES:   ${state.iconPack || 'default'}\n` +
            ` * ==========================================================================\n` +
            ` * 1) CSS COMPILADO DO TEMA (assets/css/theme-preset-active.css):\n` +
            ` * ========================================================================== */\n\n` +
            (latestCompiledCss || '/* Nenhuma regra CSS customizada ainda */') +
            `\n\n/* ==========================================================================\n` +
            ` * 2) PREDEFINIÇÃO JSON COMPLETA (presets/${(state.presetName || 'odysseexp').toLowerCase().replace(/\s+/g, '-')}.json):\n` +
            ` * ==========================================================================\n` +
            JSON.stringify(state, null, 2) +
            `\n*/`;
        $('#ovb-code-compiled-readonly').val(header);
    }

    function renderPresetsDropdown() {
        const $sel = $('#ovb-preset-selector');
        $sel.empty();
        Object.keys(savedPresets).forEach(name => {
            const label = name === 'OdysseeXP' ? '⚡ OdysseeXP (Tema Principal)' : (name === 'Tema em Branco' ? '📄 Tema em Branco (Criar do Zero)' : `🎨 ${name}`);
            const opt = $('<option></option>').val(name).text(label);
            if (name === (state.presetName || 'OdysseeXP')) {
                opt.prop('selected', true);
            }
            $sel.append(opt);
        });
    }

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

        // Sync UI Design System & Icon Pack & Preset controls
        const activeUi = state.uiStyle || 'odysseexp';
        $('.ovb-uistyle-card').removeClass('active');
        $(`.ovb-uistyle-card[data-uistyle="${activeUi}"]`).addClass('active');
        $('#ovb-topbar-uistyle').val(activeUi);
        $('#ovb-iconpack-select').val(state.iconPack || 'default');

        const pName = state.presetName || 'OdysseeXP';
        $('#ovb-preset-name-input').val(pName);
        $('#ovb-active-preset-badge').text(pName);
        $('#ovb-blank-mode-toggle').prop('checked', !!state.blankMode);
        renderPresetsDropdown();
        updateCompiledCodeDisplay();
    }

    $(document).ready(function () {
        populateGlobalVariables();
        renderModifiedElementsList();
        updateUndoRedoButtons();

        window.addEventListener('message', (event) => {
            const msg = event.data;
            if (!msg || typeof msg !== 'object' || !msg.type) return;

            switch (msg.type) {
                case 'OVB_PREVIEW_READY': {
                    pageTree = msg.tree || [];
                    if (msg.compiledCss !== undefined) {
                        latestCompiledCss = msg.compiledCss;
                        updateCompiledCodeDisplay();
                    }
                    renderNavigatorTree();
                    syncPreview();
                    break;
                }
                case 'OVB_COMPILED_CSS': {
                    latestCompiledCss = msg.compiledCss || '';
                    updateCompiledCodeDisplay();
                    break;
                }
                case 'OVB_ELEMENT_SELECTED': {
                    currentSelector = msg.selector;
                    currentSnapshot = msg.snapshot || {};
                    populateSidebarFromSelection();
                    break;
                }
                case 'OVB_CANVAS_TRANSFORMED': {
                    // Triggered when user drags an element or resize handle directly on the canvas!
                    const sel = msg.selector || currentSelector;
                    if (!sel) break;
                    currentSelector = sel;
                    if (msg.snapshot) currentSnapshot = msg.snapshot;
                    const rec = ensureElementRecord(sel);
                    Object.assign(rec.styles[currentBucket], msg.changes || {});
                    pushHistory();
                    syncPreview();
                    populateSidebarFromSelection();
                    break;
                }
                case 'OVB_DOM_MOVED': {
                    if (msg.move) {
                        if (!Array.isArray(state.domMoves)) state.domMoves = [];
                        state.domMoves.push(msg.move);
                        pushHistory();
                        showToast('Ordem do elemento atualizada na estrutura da página!');
                    }
                    if (msg.tree) {
                        pageTree = msg.tree;
                        renderNavigatorTree();
                    }
                    break;
                }
                case 'OVB_DUPLICATE_ELEMENT': {
                    const srcSel = msg.selector || currentSelector;
                    if (!srcSel) break;
                    const cloneId = 'ovb_clone_' + Math.random().toString(36).substring(2, 8);
                    if (!Array.isArray(state.clones)) state.clones = [];
                    state.clones.push({
                        id: cloneId,
                        sourceSelector: srcSel
                    });
                    // Copy styles from source if any, offset slightly so user sees the copy
                    const srcRec = state.elements[srcSel] ? deepClone(state.elements[srcSel]) : {
                        themeScope: 'all',
                        content: {},
                        styles: { desktop: {} }
                    };
                    if (!srcRec.styles) srcRec.styles = { desktop: {} };
                    if (!srcRec.styles.desktop) srcRec.styles.desktop = {};
                    srcRec.styles.desktop.translateX = '24px';
                    srcRec.styles.desktop.translateY = '24px';
                    state.elements['#' + cloneId] = srcRec;

                    pushHistory();
                    syncPreview();
                    setTimeout(() => {
                        postToPreview({ type: 'OVB_SELECT_SELECTOR', selector: '#' + cloneId, scroll: false });
                        postToPreview({ type: 'OVB_REQUEST_TREE' });
                    }, 100);
                    showToast('Elemento duplicado! Arraste a cópia para onde desejar.');
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
                    if (sel) {
                        delete state.elements[sel];
                        state.domMoves = (state.domMoves || []).filter(m => m.selector !== sel);
                        if (sel.startsWith('#ovb_clone_')) {
                            const cid = sel.slice(1);
                            state.clones = (state.clones || []).filter(c => c.id !== cid);
                        }
                        pushHistory();
                        syncPreview();
                        populateSidebarFromSelection();
                        showToast('Elemento restaurado ao original!');
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

        // Search filter in Base Elements Navigator
        $('#ovb-tree-search').on('input', function () {
            renderNavigatorTree();
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

            if (dev === 'tablet' || dev === 'mobile' || dev === 'desktop') {
                currentBucket = dev;
                $('#ovb-state-bucket').val(dev);
                populateSidebarFromSelection();
            }
        });

        // State Bucket Switcher
        $('#ovb-state-bucket').on('change', function () {
            currentBucket = $(this).val();
            populateSidebarFromSelection();
        });

        // Element Theme Scope
        $('#ovb-theme-scope').on('change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.themeScope = $(this).val();
            pushHistory();
            syncPreview();
        });

        // Preview Theme & Accent & Onboarding toggles
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

        // Interactive Mode Toggle (Navigate vs Select/Drag)
        $('#ovb-toggle-interactive').on('click', function () {
            $(this).toggleClass('active');
            const interactive = $(this).hasClass('active');
            postToPreview({ type: 'OVB_SET_INTERACTIVE_MODE', interactive: interactive });
            showToast(interactive ? 'Modo Navegação Livre ativado (cliques normais no site)' : 'Modo Editor (Selecionar, Arrastar e Redimensionar) ativado');
        });

        // Quick Structural & Position Actions in Sidebar
        $('#ovb-btn-select-parent').on('click', function () {
            postToPreview({ type: 'OVB_SELECT_PARENT' });
        });

        $('#ovb-btn-dom-up').on('click', function () {
            postToPreview({ type: 'OVB_MOVE_DOM_STEP', dir: 'up' });
        });

        $('#ovb-btn-dom-down').on('click', function () {
            postToPreview({ type: 'OVB_MOVE_DOM_STEP', dir: 'down' });
        });

        $('#ovb-btn-center-xy').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].translateX = '0px';
            rec.styles[currentBucket].translateY = '0px';
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            showToast('Posição X/Y centralizada (0px, 0px)!');
        });

        $('#ovb-btn-duplicate-el').on('click', function () {
            if (!currentSelector) return;
            window.postMessage({ type: 'OVB_DUPLICATE_ELEMENT', selector: currentSelector }, '*');
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
            window.postMessage({ type: 'OVB_RESET_ELEMENT', selector: currentSelector }, '*');
        });

        // Content Overrides (Text PT, Text EN, Image Src, Dark/Light Src, Link Href)
        $('#ovb-content-text').on('input', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.content.text = $(this).val();
            syncPreview();
        });

        $('#ovb-content-text-en').on('input', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.content.textEn = $(this).val();
            syncPreview();
        });

        $('#ovb-content-src').on('input change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.content.src = $(this).val();
            syncPreview();
        });

        $('#ovb-content-src-dark').on('input change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.content.srcDark = $(this).val();
            syncPreview();
        });

        $('#ovb-content-src-light').on('input change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.content.srcLight = $(this).val();
            syncPreview();
        });

        $('#ovb-content-href').on('input change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.content.href = $(this).val();
            syncPreview();
        });

        // Live HTML / SVG Attributes Editing
        $(document).on('input change', '.ovb-attr-input', function () {
            if (!currentSelector) return;
            const attrName = $(this).attr('data-attr-name');
            const attrVal = $(this).val();
            const rec = ensureElementRecord(currentSelector);
            rec.content.attrs[attrName] = attrVal;
            syncPreview();
        });

        $('#ovb-btn-add-attr').on('click', function () {
            if (!currentSelector) return;
            const name = $('#ovb-new-attr-name').val().trim();
            const val = $('#ovb-new-attr-val').val();
            if (!name) return;
            const rec = ensureElementRecord(currentSelector);
            rec.content.attrs[name] = val;
            $('#ovb-new-attr-name').val('');
            $('#ovb-new-attr-val').val('');
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        // Live Computed / Raw CSS Properties Inspector Editing
        $(document).on('input change', '.ovb-raw-css-input', function () {
            if (!currentSelector) return;
            const cssProp = $(this).attr('data-css-prop');
            const cssVal = $(this).val();
            const rec = ensureElementRecord(currentSelector);
            if (!rec.styles[currentBucket].rawCssProps) rec.styles[currentBucket].rawCssProps = {};
            if (cssVal === '') {
                delete rec.styles[currentBucket].rawCssProps[cssProp];
            } else {
                rec.styles[currentBucket].rawCssProps[cssProp] = cssVal;
            }
            syncPreview();
        });

        $('#ovb-btn-add-raw-css').on('click', function () {
            if (!currentSelector) return;
            const prop = $('#ovb-new-css-prop').val().trim();
            const val = $('#ovb-new-css-val').val().trim();
            if (!prop) return;
            const rec = ensureElementRecord(currentSelector);
            if (!rec.styles[currentBucket].rawCssProps) rec.styles[currentBucket].rawCssProps = {};
            rec.styles[currentBucket].rawCssProps[prop] = val;
            $('#ovb-new-css-prop').val('');
            $('#ovb-new-css-val').val('');
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
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

        // ==========================================
        // GLOBAL UI DESIGN SYSTEM & ICON PACK SWITCHERS
        // ==========================================
        $(document).on('click', '.ovb-uistyle-card', function () {
            const uiStyle = $(this).attr('data-uistyle') || 'odysseexp';
            $('.ovb-uistyle-card').removeClass('active');
            $(this).addClass('active');
            $('#ovb-topbar-uistyle').val(uiStyle);
            state.uiStyle = uiStyle;
            pushHistory();
            syncPreview();
            updateCompiledCodeDisplay();
            showToast(`🎨 Estilo da Página alterado para: ${$(this).find('.ovb-uistyle-card-title span').first().text()}!`);
        });

        $('#ovb-topbar-uistyle').on('change', function () {
            const uiStyle = $(this).val() || 'odysseexp';
            $('.ovb-uistyle-card').removeClass('active');
            $(`.ovb-uistyle-card[data-uistyle="${uiStyle}"]`).addClass('active');
            state.uiStyle = uiStyle;
            pushHistory();
            syncPreview();
            updateCompiledCodeDisplay();
            showToast(`🎨 Estilo da Página alterado para: ${uiStyle}!`);
        });

        $('#ovb-iconpack-select').on('change', function () {
            state.iconPack = $(this).val() || 'default';
            pushHistory();
            syncPreview();
            updateCompiledCodeDisplay();
            showToast('✨ Pacote de Ícones atualizado em toda a página!');
        });

        // ==========================================
        // LIVE CODE EDITOR IDE ("PROGRAMAR POR CÓDIGO / NA LATA")
        // ==========================================
        $('#ovb-toggle-code-drawer, #ovb-btn-open-code-export').on('click', function () {
            const drawer = $('#ovb-code-drawer');
            drawer.toggleClass('open');
            $('#ovb-toggle-code-drawer').toggleClass('active', drawer.hasClass('open'));
            if (drawer.hasClass('open')) {
                updateCompiledCodeDisplay();
            }
        });

        $('#ovb-code-close').on('click', function () {
            $('#ovb-code-drawer').removeClass('open maximized');
            $('#ovb-toggle-code-drawer').removeClass('active');
        });

        $('#ovb-code-maximize').on('click', function () {
            const drawer = $('#ovb-code-drawer');
            drawer.toggleClass('maximized');
            $(this).text(drawer.hasClass('maximized') ? '⤡ Restaurar' : '⤢ Expandir');
        });

        $(document).on('click', '.ovb-code-tab', function () {
            const paneId = $(this).attr('data-codetab');
            $('.ovb-code-tab').removeClass('active');
            $(this).addClass('active');
            $('.ovb-code-pane').removeClass('active');
            $('#' + paneId).addClass('active');
            if (paneId === 'pane-gemini-export') {
                updateCompiledCodeDisplay();
            }
        });

        // Support Tab key indentation inside Code Editor textareas
        $(document).on('keydown', '.ovb-code-editor-textarea', function (e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const val = $(this).val();
                $(this).val(val.substring(0, start) + '  ' + val.substring(end));
                this.selectionStart = this.selectionEnd = start + 2;
                $(this).trigger('input');
            }
        });

        // Element Custom CSS (synced between sidebar and Code IDE Drawer)
        $('#ovb-element-custom-css, #ovb-code-el-css-editor').on('input', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento na página primeiro!', true);
                return;
            }
            const val = $(this).val();
            $('#ovb-element-custom-css').not(this).val(val);
            $('#ovb-code-el-css-editor').not(this).val(val);
            const rec = ensureElementRecord(currentSelector);
            rec.customCss = val;
            syncPreview();
        });

        $('#ovb-btn-insert-selector-tpl').on('click', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento na página primeiro!', true);
                return;
            }
            const cur = $('#ovb-code-el-css-editor').val();
            const tpl = (cur ? cur + '\n\n' : '') + `selector {\n  \n}`;
            $('#ovb-code-el-css-editor').val(tpl).trigger('input').focus();
        });

        // Element Raw innerHTML editing in Code IDE Drawer
        $('#ovb-code-el-html-editor').on('input', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento na página primeiro!', true);
                return;
            }
            const rec = ensureElementRecord(currentSelector);
            rec.content.innerHTML = $(this).val();
            syncPreview();
        });

        $('#ovb-btn-restore-el-html').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            delete rec.content.innerHTML;
            pushHistory();
            syncPreview();
            showToast('HTML original do elemento restaurado!');
        });

        // Copy Compiled CSS & Copy Preset JSON for Gemini
        $('#ovb-btn-copy-compiled-css').on('click', function () {
            navigator.clipboard.writeText(latestCompiledCss || '');
            showToast('📋 CSS Compilado copiado para a área de transferência!');
        });

        $('#ovb-btn-copy-preset-json').on('click', function () {
            navigator.clipboard.writeText(JSON.stringify(state, null, 2));
            showToast('📋 Predefinição JSON copiada! Pronta para colar no Gemini.');
        });

        // ==========================================
        // GLOBAL THEME VARIABLES & GLOBAL CSS NA LATA
        // ==========================================
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

        // Global Custom CSS ("Editar CSS na lata")
        $('#ovb-global-custom-css').on('input', function () {
            state.customCss = $(this).val();
            syncPreview();
        });

        // ==========================================
        // PRESETS MANAGER (OdysseeXP / Tema em Branco / Named Presets)
        // ==========================================
        $('#ovb-preset-name-input').on('input change', function () {
            const name = $(this).val().trim() || 'OdysseeXP';
            state.presetName = name;
            $('#ovb-active-preset-badge').text(name);
            updateCompiledCodeDisplay();
        });

        $('#ovb-blank-mode-toggle').on('change', function () {
            state.blankMode = $(this).is(':checked');
            pushHistory();
            syncPreview();
            showToast(state.blankMode ? 'Modo Tema em Branco ativado (seções originais ocultas para criar do zero)!' : 'Modo Tema OdysseeXP completo ativado!');
        });

        $('#ovb-btn-load-preset').on('click', function () {
            const chosen = $('#ovb-preset-selector').val();
            if (!chosen || !savedPresets[chosen]) return;
            state = deepClone(normalizeData(savedPresets[chosen]));
            state.presetName = chosen;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            populateGlobalVariables();
            showToast(`Predefinição '${chosen}' carregada com sucesso!`);
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

        // Export Preset JSON
        $('#ovb-btn-export').on('click', function () {
            const slug = (state.presetName || 'odysseexp').toLowerCase().replace(/\s+/g, '-');
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `preset-${slug}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // Export Compiled Theme CSS
        $('#ovb-btn-export-css').on('click', function () {
            const slug = (state.presetName || 'odysseexp').toLowerCase().replace(/\s+/g, '-');
            const cssContent = `/**\n * Odyssee Theme Preset: ${state.presetName || 'OdysseeXP'}\n * Design System UI: ${state.uiStyle || 'odysseexp'}\n * Icon Pack: ${state.iconPack || 'default'}\n */\n\n` + (latestCompiledCss || '');
            const blob = new Blob([cssContent], { type: 'text/css' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `theme-preset-${slug}.css`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // Import JSON Preset
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
                    savedPresets[state.presetName] = deepClone(state);
                    pushHistory();
                    syncPreview();
                    populateSidebarFromSelection();
                    populateGlobalVariables();
                    showToast(`Predefinição '${state.presetName}' importada com sucesso!`);
                } catch (err) {
                    showToast('Arquivo JSON inválido', true);
                }
            };
            reader.readAsText(file);
        });

        // Reset Everything
        $('#ovb-btn-reset-all').on('click', function () {
            if (!confirm('Tem certeza que deseja limpar todas as personalizações visuais? O tema padrão OdysseeXP permanecerá intacto.')) {
                return;
            }
            state = normalizeData({ presetName: 'OdysseeXP', uiStyle: 'odysseexp', iconPack: 'default', blankMode: false });
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            populateGlobalVariables();
            showToast('Personalizações resetadas para o padrão OdysseeXP. Clique em Salvar para confirmar.');
        });

        // Save & Publish via AJAX (Also writes presets/odysseexp.json and assets/css/theme-preset-active.css!)
        $('#ovb-btn-save').on('click', function () {
            const $btn = $(this);
            const pName = $('#ovb-preset-name-input').val().trim() || state.presetName || 'OdysseeXP';
            state.presetName = pName;
            $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Salvando...');

            $.post(adminCfg.ajaxurl, {
                action: 'odyssee_vb_save',
                nonce: adminCfg.nonce,
                data: JSON.stringify(state),
                compiledCss: latestCompiledCss || ''
            }).done(function (res) {
                if (res && res.success) {
                    if (res.data && res.data.presets) {
                        savedPresets = res.data.presets;
                        renderPresetsDropdown();
                    }
                    showToast(res.data && res.data.message ? `✨ ${res.data.message}` : '✨ Salvo com sucesso!');
                } else {
                    showToast((res && res.data) || 'Erro ao salvar.', true);
                }
            }).fail(function () {
                showToast('Falha de conexão ao salvar.', true);
            }).always(function () {
                $btn.prop('disabled', false).html(`<i class="fas fa-check-circle"></i> Salvar (<span id="ovb-active-preset-badge">${$('<div>').text(state.presetName).html()}</span>)`);
            });
        });
    });
})(jQuery);
