/**
 * Odyssee Visual Studio — Full Engine Runtime & Interactive Canvas Manipulation
 * Allows moving, resizing, reordering, and editing every property/style of any pre-existing or new element
 */
(function () {
    'use strict';

    const config = window.odysseeVBConfig || {
        isPreview: false,
        data: { elements: {}, blocks: [], domMoves: [], clones: [], globalVars: {}, customCss: '' }
    };

    let builderData = normalizeData(config.data);
    let isInteractiveMode = false; // When true in preview, allows clicking links/buttons normally
    let dragModeEnabled = true;    // Allows dragging any selected/clicked element on canvas
    let selectedSelector = null;
    let selectedElement = null;
    let hoveredElement = null;
    let scrollObserver = null;
    let isApplyingDOM = false;

    function normalizeData(raw) {
        const d = raw && typeof raw === 'object' ? raw : {};
        return {
            elements: d.elements && typeof d.elements === 'object' && !Array.isArray(d.elements) ? d.elements : {},
            blocks: Array.isArray(d.blocks) ? d.blocks : [],
            domMoves: Array.isArray(d.domMoves) ? d.domMoves : [],
            clones: Array.isArray(d.clones) ? d.clones : [],
            globalVars: d.globalVars && typeof d.globalVars === 'object' && !Array.isArray(d.globalVars) ? d.globalVars : { all: {}, dark: {}, light: {} },
            customCss: typeof d.customCss === 'string' ? d.customCss : ''
        };
    }

    function hexToRgba(hex, alpha) {
        if (!hex) return `rgba(139, 92, 246, ${alpha})`;
        hex = String(hex).replace('#', '').trim();
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const num = parseInt(hex, 16);
        if (isNaN(num)) return hex;
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Compiles a single style ruleset object (for a specific state/device/theme) into CSS declarations
     */
    function compileRuleDeclarations(st, isHover) {
        if (!st || typeof st !== 'object') return '';
        const rules = [];
        const imp = ' !important';

        // Visibility
        if (st.hidden) {
            rules.push(`display: none${imp}`);
        } else if (st.display) {
            rules.push(`display: ${st.display}${imp}`);
        }

        // Flexbox & Grid Layout Properties
        if (st.flexDirection) rules.push(`flex-direction: ${st.flexDirection}${imp}`);
        if (st.justifyContent) rules.push(`justify-content: ${st.justifyContent}${imp}`);
        if (st.alignItems) rules.push(`align-items: ${st.alignItems}${imp}`);
        if (st.flexWrap) rules.push(`flex-wrap: ${st.flexWrap}${imp}`);
        if (st.gap !== undefined && st.gap !== '') rules.push(`gap: ${st.gap}${imp}`);
        if (st.gridTemplateColumns) rules.push(`grid-template-columns: ${st.gridTemplateColumns}${imp}`);

        // Positioning & Coordinates
        if (st.position) rules.push(`position: ${st.position}${imp}`);
        if (st.top !== undefined && st.top !== '') rules.push(`top: ${st.top}${imp}`);
        if (st.right !== undefined && st.right !== '') rules.push(`right: ${st.right}${imp}`);
        if (st.bottom !== undefined && st.bottom !== '') rules.push(`bottom: ${st.bottom}${imp}`);
        if (st.left !== undefined && st.left !== '') rules.push(`left: ${st.left}${imp}`);
        if (st.zIndex !== undefined && st.zIndex !== '') rules.push(`z-index: ${st.zIndex}${imp}`);
        if (st.overflow) rules.push(`overflow: ${st.overflow}${imp}`);
        if (st.pointerEvents) rules.push(`pointer-events: ${st.pointerEvents}${imp}`);
        if (st.cursor) rules.push(`cursor: ${st.cursor}${imp}`);

        // Independent Translate / Scale / Rotate (Composes cleanly with existing animations and VanillaTilt!)
        const tx = st.translateX !== undefined && st.translateX !== '' ? st.translateX : '0px';
        const ty = st.translateY !== undefined && st.translateY !== '' ? st.translateY : '0px';
        if (tx !== '0px' || ty !== '0px') {
            const normTx = /^-?\d+(\.\d+)?$/.test(String(tx)) ? `${tx}px` : tx;
            const normTy = /^-?\d+(\.\d+)?$/.test(String(ty)) ? `${ty}px` : ty;
            rules.push(`translate: ${normTx} ${normTy}${imp}`);
        }

        if (st.scale !== undefined && st.scale !== '' && Number(st.scale) !== 1) {
            rules.push(`scale: ${st.scale}${imp}`);
        }

        if (st.rotate !== undefined && st.rotate !== '' && Number(st.rotate) !== 0) {
            const normRot = /^-?\d+(\.\d+)?$/.test(String(st.rotate)) ? `${st.rotate}deg` : st.rotate;
            rules.push(`rotate: ${normRot}${imp}`);
        }

        // Additional 3D / Skew transforms
        const extraTransforms = [];
        if (st.rotateX !== undefined && st.rotateX !== '' && Number(st.rotateX) !== 0) {
            extraTransforms.push(`perspective(900px) rotateX(${st.rotateX}deg)`);
        }
        if (st.rotateY !== undefined && st.rotateY !== '' && Number(st.rotateY) !== 0) {
            extraTransforms.push(`perspective(900px) rotateY(${st.rotateY}deg)`);
        }
        if (st.skewX !== undefined && st.skewX !== '' && Number(st.skewX) !== 0) {
            extraTransforms.push(`skewX(${st.skewX}deg)`);
        }
        if (st.skewY !== undefined && st.skewY !== '' && Number(st.skewY) !== 0) {
            extraTransforms.push(`skewY(${st.skewY}deg)`);
        }
        if (extraTransforms.length > 0) {
            rules.push(`transform: ${extraTransforms.join(' ')}${imp}`);
        }

        // Typography
        if (st.fontFamily) rules.push(`font-family: ${st.fontFamily}${imp}`);
        if (st.fontSize) rules.push(`font-size: ${st.fontSize}${imp}`);
        if (st.fontWeight) rules.push(`font-weight: ${st.fontWeight}${imp}`);
        if (st.lineHeight) rules.push(`line-height: ${st.lineHeight}${imp}`);
        if (st.letterSpacing) rules.push(`letter-spacing: ${st.letterSpacing}${imp}`);
        if (st.textAlign) rules.push(`text-align: ${st.textAlign}${imp}`);
        if (st.textTransform) rules.push(`text-transform: ${st.textTransform}${imp}`);
        if (st.fontStyle) rules.push(`font-style: ${st.fontStyle}${imp}`);
        if (st.textDecoration) rules.push(`text-decoration: ${st.textDecoration}${imp}`);

        // Text Gradient vs Solid Text Color
        if (st.textGradientEnabled && st.textGradientColor1 && st.textGradientColor2) {
            const angle = st.textGradientAngle !== undefined && st.textGradientAngle !== '' ? st.textGradientAngle : 135;
            rules.push(`background-image: linear-gradient(${angle}deg, ${st.textGradientColor1}, ${st.textGradientColor2})${imp}`);
            rules.push(`-webkit-background-clip: text${imp}`);
            rules.push(`background-clip: text${imp}`);
            rules.push(`-webkit-text-fill-color: transparent${imp}`);
            rules.push(`color: transparent${imp}`);
        } else if (st.color) {
            rules.push(`color: ${st.color}${imp}`);
        }

        // SVG Vector Properties
        if (st.fill) rules.push(`fill: ${st.fill}${imp}`);
        if (st.stroke) rules.push(`stroke: ${st.stroke}${imp}`);
        if (st.strokeWidth !== undefined && st.strokeWidth !== '') rules.push(`stroke-width: ${st.strokeWidth}${imp}`);

        // Background
        if (st.bgGradientEnabled && st.bgGradientColor1 && st.bgGradientColor2) {
            const type = st.bgGradientType === 'radial' ? 'radial-gradient(circle' : `linear-gradient(${st.bgGradientAngle || 135}deg`;
            rules.push(`background-image: ${type}, ${st.bgGradientColor1}, ${st.bgGradientColor2})${imp}`);
        } else if (st.bgImage) {
            rules.push(`background-image: url("${st.bgImage}")${imp}`);
            if (st.bgSize) rules.push(`background-size: ${st.bgSize}${imp}`);
            if (st.bgPosition) rules.push(`background-position: ${st.bgPosition}${imp}`);
            rules.push(`background-repeat: no-repeat${imp}`);
        }
        if (st.backgroundColor) {
            rules.push(`background-color: ${st.backgroundColor}${imp}`);
        }
        if (st.backdropBlur !== undefined && st.backdropBlur !== '' && Number(st.backdropBlur) > 0) {
            rules.push(`backdrop-filter: blur(${st.backdropBlur}px)${imp}`);
            rules.push(`-webkit-backdrop-filter: blur(${st.backdropBlur}px)${imp}`);
        }

        // Spacing & Dimensions
        ['marginTop', 'marginRight', 'marginBottom', 'marginLeft',
         'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(prop => {
            if (st[prop] !== undefined && st[prop] !== '') {
                const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                const val = /^-?\d+(\.\d+)?$/.test(String(st[prop])) ? `${st[prop]}px` : st[prop];
                rules.push(`${cssProp}: ${val}${imp}`);
            }
        });

        ['width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight'].forEach(prop => {
            if (st[prop] !== undefined && st[prop] !== '') {
                const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                const val = /^-?\d+(\.\d+)?$/.test(String(st[prop])) ? `${st[prop]}px` : st[prop];
                rules.push(`${cssProp}: ${val}${imp}`);
            }
        });

        // Borders
        if (st.borderStyle && st.borderStyle !== 'none') {
            rules.push(`border-style: ${st.borderStyle}${imp}`);
            if (st.borderWidth) {
                const bw = /^-?\d+(\.\d+)?$/.test(String(st.borderWidth)) ? `${st.borderWidth}px` : st.borderWidth;
                rules.push(`border-width: ${bw}${imp}`);
            }
            if (st.borderColor) rules.push(`border-color: ${st.borderColor}${imp}`);
        } else if (st.borderStyle === 'none') {
            rules.push(`border: none${imp}`);
        }
        if (st.borderRadius !== undefined && st.borderRadius !== '') {
            const br = /^-?\d+(\.\d+)?$/.test(String(st.borderRadius)) ? `${st.borderRadius}px` : st.borderRadius;
            rules.push(`border-radius: ${br}${imp}`);
        }

        // Opacity
        if (st.opacity !== undefined && st.opacity !== '' && Number(st.opacity) < 100) {
            rules.push(`opacity: ${Number(st.opacity) / 100}${imp}`);
        }

        // Blend Mode (Efeitos de Camada)
        if (st.blendMode && st.blendMode !== 'normal') {
            if (st.blendMode === 'svg-subtract') {
                rules.push(`mix-blend-mode: difference${imp}`);
            } else {
                rules.push(`mix-blend-mode: ${st.blendMode}${imp}`);
            }
        }
        if (st.bgBlendMode && st.bgBlendMode !== 'normal') {
            rules.push(`background-blend-mode: ${st.bgBlendMode}${imp}`);
        }
        if (st.isolation) {
            rules.push(`isolation: ${st.isolation}${imp}`);
        }

        // Filters & Glow
        const filters = [];
        if (st.filterBlur !== undefined && st.filterBlur !== '' && Number(st.filterBlur) > 0) {
            filters.push(`blur(${st.filterBlur}px)`);
        }
        if (st.filterBrightness !== undefined && st.filterBrightness !== '' && Number(st.filterBrightness) !== 100) {
            filters.push(`brightness(${st.filterBrightness}%)`);
        }
        if (st.filterContrast !== undefined && st.filterContrast !== '' && Number(st.filterContrast) !== 100) {
            filters.push(`contrast(${st.filterContrast}%)`);
        }
        if (st.filterSaturate !== undefined && st.filterSaturate !== '' && Number(st.filterSaturate) !== 100) {
            filters.push(`saturate(${st.filterSaturate}%)`);
        }
        if (st.filterHue !== undefined && st.filterHue !== '' && Number(st.filterHue) !== 0) {
            filters.push(`hue-rotate(${st.filterHue}deg)`);
        }
        if (st.filterInvert !== undefined && st.filterInvert !== '' && Number(st.filterInvert) > 0) {
            filters.push(`invert(${st.filterInvert}%)`);
        }
        if (st.filterSepia !== undefined && st.filterSepia !== '' && Number(st.filterSepia) > 0) {
            filters.push(`sepia(${st.filterSepia}%)`);
        }
        if (st.blendMode === 'svg-subtract') {
            filters.push(`url(#odyssee-svg-subtract)`);
        } else if (st.blendMode === 'svg-add') {
            filters.push(`url(#odyssee-svg-add)`);
        }

        const baseFilterStr = filters.length ? filters.join(' ') : '';

        // Glow Effect
        if (st.glowEnabled) {
            const gColor1 = st.glowColor || '#8b5cf6';
            const gColor2 = st.glowColor2 || gColor1;
            const gIntensity = (st.glowIntensity !== undefined && st.glowIntensity !== '' ? Number(st.glowIntensity) : 75) / 100;
            const gBlur = st.glowBlur !== undefined && st.glowBlur !== '' ? parseFloat(String(st.glowBlur)) : 24;
            const gSpread = st.glowSpread !== undefined && st.glowSpread !== '' ? parseFloat(String(st.glowSpread)) : 0;
            const gLayers = Number(st.glowLayers || 2);
            const gMode = st.glowMode || 'box';

            const rgba1 = hexToRgba(gColor1, gIntensity);
            const rgba2 = hexToRgba(gColor2, Math.min(1, gIntensity * 0.75));
            const rgba3 = hexToRgba(gColor2, Math.min(1, gIntensity * 0.45));

            rules.push(`--ovb-glow-color: ${rgba1}`);
            rules.push(`--ovb-glow-color-2: ${rgba2}`);
            rules.push(`--ovb-glow-blur: ${gBlur}px`);
            rules.push(`--ovb-glow-spread: ${gSpread}px`);

            if (gMode === 'drop-shadow') {
                filters.push(`drop-shadow(0 0 ${Math.round(gBlur * 0.6)}px ${rgba1})`);
                if (gLayers >= 2) {
                    filters.push(`drop-shadow(0 0 ${gBlur}px ${rgba2})`);
                }
                if (gLayers >= 3) {
                    filters.push(`drop-shadow(0 0 ${Math.round(gBlur * 1.8)}px ${rgba3})`);
                }
                if (st.glowAnim === 'pulse' && !isHover) {
                    rules.push(`--ovb-base-filter: ${baseFilterStr || 'none'}`);
                    rules.push(`animation: ovbGlowPulse ${st.glowAnimSpeed || 2.6}s ease-in-out infinite${imp}`);
                } else if (st.glowAnim === 'flicker' && !isHover) {
                    rules.push(`animation: ovbGlowFlicker ${st.glowAnimSpeed || 3}s linear infinite${imp}`);
                }
            } else if (gMode === 'text') {
                const shadows = [`0 0 ${Math.round(gBlur * 0.4)}px ${rgba1}`];
                if (gLayers >= 2) shadows.push(`0 0 ${gBlur}px ${rgba2}`);
                if (gLayers >= 3) shadows.push(`0 0 ${Math.round(gBlur * 1.8)}px ${rgba3}`);
                rules.push(`text-shadow: ${shadows.join(', ')}${imp}`);
            } else {
                const insetStr = gMode === 'inset' ? 'inset ' : '';
                const shadows = [`${insetStr}0 0 ${gBlur}px ${gSpread}px ${rgba1}`];
                if (gLayers >= 2) {
                    shadows.push(`${insetStr}0 0 ${Math.round(gBlur * 1.7)}px ${Math.round(gSpread * 0.5)}px ${rgba2}`);
                }
                if (gLayers >= 3) {
                    shadows.push(`${insetStr}0 0 ${Math.round(gBlur * 2.6)}px 0px ${rgba3}`);
                }
                rules.push(`box-shadow: ${shadows.join(', ')}${imp}`);
                if (st.glowAnim === 'pulse' && !isHover) {
                    rules.push(`animation: ovbBoxGlowPulse ${st.glowAnimSpeed || 2.6}s ease-in-out infinite${imp}`);
                } else if (st.glowAnim === 'flicker' && !isHover) {
                    rules.push(`animation: ovbGlowFlicker ${st.glowAnimSpeed || 3}s linear infinite${imp}`);
                }
            }
        } else if (st.boxShadow) {
            rules.push(`box-shadow: ${st.boxShadow}${imp}`);
        }

        if (st.textShadow && (!st.glowEnabled || st.glowMode !== 'text')) {
            rules.push(`text-shadow: ${st.textShadow}${imp}`);
        }

        if (filters.length > 0) {
            rules.push(`filter: ${filters.join(' ')}${imp}`);
        }

        // Loop Animation (Continuous)
        if (!isHover && st.loopAnim && st.loopAnim !== 'none') {
            const dur = st.loopDuration || '3.2s';
            const amp = st.loopIntensity || '12px';
            rules.push(`--ovb-loop-amp: ${amp}`);
            rules.push(`animation: ${st.loopAnim} ${dur} ease-in-out infinite${imp}`);
        }

        // Arbitrary Raw CSS Properties (From the Full Computed Style Inspector)
        if (st.rawCssProps && typeof st.rawCssProps === 'object') {
            Object.entries(st.rawCssProps).forEach(([k, v]) => {
                if (v !== undefined && v !== '') {
                    rules.push(`${k}: ${v}${imp}`);
                }
            });
        }

        if (isHover) {
            rules.push(`transition: all ${st.hoverTransition || '0.32s'} cubic-bezier(0.22, 1, 0.36, 1)${imp}`);
        }

        return rules.join('; ');
    }

    /**
     * Compiles all builderData into a single CSS string and updates #odyssee-vb-compiled-css
     */
    function compileAllCSS(data) {
        const cssParts = [];

        // 1. Global Theme Variables
        const gv = data.globalVars || {};
        if (gv.all && Object.keys(gv.all).length) {
            const decls = Object.entries(gv.all).filter(([, v]) => v).map(([k, v]) => `${k}: ${v} !important;`).join(' ');
            if (decls) cssParts.push(`:root, body { ${decls} }`);
        }
        if (gv.dark && Object.keys(gv.dark).length) {
            const decls = Object.entries(gv.dark).filter(([, v]) => v).map(([k, v]) => `${k}: ${v} !important;`).join(' ');
            if (decls) cssParts.push(`body.theme-dark { ${decls} }`);
        }
        if (gv.light && Object.keys(gv.light).length) {
            const decls = Object.entries(gv.light).filter(([, v]) => v).map(([k, v]) => `${k}: ${v} !important;`).join(' ');
            if (decls) cssParts.push(`body.theme-light { ${decls} }`);
        }

        // 2. Per-Element Rules
        const tabletRules = [];
        const mobileRules = [];

        Object.entries(data.elements || {}).forEach(([selector, elConfig]) => {
            if (!elConfig || typeof elConfig !== 'object') return;
            const themeScope = elConfig.themeScope || 'all';
            const prefix = themeScope === 'dark' ? 'body.theme-dark ' : (themeScope === 'light' ? 'body.theme-light ' : '');
            const fullSel = prefix + selector;

            if (elConfig.styles && elConfig.styles.desktop) {
                const dCss = compileRuleDeclarations(elConfig.styles.desktop, false);
                if (dCss) cssParts.push(`${fullSel} { ${dCss}; }`);
            }

            if (elConfig.styles && elConfig.styles.hover) {
                const hCss = compileRuleDeclarations(elConfig.styles.hover, true);
                if (hCss) {
                    cssParts.push(`${fullSel} { transition: all 0.32s cubic-bezier(0.22, 1, 0.36, 1); }`);
                    cssParts.push(`${fullSel}:hover { ${hCss}; }`);
                }
            }

            if (elConfig.styles && elConfig.styles.dark) {
                const darkCss = compileRuleDeclarations(elConfig.styles.dark, false);
                if (darkCss) cssParts.push(`body.theme-dark ${selector} { ${darkCss}; }`);
            }
            if (elConfig.styles && elConfig.styles.light) {
                const lightCss = compileRuleDeclarations(elConfig.styles.light, false);
                if (lightCss) cssParts.push(`body.theme-light ${selector} { ${lightCss}; }`);
            }

            if (elConfig.styles && elConfig.styles.tablet) {
                const tCss = compileRuleDeclarations(elConfig.styles.tablet, false);
                if (tCss) tabletRules.push(`${fullSel} { ${tCss}; }`);
            }

            if (elConfig.styles && elConfig.styles.mobile) {
                const mCss = compileRuleDeclarations(elConfig.styles.mobile, false);
                if (mCss) mobileRules.push(`${fullSel} { ${mCss}; }`);
            }

            if (elConfig.customCss && elConfig.customCss.trim()) {
                const parsedCustom = elConfig.customCss.replace(/\bselector\b/g, fullSel);
                cssParts.push(parsedCustom);
            }
        });

        if (tabletRules.length > 0) {
            cssParts.push(`@media (max-width: 1024px) {\n  ${tabletRules.join('\n  ')}\n}`);
        }
        if (mobileRules.length > 0) {
            cssParts.push(`@media (max-width: 768px) {\n  ${mobileRules.join('\n  ')}\n}`);
        }

        if (data.customCss && data.customCss.trim()) {
            cssParts.push(data.customCss);
        }

        return cssParts.join('\n');
    }

    function updateLiveStyleTag() {
        let styleEl = document.getElementById('odyssee-vb-compiled-css');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'odyssee-vb-compiled-css';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = compileAllCSS(builderData);
    }

    /**
     * Replays saved DOM structural moves (moving pre-existing elements up/down or into another container)
     */
    function applyDOMMoves() {
        (builderData.domMoves || []).forEach(move => {
            if (!move || !move.selector || !move.refSelector) return;
            try {
                const el = document.querySelector(move.selector);
                const ref = document.querySelector(move.refSelector);
                if (!el || !ref || el === ref || el.contains(ref)) return;

                if (move.pos === 'before' && ref.parentNode) {
                    ref.parentNode.insertBefore(el, ref);
                } else if (move.pos === 'after' && ref.parentNode) {
                    ref.parentNode.insertBefore(el, ref.nextSibling);
                } else if (move.pos === 'prepend') {
                    ref.insertBefore(el, ref.firstChild);
                } else if (move.pos === 'append') {
                    ref.appendChild(el);
                }
            } catch (e) {}
        });
    }

    /**
     * Renders cloned pre-existing elements
     */
    function renderClonedElements() {
        document.querySelectorAll('[data-ovb-clone-id]').forEach(el => el.remove());

        (builderData.clones || []).forEach(cl => {
            if (!cl || !cl.id || !cl.sourceSelector) return;
            try {
                const src = document.querySelector(cl.sourceSelector);
                if (!src || !src.parentNode) return;
                const copy = src.cloneNode(true);
                copy.id = cl.id;
                copy.setAttribute('data-ovb-clone-id', cl.id);
                copy.removeAttribute('data-ovb-selected');
                copy.removeAttribute('data-ovb-hover');
                src.parentNode.insertBefore(copy, src.nextSibling);
            } catch (e) {}
        });
    }

    /**
     * Builds HTML for a custom inserted widget/block
     */
    function buildBlockElement(block) {
        const wrapper = document.createElement('div');
        wrapper.className = `ovb-custom-block ovb-block-type-${block.type || 'text'}`;
        wrapper.setAttribute('data-ovb-block-id', block.id);
        wrapper.id = block.id;

        const c = block.content || {};
        switch (block.type) {
            case 'heading': {
                const tag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(c.tag) ? c.tag : 'h2';
                const h = document.createElement(tag);
                h.className = 'ovb-block-heading';
                h.textContent = c.text || 'Novo Título Personalizado';
                wrapper.appendChild(h);
                break;
            }
            case 'text': {
                const p = document.createElement('div');
                p.className = 'ovb-block-text';
                p.innerHTML = c.html || '<p>Seu novo bloco de texto criativo. Clique e arraste para mover ou personalize fontes, cores, glow e animações.</p>';
                wrapper.appendChild(p);
                break;
            }
            case 'button': {
                const btnWrap = document.createElement('div');
                btnWrap.className = 'ovb-block-button-wrap';
                const a = document.createElement('a');
                a.className = 'ovb-block-button';
                a.href = c.url || '#';
                if (c.newTab) {
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                }
                if (c.icon) {
                    const i = document.createElement('i');
                    i.className = c.icon;
                    a.appendChild(i);
                }
                const span = document.createElement('span');
                span.textContent = c.text || 'Botão de Ação';
                a.appendChild(span);
                btnWrap.appendChild(a);
                wrapper.appendChild(btnWrap);
                break;
            }
            case 'image': {
                const imgWrap = document.createElement('div');
                imgWrap.className = 'ovb-block-image-wrap';
                const img = document.createElement('img');
                img.src = c.src || '/wp-content/uploads/2025/11/typewhite.webp';
                img.alt = c.alt || 'Imagem personalizada';
                imgWrap.appendChild(img);
                wrapper.appendChild(imgWrap);
                break;
            }
            case 'card': {
                const card = document.createElement('div');
                card.className = 'ovb-block-card';
                if (c.icon !== '') {
                    const iconDiv = document.createElement('div');
                    iconDiv.className = 'ovb-block-card-icon';
                    iconDiv.innerHTML = `<i class="${c.icon || 'fas fa-sparkles'}"></i>`;
                    card.appendChild(iconDiv);
                }
                const title = document.createElement('h3');
                title.className = 'ovb-block-card-title';
                title.textContent = c.title || 'Destaque Criativo';
                card.appendChild(title);

                const desc = document.createElement('p');
                desc.className = 'ovb-block-card-desc';
                desc.textContent = c.desc || 'Adicione descrições, efeitos de glow, glassmorphism e animações interativas neste card.';
                card.appendChild(desc);
                wrapper.appendChild(card);
                break;
            }
            case 'glow-orb': {
                const orb = document.createElement('div');
                orb.className = 'ovb-block-glow-orb';
                wrapper.appendChild(orb);
                break;
            }
            case 'divider': {
                const hr = document.createElement('hr');
                hr.className = 'ovb-block-divider';
                wrapper.appendChild(hr);
                break;
            }
            case 'html': {
                const htmlBox = document.createElement('div');
                htmlBox.className = 'ovb-block-html';
                htmlBox.innerHTML = c.html || '<div style="padding:20px;text-align:center;">Bloco HTML / SVG Personalizado</div>';
                wrapper.appendChild(htmlBox);
                break;
            }
        }

        return wrapper;
    }

    function renderCustomBlocks() {
        document.querySelectorAll('.ovb-custom-block[data-ovb-block-id]').forEach(el => el.remove());

        (builderData.blocks || []).forEach(block => {
            if (!block || !block.id || !block.targetSelector) return;
            let target = null;
            try {
                target = document.querySelector(block.targetSelector);
            } catch (e) {
                return;
            }
            if (!target) return;

            const blockEl = buildBlockElement(block);
            const pos = block.position || 'after';

            if (pos === 'before' && target.parentNode) {
                target.parentNode.insertBefore(blockEl, target);
            } else if (pos === 'after' && target.parentNode) {
                target.parentNode.insertBefore(blockEl, target.nextSibling);
            } else if (pos === 'prepend') {
                target.insertBefore(blockEl, target.firstChild);
            } else {
                target.appendChild(blockEl);
            }
        });
    }

    /**
     * Applies DOM-level features: text overrides (PT/EN), image src (Dark/Light), HTML attributes, overlay layers, entrance animations, hover presets, 3D tilt
     */
    function applyDOMFeatures() {
        if (isApplyingDOM) return;
        isApplyingDOM = true;

        try {
            if (!scrollObserver && 'IntersectionObserver' in window) {
                scrollObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        const el = entry.target;
                        const cfg = el._ovbAnimConfig;
                        if (!cfg) return;
                        if (entry.isIntersecting) {
                            el.classList.remove('ovb-anim-Wait');
                            el.classList.add('ovb-anim-Triggered');
                            el.style.setProperty('animation-name', cfg.name, 'important');
                            el.style.setProperty('animation-duration', cfg.duration || '0.75s', 'important');
                            el.style.setProperty('animation-delay', cfg.delay || '0s', 'important');
                            el.style.setProperty('animation-timing-function', cfg.easing || 'cubic-bezier(0.22, 1, 0.36, 1)', 'important');
                            el.style.setProperty('animation-fill-mode', 'both', 'important');
                            if (!cfg.repeat) {
                                scrollObserver.unobserve(el);
                            }
                        } else if (cfg.repeat) {
                            el.classList.remove('ovb-anim-Triggered');
                            el.style.removeProperty('animation-name');
                            el.classList.add('ovb-anim-Wait');
                        }
                    });
                }, { threshold: 0.08 });
            }

            document.querySelectorAll('.ovb-layer-overlay').forEach(el => el.remove());

            const isDark = document.body.classList.contains('theme-dark');
            const curLang = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'pt';

            Object.entries(builderData.elements || {}).forEach(([selector, elConfig]) => {
                if (!elConfig || typeof elConfig !== 'object') return;
                let nodes = [];
                try {
                    nodes = Array.from(document.querySelectorAll(selector));
                } catch (e) {
                    return;
                }

                nodes.forEach(el => {
                    // 1. Content & Native Attributes Overrides
                    if (elConfig.content) {
                        const c = elConfig.content;
                        const activeText = (curLang === 'en' && c.textEn) ? c.textEn : c.text;

                        if (activeText !== undefined && activeText !== '') {
                            if (!el.hasAttribute('data-ovb-orig-text')) {
                                el.setAttribute('data-ovb-orig-text', el.textContent);
                            }
                            if (el.children.length === 0 || el.tagName === 'TEXT' || el.tagName === 'TSPAN') {
                                if (el.textContent !== activeText) {
                                    el.textContent = activeText;
                                }
                            } else {
                                // If element has icon + span (like buttons), update text node or span
                                const textSpan = el.querySelector('span[data-key], span');
                                if (textSpan && textSpan.textContent !== activeText) {
                                    textSpan.textContent = activeText;
                                }
                            }
                        } else if (el.hasAttribute('data-ovb-orig-text')) {
                            if (el.children.length === 0) {
                                el.textContent = el.getAttribute('data-ovb-orig-text');
                            }
                            el.removeAttribute('data-ovb-orig-text');
                        }

                        // Image Src (supports general src, srcDark, srcLight)
                        if (el.tagName === 'IMG') {
                            const targetSrc = (isDark && c.srcDark) ? c.srcDark : ((!isDark && c.srcLight) ? c.srcLight : c.src);
                            if (targetSrc !== undefined && targetSrc !== '') {
                                if (!el.hasAttribute('data-ovb-orig-src')) {
                                    el.setAttribute('data-ovb-orig-src', el.getAttribute('src') || '');
                                }
                                if (el.getAttribute('src') !== targetSrc) {
                                    el.setAttribute('src', targetSrc);
                                }
                            }
                        }

                        if (c.href !== undefined && c.href !== '' && el.tagName === 'A') {
                            el.setAttribute('href', c.href);
                        }

                        if (c.alt !== undefined && c.alt !== '' && el.tagName === 'IMG') {
                            el.setAttribute('alt', c.alt);
                        }

                        // Custom HTML / SVG attributes
                        if (c.attrs && typeof c.attrs === 'object') {
                            Object.entries(c.attrs).forEach(([attrName, attrVal]) => {
                                if (attrVal !== undefined && attrVal !== '') {
                                    el.setAttribute(attrName, attrVal);
                                }
                            });
                        }
                    }

                    // 2. Hover Animation Preset Class
                    ['ovb-hover-lift', 'ovb-hover-grow', 'ovb-hover-shrink', 'ovb-hover-tilt', 'ovb-hover-glow-boost'].forEach(cls => {
                        el.classList.remove(cls);
                    });
                    const st = (elConfig.styles && elConfig.styles.desktop) || {};
                    if (st.hoverPreset && st.hoverPreset !== 'none') {
                        el.classList.add(st.hoverPreset);
                    }

                    // 3. Extra Layer Overlay (Blend Mode Layer inside HTML Element)
                    if (st.overlayEnabled && st.overlayColor && !(el instanceof SVGElement)) {
                        const compPos = window.getComputedStyle(el).position;
                        if (compPos === 'static') {
                            el.style.position = 'relative';
                        }
                        const ov = document.createElement('div');
                        ov.className = 'ovb-layer-overlay';
                        if (st.overlayColor2) {
                            ov.style.background = `linear-gradient(${st.overlayAngle || 135}deg, ${st.overlayColor}, ${st.overlayColor2})`;
                        } else {
                            ov.style.background = st.overlayColor;
                        }
                        ov.style.mixBlendMode = st.overlayBlendMode || 'overlay';
                        ov.style.opacity = st.overlayOpacity !== undefined ? Number(st.overlayOpacity) / 100 : 0.5;
                        el.appendChild(ov);
                    }

                    // 4. Entrance Scroll Animation
                    if (st.entranceAnim && st.entranceAnim !== 'none') {
                        el._ovbAnimConfig = {
                            name: st.entranceAnim,
                            duration: st.entranceDuration || '0.75s',
                            delay: st.entranceDelay || '0s',
                            easing: st.entranceEasing || 'cubic-bezier(0.22, 1, 0.36, 1)',
                            repeat: !!st.entranceRepeat
                        };
                        if (!el.classList.contains('ovb-anim-Triggered')) {
                            el.classList.add('ovb-anim-Wait');
                            if (scrollObserver) scrollObserver.observe(el);
                        }
                    } else if (el._ovbAnimConfig) {
                        delete el._ovbAnimConfig;
                        el.classList.remove('ovb-anim-Wait', 'ovb-anim-Triggered');
                        el.style.removeProperty('animation-name');
                    }

                    // 5. 3D Tilt Effect (VanillaTilt)
                    if (st.tiltEnabled && window.VanillaTilt && !(el instanceof SVGElement)) {
                        if (el.vanillaTilt) {
                            el.vanillaTilt.destroy();
                        }
                        window.VanillaTilt.init(el, {
                            max: Number(st.tiltMax || 15),
                            speed: Number(st.tiltSpeed || 400),
                            scale: Number(st.tiltScale || 1.04),
                            glare: !!st.tiltGlare,
                            'max-glare': Number(st.tiltMaxGlare || 0.35)
                        });
                    } else if (st.tiltEnabled === false && el.vanillaTilt) {
                        el.vanillaTilt.destroy();
                    }
                });
            });
        } finally {
            isApplyingDOM = false;
        }
    }

    function triggerAnimationPreview(selector, animName, duration, delay, easing) {
        if (!selector || !animName || animName === 'none') return;
        let nodes = [];
        try {
            nodes = Array.from(document.querySelectorAll(selector));
        } catch (e) {
            return;
        }
        nodes.forEach(el => {
            el.style.setProperty('animation', 'none', 'important');
            void el.getBoundingClientRect();
            el.style.setProperty('animation', `${animName} ${duration || '0.75s'} ${easing || 'cubic-bezier(0.22, 1, 0.36, 1)'} ${delay || '0s'} both`, 'important');
        });
    }

    /**
     * Generates a clean, accurate CSS selector for ANY HTML or SVG element on the page
     */
    function generateSelector(el) {
        if (!el || el.nodeType !== 1) return null;

        // If user clicked a path/tspan inside a named SVG group (.dg-item) in the vector banner,
        // allow selecting the SVG icon group itself unless they already selected the group and clicked deeper!
        const svgGroup = el.closest && el.closest('g.dg-item[id]');
        if (svgGroup && el !== svgGroup && selectedElement !== svgGroup) {
            el = svgGroup;
        }

        if (el.hasAttribute('data-ovb-block-id')) {
            return `#${CSS.escape(el.getAttribute('data-ovb-block-id'))}`;
        }
        if (el.hasAttribute('data-ovb-clone-id')) {
            return `#${CSS.escape(el.getAttribute('data-ovb-clone-id'))}`;
        }

        if (el.id && !el.id.startsWith('ovb-')) {
            return `#${CSS.escape(el.id)}`;
        }

        const dataKey = el.getAttribute('data-key');
        if (dataKey) {
            const tag = el.tagName.toLowerCase();
            const candidate = `${tag}[data-key="${CSS.escape(dataKey)}"]`;
            try {
                if (document.querySelectorAll(candidate).length === 1) {
                    return candidate;
                }
            } catch (e) {}
        }

        const parts = [];
        let cur = el;
        while (cur && cur.nodeType === 1 && cur !== document.body && cur !== document.documentElement) {
            if (cur.id && !cur.id.startsWith('ovb-')) {
                parts.unshift(`#${CSS.escape(cur.id)}`);
                break;
            }

            let part = cur.tagName.toLowerCase();
            const validClasses = Array.from(cur.classList || []).filter(c =>
                !c.startsWith('ovb-') &&
                !['theme-dark', 'theme-light', 'color-purple', 'color-red', 'modo-onboarding', 'transparent', 'active', 'visible'].includes(c)
            );

            if (validClasses.length > 0) {
                part += '.' + validClasses.slice(0, 2).map(c => CSS.escape(c)).join('.');
            }

            if (cur.parentElement) {
                const siblings = Array.from(cur.parentElement.children).filter(ch => ch.tagName === cur.tagName);
                if (siblings.length > 1) {
                    const idx = Array.from(cur.parentElement.children).indexOf(cur) + 1;
                    part += `:nth-child(${idx})`;
                }
            }

            parts.unshift(part);

            const testSel = parts.join(' > ');
            try {
                if (document.querySelectorAll(testSel).length === 1) {
                    return testSel;
                }
            } catch (e) {}

            cur = cur.parentElement;
        }

        return parts.join(' > ') || 'body';
    }

    /**
     * Friendly human-readable label for any element
     */
    function getElementLabel(el) {
        if (!el || el.nodeType !== 1) return 'Elemento';
        if (el.hasAttribute('data-ovb-block-id')) {
            return `Bloco · #${el.getAttribute('data-ovb-block-id')}`;
        }
        if (el.hasAttribute('data-ovb-clone-id')) {
            return `Cópia · #${el.getAttribute('data-ovb-clone-id')}`;
        }

        const tag = el.tagName.toUpperCase();
        if (el.id) {
            const cleanId = el.id.replace('.png', '');
            return `${tag} #${cleanId}`;
        }
        const key = el.getAttribute('data-key');
        if (key) return `${tag} [${key}]`;
        const cls = Array.from(el.classList || []).filter(c => !c.startsWith('ovb-'))[0];
        if (cls) return `${tag} .${cls}`;
        return tag;
    }

    /**
     * Reads ALL real computed styles & HTML/SVG attributes of the selected element
     */
    function getComputedSnapshot(el) {
        if (!el || el.nodeType !== 1) return {};
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        // Collect all HTML/SVG attributes
        const attrs = {};
        if (el.attributes) {
            for (let i = 0; i < el.attributes.length; i++) {
                const a = el.attributes[i];
                if (!a.name.startsWith('data-ovb-') && a.name !== 'style') {
                    attrs[a.name] = a.value;
                }
            }
        }

        // Parse current independent translate X / Y
        let tx = '0px';
        let ty = '0px';
        if (cs.translate && cs.translate !== 'none') {
            const parts = cs.translate.split(' ');
            tx = parts[0] || '0px';
            ty = parts[1] || '0px';
        }

        return {
            tagName: el.tagName.toLowerCase(),
            isSvg: el instanceof SVGElement,
            label: getElementLabel(el),
            text: (el.children.length === 0 || el.tagName === 'TEXT' || el.tagName === 'TSPAN') ? (el.textContent || '').trim() : (el.querySelector('span[data-key], span') ? el.querySelector('span[data-key], span').textContent.trim() : ''),
            src: el.tagName === 'IMG' ? (el.getAttribute('src') || '') : '',
            href: el.tagName === 'A' ? (el.getAttribute('href') || '') : '',
            alt: el.tagName === 'IMG' ? (el.getAttribute('alt') || '') : '',
            dataKey: el.getAttribute('data-key') || '',
            attrs: attrs,
            isCustomBlock: el.hasAttribute('data-ovb-block-id'),
            blockId: el.getAttribute('data-ovb-block-id') || null,
            isClone: el.hasAttribute('data-ovb-clone-id'),
            cloneId: el.getAttribute('data-ovb-clone-id') || null,
            rect: {
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                top: Math.round(rect.top),
                left: Math.round(rect.left)
            },
            computed: {
                display: cs.display,
                position: cs.position,
                top: cs.top !== 'auto' ? cs.top : '',
                right: cs.right !== 'auto' ? cs.right : '',
                bottom: cs.bottom !== 'auto' ? cs.bottom : '',
                left: cs.left !== 'auto' ? cs.left : '',
                translateX: tx,
                translateY: ty,
                scale: cs.scale && cs.scale !== 'none' ? cs.scale : '1',
                rotate: cs.rotate && cs.rotate !== 'none' ? cs.rotate : '0deg',
                width: Math.round(rect.width) + 'px',
                height: Math.round(rect.height) + 'px',
                minWidth: cs.minWidth !== '0px' && cs.minWidth !== 'auto' ? cs.minWidth : '',
                maxWidth: cs.maxWidth !== 'none' ? cs.maxWidth : '',
                minHeight: cs.minHeight !== '0px' && cs.minHeight !== 'auto' ? cs.minHeight : '',
                flexDirection: cs.flexDirection,
                justifyContent: cs.justifyContent,
                alignItems: cs.alignItems,
                flexWrap: cs.flexWrap,
                gap: cs.gap !== 'normal' ? cs.gap : '',
                fontFamily: cs.fontFamily,
                fontSize: cs.fontSize,
                fontWeight: cs.fontWeight,
                lineHeight: cs.lineHeight,
                letterSpacing: cs.letterSpacing !== 'normal' ? cs.letterSpacing : '0px',
                textAlign: cs.textAlign,
                textTransform: cs.textTransform,
                color: cs.color,
                fill: cs.fill,
                stroke: cs.stroke !== 'none' ? cs.stroke : '',
                backgroundColor: cs.backgroundColor,
                borderRadius: cs.borderRadius,
                borderStyle: cs.borderTopStyle,
                borderWidth: cs.borderTopWidth,
                borderColor: cs.borderTopColor,
                paddingTop: cs.paddingTop,
                paddingRight: cs.paddingRight,
                paddingBottom: cs.paddingBottom,
                paddingLeft: cs.paddingLeft,
                marginTop: cs.marginTop,
                marginRight: cs.marginRight,
                marginBottom: cs.marginBottom,
                marginLeft: cs.marginLeft,
                zIndex: cs.zIndex !== 'auto' ? cs.zIndex : '',
                overflow: cs.overflow,
                mixBlendMode: cs.mixBlendMode || 'normal',
                opacity: Math.round(parseFloat(cs.opacity || '1') * 100),
                filter: cs.filter !== 'none' ? cs.filter : '',
                boxShadow: cs.boxShadow !== 'none' ? cs.boxShadow : '',
                textShadow: cs.textShadow !== 'none' ? cs.textShadow : ''
            }
        };
    }

    /**
     * Collects a complete, categorized Scene Graph of ALL base elements on the current page
     */
    function collectPageTree() {
        const groups = [];

        function makeNode(el, customLabel) {
            if (!el) return null;
            const sel = generateSelector(el);
            if (!sel) return null;
            return {
                selector: sel,
                label: customLabel || getElementLabel(el),
                hasCustom: !!builderData.elements[sel],
                isBlock: el.hasAttribute('data-ovb-block-id') || el.hasAttribute('data-ovb-clone-id')
            };
        }

        // 1. Cabeçalho & Navegação
        const headerEl = document.querySelector('header.main-header');
        if (headerEl) {
            const hChildren = [];
            headerEl.querySelectorAll('#header-logotype, .logo-link, .main-nav, .main-nav a, .header-mobile-buttons a, #btn-faq, #btn-settings, #btn-mobile-menu').forEach(el => {
                const n = makeNode(el);
                if (n) hChildren.push(n);
            });
            const sidebarEl = document.getElementById('settings-sidebar');
            if (sidebarEl) hChildren.push(makeNode(sidebarEl, 'ASIDE #settings-sidebar (Gaveta Config)'));
            groups.push({
                selector: generateSelector(headerEl),
                label: '🧭 Cabeçalho & Menu Principal',
                hasCustom: !!builderData.elements[generateSelector(headerEl)],
                children: hChildren
            });
        }

        // 2. Tela de Onboarding & Aurora
        const onbEl = document.getElementById('onboarding-container');
        if (onbEl) {
            const onbChildren = [];
            document.querySelectorAll('.onboarding-aurora, .onboarding-aurora .g1, .onboarding-aurora .g2, .onboarding-aurora .g3, .onboarding-aurora .g4, .onboarding-aurora .g5').forEach(el => {
                const n = makeNode(el);
                if (n) onbChildren.push(n);
            });
            onbEl.querySelectorAll('.onboarding-logo, .onboarding-subtitle, #step-language, #lang-pt, #lang-en, #step-theme, #btn-light, #btn-dark, .color-option-btn, #btn-continuar').forEach(el => {
                const n = makeNode(el);
                if (n) onbChildren.push(n);
            });
            groups.push({
                selector: '#onboarding-container',
                label: '🚪 Tela de Onboarding & Aurora',
                hasCustom: !!builderData.elements['#onboarding-container'],
                children: onbChildren
            });
        }

        // 3. Nebulosas & Fundo Imersivo (Home)
        const gradContainer = document.querySelector('.immersive-wrapper > .gradients-container');
        if (gradContainer) {
            const gChildren = [];
            gradContainer.querySelectorAll('.g1, .g2, .g3, .g4, .g5').forEach((el, idx) => {
                const n = makeNode(el, `Nebulosa .g${idx + 1}`);
                if (n) gChildren.push(n);
            });
            const fadeBot = document.querySelector('.gradient-fade-bottom');
            if (fadeBot) gChildren.push(makeNode(fadeBot, 'Fade Inferior (.gradient-fade-bottom)'));
            groups.push({
                selector: generateSelector(gradContainer),
                label: '🌌 Nebulosas de Fundo (.gradients-container)',
                hasCustom: !!builderData.elements[generateSelector(gradContainer)],
                children: gChildren
            });
        }

        // 4. Todas as Seções da Página (<section>)
        document.querySelectorAll('section').forEach(sec => {
            const secSel = generateSelector(sec);
            const secChildren = [];

            // Direct & key elements inside this section
            sec.querySelectorAll(
                '#artcraft-orbit-container, .hero-content-centered, .hero-logo-container, .hero-symbol, .hero-slogan, .scroll-indicator, ' +
                'h1, h2, h3, h4, p, .category-banner-wrapper, img.category-banner, svg#dg-animated-banner, ' +
                'svg#dg-animated-banner g.dg-item[id], svg#dg-animated-banner text.dg-item, ' +
                '.portfolio-showcase, .carousel-wrapper, .category-buttons, .category-image-placeholder, .category-posts-link, ' +
                '.services-grid, .service-card, .package-card, .btn-primary, button, a.btn, .ovb-custom-block'
            ).forEach(child => {
                if (child.closest('#ovb-Floating-Badge, #ovb-Hover-Badge, #ovb-Selection-Box')) return;
                let customName = null;
                if (child.matches && child.matches('svg#dg-animated-banner g.dg-item[id]')) {
                    customName = `🎨 Ícone SVG: ${child.id.replace('.png', '')}`;
                } else if (child.matches && child.matches('svg#dg-animated-banner text.dg-item')) {
                    customName = `🔤 Texto SVG: ${child.textContent.trim()}`;
                }
                const n = makeNode(child, customName);
                if (n) secChildren.push(n);
            });

            groups.push({
                selector: secSel,
                label: `📦 Seção: ${getElementLabel(sec)}`,
                hasCustom: !!builderData.elements[secSel],
                children: secChildren
            });
        });

        // 5. Páginas sem <section> ou elementos de Currículo/FAQ/Blog
        document.querySelectorAll('.cv-container, .faq-container, .posts-page-container, article, footer.site-footer').forEach(box => {
            const bSel = generateSelector(box);
            const bChildren = [];
            box.querySelectorAll('h1, h2, h3, h4, p, img, button, a, .faq-item, .cv-card, .cv-section').forEach(ch => {
                const n = makeNode(ch);
                if (n) bChildren.push(n);
            });
            groups.push({
                selector: bSel,
                label: `📄 Bloco: ${getElementLabel(box)}`,
                hasCustom: !!builderData.elements[bSel],
                children: bChildren.slice(0, 40)
            });
        });

        return groups;
    }

    /**
     * Initializes the Interactive Canvas Manipulation Engine (Drag-to-Move, 8 Resize Handles, Reorder, Duplicate)
     */
    function initPreviewInspector() {
        document.body.classList.add('ovb-editor-active');

        try {
            localStorage.setItem('onboardingFeito', 'sim');
        } catch (e) {}
        document.body.classList.remove('modo-onboarding');

        // 1. Hover Badge
        const hoverBadge = document.createElement('div');
        hoverBadge.id = 'ovb-Hover-Badge';
        document.body.appendChild(hoverBadge);

        // 2. Selection Frame with 8 Resize Handles
        const selBox = document.createElement('div');
        selBox.id = 'ovb-Selection-Box';
        selBox.innerHTML = `
            <div class="ovb-resize-handle ovb-rh-nw" data-rh="nw" title="Redimensionar Escala / Tamanho"></div>
            <div class="ovb-resize-handle ovb-rh-n"  data-rh="n"  title="Redimensionar Altura"></div>
            <div class="ovb-resize-handle ovb-rh-ne" data-rh="ne" title="Redimensionar Escala / Tamanho"></div>
            <div class="ovb-resize-handle ovb-rh-e"  data-rh="e"  title="Redimensionar Largura"></div>
            <div class="ovb-resize-handle ovb-rh-se" data-rh="se" title="Redimensionar Escala / Tamanho"></div>
            <div class="ovb-resize-handle ovb-rh-s"  data-rh="s"  title="Redimensionar Altura"></div>
            <div class="ovb-resize-handle ovb-rh-sw" data-rh="sw" title="Redimensionar Escala / Tamanho"></div>
            <div class="ovb-resize-handle ovb-rh-w"  data-rh="w"  title="Redimensionar Largura"></div>
        `;
        document.body.appendChild(selBox);

        // 3. Floating Action Toolbar on Selected Element
        const floatBadge = document.createElement('div');
        floatBadge.id = 'ovb-Floating-Badge';
        floatBadge.innerHTML = `
            <span class="ovb-badge-drag-handle" title="Arraste aqui (ou arraste o próprio elemento) para mover livremente em X/Y">
                ✥ <span class="ovb-badge-title">Elemento</span>
            </span>
            <button type="button" class="ovb-badge-btn" data-act="move-up" title="Mover Acima na Ordem da Página (HTML)">▲</button>
            <button type="button" class="ovb-badge-btn" data-act="move-down" title="Mover Abaixo na Ordem da Página (HTML)">▼</button>
            <button type="button" class="ovb-badge-btn" data-act="parent" title="Selecionar Elemento Pai">⬆ Pai</button>
            <button type="button" class="ovb-badge-btn" data-act="duplicate" title="Duplicar este Elemento">⧉</button>
            <button type="button" class="ovb-badge-btn" data-act="hide" title="Ocultar Elemento">👁️</button>
            <button type="button" class="ovb-badge-btn" data-act="add-after" title="Inserir Novo Bloco Abaixo">＋</button>
            <button type="button" class="ovb-badge-btn" data-act="reset" title="Resetar Posição e Estilo deste Elemento">↺</button>
        `;
        document.body.appendChild(floatBadge);

        // 4. Live Transform HUD & Snap Guide
        const hud = document.createElement('div');
        hud.id = 'ovb-Transform-HUD';
        document.body.appendChild(hud);

        const snapGuideV = document.createElement('div');
        snapGuideV.id = 'ovb-Snap-Guide-V';
        document.body.appendChild(snapGuideV);

        function updateSelectionOverlay() {
            if (selectedElement && document.body.contains(selectedElement) && !isInteractiveMode) {
                const rect = selectedElement.getBoundingClientRect();
                selBox.style.display = 'block';
                selBox.style.top = `${rect.top}px`;
                selBox.style.left = `${rect.left}px`;
                selBox.style.width = `${Math.max(8, rect.width)}px`;
                selBox.style.height = `${Math.max(8, rect.height)}px`;

                floatBadge.style.display = 'flex';
                const badgeTop = rect.top > 38 ? rect.top - 34 : Math.min(window.innerHeight - 36, rect.bottom + 6);
                const badgeLeft = Math.max(6, Math.min(window.innerWidth - 360, rect.left));
                floatBadge.style.top = `${badgeTop}px`;
                floatBadge.style.left = `${badgeLeft}px`;
            } else {
                selBox.style.display = 'none';
                floatBadge.style.display = 'none';
            }

            if (hoveredElement && hoveredElement !== selectedElement && document.body.contains(hoveredElement) && !isInteractiveMode) {
                const rect = hoveredElement.getBoundingClientRect();
                hoverBadge.style.display = 'block';
                hoverBadge.style.top = `${Math.max(4, rect.top - 22)}px`;
                hoverBadge.style.left = `${Math.max(4, rect.left)}px`;
            } else {
                hoverBadge.style.display = 'none';
            }
        }

        window.addEventListener('scroll', updateSelectionOverlay, true);
        window.addEventListener('resize', updateSelectionOverlay);

        function selectElement(el, scrollToIt) {
            if (!el || el.nodeType !== 1) return;
            if (selectedElement) {
                selectedElement.removeAttribute('data-ovb-selected');
            }
            selectedElement = el;
            selectedElement.setAttribute('data-ovb-selected', 'true');
            selectedSelector = generateSelector(el);

            const titleSpan = floatBadge.querySelector('.ovb-badge-title');
            if (titleSpan) titleSpan.textContent = getElementLabel(el);

            if (scrollToIt) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            updateSelectionOverlay();

            window.parent.postMessage({
                type: 'OVB_ELEMENT_SELECTED',
                selector: selectedSelector,
                snapshot: getComputedSnapshot(el)
            }, '*');
        }

        // --- DRAG TO MOVE ENGINE (Works on ANY pre-existing HTML or SVG element!) ---
        let dragState = null;

        function getElementCurrentTranslate(el, selector) {
            const rec = builderData.elements[selector];
            const st = (rec && rec.styles && rec.styles.desktop) || {};
            if (st.translateX !== undefined || st.translateY !== undefined) {
                return {
                    x: parseFloat(String(st.translateX || '0')) || 0,
                    y: parseFloat(String(st.translateY || '0')) || 0
                };
            }
            const cs = window.getComputedStyle(el);
            if (cs.translate && cs.translate !== 'none') {
                const parts = cs.translate.split(' ');
                return {
                    x: parseFloat(parts[0]) || 0,
                    y: parseFloat(parts[1]) || 0
                };
            }
            return { x: 0, y: 0 };
        }

        function startDraggingElement(e, el) {
            if (!el || el === document.body || el === document.documentElement) return;
            const sel = generateSelector(el);
            const curT = getElementCurrentTranslate(el, sel);

            // Calculate scale factor if inside an SVG with viewBox
            let svgScale = 1;
            const ownerSvg = el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg' ? el.ownerSVGElement : null;
            if (ownerSvg && ownerSvg.viewBox && ownerSvg.viewBox.baseVal && ownerSvg.viewBox.baseVal.width) {
                const svgRect = ownerSvg.getBoundingClientRect();
                if (svgRect.width > 0) {
                    svgScale = ownerSvg.viewBox.baseVal.width / svgRect.width;
                }
            }

            dragState = {
                mode: 'move',
                el: el,
                selector: sel,
                startX: e.clientX,
                startY: e.clientY,
                origX: curT.x,
                origY: curT.y,
                svgScale: svgScale,
                moved: false
            };
        }

        // Start drag from the floating badge handle OR directly on any element on the canvas
        floatBadge.querySelector('.ovb-badge-drag-handle').addEventListener('mousedown', (e) => {
            if (e.button !== 0 || !selectedElement) return;
            e.preventDefault();
            e.stopPropagation();
            startDraggingElement(e, selectedElement);
        });

        document.addEventListener('mousedown', (e) => {
            if (isInteractiveMode || !dragModeEnabled || e.button !== 0) return;
            const target = e.target;
            if (!target || target === document.body || target === document.documentElement) return;
            if (target.closest('#ovb-Floating-Badge, #ovb-Hover-Badge, #ovb-Selection-Box, #wpadminbar')) return;

            // Select or prepare to drag the target element
            let elToAct = target;
            const svgGroup = target.closest && target.closest('g.dg-item[id]');
            if (svgGroup && selectedElement !== target) {
                elToAct = svgGroup;
            }

            selectElement(elToAct, false);
            startDraggingElement(e, elToAct);
            e.preventDefault();
        }, true);

        // --- 8-POINT RESIZE HANDLES ENGINE ---
        selBox.querySelectorAll('.ovb-resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (e.button !== 0 || !selectedElement) return;
                e.preventDefault();
                e.stopPropagation();

                const dir = handle.getAttribute('data-rh');
                const rect = selectedElement.getBoundingClientRect();
                const cs = window.getComputedStyle(selectedElement);
                const curScale = parseFloat(cs.scale && cs.scale !== 'none' ? cs.scale : '1') || 1;

                dragState = {
                    mode: 'resize',
                    dir: dir,
                    el: selectedElement,
                    selector: selectedSelector,
                    startX: e.clientX,
                    startY: e.clientY,
                    origW: rect.width,
                    origH: rect.height,
                    origScale: curScale,
                    isSvgOrCorner: (selectedElement instanceof SVGElement) || ['nw', 'ne', 'se', 'sw'].includes(dir),
                    moved: false
                };
            });
        });

        window.addEventListener('mousemove', (e) => {
            if (!dragState) return;
            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;

            if (!dragState.moved && Math.hypot(dx, dy) < 4) return;
            dragState.moved = true;
            document.body.classList.add('ovb-is-dragging');

            if (dragState.mode === 'move') {
                let newX = Math.round(dragState.origX + dx * dragState.svgScale);
                let newY = Math.round(dragState.origY + dy * dragState.svgScale);

                // Snap to 0 center if within 6px
                if (Math.abs(newX) <= 6) {
                    newX = 0;
                    snapGuideV.style.display = 'block';
                } else {
                    snapGuideV.style.display = 'none';
                }

                dragState.currentX = `${newX}px`;
                dragState.currentY = `${newY}px`;

                dragState.el.style.setProperty('translate', `${newX}px ${newY}px`, 'important');

                hud.style.display = 'block';
                hud.style.top = `${e.clientY + 16}px`;
                hud.style.left = `${e.clientX + 16}px`;
                hud.textContent = `X: ${newX >= 0 ? '+' : ''}${newX}px  |  Y: ${newY >= 0 ? '+' : ''}${newY}px`;
                updateSelectionOverlay();
            } else if (dragState.mode === 'resize') {
                if (dragState.isSvgOrCorner && (dragState.el instanceof SVGElement || dragState.dir === 'se' || dragState.dir === 'nw')) {
                    const sign = (dragState.dir === 'nw' || dragState.dir === 'sw') ? -1 : 1;
                    const delta = (dx * sign) / Math.max(60, dragState.origW);
                    const newScale = Math.max(0.15, Math.min(5, Number((dragState.origScale + delta).toFixed(2))));
                    dragState.currentScale = newScale;
                    dragState.el.style.setProperty('scale', String(newScale), 'important');

                    hud.style.display = 'block';
                    hud.style.top = `${e.clientY + 16}px`;
                    hud.style.left = `${e.clientX + 16}px`;
                    hud.textContent = `Escala: ${Math.round(newScale * 100)}% (${newScale}x)`;
                } else {
                    let newW = dragState.origW;
                    let newH = dragState.origH;
                    if (dragState.dir.includes('e')) newW = Math.max(20, Math.round(dragState.origW + dx));
                    if (dragState.dir.includes('w')) newW = Math.max(20, Math.round(dragState.origW - dx));
                    if (dragState.dir.includes('s')) newH = Math.max(20, Math.round(dragState.origH + dy));
                    if (dragState.dir.includes('n')) newH = Math.max(20, Math.round(dragState.origH - dy));

                    if (dragState.dir.includes('e') || dragState.dir.includes('w')) {
                        dragState.currentW = `${newW}px`;
                        dragState.el.style.setProperty('width', `${newW}px`, 'important');
                    }
                    if (dragState.dir.includes('s') || dragState.dir.includes('n')) {
                        dragState.currentH = `${newH}px`;
                        dragState.el.style.setProperty('height', `${newH}px`, 'important');
                    }

                    hud.style.display = 'block';
                    hud.style.top = `${e.clientY + 16}px`;
                    hud.style.left = `${e.clientX + 16}px`;
                    hud.textContent = `L: ${newW}px  ×  A: ${newH}px`;
                }
                updateSelectionOverlay();
            }
        }, true);

        window.addEventListener('mouseup', () => {
            if (!dragState) return;
            const st = dragState;
            dragState = null;
            document.body.classList.remove('ovb-is-dragging');
            hud.style.display = 'none';
            snapGuideV.style.display = 'none';

            if (st.moved) {
                const changes = {};
                if (st.mode === 'move') {
                    changes.translateX = st.currentX;
                    changes.translateY = st.currentY;
                } else if (st.mode === 'resize') {
                    if (st.currentScale !== undefined) changes.scale = st.currentScale;
                    if (st.currentW !== undefined) changes.width = st.currentW;
                    if (st.currentH !== undefined) changes.height = st.currentH;
                }

                window.parent.postMessage({
                    type: 'OVB_CANVAS_TRANSFORMED',
                    selector: st.selector,
                    changes: changes,
                    snapshot: getComputedSnapshot(st.el)
                }, '*');
            }
        }, true);

        // Prevent accidental click navigation when in Editor Mode
        document.addEventListener('click', (e) => {
            if (isInteractiveMode) return;
            const target = e.target;
            if (!target || target.closest('#ovb-Floating-Badge, #ovb-Hover-Badge, #ovb-Selection-Box, #wpadminbar')) return;
            e.preventDefault();
            e.stopPropagation();
        }, true);

        // Floating Badge Action Buttons (Move Up/Down in DOM, Duplicate, Hide, Parent, Add Block, Reset)
        floatBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const btn = e.target.closest('[data-act]');
            if (!btn || !selectedElement) return;
            const act = btn.getAttribute('data-act');

            if (act === 'parent' && selectedElement.parentElement && selectedElement.parentElement !== document.body) {
                selectElement(selectedElement.parentElement, false);
            } else if (act === 'move-up') {
                const prev = selectedElement.previousElementSibling;
                if (prev && !prev.id.startsWith('ovb-')) {
                    const prevSel = generateSelector(prev);
                    selectedElement.parentNode.insertBefore(selectedElement, prev);
                    updateSelectionOverlay();
                    window.parent.postMessage({
                        type: 'OVB_DOM_MOVED',
                        move: { selector: selectedSelector, refSelector: prevSel, pos: 'before' },
                        tree: collectPageTree()
                    }, '*');
                }
            } else if (act === 'move-down') {
                const next = selectedElement.nextElementSibling;
                if (next && !next.id.startsWith('ovb-')) {
                    const nextSel = generateSelector(next);
                    selectedElement.parentNode.insertBefore(selectedElement, next.nextSibling);
                    updateSelectionOverlay();
                    window.parent.postMessage({
                        type: 'OVB_DOM_MOVED',
                        move: { selector: selectedSelector, refSelector: nextSel, pos: 'after' },
                        tree: collectPageTree()
                    }, '*');
                }
            } else if (act === 'duplicate') {
                window.parent.postMessage({
                    type: 'OVB_DUPLICATE_ELEMENT',
                    selector: selectedSelector
                }, '*');
            } else if (act === 'hide') {
                window.parent.postMessage({
                    type: 'OVB_CANVAS_TRANSFORMED',
                    selector: selectedSelector,
                    changes: { hidden: true }
                }, '*');
            } else if (act === 'add-after') {
                window.parent.postMessage({
                    type: 'OVB_OPEN_ADD_BLOCK',
                    targetSelector: selectedSelector
                }, '*');
            } else if (act === 'reset') {
                selectedElement.style.removeProperty('translate');
                selectedElement.style.removeProperty('scale');
                selectedElement.style.removeProperty('width');
                selectedElement.style.removeProperty('height');
                window.parent.postMessage({
                    type: 'OVB_RESET_ELEMENT',
                    selector: selectedSelector
                }, '*');
            }
        });

        // Hover Highlight
        document.addEventListener('mouseover', (e) => {
            if (isInteractiveMode || dragState) return;
            const target = e.target;
            if (!target || target === document.body || target === document.documentElement) return;
            if (target.closest('#ovb-Floating-Badge, #ovb-Hover-Badge, #ovb-Selection-Box, #wpadminbar')) return;

            if (hoveredElement && hoveredElement !== target) {
                hoveredElement.removeAttribute('data-ovb-hover');
            }
            hoveredElement = target;
            hoveredElement.setAttribute('data-ovb-hover', 'true');
            hoverBadge.textContent = getElementLabel(target);
            updateSelectionOverlay();
        }, true);

        document.addEventListener('mouseout', (e) => {
            if (hoveredElement && e.target === hoveredElement) {
                hoveredElement.removeAttribute('data-ovb-hover');
                hoveredElement = null;
                hoverBadge.style.display = 'none';
            }
        }, true);

        // Listen for commands from the Studio Editor parent window
        window.addEventListener('message', (event) => {
            const msg = event.data;
            if (!msg || typeof msg !== 'object' || !msg.type) return;

            switch (msg.type) {
                case 'OVB_SYNC_DATA': {
                    builderData = normalizeData(msg.data);
                    applyDOMMoves();
                    renderClonedElements();
                    renderCustomBlocks();
                    updateLiveStyleTag();
                    applyDOMFeatures();
                    if (selectedSelector) {
                        try {
                            const found = document.querySelector(selectedSelector);
                            if (found) {
                                selectedElement = found;
                                selectedElement.setAttribute('data-ovb-selected', 'true');
                            }
                        } catch (err) {}
                    }
                    updateSelectionOverlay();
                    break;
                }
                case 'OVB_SELECT_SELECTOR': {
                    if (!msg.selector) return;
                    try {
                        const el = document.querySelector(msg.selector);
                        if (el) selectElement(el, !!msg.scroll);
                    } catch (err) {}
                    break;
                }
                case 'OVB_SELECT_PARENT': {
                    if (selectedElement && selectedElement.parentElement && selectedElement.parentElement !== document.body) {
                        selectElement(selectedElement.parentElement, false);
                    }
                    break;
                }
                case 'OVB_MOVE_DOM_STEP': {
                    if (!selectedElement) return;
                    const dir = msg.dir;
                    if (dir === 'up') {
                        floatBadge.querySelector('[data-act="move-up"]').click();
                    } else if (dir === 'down') {
                        floatBadge.querySelector('[data-act="move-down"]').click();
                    }
                    break;
                }
                case 'OVB_TEST_ANIMATION': {
                    triggerAnimationPreview(msg.selector || selectedSelector, msg.anim, msg.duration, msg.delay, msg.easing);
                    break;
                }
                case 'OVB_SET_INTERACTIVE_MODE': {
                    isInteractiveMode = !!msg.interactive;
                    document.body.classList.toggle('ovb-editor-active', !isInteractiveMode);
                    if (isInteractiveMode) {
                        if (hoveredElement) hoveredElement.removeAttribute('data-ovb-hover');
                        hoverBadge.style.display = 'none';
                        floatBadge.style.display = 'none';
                        selBox.style.display = 'none';
                    } else {
                        updateSelectionOverlay();
                    }
                    break;
                }
                case 'OVB_SET_PREVIEW_THEME': {
                    if (msg.theme === 'light') {
                        document.body.classList.remove('theme-dark');
                        document.body.classList.add('theme-light');
                        try { localStorage.setItem('userTheme', 'light'); } catch (e) {}
                    } else if (msg.theme === 'dark') {
                        document.body.classList.remove('theme-light');
                        document.body.classList.add('theme-dark');
                        try { localStorage.setItem('userTheme', 'dark'); } catch (e) {}
                    }
                    if (msg.color === 'red') {
                        document.body.classList.remove('color-purple');
                        document.body.classList.add('color-red');
                        try { localStorage.setItem('userColor', 'red'); } catch (e) {}
                    } else if (msg.color === 'purple') {
                        document.body.classList.remove('color-red');
                        document.body.classList.add('color-purple');
                        try { localStorage.setItem('userColor', 'purple'); } catch (e) {}
                    }
                    if (msg.onboarding !== undefined) {
                        document.body.classList.toggle('modo-onboarding', !!msg.onboarding);
                    }
                    setTimeout(applyDOMFeatures, 60);
                    break;
                }
                case 'OVB_REQUEST_TREE': {
                    window.parent.postMessage({
                        type: 'OVB_PAGE_TREE',
                        tree: collectPageTree()
                    }, '*');
                    break;
                }
            }
        });

        window.parent.postMessage({
            type: 'OVB_PREVIEW_READY',
            url: window.location.href,
            theme: document.body.classList.contains('theme-light') ? 'light' : 'dark',
            color: document.body.classList.contains('color-red') ? 'red' : 'purple',
            tree: collectPageTree()
        }, '*');
    }

    function init() {
        applyDOMMoves();
        renderClonedElements();
        renderCustomBlocks();
        updateLiveStyleTag();
        applyDOMFeatures();

        // Observe dynamic changes (carousels, translations, theme switches) and keep customizations intact
        let debounceTimer = null;
        const domObserver = new MutationObserver((mutations) => {
            if (isApplyingDOM) return;
            let shouldReapply = false;
            for (const m of mutations) {
                if (m.type === 'attributes' && (m.target === document.body || m.target === document.documentElement)) {
                    shouldReapply = true;
                    break;
                }
                if (m.addedNodes && m.addedNodes.length > 0) {
                    for (const n of m.addedNodes) {
                        if (n.nodeType === 1 &&
                            !n.classList.contains('ovb-layer-overlay') &&
                            !n.classList.contains('ovb-custom-block') &&
                            !String(n.id).startsWith('ovb-')) {
                            shouldReapply = true;
                            break;
                        }
                    }
                }
                if (shouldReapply) break;
            }
            if (shouldReapply) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    applyDOMFeatures();
                }, 120);
            }
        });

        if (document.body) {
            domObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        }
        domObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['lang']
        });

        if (config.isPreview && window.parent !== window) {
            initPreviewInspector();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
