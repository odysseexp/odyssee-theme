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
    let currentBucket = 'desktop'; // 'desktop', 'tablet', 'mobile', 'global', 'hover', 'dark', 'light'
    let aspectRatioLocked = true;
    let uiStyleTargetMode = 'element'; // 'element' (Individual) or 'global' (Site-wide)
    let layerViewMode = 'sections'; // 'sections' or 'zstack'
    let copiedElementStyle = null;
    let pageTree = [];
    let currentAlignScope = 'parent'; // 'parent' (camada pai) or 'global' (página inteira)
    let isPickingTarget = false;
    let targetPickerProp = null;

    const BUCKET_LABELS = {
        desktop: '🖥️ Só Desktop (≥1025px)',
        tablet: '📱 Só Tablet (769–1024px)',
        mobile: '📲 Só Mobile (≤768px)',
        global: '🌐 Todos Dispositivos',
        hover: '👆 Hover (Mouse)',
        dark: '🌙 Tema Escuro',
        light: '☀️ Tema Claro'
    };

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
            customJs: typeof d.customJs === 'string' ? d.customJs : '',
            componentPresets: Array.isArray(d.componentPresets) ? d.componentPresets : [],
            pagePresets: d.pagePresets && typeof d.pagePresets === 'object' && !Array.isArray(d.pagePresets) ? d.pagePresets : {},
            sitePresets: d.sitePresets && typeof d.sitePresets === 'object' && !Array.isArray(d.sitePresets) ? d.sitePresets : {},
            colorPalettes: Array.isArray(d.colorPalettes) ? d.colorPalettes : [],
            activeGlobalPalette: typeof d.activeGlobalPalette === 'string' ? d.activeGlobalPalette : '',
            pagePalettes: d.pagePalettes && typeof d.pagePalettes === 'object' && !Array.isArray(d.pagePalettes) ? d.pagePalettes : {},
            allowVisitorColorSwitch: d.allowVisitorColorSwitch !== undefined ? !!d.allowVisitorColorSwitch : true
        };
    }

    function pushHistory() {
        history = history.slice(0, historyIdx + 1);
        history.push(deepClone(state));
        if (history.length > 60) history.shift();
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
    const postToIframe = postToPreview;

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
                elUiStyle: '',
                elementRole: '',
                roleUrl: '',
                roleNewTab: false,
                passEvents: false,
                locked: false,
                specialConfig: {},
                content: { attrs: {} },
                styles: {
                    desktop: { rawCssProps: {} },
                    tablet: {},
                    mobile: {},
                    global: {},
                    hover: {},
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
        if (!rec.specialConfig || typeof rec.specialConfig !== 'object') rec.specialConfig = {};
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

    function syncUiStyleCardsSelection() {
        $('.ovb-uistyle-card').removeClass('active');
        if (uiStyleTargetMode === 'element' && currentSelector) {
            const rec = state.elements[currentSelector] || {};
            const elStyle = rec.elUiStyle || '';
            if (elStyle) {
                $(`.ovb-uistyle-card[data-uistyle="${elStyle}"]`).addClass('active');
            } else {
                $(`.ovb-uistyle-card[data-uistyle="${state.uiStyle || 'odysseexp'}"]`).addClass('active');
            }
        } else {
            $(`.ovb-uistyle-card[data-uistyle="${state.uiStyle || 'odysseexp'}"]`).addClass('active');
        }
    }

    /**
     * Populates all sidebar inputs from the currently selected element & its live computed styles
     */
    function populateSidebarFromSelection() {
        const bannerLabel = $('#ovb-sel-label');
        const bannerSel = $('#ovb-sel-selector');

        $('#ovb-active-bucket-badge').text(BUCKET_LABELS[currentBucket] || currentBucket);

        if (!currentSelector) {
            bannerLabel.text('Nenhum elemento selecionado');
            bannerSel.text('Clique ou arraste qualquer item do site ao lado →');
            syncUiStyleCardsSelection();
            return;
        }

        bannerLabel.text((currentSnapshot && currentSnapshot.label) || 'Elemento Selecionado');
        bannerSel.text(currentSelector);
        $('#ovb-custom-selector-input').val(currentSelector);

        const rec = state.elements[currentSelector] || {};
        // Strictly read the active bucket's styles without bleeding Desktop into Tablet/Mobile!
        const st = (rec.styles && rec.styles[currentBucket]) || {};
        const content = rec.content || {};
        const comp = (currentSnapshot && currentSnapshot.computed) || {};

        $('#ovb-theme-scope').val(rec.themeScope || 'all');
        $('#ovb-el-uistyle-select').val(rec.elUiStyle || '');
        syncUiStyleCardsSelection();

        // Detecção de Tipo: Vetor SVG / CSS vs Imagem Raster (PNG/JPEG)
        const isImgTag = (currentSnapshot && currentSnapshot.tag === 'IMG');
        const isRasterSrc = (currentSnapshot && currentSnapshot.src && /\.(jpe?g|png|webp|gif|bmp)(\?.*)?$/i.test(currentSnapshot.src));
        const isRasterBg = (comp && comp.backgroundImage && !comp.backgroundImage.includes('none') && !comp.backgroundImage.includes('data:image/svg'));
        const isRaster = isImgTag || isRasterSrc || isRasterBg;

        if (isRaster) {
            $('#ovb-info-detected-type').text('Imagem Raster (PNG/JPEG)');
            $('#ovb-behavior-type-tag').text('Imagem Raster (Pixels fixos)').css('color', '#f87171');
            $('#ovb-allow-color-edit').prop('checked', false);
            $('#ovb-raster-color-lock-notice').show();
            $('#ovb-color-controls-wrap').css({ 'opacity': '0.35', 'pointer-events': 'none' });
        } else {
            const isSvg = (currentSnapshot && (currentSnapshot.tag === 'SVG' || currentSnapshot.isSvg || currentSnapshot.tag === 'path'));
            $('#ovb-info-detected-type').text(isSvg ? 'Vetor SVG Editável' : 'Elemento CSS / HTML');
            $('#ovb-behavior-type-tag').text(isSvg ? 'Vetor SVG Editável' : 'Elemento CSS / HTML').css('color', '#34d399');
            $('#ovb-allow-color-edit').prop('checked', true);
            $('#ovb-raster-color-lock-notice').hide();
            $('#ovb-color-controls-wrap').css({ 'opacity': '1', 'pointer-events': 'auto' });
        }

        // Standalone Element / Shape Interactive Role & Behavior
        const roleVal = rec.elementRole || st.elementRole || 'none';
        $('#ovb-element-role-select').val(roleVal);
        $('.ovb-el-role-select').val(roleVal);
        $('.ovb-el-role-url').val(rec.roleUrl || st.roleUrl || '');
        $('.ovb-el-role-newtab').prop('checked', !!(rec.roleNewTab || st.roleNewTab));
        $('.ovb-el-pass-events').prop('checked', !!(rec.passEvents || st.passEvents));

        $('#ovb-role-link-box').toggle(roleVal === 'link' || roleVal === 'button');
        $('#ovb-role-page-box').toggle(roleVal === 'page');
        $('#ovb-role-lightbox-box').toggle(roleVal === 'lightbox-image' || roleVal === 'lightbox-gallery');

        // Sincronização e Travas de Animações de Hover & Clique
        const hoverEnabled = !!(rec.enableHoverAnim !== undefined ? rec.enableHoverAnim : st.enableHoverAnim);
        $('#ovb-chk-enable-hover').prop('checked', hoverEnabled);
        if (hoverEnabled) {
            $('#ovb-hover-anim-preset-select').prop('disabled', false);
            $('#ovb-hover-lock-badge')
                .text('✅ Ativo pelo Comportamento')
                .css({ 'background': 'rgba(16,185,129,0.2)', 'color': '#6ee7b7' });
        } else {
            $('#ovb-hover-anim-preset-select').prop('disabled', true);
            $('#ovb-hover-lock-badge')
                .text('🔒 Bloqueado no Comportamento')
                .css({ 'background': 'rgba(239,68,68,0.2)', 'color': '#fca5a5' });
        }

        const clickEnabled = !!(rec.enableClickAnim !== undefined ? rec.enableClickAnim : st.enableClickAnim);
        $('#ovb-chk-enable-click').prop('checked', clickEnabled);
        if (clickEnabled) {
            $('#ovb-click-anim-preset-select').prop('disabled', false);
            $('#ovb-click-lock-badge')
                .text('✅ Ativo pelo Comportamento')
                .css({ 'background': 'rgba(16,185,129,0.2)', 'color': '#6ee7b7' });
        } else {
            $('#ovb-click-anim-preset-select').prop('disabled', true);
            $('#ovb-click-lock-badge')
                .text('🔒 Bloqueado no Comportamento')
                .css({ 'background': 'rgba(239,68,68,0.2)', 'color': '#fca5a5' });
        }

        // Código CSS do Elemento no final da Aba 1 (Propriedades)
        const customCssVal = st.customCss || rec.customCss || '';
        $('#ovb-element-custom-css').val(customCssVal);

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

        // Populate Special Config inputs (Carousel #5, Floating Orbit #6, Gradient Seam Breaker #8)
        const specialDefaults = {
            direction: 'clockwise',
            mode: 'infinite',
            cardsCount: 8,
            visibleCards: 0,
            speed: 0.2,
            category: '',
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
            bloom: 0,
            heightPx: 180,
            gradientDirection: 'to bottom'
        };
        const mergedSpecial = Object.assign({}, specialDefaults, (blockObj && blockObj.config) || {}, rec.specialConfig || {});
        $('[data-ovb-sconfig]').each(function () {
            const key = $(this).attr('data-ovb-sconfig');
            if (mergedSpecial[key] !== undefined) {
                $(this).val(String(mergedSpecial[key]));
            }
        });

        // Bind all [data-ovb-prop] fields strictly from active bucket `st[prop]` (or live computed `comp[prop]`)
        $('[data-ovb-prop]').each(function () {
            const $el = $(this);
            const prop = $el.attr('data-ovb-prop');
            const savedVal = st[prop];
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
            const savedVal = st[prop];
            const compVal = comp[prop];
            const rawVal = savedVal !== undefined ? savedVal : (compVal !== undefined ? compVal : ($(this).attr('data-default') || 0));
            const numeric = parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
            if (!isNaN(numeric)) {
                $(this).val(numeric);
            }
        });

        // Highlight active 9-point Transform Origin dot
        const activeOrigin = st.transformOrigin || 'center center';
        $('.ovb-origin-dot').removeClass('active');
        $(`.ovb-origin-dot[data-origin="${activeOrigin}"]`).addClass('active');

        // Highlight Flip H / Flip V buttons
        $('#ovb-btn-flip-x').css('border-color', st.flipX ? '#a855f7' : '');
        $('#ovb-btn-flip-y').css('border-color', st.flipY ? '#a855f7' : '');

        // Highlight active blend mode pill
        const activeBlend = st.blendMode || comp.mixBlendMode || 'normal';
        $('.ovb-blend-pill').removeClass('active');
        $(`.ovb-blend-pill[data-blend="${activeBlend}"]`).addClass('active');

        // Synchronize Top Control Bar inputs
        const curTx = (st.translateX !== undefined && st.translateX !== '') ? st.translateX : ((comp.translate && comp.translate.x) || '0');
        const curTy = (st.translateY !== undefined && st.translateY !== '') ? st.translateY : ((comp.translate && comp.translate.y) || '0');
        const curW = (st.width !== undefined && st.width !== '') ? st.width : ((comp.rect && Math.round(comp.rect.width)) || '');
        const curH = (st.height !== undefined && st.height !== '') ? st.height : ((comp.rect && Math.round(comp.rect.height)) || '');

        $('#ovb-cbar-val-x').val(String(curTx).replace(/px$/, ''));
        $('#ovb-cbar-val-y').val(String(curTy).replace(/px$/, ''));
        $('#ovb-cbar-val-w').val(String(curW).replace(/px$/, ''));
        $('#ovb-cbar-val-h').val(String(curH).replace(/px$/, ''));
        $('#ovb-cbar-aspect-lock').toggleClass('unlocked', !aspectRatioLocked);

        // Sync Code IDE Drawer with custom CSS
        if (!$('#ovb-code-el-css-editor').is(':focus')) {
            $('#ovb-code-el-css-editor').val(rec.customCss || (st && st.customCss) || '');
        }
        $('#ovb-code-el-label').text(currentSelector);
        $('#ovb-code-el-html-label').text(currentSelector);

        if (currentSnapshot && currentSnapshot.parentSvgSelector) {
            $('#ovb-btn-select-parent-svg').attr('data-parent-svg', currentSnapshot.parentSvgSelector).show();
        } else {
            $('#ovb-btn-select-parent-svg').hide();
        }

        // Element Raw innerHTML / SVG in Code IDE Drawer
        if (!$('#ovb-code-el-html-editor').is(':focus')) {
            const rawHtml = content.innerHTML !== undefined ? content.innerHTML : ((currentSnapshot && currentSnapshot.innerHTML) || '');
            $('#ovb-code-el-html-editor').val(rawHtml);
        }

        // Highlight selected row in Photoshop Layers panel
        $('.ovb-ps-layer-row').removeClass('is-selected');
        $(`.ovb-ps-layer-row[data-sel="${CSS.escape(currentSelector)}"]`).addClass('is-selected');
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
     * Builds the HTML for a single Photoshop/Illustrator style layer row with live visual thumbnail
     */
    function buildPhotoshopLayerRow(item) {
        const sel = item.selector || '';
        const rec = state.elements[sel] || {};
        const st = (rec.styles && rec.styles[currentBucket]) || {};
        const isMod = !!state.elements[sel];
        const isSelected = currentSelector === sel;
        const isHidden = !!st.hidden || !!item.hidden;
        const isLocked = !!rec.locked || !!item.locked;
        const isImmune = rec.elUiStyle === 'none' || item.elUiStyle === 'none';
        const effZ = st.zIndex !== undefined && st.zIndex !== '' ? st.zIndex : (item.zIndex !== undefined ? item.zIndex : 0);

        let thumbInnerHtml = '';
        let thumbStyle = '';
        if (item.thumbType === 'image' && item.thumbSrc) {
            thumbInnerHtml = `<img src="${$('<div>').text(item.thumbSrc).html()}" alt="">`;
        } else if (item.thumbType === 'svg' && item.thumbSrc) {
            thumbInnerHtml = item.thumbSrc;
        } else if (item.thumbType === 'shape') {
            thumbStyle = item.thumbBg ? `background:${item.thumbBg};` : 'background:linear-gradient(135deg,#8b5cf6,#ec4899);';
            thumbInnerHtml = `<span class="ovb-ps-thumb-text" style="color:#fff;text-shadow:0 1px 2px #000;">Forma</span>`;
        } else {
            if (item.thumbBg) {
                thumbStyle = `background:${item.thumbBg};`;
            }
            const tColor = item.thumbColor || '#f8fafc';
            const tLabel = $('<div>').text(item.thumbText || 'Aa').html();
            thumbInnerHtml = `<span class="ovb-ps-thumb-text" style="color:${tColor};">${tLabel}</span>`;
        }

        const safeSel = $('<div>').text(sel).html();
        const safeLabel = $('<div>').text(item.label || sel).html();
        const immuneBadge = isImmune ? '<span title="Tema Não Aplicável (Imune)" style="color:#fda4af;margin-left:3px;">🛡️</span>' : '';

        return $(`
            <div class="ovb-ps-layer-row ${isSelected ? 'is-selected' : ''} ${isMod ? 'is-modified' : ''} ${isHidden ? 'is-hidden-layer' : ''}" data-sel="${safeSel}">
                <button type="button" class="ovb-ps-icon-toggle ovb-ps-eye ${isHidden ? 'active-warn' : ''}" data-sel="${safeSel}" title="Mostrar / Ocultar Camada (👁️)">
                    ${isHidden ? '🚫' : '👁️'}
                </button>
                <button type="button" class="ovb-ps-icon-toggle ovb-ps-lock ${isLocked ? 'active-warn' : ''}" data-sel="${safeSel}" title="Trancar / Destrancar Camada (🔒)">
                    ${isLocked ? '🔒' : '🔓'}
                </button>
                <div class="ovb-ps-thumb" style="${$('<div>').text(thumbStyle).html()}" title="Miniatura de Preview da Camada">
                    ${thumbInnerHtml}
                </div>
                <div class="ovb-ps-meta">
                    <div class="ovb-ps-title">${safeLabel}${immuneBadge}</div>
                    <div class="ovb-ps-sub">${safeSel}</div>
                </div>
                <span class="ovb-ps-zbadge" title="Camada Z-Index">Z:${effZ}</span>
                <div style="display:flex;flex-direction:column;gap:2px;">
                    <button type="button" class="ovb-ps-icon-toggle ovb-ps-zup" data-sel="${safeSel}" style="width:18px;height:13px;font-size:8px;" title="Subir Camada (Atalho: ] )">▲</button>
                    <button type="button" class="ovb-ps-icon-toggle ovb-ps-zdown" data-sel="${safeSel}" style="width:18px;height:13px;font-size:8px;" title="Descer Camada (Atalho: [ )">▼</button>
                </div>
            </div>
        `);
    }

    /**
     * Renders the Photoshop / Illustrator Layers Panel in Tab 4 with Live Thumbnail Previews
     */
    function renderNavigatorTree() {
        const container = $('#ovb-navigator-tree');
        const filterText = ($('#ovb-tree-search').val() || '').toLowerCase().trim();
        container.empty();

        if (!pageTree || pageTree.length === 0) {
            container.html('<p style="color:#64748b;font-size:11.5px;">Carregando camadas e miniaturas da página...</p>');
            return;
        }

        if (layerViewMode === 'zstack') {
            // Flatten all layers and sort by Z-Index descending (top-to-bottom like Photoshop/Illustrator)
            const flat = [];
            pageTree.forEach(group => {
                (group.children || []).forEach(ch => {
                    if (!filterText || ch.label.toLowerCase().includes(filterText) || (ch.selector && ch.selector.toLowerCase().includes(filterText))) {
                        flat.push(ch);
                    }
                });
            });
            flat.sort((a, b) => {
                const za = (state.elements[a.selector] && state.elements[a.selector].styles && state.elements[a.selector].styles[currentBucket] && parseInt(state.elements[a.selector].styles[currentBucket].zIndex, 10)) || a.zIndex || 0;
                const zb = (state.elements[b.selector] && state.elements[b.selector].styles && state.elements[b.selector].styles[currentBucket] && parseInt(state.elements[b.selector].styles[currentBucket].zIndex, 10)) || b.zIndex || 0;
                return zb - za;
            });
            flat.forEach(ch => {
                container.append(buildPhotoshopLayerRow(ch));
            });
            return;
        }

        // Default: Grouped by Section with Photoshop Layer Rows & Thumbnails
        pageTree.forEach(group => {
            const groupMatch = !filterText || group.label.toLowerCase().includes(filterText) || (group.selector && group.selector.toLowerCase().includes(filterText));
            const matchingChildren = (group.children || []).filter(ch =>
                !filterText || ch.label.toLowerCase().includes(filterText) || (ch.selector && ch.selector.toLowerCase().includes(filterText))
            );

            if (!groupMatch && matchingChildren.length === 0) return;

            const safeGroupSel = $('<div>').text(group.selector).html();
            const groupHeader = $(`
                <div class="ovb-ps-group-header" data-sel="${safeGroupSel}" style="cursor:pointer;">
                    <span>📁 ${$('<div>').text(group.label).html()}</span>
                    <span style="font-size:10px;color:#c084fc;">${matchingChildren.length} camadas</span>
                </div>
            `);
            container.append(groupHeader);

            matchingChildren.forEach(ch => {
                container.append(buildPhotoshopLayerRow(ch));
            });
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

        // Initialize shapes with a vivid visible color & gradient immediately so they never start invisible!
        if (type === 'shape-square' || type === 'shape-circle' || type === 'shape-bar' || type === 'shape-squircle') {
            const initC1 = $('#ovb-shape-init-color').val() || '#8b5cf6';
            const initC2 = $('#ovb-shape-init-color2').val() || '#ec4899';
            const rec = ensureElementRecord('#' + id);
            rec.elementRole = 'none';
            rec.styles[currentBucket] = Object.assign(rec.styles[currentBucket] || {}, {
                backgroundColor: initC1,
                bgGradientEnabled: true,
                bgGradientColor1: initC1,
                bgGradientColor2: initC2,
                bgGradientType: 'linear',
                bgGradientAngle: 135,
                borderStyle: 'solid',
                borderWidth: '1px',
                borderColor: 'rgba(255,255,255,0.28)'
            });
        } else if (type === 'glow-orb') {
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

        showToast('✨ Elemento criado com cor visível! Use as opções abaixo para trocar cor, degradê ou interação.');
    }

    /**
     * Renders the Custom Color Palettes UI in Tab 4 (Global, Per-Page & Visitor Cookies Toggle)
     */
    function renderColorPalettesUI() {
        $('#ovb-allow-visitor-color-switch').prop('checked', state.allowVisitorColorSwitch !== false);

        const baseOptions = [
            { id: 'purple', name: '🟣 Roxo Odyssee (#8b5cf6)' },
            { id: 'red', name: '🔴 Vermelho Crimson (#ef4444)' }
        ];
        const customPals = Array.isArray(state.colorPalettes) ? state.colorPalettes : [];

        // Populate Global Palette dropdown
        const $globalSel = $('#ovb-global-palette-select');
        $globalSel.empty();
        $globalSel.append('<option value="">Padrão Nativo (Roxo Odyssee #8b5cf6)</option>');
        baseOptions.forEach(bp => {
            $globalSel.append($('<option></option>').val(bp.id).text(bp.name));
        });
        customPals.forEach(cp => {
            $globalSel.append($('<option></option>').val(cp.id).text(`🎨 ${cp.name} (${cp.accent})`));
        });
        $globalSel.val(state.activeGlobalPalette || '');

        // Populate Per-Page Palette dropdowns
        $('.ovb-page-palette-select').each(function () {
            const pageKey = $(this).attr('data-page-key');
            const $sel = $(this);
            $sel.empty();
            $sel.append('<option value="">Herdar Paleta Global</option>');
            baseOptions.forEach(bp => {
                $sel.append($('<option></option>').val(bp.id).text(bp.name));
            });
            customPals.forEach(cp => {
                $sel.append($('<option></option>').val(cp.id).text(`🎨 ${cp.name}`));
            });
            const savedPagePal = (state.pagePalettes && state.pagePalettes[pageKey]) || '';
            $sel.val(savedPagePal);
        });

        // Render Custom Palettes Cards List
        const $list = $('#ovb-custom-palettes-list');
        $list.empty();
        if (customPals.length === 0) {
            $list.html('<p style="color:#64748b;font-size:10.5px;margin:0;">Nenhuma paleta extra criada ainda. Crie acima para disponibilizar globalmente, por página e nos Settings do visitante!</p>');
            return;
        }

        customPals.forEach((cp, idx) => {
            const safeName = $('<div>').text(cp.name).html();
            const card = $(`
                <div class="ovb-palette-item-card">
                    <div style="display:flex;align-items:center;gap:7px;min-width:0;">
                        <div class="ovb-palette-swatches">
                            <span class="ovb-palette-dot" style="background:${cp.accent || '#8b5cf6'};" title="Destaque: ${cp.accent}"></span>
                            <span class="ovb-palette-dot" style="background:${cp.nebula1 || cp.accent};" title="Nebulosa 1"></span>
                            <span class="ovb-palette-dot" style="background:${cp.nebula2 || cp.accentHover};" title="Nebulosa 2"></span>
                        </div>
                        <span style="font-size:11px;font-weight:700;color:#f8fafc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeName}</span>
                    </div>
                    <div style="display:flex;gap:4px;">
                        <button type="button" class="ovb-mini-btn ovb-apply-pal-global" data-pal-id="${cp.id}" title="Definir como Paleta Global do Site">🌐 Global</button>
                        <button type="button" class="ovb-mini-btn ovb-del-palette-btn" data-idx="${idx}" title="Remover Paleta">✕</button>
                    </div>
                </div>
            `);
            $list.append(card);
        });
    }

    let clipboardElement = null;

    function copyElement(sel) {
        if (!sel) return;
        const rec = state.elements[sel] ? deepClone(state.elements[sel]) : null;
        clipboardElement = {
            selector: sel,
            record: rec,
            snapshot: currentSnapshot ? deepClone(currentSnapshot) : null
        };
        showToast('📋 Elemento copiado para a área de transferência do Odyssee Studio!');
    }

    function cutElement(sel) {
        if (!sel) return;
        copyElement(sel);
        executeShortcutCommand('delete-element');
        showToast('✂ Elemento recortado!');
    }

    function pasteElement(inPlace) {
        if (!clipboardElement || !clipboardElement.selector) {
            showToast('Nenhum elemento copiado para colar!', true);
            return;
        }
        const srcSel = clipboardElement.selector;
        const cloneId = 'ovb_clone_' + Math.random().toString(36).substring(2, 8);
        if (!Array.isArray(state.clones)) state.clones = [];
        state.clones.push({
            id: cloneId,
            sourceSelector: srcSel
        });
        const copyRec = clipboardElement.record ? deepClone(clipboardElement.record) : {
            themeScope: 'all',
            content: {},
            styles: { desktop: {} }
        };
        if (!copyRec.styles) copyRec.styles = { desktop: {} };
        if (!copyRec.styles[currentBucket]) copyRec.styles[currentBucket] = {};
        if (!inPlace) {
            const curTx = parseFloat(copyRec.styles[currentBucket].translateX || 0) + 24;
            const curTy = parseFloat(copyRec.styles[currentBucket].translateY || 0) + 24;
            copyRec.styles[currentBucket].translateX = `${curTx}px`;
            copyRec.styles[currentBucket].translateY = `${curTy}px`;
        }
        state.elements['#' + cloneId] = copyRec;
        pushHistory();
        syncPreview();
        setTimeout(() => {
            postToPreview({ type: 'OVB_SELECT_SELECTOR', selector: '#' + cloneId, scroll: false });
            postToPreview({ type: 'OVB_REQUEST_TREE' });
        }, 100);
        showToast(inPlace ? '📌 Elemento colado no mesmo local!' : '📋 Elemento colado!');
    }

    function deselectElement() {
        currentSelector = null;
        currentSnapshot = null;
        populateSidebarFromSelection();
        postToPreview({ type: 'OVB_SELECT_SELECTOR', selector: '' });
        showToast('Elemento desselecionado');
    }

    /**
     * Executes Undo, Redo, and Adaptive Keyboard Shortcuts (from Admin or Preview Iframe)
     */
    function executeShortcutCommand(cmd) {
        if (!cmd) return;
        switch (cmd) {
            case 'undo':
                $('#ovb-btn-undo').trigger('click');
                break;
            case 'redo':
                $('#ovb-btn-redo').trigger('click');
                break;
            case 'save':
                $('#ovb-btn-save').trigger('click');
                break;
            case 'cut':
                cutElement(currentSelector);
                break;
            case 'copy':
                copyElement(currentSelector);
                break;
            case 'paste':
                pasteElement(false);
                break;
            case 'paste-in-place':
                pasteElement(true);
                break;
            case 'deselect':
                deselectElement();
                break;
            case 'find':
                $('.ovb-tab-btn[data-tab="tab-layers"]').trigger('click');
                $('#ovb-search-layers').focus();
                break;
            case 'duplicate':
                if (currentSelector) {
                    window.postMessage({ type: 'OVB_DUPLICATE_ELEMENT', selector: currentSelector }, '*');
                }
                break;
            case 'delete':
            case 'delete-or-hide':
            case 'delete-element': {
                if (!currentSelector) break;
                if (currentSelector.startsWith('#ovb_blk_')) {
                    $('#ovb-btn-delete-block').trigger('click');
                } else {
                    const rec = ensureElementRecord(currentSelector);
                    rec.styles[currentBucket].hidden = !rec.styles[currentBucket].hidden;
                    pushHistory();
                    syncPreview();
                    populateSidebarFromSelection();
                    renderNavigatorTree();
                    showToast(rec.styles[currentBucket].hidden ? '👁️ Elemento ocultado neste dispositivo (Ctrl+Z para desfazer)' : '👁️ Elemento visível novamente');
                }
                break;
            }
            case 'tool-select':
                $('.ovb-ai-tool-btn').removeClass('active');
                $('.ovb-ai-tool-btn[data-ai-cmd="tool-select"]').addClass('active');
                if ($('#ovb-toggle-interactive').hasClass('active')) {
                    $('#ovb-toggle-interactive').trigger('click');
                }
                showToast('🖱️ Ferramenta Seleção (V) ativa');
                break;
            case 'tool-direct-select':
                $('.ovb-ai-tool-btn').removeClass('active');
                $('.ovb-ai-tool-btn[data-ai-cmd="tool-direct-select"]').addClass('active');
                postToPreview({ type: 'OVB_SELECT_PARENT' });
                showToast('↖ Seleção Direta / Nível Pai (A)');
                break;
            case 'tool-text':
                $('.ovb-tab-btn[data-tab="tab-content"]').trigger('click');
                if (currentSelector) {
                    $('#ovb-content-text').focus();
                    showToast('🔤 Editando texto do elemento (T)');
                } else {
                    insertNewBlock('heading');
                }
                break;
            case 'tool-rect':
                insertNewBlock('shape-square');
                break;
            case 'tool-ellipse':
                insertNewBlock('shape-circle');
                break;
            case 'tool-rounded':
                insertNewBlock('shape-bar');
                break;
            case 'tool-gradient':
                if (!currentSelector) {
                    showToast('Selecione um elemento primeiro para aplicar Degradê (G)!', true);
                    break;
                }
                {
                    const rec = ensureElementRecord(currentSelector);
                    const st = rec.styles[currentBucket];
                    st.bgGradientEnabled = !st.bgGradientEnabled;
                    if (st.bgGradientEnabled && !st.bgGradientColor1) {
                        st.bgGradientColor1 = '#8b5cf6';
                        st.bgGradientColor2 = '#ec4899';
                        st.bgGradientAngle = 135;
                    }
                    pushHistory();
                    syncPreview();
                    populateSidebarFromSelection();
                    showToast(st.bgGradientEnabled ? '🌈 Degradê ativado no elemento (G)!' : 'Degradê desativado');
                }
                break;
            case 'eyedropper-copy':
                if (!currentSelector) {
                    showToast('Selecione um elemento para copiar o estilo com o Conta-Gotas (I)!', true);
                    break;
                }
                {
                    const rec = ensureElementRecord(currentSelector);
                    copiedElementStyle = {
                        elUiStyle: rec.elUiStyle || '',
                        bucketStyles: deepClone(rec.styles[currentBucket] || {})
                    };
                    showToast('💧 Conta-Gotas (I): Estilo copiado! Use Shift+I em outro item para colar.');
                }
                break;
            case 'eyedropper-paste':
                if (!currentSelector || !copiedElementStyle) {
                    showToast('Copie o estilo de um elemento primeiro com a tecla I!', true);
                    break;
                }
                {
                    const rec = ensureElementRecord(currentSelector);
                    if (copiedElementStyle.elUiStyle) {
                        rec.elUiStyle = copiedElementStyle.elUiStyle;
                    }
                    const pasted = deepClone(copiedElementStyle.bucketStyles || {});
                    delete pasted.translateX;
                    delete pasted.translateY;
                    Object.assign(rec.styles[currentBucket], pasted);
                    pushHistory();
                    syncPreview();
                    populateSidebarFromSelection();
                    showToast('🎨 Estilo colado com sucesso (Shift+I)!');
                }
                break;
            case 'layer-back':
                if (!currentSelector) break;
                {
                    const rec = ensureElementRecord(currentSelector);
                    const curZ = parseInt(rec.styles[currentBucket].zIndex, 10) || 10;
                    rec.styles[currentBucket].zIndex = Math.max(0, curZ - 1);
                    pushHistory();
                    syncPreview();
                    populateSidebarFromSelection();
                    renderNavigatorTree();
                    showToast(`⬇ Camada enviada para trás (Z-Index: ${rec.styles[currentBucket].zIndex})`);
                }
                break;
            case 'layer-forward':
                if (!currentSelector) break;
                {
                    const rec = ensureElementRecord(currentSelector);
                    const curZ = parseInt(rec.styles[currentBucket].zIndex, 10) || 10;
                    rec.styles[currentBucket].zIndex = curZ + 1;
                    pushHistory();
                    syncPreview();
                    populateSidebarFromSelection();
                    renderNavigatorTree();
                    showToast(`⬆ Camada trazida para frente (Z-Index: ${rec.styles[currentBucket].zIndex})`);
                }
                break;
            case 'tool-hand':
                $('#ovb-toggle-interactive').trigger('click');
                break;
        }
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

    function renderPresetsCatalogCards() {
        const catalog = window.ODYSSEE_VB_PRESETS_CATALOG || [];
        const $smallGrid = $('#ovb-presets-small-grid');
        const $robustGrid = $('#ovb-presets-robust-grid');
        $smallGrid.empty();
        $robustGrid.empty();

        catalog.forEach(p => {
            const card = $(`
                <div class="ovb-preset-catalog-card" data-preset-id="${p.id}" style="padding:8px 10px;background:#161f33;border:1px solid rgba(139,92,246,0.28);border-radius:8px;margin-bottom:6px;cursor:pointer;transition:all 0.2s;">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                        <strong style="font-size:11.5px;color:#f8fafc;">${p.icon || '✨'} ${$('<div>').text(p.label).html()}</strong>
                        <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(168,85,247,0.22);color:#e9d5ff;font-weight:700;">＋ Inserir</span>
                    </div>
                    <div style="font-size:10.5px;color:#94a3b8;margin-top:3px;line-height:1.35;">${$('<div>').text(p.desc).html()}</div>
                </div>
            `);
            if (p.category === 'robust') {
                $robustGrid.append(card);
            } else {
                $smallGrid.append(card);
            }
        });
    }

    function renderUserComponentPresets() {
        const $list = $('#ovb-user-comp-presets-list');
        $list.empty();
        const comps = state.componentPresets || [];
        if (comps.length === 0) {
            $list.html('<p style="color:#64748b;font-size:11px;margin:0;">Nenhum conjunto salvo ainda. Selecione qualquer item e clique em 💾 Salvar.</p>');
            return;
        }
        comps.forEach((cp, idx) => {
            const row = $(`
                <div class="ovb-tree-item" style="display:flex;align-items:center;justify-content:space-between;gap:4px;">
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:155px;" title="${$('<div>').text(cp.name).html()}">🧩 ${$('<div>').text(cp.name).html()}</span>
                    <div style="display:flex;gap:3px;">
                        <button type="button" class="ovb-mini-btn ovb-insert-comp-preset" data-idx="${idx}" title="Inserir este Conjunto na página">＋ Inserir</button>
                        <button type="button" class="ovb-mini-btn ovb-export-single-comp" data-idx="${idx}" title="Baixar JSON deste Conjunto">⬇</button>
                        <button type="button" class="ovb-mini-btn ovb-del-comp-preset" data-idx="${idx}" title="Excluir Conjunto">✕</button>
                    </div>
                </div>
            `);
            $list.append(row);
        });
    }

    function renderPagePresetsDropdown() {
        const $sel = $('#ovb-page-preset-selector');
        $sel.empty();
        $sel.append('<option value="">-- Selecionar Preset de Página --</option>');
        Object.keys(state.pagePresets || {}).forEach(pName => {
            $sel.append($('<option></option>').val(pName).text(`📄 ${pName}`));
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
        $('#ovb-topbar-uistyle').val(activeUi);
        $('#ovb-iconpack-select').val(state.iconPack || 'default');
        syncUiStyleCardsSelection();

        const pName = state.presetName || 'OdysseeXP';
        $('#ovb-preset-name-input').val(pName);
        $('#ovb-active-preset-badge').text(pName);
        $('#ovb-blank-mode-toggle').prop('checked', !!state.blankMode);
        renderPresetsDropdown();
        renderUserComponentPresets();
        renderPagePresetsDropdown();
        renderColorPalettesUI();
        updateCompiledCodeDisplay();
    }

    $(document).ready(function () {
        renderPresetsCatalogCards();
        populateGlobalVariables();
        renderModifiedElementsList();
        updateUndoRedoButtons();

        // Ensure Rock-Solid Handshake with Preview Iframe on Load
        $('#ovb-preview-iframe').on('load', function () {
            postToPreview({ type: 'OVB_PING_INIT' });
            syncPreview();
        });
        setTimeout(() => { postToPreview({ type: 'OVB_PING_INIT' }); syncPreview(); }, 250);
        setTimeout(() => { postToPreview({ type: 'OVB_PING_INIT' }); }, 1200);

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
                    if (isPickingTarget && targetPickerProp) {
                        isPickingTarget = false;
                        const pickedSel = msg.selector;
                        $(`[data-ovb-prop="${targetPickerProp}"]`).val(pickedSel).trigger('change');
                        showToast(`🎯 Elemento alvo vinculado: ${pickedSel}`);
                        break;
                    }
                    currentSelector = msg.selector;
                    currentSnapshot = msg.snapshot || {};
                    populateSidebarFromSelection();
                    break;
                }
                case 'OVB_SHORTCUT_COMMAND': {
                    executeShortcutCommand(msg.command);
                    break;
                }
                case 'OVB_TOGGLE_IMMUNE_ELEMENT': {
                    const sel = msg.selector || currentSelector;
                    if (!sel) break;
                    currentSelector = sel;
                    const rec = ensureElementRecord(sel);
                    rec.elUiStyle = rec.elUiStyle === 'none' ? '' : 'none';
                    pushHistory();
                    syncPreview();
                    populateSidebarFromSelection();
                    renderNavigatorTree();
                    showToast(rec.elUiStyle === 'none'
                        ? '🛡️ Elemento marcado como "Tema Não Aplicável (Imune)"!'
                        : '🎨 Imunidade removida: o elemento voltou a aceitar temas.');
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
                case 'OVB_ELEMENT_ALIGNED': {
                    const sel = msg.selector || currentSelector;
                    if (!sel) break;
                    const rec = ensureElementRecord(sel);
                    if (msg.translateX !== undefined) rec.styles[currentBucket].translateX = msg.translateX;
                    if (msg.translateY !== undefined) rec.styles[currentBucket].translateY = msg.translateY;
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
                case 'OVB_UNSTRETCH_ELEMENT': {
                    const sel = msg.selector || currentSelector;
                    if (sel && state.elements[sel] && state.elements[sel].styles) {
                        const bucketObj = state.elements[sel].styles[currentBucket] || {};
                        delete bucketObj.width;
                        delete bucketObj.height;
                        delete bucketObj.scaleX;
                        delete bucketObj.scaleY;
                        delete bucketObj.aspectRatio;
                        delete bucketObj.objectFit;
                        pushHistory();
                        syncPreview();
                        populateSidebarFromSelection();
                        showToast('✨ Proporção 1:1 original restaurada (sem esticamento)!');
                    }
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
                        renderNavigatorTree();
                        showToast('Elemento restaurado ao original!');
                    }
                    break;
                }
                case 'OVB_FIGMA_SVG_RESULT': {
                    if (!msg.svgContent) break;
                    const slug = (state.presetName || 'odysseexp').toLowerCase().replace(/\s+/g, '-');
                    const targetTool = msg.target === 'lunacy' ? 'lunacy' : 'figma';
                    const scopeName = msg.scope === 'element' ? 'conjunto' : 'pagina';
                    const blob = new Blob([msg.svgContent], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${slug}-${targetTool}-${scopeName}.svg`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast(`🎨 Artboard vetorial em camadas exportado para ${targetTool.toUpperCase()}!`);
                    break;
                }
                case 'OVB_COMPONENT_PRESET_CAPTURED': {
                    if (!msg.html) break;
                    if (!Array.isArray(state.componentPresets)) state.componentPresets = [];
                    state.componentPresets.push({
                        id: 'comp_' + Date.now(),
                        name: msg.name || 'Conjunto Personalizado',
                        html: msg.html,
                        elConfig: msg.elConfig || {}
                    });
                    pushHistory();
                    renderUserComponentPresets();
                    showToast(`💾 Conjunto '${msg.name}' salvo nos seus Presets de Conjunto!`);
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

        // Responsive Device Switcher (Strictly Isolated per Device!)
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
                showToast(`Modo isolado ativo: ${BUCKET_LABELS[dev]}`);
            }
        });

        // State Bucket Switcher
        $('#ovb-state-bucket').on('change', function () {
            currentBucket = $(this).val();
            if (currentBucket === 'desktop' || currentBucket === 'tablet' || currentBucket === 'mobile') {
                $('.ovb-device-btn').removeClass('active');
                $(`.ovb-device-btn[data-device="${currentBucket}"]`).addClass('active');
                $('#ovb-iframe-container').removeClass('device-desktop device-tablet device-mobile').addClass('device-' + currentBucket);
            }
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

        // Per-Element Individual UI Design System Override
        $('#ovb-el-uistyle-select').on('change', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento primeiro para aplicar um Estilo UI individual!', true);
                return;
            }
            const rec = ensureElementRecord(currentSelector);
            rec.elUiStyle = $(this).val() || '';
            pushHistory();
            syncPreview();
            updateCompiledCodeDisplay();
            showToast(rec.elUiStyle ? `🎯 Estilo '${rec.elUiStyle}' aplicado somente a este item!` : '🎯 Item voltou a herdar o Estilo da Página!');
        });

        // Preview Theme & Accent & Onboarding & Grid toggles
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

        $('#ovb-toggle-grid').on('click', function () {
            $(this).toggleClass('active');
            const showGrid = $(this).hasClass('active');
            postToPreview({ type: 'OVB_TOGGLE_GRID', show: showGrid });
            showToast(showGrid ? '📐 Grade de Alinhamento ativada!' : 'Grade de Alinhamento ocultada');
        });

        // Interactive Mode Toggle (Navigate vs Select/Drag)
        $('#ovb-toggle-interactive').on('click', function () {
            $(this).toggleClass('active');
            const interactive = $(this).hasClass('active');
            postToPreview({ type: 'OVB_SET_INTERACTIVE_MODE', interactive: interactive });
            showToast(interactive ? 'Modo Navegação Livre ativado (cliques normais no site)' : 'Modo Editor (Selecionar, Arrastar e Redimensionar) ativado');
        });

        // ==========================================
        // FIGMA / ILLUSTRATOR TRANSFORM, PROPORTION & ALIGNMENT TOOLS
        // ==========================================
        $('#ovb-btn-aspect-lock').on('click', function () {
            aspectRatioLocked = !aspectRatioLocked;
            $(this).toggleClass('unlocked', !aspectRatioLocked);
            $(this).html(aspectRatioLocked
                ? '<i class="fas fa-lock"></i> <span>Proporção Travada</span>'
                : '<i class="fas fa-lock-open"></i> <span>Proporção Livre</span>');
            postToPreview({ type: 'OVB_SET_ASPECT_LOCK', locked: aspectRatioLocked });
            showToast(aspectRatioLocked ? '🔒 Proporção travada (evita esticar o elemento sem querer)!' : '🔓 Proporção livre ativada');
        });

        $('#ovb-btn-unstretch').on('click', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento primeiro!', true);
                return;
            }
            window.postMessage({ type: 'OVB_UNSTRETCH_ELEMENT', selector: currentSelector }, '*');
        });

        $('#ovb-btn-reset-scale').on('click', function () {
            if (!currentSelector) return;
            updateElementStyleProp('scale', '1');
            populateSidebarFromSelection();
            showToast('Escala uniforme redefinida para 1x (100%)!');
        });

        $(document).on('click', '.ovb-btn-auto-dim', function () {
            if (!currentSelector) return;
            const dim = $(this).attr('data-dim');
            const rec = ensureElementRecord(currentSelector);
            delete rec.styles[currentBucket][dim];
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            showToast(`${dim === 'width' ? 'Largura' : 'Altura'} redefinida para Auto!`);
        });

        // Flag de Escopo do Ajuste de Alinhamento (Apenas na Camada Pai vs No Global da Página)
        $(document).on('click', '.ovb-align-scope-btn', function () {
            $('.ovb-align-scope-btn').removeClass('active');
            $(this).addClass('active');
            currentAlignScope = $(this).attr('data-align-scope') || 'parent';
            showToast(`🎯 Escopo do alinhamento: ${currentAlignScope === 'parent' ? 'Apenas Dentro da Camada Pai' : 'Global na Página'}`);
        });

        // Quick 6-Button Alignment Bar (com cálculo geométrico no Preview)
        $(document).on('click', '.ovb-align-btn', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento na página primeiro!', true);
                return;
            }
            const align = $(this).attr('data-align');
            const rec = ensureElementRecord(currentSelector);
            const st = rec.styles[currentBucket];

            // Envia ao preview para medição exata do Bounding Box do Pai ou Viewport
            postToPreview({
                type: 'OVB_ALIGN_ELEMENT',
                selector: currentSelector,
                align: align,
                scope: currentAlignScope
            });

            // Fallback imediato de alinhamento no estilo do bucket ativo
            if (align === 'left') {
                st.marginLeft = '0px';
                st.marginRight = 'auto';
                st.textAlign = 'left';
            } else if (align === 'center-h') {
                st.marginLeft = 'auto';
                st.marginRight = 'auto';
                st.textAlign = 'center';
            } else if (align === 'right') {
                st.marginLeft = 'auto';
                st.marginRight = '0px';
                st.textAlign = 'right';
            } else if (align === 'top') {
                st.alignSelf = 'flex-start';
            } else if (align === 'center-v') {
                st.alignSelf = 'center';
            } else if (align === 'bottom') {
                st.alignSelf = 'flex-end';
            }

            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            showToast(`📐 Alinhamento ${align} (${currentAlignScope === 'parent' ? 'Camada Pai' : 'Global'}) aplicado!`);
        });

        // Listeners da Aba Comportamento & Estilo
        $(document).on('change', '#ovb-allow-color-edit', function () {
            const isAllowed = $(this).is(':checked');
            if (isAllowed) {
                $('#ovb-raster-color-lock-notice').hide();
                $('#ovb-color-controls-wrap').css({ 'opacity': '1', 'pointer-events': 'auto' });
            } else {
                $('#ovb-raster-color-lock-notice').show();
                $('#ovb-color-controls-wrap').css({ 'opacity': '0.35', 'pointer-events': 'none' });
            }
        });

        $(document).on('change', '#ovb-element-role-select', function () {
            const roleVal = $(this).val();
            $('#ovb-role-link-box').toggle(roleVal === 'link' || roleVal === 'button');
            $('#ovb-role-page-box').toggle(roleVal === 'page');
            $('#ovb-role-lightbox-box').toggle(roleVal === 'lightbox-image' || roleVal === 'lightbox-gallery');
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.elementRole = roleVal;
            rec.styles[currentBucket].elementRole = roleVal;
            pushHistory();
            syncPreview();
        });

        $(document).on('change', '#ovb-chk-enable-hover', function () {
            const isChecked = $(this).is(':checked');
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.enableHoverAnim = isChecked;
            rec.styles[currentBucket].enableHoverAnim = isChecked;
            if (isChecked) {
                $('#ovb-hover-anim-preset-select').prop('disabled', false);
                $('#ovb-hover-lock-badge')
                    .text('✅ Ativo pelo Comportamento')
                    .css({ 'background': 'rgba(16,185,129,0.2)', 'color': '#6ee7b7' });
            } else {
                $('#ovb-hover-anim-preset-select').prop('disabled', true);
                $('#ovb-hover-lock-badge')
                    .text('🔒 Bloqueado no Comportamento')
                    .css({ 'background': 'rgba(239,68,68,0.2)', 'color': '#fca5a5' });
            }
            pushHistory();
            syncPreview();
        });

        $(document).on('change', '#ovb-chk-enable-click', function () {
            const isChecked = $(this).is(':checked');
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.enableClickAnim = isChecked;
            rec.styles[currentBucket].enableClickAnim = isChecked;
            if (isChecked) {
                $('#ovb-click-anim-preset-select').prop('disabled', false);
                $('#ovb-click-lock-badge')
                    .text('✅ Ativo pelo Comportamento')
                    .css({ 'background': 'rgba(16,185,129,0.2)', 'color': '#6ee7b7' });
            } else {
                $('#ovb-click-anim-preset-select').prop('disabled', true);
                $('#ovb-click-lock-badge')
                    .text('🔒 Bloqueado no Comportamento')
                    .css({ 'background': 'rgba(239,68,68,0.2)', 'color': '#fca5a5' });
            }
            pushHistory();
            syncPreview();
        });

        $(document).on('click', '.ovb-btn-pick-target', function () {
            targetPickerProp = $(this).attr('data-target-prop');
            isPickingTarget = true;
            showToast('🎯 Clique em qualquer elemento na página para vinculá-lo como alvo!');
        });

        // Código CSS do Elemento no final da Aba 1 (Propriedades)
        $(document).on('input change', '#ovb-element-custom-css', function () {
            if (!currentSelector) return;
            const val = $(this).val();
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].customCss = val;
            rec.customCss = val;
            syncPreview();
            clearTimeout(historyTimer);
            historyTimer = setTimeout(pushHistory, 400);
        });

        $(document).on('click', '#ovb-btn-open-code-from-prop', function () {
            $('#ovb-btn-code-editor').trigger('click');
        });

        // 9-Point Reference Point / Transform Origin Matrix (Illustrator style)
        $(document).on('click', '.ovb-origin-dot', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento primeiro!', true);
                return;
            }
            const origin = $(this).attr('data-origin') || 'center center';
            $('.ovb-origin-dot').removeClass('active');
            $(this).addClass('active');
            updateElementStyleProp('transformOrigin', origin);
            showToast(`Ponto de âncora alterado para: ${origin}`);
        });

        // Quick Flip H / Flip V & Rotate -90° / +90° / 0°
        $('#ovb-btn-flip-x').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].flipX = !rec.styles[currentBucket].flipX;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-btn-flip-y').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].flipY = !rec.styles[currentBucket].flipY;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-btn-rot-m90').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            const cur = parseFloat(String(rec.styles[currentBucket].rotate || '0').replace(/[^0-9.-]/g, '')) || 0;
            rec.styles[currentBucket].rotate = ((cur - 90) % 360) + 'deg';
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-btn-rot-p90').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            const cur = parseFloat(String(rec.styles[currentBucket].rotate || '0').replace(/[^0-9.-]/g, '')) || 0;
            rec.styles[currentBucket].rotate = ((cur + 90) % 360) + 'deg';
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-btn-rot-0').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].rotate = '0deg';
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        // Copy Current Device Styles to All Devices / Reset Current Device Bucket Only
        $('#ovb-btn-copy-device-to-all').on('click', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento primeiro!', true);
                return;
            }
            const rec = ensureElementRecord(currentSelector);
            const srcStyles = deepClone(rec.styles[currentBucket] || {});
            rec.styles.desktop = deepClone(srcStyles);
            rec.styles.tablet = deepClone(srcStyles);
            rec.styles.mobile = deepClone(srcStyles);
            pushHistory();
            syncPreview();
            showToast('📲 Estilo copiado para Desktop, Tablet e Mobile!');
        });

        $('#ovb-btn-reset-bucket').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket] = { rawCssProps: {} };
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            showToast(`🗑️ Ajustes de ${BUCKET_LABELS[currentBucket] || currentBucket} limpos (outros dispositivos intactos)!`);
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
            showToast('Posição X/Y centralizada (0px, 0px) neste dispositivo!');
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

            // Sync any duplicate inputs with the same [data-ovb-prop]
            $(`[data-ovb-prop="${prop}"]`).not(this).val(val);

            const $slider = $(`.ovb-range[data-ovb-range-for="${prop}"]`);
            if ($slider.length) {
                const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
                if (!isNaN(num)) $slider.val(num);
            }

            updateElementStyleProp(prop, val);
        });

        // Range Sliders Binding ([data-ovb-range-for]) — with Aspect Ratio Protection for Width/Height!
        $(document).on('input change', '.ovb-range[data-ovb-range-for]', function () {
            const prop = $(this).attr('data-ovb-range-for');
            const unit = $(this).attr('data-unit') || '';
            const numVal = parseFloat($(this).val());
            const val = numVal + unit;
            $(`[data-ovb-prop="${prop}"]`).val(val);

            // If Aspect Ratio Lock is active and user drags Width or Height slider, prevent stretching!
            if (aspectRatioLocked && currentSelector && (prop === 'width' || prop === 'height')) {
                const rec = ensureElementRecord(currentSelector);
                if (prop === 'width') {
                    // Setting height to 'auto' lets images/containers scale proportionally without stretching
                    delete rec.styles[currentBucket].height;
                    $('[data-ovb-prop="height"]').val('auto');
                } else if (prop === 'height') {
                    const ratio = (currentSnapshot && currentSnapshot.computed && currentSnapshot.computed.naturalRatio) || 0;
                    if (ratio > 0) {
                        const calcW = Math.round(numVal * ratio) + 'px';
                        rec.styles[currentBucket].width = calcW;
                        $('[data-ovb-prop="width"]').val(calcW);
                        $('#ovb-slider-width').val(Math.round(numVal * ratio));
                    }
                }
            }

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

        // Quick Shape Color & Gradient Swatches + Standalone Element Role/Interaction Controls
        $(document).on('click', '.ovb-shape-swatch-btn', function () {
            if (!currentSelector) {
                showToast('Selecione ou crie uma forma primeiro!', true);
                return;
            }
            const c1 = $(this).attr('data-c1') || '#8b5cf6';
            const c2 = $(this).attr('data-c2') || '';
            const useGrad = $(this).attr('data-grad') === '1';
            const rec = ensureElementRecord(currentSelector);
            const st = rec.styles[currentBucket];
            st.backgroundColor = c1;
            st.bgGradientEnabled = useGrad;
            if (useGrad && c2) {
                st.bgGradientColor1 = c1;
                st.bgGradientColor2 = c2;
                st.bgGradientType = 'linear';
                st.bgGradientAngle = 135;
            }
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            showToast('🎨 Cor/Degradê da forma atualizado!');
        });

        $(document).on('change', '.ovb-el-role-select', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento primeiro!', true);
                return;
            }
            const role = $(this).val() || '';
            const rec = ensureElementRecord(currentSelector);
            rec.elementRole = role;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            const labels = {
                '': 'Padrão nativo do elemento',
                'none': '🚫 Sem interação do usuário (Apenas forma visual)',
                'button': '🔘 Botão interativo clicável',
                'link': '🔗 Hyperlink clicável',
                'scroll': '⚓ Âncora de rolagem suave'
            };
            showToast(`Propriedade de interação: ${labels[role] || role}`);
        });

        $(document).on('input change', '.ovb-el-role-url', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.roleUrl = $(this).val().trim();
            syncPreview();
        });

        $(document).on('change', '.ovb-el-role-newtab', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.roleNewTab = $(this).is(':checked');
            pushHistory();
            syncPreview();
        });

        $(document).on('change', '.ovb-el-pass-events', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.passEvents = $(this).is(':checked');
            pushHistory();
            syncPreview();
        });

        // Tool Buttons (Top Control Bar, Left Toolstrip & Illustrator Strip)
        $(document).on('click', '.ovb-ai-tool-btn[data-ai-cmd], .ovb-cbar-btn[data-ai-cmd], .ovb-toolstrip-btn[data-ai-cmd]', function () {
            const cmd = $(this).attr('data-ai-cmd');
            executeShortcutCommand(cmd);
        });

        $('#ovb-btn-quick-hero-slogan').on('click', function () {
            currentSelector = '.hero-slogan';
            postToPreview({ type: 'OVB_SELECT_SELECTOR', selector: '.hero-slogan', scroll: true });
            populateSidebarFromSelection();
            showToast('🔤 Título abaixo da Logo (.hero-slogan) selecionado! Agora você pode arrastar, redimensionar ou editar o texto.');
        });

        $('#ovb-btn-quick-immune, #ovb-btn-mark-immune, #ovb-layer-act-immune').on('click', function () {
            if (!currentSelector) {
                showToast('Selecione primeiro o elemento (ex: Logo SVG ou Banner SVG) que deseja tornar Imune!', true);
                return;
            }
            window.postMessage({ type: 'OVB_TOGGLE_IMMUNE_ELEMENT', selector: currentSelector }, '*');
        });

        // ==========================================
        // TOP CONTROL BAR NUMERIC & TRANSFORM INPUTS
        // ==========================================
        $('#ovb-cbar-val-x').on('input change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].translateX = $(this).val();
            pushHistory();
            syncPreview();
        });

        $('#ovb-cbar-val-y').on('input change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].translateY = $(this).val();
            pushHistory();
            syncPreview();
        });

        $('#ovb-cbar-val-w').on('input change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            const val = $(this).val();
            rec.styles[currentBucket].width = val ? (isNaN(val) ? val : `${val}px`) : '';
            if (aspectRatioLocked && currentSnapshot && currentSnapshot.computed && currentSnapshot.computed.rect) {
                const aspect = (currentSnapshot.computed.rect.width / currentSnapshot.computed.rect.height) || 1;
                const numW = parseFloat(val);
                if (!isNaN(numW)) {
                    const newH = Math.round(numW / aspect);
                    rec.styles[currentBucket].height = `${newH}px`;
                    $('#ovb-cbar-val-h').val(newH);
                }
            }
            pushHistory();
            syncPreview();
        });

        $('#ovb-cbar-val-h').on('input change', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            const val = $(this).val();
            rec.styles[currentBucket].height = val ? (isNaN(val) ? val : `${val}px`) : '';
            pushHistory();
            syncPreview();
        });

        $('#ovb-cbar-aspect-lock').on('click', function () {
            aspectRatioLocked = !aspectRatioLocked;
            $(this).toggleClass('unlocked', !aspectRatioLocked);
            $('#ovb-btn-aspect-lock').toggleClass('unlocked', !aspectRatioLocked);
            postToPreview({ type: 'OVB_SET_ASPECT_LOCK', locked: aspectRatioLocked });
            showToast(aspectRatioLocked ? '🔒 Proporção travada!' : '🔓 Proporção livre ativada');
        });

        $('#ovb-cbar-rot-m90').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].rotate = (parseInt(rec.styles[currentBucket].rotate, 10) || 0) - 90;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-cbar-rot-p90').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].rotate = (parseInt(rec.styles[currentBucket].rotate, 10) || 0) + 90;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-cbar-flip-h').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].flipX = !rec.styles[currentBucket].flipX;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-cbar-flip-v').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].flipY = !rec.styles[currentBucket].flipY;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-cbar-z-top').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].zIndex = 9999;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-cbar-z-up').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].zIndex = (parseInt(rec.styles[currentBucket].zIndex, 10) || 10) + 1;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-cbar-z-down').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].zIndex = Math.max(0, (parseInt(rec.styles[currentBucket].zIndex, 10) || 10) - 1);
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        $('#ovb-cbar-z-bottom').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].zIndex = 0;
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        // ==========================================
        // TAB 3: EDITAR BUTTONS
        // ==========================================
        $('#ovb-edit-undo').on('click', () => $('#ovb-btn-undo').trigger('click'));
        $('#ovb-edit-redo').on('click', () => $('#ovb-btn-redo').trigger('click'));
        $('#ovb-edit-find').on('click', () => {
            $('.ovb-tab-btn[data-tab="tab-layers"]').trigger('click');
            $('#ovb-search-layers').focus();
        });
        $('#ovb-edit-cut').on('click', () => executeShortcutCommand('cut'));
        $('#ovb-edit-copy').on('click', () => executeShortcutCommand('copy'));
        $('#ovb-edit-paste').on('click', () => executeShortcutCommand('paste'));
        $('#ovb-edit-paste-in-place').on('click', () => executeShortcutCommand('paste-in-place'));
        $('#ovb-edit-duplicate').on('click', () => executeShortcutCommand('duplicate'));
        $('#ovb-edit-deselect').on('click', () => executeShortcutCommand('deselect'));
        $('#ovb-edit-delete').on('click', () => executeShortcutCommand('delete-element'));

        // ==========================================
        // TAB 4: CAMADAS GROUPING & CLIPPING MASK
        // ==========================================
        $('#ovb-btn-layer-group').on('click', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento para agrupar!', true);
                return;
            }
            const gName = prompt('Nome do novo grupo de camadas:', 'Grupo ' + (((state.layerGroups || []).length) + 1));
            if (!gName) return;
            if (!Array.isArray(state.layerGroups)) state.layerGroups = [];
            const gId = 'ovb_grp_' + Date.now();
            state.layerGroups.push({
                id: gId,
                name: gName,
                selectors: [currentSelector]
            });
            pushHistory();
            renderNavigatorTree();
            showToast(`📦 Grupo '${gName}' criado!`);
        });

        $('#ovb-btn-layer-ungroup').on('click', function () {
            if (!Array.isArray(state.layerGroups) || !state.layerGroups.length) {
                showToast('Nenhum grupo de camadas criado ainda.', true);
                return;
            }
            state.layerGroups = state.layerGroups.filter(g => !g.selectors || !g.selectors.includes(currentSelector));
            pushHistory();
            renderNavigatorTree();
            showToast('📦 Elemento desagrupado!');
        });

        $('#ovb-btn-layer-mask').on('click', function () {
            if (!currentSelector) {
                showToast('Selecione um elemento para aplicar máscara de recorte (Clipping Mask)!', true);
                return;
            }
            const rec = ensureElementRecord(currentSelector);
            const st = rec.styles[currentBucket];
            if (st.clipPath) {
                delete st.clipPath;
                delete st.overflow;
                showToast('Máscara de recorte removida.');
            } else {
                st.overflow = 'hidden';
                st.clipPath = 'inset(0px round 16px)';
                showToast('✂ Máscara de recorte (Clipping Mask) aplicada!');
            }
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
        });

        // ==========================================
        // TAB 8: EXPORTAR ACTIONS
        // ==========================================
        $('#ovb-export-what-selector').on('change', function () {
            const val = $(this).val();
            $('#ovb-export-preset-picker-wrap').toggle(val === 'preset');
        });

        function generateDesignTokens(data) {
            const tokens = {
                color: {
                    brand: { value: '#8b5cf6', type: 'color' },
                    accent: { value: '#ec4899', type: 'color' }
                },
                dimension: {},
                elevation: {}
            };
            (data.colorPalettes || []).forEach(p => {
                tokens.color[p.id] = {
                    accent: { value: p.accent, type: 'color' },
                    accentHover: { value: p.accentHover || p.accent, type: 'color' },
                    bgDark: { value: p.bgDark || '#0f172a', type: 'color' },
                    bgLight: { value: p.bgLight || '#f8fafc', type: 'color' }
                };
            });
            return tokens;
        }

        const crcTable = (() => {
            let c;
            const table = [];
            for (let n = 0; n < 256; n++) {
                c = n;
                for (let k = 0; k < 8; k++) {
                    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
                }
                table[n] = c;
            }
            return table;
        })();

        function crc32(r) {
            let t = -1;
            for (let i = 0; i < r.length; i++) {
                t = (t >>> 8) ^ crcTable[(t ^ r[i]) & 255];
            }
            return (t ^ -1) >>> 0;
        }

        function downloadZipFile(zipFilename, files) {
            const textEnc = new TextEncoder();
            const localHeaders = [];
            const centralHeaders = [];
            let offset = 0;

            files.forEach(file => {
                const nameBytes = textEnc.encode(file.name);
                const dataBytes = textEnc.encode(file.content);
                const crc = crc32(dataBytes);
                const size = dataBytes.length;

                // Local file header (30 bytes + name length + data)
                const local = new Uint8Array(30 + nameBytes.length + size);
                const lv = new DataView(local.buffer);
                lv.setUint32(0, 0x04034b50, true);
                lv.setUint16(4, 20, true);
                lv.setUint16(6, 0, true);
                lv.setUint16(8, 0, true);
                lv.setUint16(10, 0, true);
                lv.setUint16(12, 0, true);
                lv.setUint32(14, crc, true);
                lv.setUint32(18, size, true);
                lv.setUint32(22, size, true);
                lv.setUint16(26, nameBytes.length, true);
                lv.setUint16(28, 0, true);
                local.set(nameBytes, 30);
                local.set(dataBytes, 30 + nameBytes.length);
                localHeaders.push(local);

                // Central directory header (46 bytes + name length)
                const cd = new Uint8Array(46 + nameBytes.length);
                const cv = new DataView(cd.buffer);
                cv.setUint32(0, 0x02014b50, true);
                cv.setUint16(4, 20, true);
                cv.setUint16(6, 20, true);
                cv.setUint16(8, 0, true);
                cv.setUint16(10, 0, true);
                cv.setUint16(12, 0, true);
                cv.setUint32(16, crc, true);
                cv.setUint32(20, size, true);
                cv.setUint32(24, size, true);
                cv.setUint16(28, nameBytes.length, true);
                cv.setUint16(30, 0, true);
                cv.setUint16(32, 0, true);
                cv.setUint16(34, 0, true);
                cv.setUint32(36, 0, true);
                cv.setUint32(42, offset, true);
                cd.set(nameBytes, 46);
                centralHeaders.push(cd);

                offset += local.length;
            });

            const cdOffset = offset;
            let cdSize = 0;
            centralHeaders.forEach(c => cdSize += c.length);

            const eocd = new Uint8Array(22);
            const ev = new DataView(eocd.buffer);
            ev.setUint32(0, 0x06054b50, true);
            ev.setUint16(4, 0, true);
            ev.setUint16(6, 0, true);
            ev.setUint16(8, files.length, true);
            ev.setUint16(10, files.length, true);
            ev.setUint32(12, cdSize, true);
            ev.setUint32(16, cdOffset, true);
            ev.setUint16(20, 0, true);

            const blob = new Blob([...localHeaders, ...centralHeaders, eocd], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = zipFilename;
            a.click();
            URL.revokeObjectURL(url);
        }

        $('#ovb-btn-export-zip-css').on('click', function () {
            const pName = (state.presetName || 'odysseexp').toLowerCase().replace(/\s+/g, '-');
            const files = [
                { name: 'style.css', content: latestCompiledCss || '/* Theme Compiled CSS */' },
                { name: `${pName}.json`, content: JSON.stringify(state, null, 2) },
                { name: 'tokens.json', content: JSON.stringify(generateDesignTokens(state), null, 2) }
            ];
            downloadZipFile(`odyssee-${pName}-theme.zip`, files);
            showToast('📦 Arquivo .zip gerado e baixado com sucesso!');
        });

        $('#ovb-btn-export-figma').on('click', function () {
            const scope = $('#ovb-export-what-selector').val() === 'element' ? 'element' : 'page';
            postToPreview({
                type: 'OVB_EXPORT_FIGMA_SVG',
                target: 'figma',
                scope: scope,
                selector: currentSelector
            });
            showToast('🎨 Gerando SVG otimizado para o Figma...');
        });

        $('#ovb-btn-export-lunacy').on('click', function () {
            const scope = $('#ovb-export-what-selector').val() === 'element' ? 'element' : 'page';
            postToPreview({
                type: 'OVB_EXPORT_FIGMA_SVG',
                target: 'lunacy',
                scope: scope,
                selector: currentSelector
            });
            showToast('🌙 Gerando SVG otimizado para o Lunacy...');
        });

        $('#ovb-btn-export-tokens').on('click', function () {
            const tokens = generateDesignTokens(state);
            const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `odyssee-tokens.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('💎 Design Tokens W3C exportados!');
        });

        // ==========================================
        // TAB 9: PREFERÊNCIAS (INTERACTIVE SHORTCUT RECORDING)
        // ==========================================
        let recordingShortcutBtn = null;
        $(document).on('click', '.ovb-sc-btn', function () {
            $('.ovb-sc-btn').removeClass('recording').text(function () { return $(this).attr('data-key') || ''; });
            recordingShortcutBtn = $(this);
            recordingShortcutBtn.addClass('recording').text('Pressione...');
        });

        $(document).on('keydown', function (e) {
            if (!recordingShortcutBtn) return;
            e.preventDefault();
            e.stopPropagation();
            const parts = [];
            if (e.ctrlKey) parts.push('Ctrl');
            if (e.shiftKey) parts.push('Shift');
            if (e.altKey) parts.push('Alt');
            const key = e.key.toUpperCase();
            if (!['CONTROL', 'SHIFT', 'ALT'].includes(key)) {
                parts.push(key);
                const combo = parts.join('+');
                const act = recordingShortcutBtn.closest('.ovb-shortcut-row').attr('data-action');
                recordingShortcutBtn.attr('data-key', combo).text(combo).removeClass('recording');
                if (!state.shortcuts) state.shortcuts = {};
                state.shortcuts[act] = combo;
                recordingShortcutBtn = null;
                pushHistory();
                showToast(`⌨ Atalho atualizado: ${act} → ${combo}`);
            }
        });

        $('#ovb-btn-reset-shortcuts').on('click', function () {
            delete state.shortcuts;
            pushHistory();
            $('.ovb-shortcut-row').each(function () {
                const btn = $(this).find('.ovb-sc-btn');
                const dKey = btn.attr('data-default-key') || btn.text();
                btn.attr('data-key', dKey).text(dKey);
            });
            showToast('Atalhos restaurados para o padrão');
        });

        // Insert any of the 21 Pre-Built Presets (1–12 Small/Modular & 13–21 Robust Full-Screen)
        $(document).on('click', '.ovb-preset-catalog-card', function () {
            const presetId = $(this).attr('data-preset-id');
            const catalog = window.ODYSSEE_VB_PRESETS_CATALOG || [];
            const presetDef = catalog.find(p => p.id === presetId);
            if (!presetDef) return;

            const targetSel = currentSelector || 'main, .main-content, .immersive-wrapper, body';
            const pos = $('#ovb-insert-position').val() || 'after';
            const id = 'ovb_blk_' + Math.random().toString(36).substring(2, 8);

            const newBlock = {
                id: id,
                type: presetDef.id,
                targetSelector: targetSel,
                position: pos,
                config: deepClone(presetDef.defaultConfig || {}),
                content: { html: presetDef.html || '' }
            };

            if (!Array.isArray(state.blocks)) state.blocks = [];
            state.blocks.push(newBlock);

            if (presetDef.defaultConfig) {
                const rec = ensureElementRecord('#' + id);
                rec.specialConfig = deepClone(presetDef.defaultConfig);
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
            }, 140);

            showToast(`✨ ${presetDef.label} inserido! Você pode editar tudo livremente.`);
        });

        // Quick Select Orbit Hero (#6) or Carousel (#5) on Home Page
        $('#ovb-btn-quick-select-orbit').on('click', function () {
            currentSelector = '#artcraft-orbit-container';
            postToPreview({ type: 'OVB_SELECT_SELECTOR', selector: '#artcraft-orbit-container', scroll: true });
            populateSidebarFromSelection();
            showToast('🪐 Cards Flutuantes Orbitais selecionados!');
        });

        $('#ovb-btn-quick-select-carousel').on('click', function () {
            currentSelector = '#carousel-recentes';
            postToPreview({ type: 'OVB_SELECT_SELECTOR', selector: '#carousel-recentes', scroll: true });
            populateSidebarFromSelection();
            showToast('🎠 Carrossel selecionado!');
        });

        // Live Special Config Binding ([data-ovb-sconfig]) for Carousels (#5), Floating Orbit (#6), and Gradient (#8)
        $(document).on('input change', '[data-ovb-sconfig]', function () {
            const key = $(this).attr('data-ovb-sconfig');
            let val = $(this).val();
            if (['cardsCount', 'visibleCards', 'speed', 'totalCards', 'density', 'speedMult', 'smoothness', 'ring1Dir', 'ring2Dir', 'ring3Dir', 'ring4Dir', 'hoverWarp', 'hoverTug', 'chromaticAberration', 'bloom', 'heightPx'].includes(key)) {
                const num = parseFloat(val);
                if (!isNaN(num)) val = num;
            }

            // Target current selector, or auto-fallback to #artcraft-orbit-container / #carousel-recentes
            let targetSel = currentSelector;
            if (!targetSel) {
                if (['totalCards', 'density', 'speedMult', 'smoothness', 'ring1Dir', 'ring2Dir', 'ring3Dir', 'ring4Dir', 'hoverWarp', 'hoverTug', 'chromaticAberration', 'bloom'].includes(key)) {
                    targetSel = '#artcraft-orbit-container';
                } else if (['direction', 'mode', 'cardsCount', 'visibleCards', 'speed', 'category'].includes(key)) {
                    targetSel = '#carousel-recentes';
                } else {
                    targetSel = '.gradient-fade-bottom';
                }
                currentSelector = targetSel;
            }

            const rec = ensureElementRecord(targetSel);
            rec.specialConfig[key] = val;

            // If it's a custom block, also update block.config
            if (targetSel.startsWith('#ovb_blk_')) {
                const bId = targetSel.slice(1);
                const blk = (state.blocks || []).find(b => b.id === bId);
                if (blk) {
                    if (!blk.config) blk.config = {};
                    blk.config[key] = val;
                }
            }

            syncPreview();
            clearTimeout(historyTimer);
            historyTimer = setTimeout(pushHistory, 450);
        });

        // ==========================================
        // INDIVIDUAL ELEMENT UI STYLE vs GLOBAL UI DESIGN SYSTEM SWITCHERS
        // ==========================================
        $(document).on('click', '.ovb-uistyle-target-btn', function () {
            uiStyleTargetMode = $(this).attr('data-target-mode') || 'element';
            $('.ovb-uistyle-target-btn').removeClass('active');
            $(this).addClass('active');
            if (uiStyleTargetMode === 'element') {
                $('#ovb-uistyle-mode-hint').html('✅ <strong>Modo Individual Ativo:</strong> clicar em qualquer card abaixo muda o estilo <strong>apenas do elemento selecionado</strong> (ex: um botão da Header), sem alterar o resto do site!').css('color', '#a7f3d0');
            } else {
                $('#ovb-uistyle-mode-hint').html('🌐 <strong>Modo Global Ativo:</strong> clicar em um card abaixo mudará o Design System da <strong>página inteira</strong> (exceto itens marcados como Imunes).').css('color', '#fde68a');
            }
            syncUiStyleCardsSelection();
        });

        $(document).on('click', '.ovb-uistyle-card', function () {
            const uiStyle = $(this).attr('data-uistyle') || 'odysseexp';
            const cardTitle = $(this).find('.ovb-uistyle-card-title span').first().text();

            // If "Tema Não Aplicável (Imune)" card is clicked, or if Individual Mode is active and an element is selected:
            if (uiStyle === 'none' || (uiStyleTargetMode === 'element' && currentSelector)) {
                if (!currentSelector) {
                    showToast('Selecione primeiro um elemento na página para aplicar este estilo individualmente!', true);
                    return;
                }
                const rec = ensureElementRecord(currentSelector);
                rec.elUiStyle = uiStyle;
                $('#ovb-el-uistyle-select').val(uiStyle);
                syncUiStyleCardsSelection();
                pushHistory();
                syncPreview();
                renderNavigatorTree();
                updateCompiledCodeDisplay();
                showToast(uiStyle === 'none'
                    ? `🛡️ Item '${currentSelector}' marcado como Tema Não Aplicável (Imune)!`
                    : `🎯 Estilo '${cardTitle}' aplicado SOMENTE ao item selecionado (${currentSelector})!`);
                return;
            }

            // Otherwise (Global mode or no element selected), apply to the entire site
            $('.ovb-uistyle-card').removeClass('active');
            $(this).addClass('active');
            $('#ovb-topbar-uistyle').val(uiStyle);
            state.uiStyle = uiStyle;
            pushHistory();
            syncPreview();
            updateCompiledCodeDisplay();
            showToast(`🌐 Estilo Global da Página alterado para: ${cardTitle}!`);
        });

        $('#ovb-topbar-uistyle').on('change', function () {
            const uiStyle = $(this).val() || 'odysseexp';
            state.uiStyle = uiStyle;
            syncUiStyleCardsSelection();
            pushHistory();
            syncPreview();
            updateCompiledCodeDisplay();
            showToast(`🌐 Estilo Global da Página alterado para: ${uiStyle}!`);
        });

        $('#ovb-iconpack-select').on('change', function () {
            state.iconPack = $(this).val() || 'default';
            pushHistory();
            syncPreview();
            updateCompiledCodeDisplay();
            showToast('✨ Pacote de Ícones atualizado em toda a página!');
        });

        // ==========================================
        // LIVE CODE EDITOR IDE (CSS, HTML & SVG)
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
            if (paneId === 'pane-compiled-export') {
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

        // Helper to insert a brand-new standalone SVG/HTML block on the page
        function insertNewSvgOrHtmlBlock(rawMarkup) {
            const code = (rawMarkup || '').trim();
            if (!code) {
                showToast('Cole ou digite um código <svg>...</svg> ou HTML primeiro!', true);
                return;
            }
            const newId = 'ovb_blk_' + Date.now();
            const targetSel = (currentSelector && currentSelector !== 'body') ? currentSelector : 'body';
            const pos = targetSel === 'body' ? 'append' : 'after';

            if (!Array.isArray(state.blocks)) state.blocks = [];
            state.blocks.push({
                id: newId,
                type: 'html',
                targetSelector: targetSel,
                position: pos,
                content: {
                    html: code
                }
            });

            const blkSel = '#' + newId;
            const rec = ensureElementRecord(blkSel);
            rec.content.innerHTML = code;
            rec.elUiStyle = 'none'; // Keep SVG/HTML blocks immune to theme button overrides by default

            pushHistory();
            syncPreview();
            setTimeout(() => {
                postToPreview({ type: 'OVB_SELECT_SELECTOR', selector: blkSel });
            }, 90);
            showToast('✨ Novo bloco SVG / HTML inserido na página e selecionado!');
        }

        // Apply Raw HTML / SVG to the currently selected element
        function applyRawHtmlOrSvgToSelected(rawVal, showFeedback) {
            if (!currentSelector) {
                if (showFeedback) {
                    insertNewSvgOrHtmlBlock(rawVal);
                }
                return;
            }
            const rec = ensureElementRecord(currentSelector);
            rec.content.innerHTML = rawVal;

            // If this element is a custom block (#ovb_blk_...), also sync its block.content.html so renderCustomBlocks() preserves it
            if (currentSnapshot && currentSnapshot.isCustomBlock && currentSnapshot.blockId && Array.isArray(state.blocks)) {
                const blk = state.blocks.find(b => b && b.id === currentSnapshot.blockId);
                if (blk) {
                    if (!blk.content) blk.content = {};
                    blk.content.html = rawVal;
                }
            }

            syncPreview();
            if (showFeedback) {
                pushHistory();
                showToast('✅ Código HTML / SVG aplicado no elemento selecionado!');
            }
        }

        // Element Raw innerHTML / SVG live editing in Code IDE Drawer
        $('#ovb-code-el-html-editor').on('input', function () {
            if (!currentSelector) return;
            applyRawHtmlOrSvgToSelected($(this).val(), false);
        });

        $('#ovb-btn-apply-raw-html').on('click', function () {
            applyRawHtmlOrSvgToSelected($('#ovb-code-el-html-editor').val(), true);
        });

        $('#ovb-btn-insert-new-svg-block').on('click', function () {
            insertNewSvgOrHtmlBlock($('#ovb-code-el-html-editor').val());
        });

        $('#ovb-btn-select-parent-svg').on('click', function () {
            const parentSvgSel = $(this).attr('data-parent-svg');
            if (parentSvgSel) {
                postToPreview({ type: 'OVB_SELECT_SELECTOR', selector: parentSvgSel });
                showToast('⬆️ Tag <svg> raiz selecionada!');
            }
        });

        $('#ovb-btn-upload-svg-file').on('click', function () {
            $('#ovb-upload-svg-input').trigger('click');
        });

        $('#ovb-upload-svg-input').on('change', function (e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (evt) {
                const svgContent = String(evt.target.result || '').trim();
                if (!svgContent) return;
                $('#ovb-code-el-html-editor').val(svgContent);
                if (currentSelector && currentSelector !== 'body') {
                    applyRawHtmlOrSvgToSelected(svgContent, true);
                } else {
                    insertNewSvgOrHtmlBlock(svgContent);
                }
            };
            reader.readAsText(file);
            $(this).val('');
        });

        $('#ovb-btn-restore-el-html').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            delete rec.content.innerHTML;
            pushHistory();
            syncPreview();
            setTimeout(() => {
                postToPreview({ type: 'OVB_SELECT_SELECTOR', selector: currentSelector });
            }, 60);
            showToast('↺ Código original do elemento restaurado!');
        });

        // Copy Compiled CSS & Copy Preset JSON
        $('#ovb-btn-copy-compiled-css').on('click', function () {
            navigator.clipboard.writeText(latestCompiledCss || '');
            showToast('📋 CSS Compilado copiado para a área de transferência!');
        });

        $('#ovb-btn-copy-preset-json').on('click', function () {
            navigator.clipboard.writeText(JSON.stringify(state, null, 2));
            showToast('📋 Predefinição JSON copiada para a área de transferência!');
        });

        // ==========================================
        // GLOBAL THEME VARIABLES, CUSTOM COLOR PALETTES & GLOBAL CSS
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

        // Custom Color Palettes: Visitor Cookie Switch Toggle, Global Palette, Per-Page Palette, Add/Delete Palette
        $('#ovb-allow-visitor-color-switch').on('change', function () {
            state.allowVisitorColorSwitch = $(this).is(':checked');
            pushHistory();
            syncPreview();
            showToast(state.allowVisitorColorSwitch
                ? '🍪 Visitantes podem alterar a cor global nos Settings (salvo em cookie do navegador)!'
                : '🔒 Seletor de cor para visitantes desativado nos Settings.');
        });

        $('#ovb-global-palette-select').on('change', function () {
            state.activeGlobalPalette = $(this).val() || '';
            pushHistory();
            syncPreview();
            showToast(state.activeGlobalPalette ? `🌐 Paleta Global definida para: ${state.activeGlobalPalette}` : '🌐 Paleta Global restaurada ao padrão!');
        });

        $(document).on('change', '.ovb-page-palette-select', function () {
            const pageKey = $(this).attr('data-page-key');
            const val = $(this).val() || '';
            if (!state.pagePalettes || typeof state.pagePalettes !== 'object') state.pagePalettes = {};
            if (val) {
                state.pagePalettes[pageKey] = val;
            } else {
                delete state.pagePalettes[pageKey];
            }
            pushHistory();
            syncPreview();
            showToast(`📄 Paleta da página (${pageKey}) atualizada!`);
        });

        $('#ovb-btn-add-palette').on('click', function () {
            const name = $('#ovb-new-palette-name').val().trim();
            if (!name) {
                showToast('Digite um nome para a nova paleta de cor!', true);
                return;
            }
            const id = 'pal_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Math.random().toString(36).substring(2, 5);
            const newPal = {
                id: id,
                name: name,
                accent: $('#ovb-new-pal-accent').val() || '#10b981',
                accentHover: $('#ovb-new-pal-hover').val() || '#059669',
                nebula1: $('#ovb-new-pal-neb1').val() || '#047857',
                nebula2: $('#ovb-new-pal-neb2').val() || '#06b6d4',
                nebula3: $('#ovb-new-pal-neb3').val() || '#3b82f6',
                bgDark: $('#ovb-new-pal-bg').val() || '#0b0f17'
            };
            if (!Array.isArray(state.colorPalettes)) state.colorPalettes = [];
            state.colorPalettes.push(newPal);
            state.activeGlobalPalette = id;
            $('#ovb-new-palette-name').val('');
            pushHistory();
            renderColorPalettesUI();
            syncPreview();
            showToast(`🎨 Nova paleta '${name}' criada e aplicada! Também disponível nos Settings do site.`);
        });

        $(document).on('click', '.ovb-apply-pal-global', function () {
            const palId = $(this).attr('data-pal-id');
            if (!palId) return;
            state.activeGlobalPalette = palId;
            pushHistory();
            renderColorPalettesUI();
            syncPreview();
            showToast('🌐 Paleta definida como Global para todo o site!');
        });

        $(document).on('click', '.ovb-del-palette-btn', function () {
            const idx = parseInt($(this).attr('data-idx'), 10);
            if (!Array.isArray(state.colorPalettes) || !state.colorPalettes[idx]) return;
            const removed = state.colorPalettes.splice(idx, 1)[0];
            if (removed && state.activeGlobalPalette === removed.id) {
                state.activeGlobalPalette = '';
            }
            pushHistory();
            renderColorPalettesUI();
            syncPreview();
            showToast('Paleta removida.');
        });

        // Global Custom CSS
        $('#ovb-global-custom-css').on('input', function () {
            state.customCss = $(this).val();
            syncPreview();
        });

        // ==========================================
        // 3-TIER PRESETS MANAGER (1. Conjuntos, 2. Página Única, 3. Site Todo)
        // ==========================================
        // Tier 1: Save/Insert/Export User Component Set Presets
        $('#ovb-btn-save-comp-preset').on('click', function () {
            if (!currentSelector) {
                showToast('Selecione primeiro o elemento ou conjunto que deseja salvar como Preset!', true);
                return;
            }
            const name = $('#ovb-comp-preset-name').val().trim() || ((currentSnapshot && currentSnapshot.label) || 'Meu Conjunto');
            postToPreview({
                type: 'OVB_CAPTURE_COMPONENT_PRESET',
                selector: currentSelector,
                name: name
            });
            $('#ovb-comp-preset-name').val('');
        });

        $(document).on('click', '.ovb-insert-comp-preset', function () {
            const idx = parseInt($(this).attr('data-idx'), 10);
            const comp = (state.componentPresets || [])[idx];
            if (!comp) return;
            const targetSel = currentSelector || 'main, .main-content, .immersive-wrapper, body';
            const pos = $('#ovb-insert-position').val() || 'after';
            const id = 'ovb_blk_' + Math.random().toString(36).substring(2, 8);

            state.blocks.push({
                id: id,
                type: 'user-component-preset',
                targetSelector: targetSel,
                position: pos,
                content: { html: comp.html }
            });
            if (comp.elConfig && Object.keys(comp.elConfig).length > 0) {
                state.elements['#' + id] = deepClone(comp.elConfig);
            }
            pushHistory();
            syncPreview();
            showToast(`🧩 Conjunto '${comp.name}' inserido na página!`);
        });

        $(document).on('click', '.ovb-export-single-comp', function () {
            const idx = parseInt($(this).attr('data-idx'), 10);
            const comp = (state.componentPresets || [])[idx];
            if (!comp) return;
            const slug = (comp.name || 'conjunto').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const blob = new Blob([JSON.stringify({ type: 'odyssee-component-preset', version: '26.10.8', preset: comp }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `preset-conjunto-${slug}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        $(document).on('click', '.ovb-del-comp-preset', function () {
            const idx = parseInt($(this).attr('data-idx'), 10);
            if (!Array.isArray(state.componentPresets)) return;
            state.componentPresets.splice(idx, 1);
            pushHistory();
            renderUserComponentPresets();
            showToast('Conjunto removido.');
        });

        $('#ovb-btn-export-all-comp-presets').on('click', function () {
            const blob = new Blob([JSON.stringify({ type: 'odyssee-component-presets-collection', version: '26.10.8', componentPresets: state.componentPresets || [] }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'odyssee-presets-conjuntos.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        $('#ovb-btn-import-comp-presets').on('click', function () {
            $('#ovb-import-comp-file').trigger('click');
        });

        $('#ovb-import-comp-file').on('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    const parsed = JSON.parse(ev.target.result);
                    if (!Array.isArray(state.componentPresets)) state.componentPresets = [];
                    if (parsed.preset) {
                        state.componentPresets.push(parsed.preset);
                    } else if (Array.isArray(parsed.componentPresets)) {
                        state.componentPresets.push(...parsed.componentPresets);
                    }
                    pushHistory();
                    renderUserComponentPresets();
                    showToast('Conjunto(s) importado(s) com sucesso!');
                } catch (err) {
                    showToast('Arquivo JSON de conjunto inválido.', true);
                }
            };
            reader.readAsText(file);
        });

        // Tier 2: Save/Load/Export Single Page Presets
        $('#ovb-btn-save-page-preset').on('click', function () {
            const pageLabel = $('#ovb-page-switcher option:selected').text().trim() || 'Página Atual';
            const customName = $('#ovb-page-preset-name').val().trim() || `${pageLabel} (${new Date().toLocaleTimeString()})`;
            if (!state.pagePresets || typeof state.pagePresets !== 'object') state.pagePresets = {};
            state.pagePresets[customName] = {
                name: customName,
                pageUrl: $('#ovb-page-switcher').val() || '/',
                uiStyle: state.uiStyle,
                iconPack: state.iconPack,
                elements: deepClone(state.elements || {}),
                blocks: deepClone(state.blocks || []),
                domMoves: deepClone(state.domMoves || []),
                clones: deepClone(state.clones || [])
            };
            $('#ovb-page-preset-name').val('');
            pushHistory();
            renderPagePresetsDropdown();
            $('#ovb-page-preset-selector').val(customName);
            showToast(`📄 Preset de página '${customName}' salvo!`);
        });

        $('#ovb-btn-load-page-preset').on('click', function () {
            const pName = $('#ovb-page-preset-selector').val();
            if (!pName || !state.pagePresets || !state.pagePresets[pName]) {
                showToast('Selecione um Preset de Página primeiro!', true);
                return;
            }
            const pg = deepClone(state.pagePresets[pName]);
            state.elements = Object.assign({}, state.elements || {}, pg.elements || {});
            state.blocks = pg.blocks || [];
            state.domMoves = pg.domMoves || [];
            state.clones = pg.clones || [];
            pushHistory();
            syncPreview();
            populateSidebarFromSelection();
            showToast(`📄 Preset de página '${pName}' aplicado!`);
        });

        $('#ovb-btn-export-page-preset').on('click', function () {
            const pName = $('#ovb-page-preset-selector').val();
            const pageData = (pName && state.pagePresets && state.pagePresets[pName]) ? state.pagePresets[pName] : {
                name: 'Pagina-Atual',
                pageUrl: $('#ovb-page-switcher').val() || '/',
                elements: state.elements,
                blocks: state.blocks,
                domMoves: state.domMoves,
                clones: state.clones
            };
            const slug = (pageData.name || 'pagina').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const blob = new Blob([JSON.stringify({ type: 'odyssee-single-page-preset', version: '26.10.8', pagePreset: pageData }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `preset-pagina-${slug}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // Tier 3: Full Site Presets (OdysseeXP / Tema em Branco / Named Presets)
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

        // ==========================================
        // FIGMA & LUNACY OPEN-STANDARD EXPORT (Layered .SVG Artboard + W3C .tokens.json)
        // ==========================================
        $('#ovb-btn-export-figma').on('click', function () {
            const scope = $('#ovb-design-export-scope').val() || 'page';
            if (scope === 'element' && !currentSelector) {
                showToast('Selecione um elemento ou conjunto primeiro para exportar!', true);
                return;
            }
            postToPreview({
                type: 'OVB_EXPORT_FIGMA_SVG',
                target: 'figma',
                scope: scope,
                selector: currentSelector
            });
        });

        $('#ovb-btn-export-lunacy').on('click', function () {
            const scope = $('#ovb-design-export-scope').val() || 'page';
            if (scope === 'element' && !currentSelector) {
                showToast('Selecione um elemento ou conjunto primeiro para exportar!', true);
                return;
            }
            postToPreview({
                type: 'OVB_EXPORT_FIGMA_SVG',
                target: 'lunacy',
                scope: scope,
                selector: currentSelector
            });
        });

        $('#ovb-btn-export-tokens').on('click', function () {
            const slug = (state.presetName || 'odysseexp').toLowerCase().replace(/\s+/g, '-');
            const w3cTokens = {
                "$schema": "https://tr.designtokens.org/format/",
                "meta": {
                    "generator": "Odyssee Visual Studio v26.10.8",
                    "compatibleWith": ["Figma (Tokens Studio / Native Variables)", "Lunacy", "VS Code / Cursor"],
                    "presetName": state.presetName || "OdysseeXP",
                    "uiStyle": state.uiStyle || "odysseexp",
                    "iconPack": state.iconPack || "default"
                },
                "color": {
                    "accent": { "$value": (state.globalVars && state.globalVars.all && state.globalVars.all['--color-accent']) || "#8b5cf6", "$type": "color" },
                    "nebula-1": { "$value": (state.globalVars && state.globalVars.all && state.globalVars.all['--nebula-1']) || "#9333ea", "$type": "color" },
                    "nebula-2": { "$value": (state.globalVars && state.globalVars.all && state.globalVars.all['--nebula-2']) || "#c026d3", "$type": "color" },
                    "nebula-3": { "$value": (state.globalVars && state.globalVars.all && state.globalVars.all['--nebula-3']) || "#7c3aed", "$type": "color" },
                    "dark-bg": { "$value": (state.globalVars && state.globalVars.dark && state.globalVars.dark['--bg-page']) || "#0d1538", "$type": "color" },
                    "light-bg": { "$value": (state.globalVars && state.globalVars.light && state.globalVars.light['--bg-page']) || "#f8fafc", "$type": "color" }
                },
                "colorPalettes": state.colorPalettes || [],
                "elements": state.elements || {}
            };
            const blob = new Blob([JSON.stringify(w3cTokens, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${slug}-figma-lunacy.tokens.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('💎 W3C Design Tokens (.tokens.json) exportado para Figma & Lunacy!');
        });

        // ==========================================
        // PHOTOSHOP / ILLUSTRATOR LAYERS PANEL INTERACTIONS (Thumbnails, Eye, Lock, Z-Index & Spotlight)
        // ==========================================
        $(document).on('click', '.ovb-layer-view-btn', function () {
            layerViewMode = $(this).attr('data-layer-view') || 'sections';
            $('.ovb-layer-view-btn').removeClass('active');
            $(this).addClass('active');
            renderNavigatorTree();
        });

        $('#ovb-btn-refresh-layers').on('click', function () {
            postToPreview({ type: 'OVB_REQUEST_TREE' });
            showToast('↻ Camadas e miniaturas atualizadas!');
        });

        $(document).on('click', '.ovb-ps-layer-row, .ovb-ps-group-header, .ovb-tree-item', function (e) {
            if ($(e.target).closest('.ovb-ps-icon-toggle, .ovb-del-rule, .ovb-insert-comp-preset, .ovb-export-single-comp, .ovb-del-comp-preset').length) return;
            const sel = $(this).attr('data-sel');
            if (!sel) return;
            currentSelector = sel;
            $('.ovb-ps-layer-row').removeClass('is-selected');
            $(this).closest('.ovb-ps-layer-row').addClass('is-selected');
            postToPreview({
                type: 'OVB_SELECT_SELECTOR',
                selector: sel,
                scroll: true
            });
        });

        // Hovering a layer row spotlights the element directly on the live canvas!
        $(document).on('mouseenter', '.ovb-ps-layer-row', function () {
            const sel = $(this).attr('data-sel');
            if (sel) {
                postToPreview({ type: 'OVB_SPOTLIGHT_SELECTOR', selector: sel });
            }
        });

        $(document).on('mouseleave', '.ovb-ps-layer-row', function () {
            postToPreview({ type: 'OVB_SPOTLIGHT_SELECTOR', selector: '' });
        });

        // Eye icon toggle (Show / Hide layer)
        $(document).on('click', '.ovb-ps-eye', function (e) {
            e.stopPropagation();
            const sel = $(this).attr('data-sel');
            if (!sel) return;
            const rec = ensureElementRecord(sel);
            rec.styles[currentBucket].hidden = !rec.styles[currentBucket].hidden;
            pushHistory();
            syncPreview();
            renderNavigatorTree();
            if (currentSelector === sel) populateSidebarFromSelection();
        });

        // Lock icon toggle (Lock / Unlock layer from accidental canvas drag)
        $(document).on('click', '.ovb-ps-lock', function (e) {
            e.stopPropagation();
            const sel = $(this).attr('data-sel');
            if (!sel) return;
            const rec = ensureElementRecord(sel);
            rec.locked = !rec.locked;
            pushHistory();
            syncPreview();
            renderNavigatorTree();
            showToast(rec.locked ? `🔒 Camada '${sel}' trancada!` : `🔓 Camada '${sel}' destrancada!`);
        });

        // Z-Index Up / Down buttons inside layer row
        $(document).on('click', '.ovb-ps-zup', function (e) {
            e.stopPropagation();
            const sel = $(this).attr('data-sel');
            if (!sel) return;
            currentSelector = sel;
            executeShortcutCommand('layer-forward');
        });

        $(document).on('click', '.ovb-ps-zdown', function (e) {
            e.stopPropagation();
            const sel = $(this).attr('data-sel');
            if (!sel) return;
            currentSelector = sel;
            executeShortcutCommand('layer-back');
        });

        // Quick Layer Bar Actions for Currently Selected Element
        $('#ovb-layer-act-vis').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.styles[currentBucket].hidden = !rec.styles[currentBucket].hidden;
            pushHistory();
            syncPreview();
            renderNavigatorTree();
            populateSidebarFromSelection();
        });

        $('#ovb-layer-act-lock').on('click', function () {
            if (!currentSelector) return;
            const rec = ensureElementRecord(currentSelector);
            rec.locked = !rec.locked;
            pushHistory();
            syncPreview();
            renderNavigatorTree();
            showToast(rec.locked ? '🔒 Camada trancada!' : '🔓 Camada destrancada!');
        });

        $('#ovb-layer-act-up').on('click', function () {
            executeShortcutCommand('layer-forward');
        });

        $('#ovb-layer-act-down').on('click', function () {
            executeShortcutCommand('layer-back');
        });

        // Delete Single Selector Rule from Modified List
        $(document).on('click', '.ovb-del-rule', function (e) {
            e.stopPropagation();
            const sel = $(this).attr('data-sel');
            if (sel && state.elements[sel]) {
                delete state.elements[sel];
                pushHistory();
                syncPreview();
                renderNavigatorTree();
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
                renderNavigatorTree();
                showToast('↺ Desfeito (Ctrl+Z)');
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
                renderNavigatorTree();
                showToast('↻ Refeito (Ctrl+Shift+Z)');
            }
        });

        // Parent Window Keyboard Shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+C, Ctrl+V, Illustrator & Atalhos Customizados de Preferências)
        $(document).on('keydown', function (e) {
            if ($(e.target).is('input, textarea, select')) return;

            // Checagem prévia de atalhos personalizados salvos em state.shortcuts
            if (state.shortcuts && typeof state.shortcuts === 'object') {
                const parts = [];
                if (e.ctrlKey) parts.push('Ctrl');
                if (e.shiftKey) parts.push('Shift');
                if (e.altKey) parts.push('Alt');
                const keyUp = (e.key || '').toUpperCase();
                if (!['CONTROL', 'SHIFT', 'ALT'].includes(keyUp)) {
                    parts.push(keyUp);
                    const currentCombo = parts.join('+');
                    for (const [actionName, customCombo] of Object.entries(state.shortcuts)) {
                        if (customCombo && customCombo.toUpperCase() === currentCombo.toUpperCase()) {
                            e.preventDefault();
                            executeShortcutCommand(actionName);
                            return;
                        }
                    }
                }
            }

            const isMod = e.ctrlKey || e.metaKey;
            const key = (e.key || '').toLowerCase();

            if (isMod) {
                if (key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    executeShortcutCommand('undo');
                } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    executeShortcutCommand('redo');
                } else if (key === 's') {
                    e.preventDefault();
                    executeShortcutCommand('save');
                } else if (key === 'd') {
                    e.preventDefault();
                    executeShortcutCommand('duplicate');
                } else if (key === 'c') {
                    e.preventDefault();
                    executeShortcutCommand('copy');
                } else if (key === 'x') {
                    e.preventDefault();
                    executeShortcutCommand('cut');
                } else if (key === 'v') {
                    e.preventDefault();
                    if (e.altKey) {
                        executeShortcutCommand('paste-in-place');
                    } else {
                        executeShortcutCommand('paste');
                    }
                } else if (key === 'f') {
                    e.preventDefault();
                    executeShortcutCommand('find');
                }
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                executeShortcutCommand('deselect');
                return;
            }

            if (e.altKey) return;
            const aiMap = {
                'v': 'tool-select',
                'a': 'tool-direct-select',
                't': 'tool-text',
                'm': 'tool-rect',
                'l': 'tool-ellipse',
                'u': 'tool-rounded',
                'g': 'tool-gradient',
                'i': e.shiftKey ? 'eyedropper-paste' : 'eyedropper-copy',
                '[': 'layer-back',
                ']': 'layer-forward',
                'h': 'tool-hand',
                'delete': 'delete-element',
                'backspace': 'delete-element'
            };
            if (aiMap[key]) {
                e.preventDefault();
                executeShortcutCommand(aiMap[key]);
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
                    if (parsed.type === 'odyssee-single-page-preset' && parsed.pagePreset) {
                        const pg = parsed.pagePreset;
                        if (!state.pagePresets) state.pagePresets = {};
                        state.pagePresets[pg.name || 'Página Importada'] = pg;
                        state.elements = Object.assign({}, state.elements || {}, pg.elements || {});
                        state.blocks = pg.blocks || [];
                        state.domMoves = pg.domMoves || [];
                        state.clones = pg.clones || [];
                        pushHistory();
                        syncPreview();
                        populateSidebarFromSelection();
                        populateGlobalVariables();
                        showToast(`📄 Preset de Página '${pg.name}' importado e aplicado!`);
                        return;
                    }
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
