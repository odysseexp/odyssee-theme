/**
 * Odyssee Visual Studio — Frontend Runtime & Live Canvas Inspector
 * Non-destructive visual layer for Elementor-like customization
 */
(function () {
    'use strict';

    const config = window.odysseeVBConfig || {
        isPreview: false,
        data: { elements: {}, blocks: [], globalVars: {}, customCss: '' }
    };

    let builderData = normalizeData(config.data);
    let isInteractiveMode = false; // When true in preview, allows clicking links/buttons normally
    let selectedSelector = null;
    let selectedElement = null;
    let hoveredElement = null;
    let scrollObserver = null;

    function normalizeData(raw) {
        const d = raw && typeof raw === 'object' ? raw : {};
        return {
            elements: d.elements && typeof d.elements === 'object' ? d.elements : {},
            blocks: Array.isArray(d.blocks) ? d.blocks : [],
            globalVars: d.globalVars && typeof d.globalVars === 'object' ? d.globalVars : {},
            customCss: typeof d.customCss === 'string' ? d.customCss : ''
        };
    }

    function hexToRgba(hex, alpha) {
        if (!hex) return `rgba(139, 92, 246, ${alpha})`;
        hex = hex.replace('#', '').trim();
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
                rules.push(`${cssProp}: ${st[prop]}${imp}`);
            }
        });

        if (st.width) rules.push(`width: ${st.width}${imp}`);
        if (st.maxWidth) rules.push(`max-width: ${st.maxWidth}${imp}`);
        if (st.minHeight) rules.push(`min-height: ${st.minHeight}${imp}`);
        if (st.display) rules.push(`display: ${st.display}${imp}`);
        if (st.position) rules.push(`position: ${st.position}${imp}`);
        if (st.zIndex !== undefined && st.zIndex !== '') rules.push(`z-index: ${st.zIndex}${imp}`);
        if (st.overflow) rules.push(`overflow: ${st.overflow}${imp}`);

        // Borders
        if (st.borderStyle && st.borderStyle !== 'none') {
            rules.push(`border-style: ${st.borderStyle}${imp}`);
            if (st.borderWidth) rules.push(`border-width: ${st.borderWidth}${imp}`);
            if (st.borderColor) rules.push(`border-color: ${st.borderColor}${imp}`);
        } else if (st.borderStyle === 'none') {
            rules.push(`border: none${imp}`);
        }
        if (st.borderRadius !== undefined && st.borderRadius !== '') {
            rules.push(`border-radius: ${st.borderRadius}${imp}`);
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
            const gBlur = st.glowBlur !== undefined && st.glowBlur !== '' ? Number(st.glowBlur) : 24;
            const gSpread = st.glowSpread !== undefined && st.glowSpread !== '' ? Number(st.glowSpread) : 0;
            const gLayers = Number(st.glowLayers || 2);
            const gMode = st.glowMode || 'box'; // 'box', 'drop-shadow', 'text', 'inset'

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

        if (filters.length > 0) {
            rules.push(`filter: ${filters.join(' ')}${imp}`);
        }

        // 2D / 3D Transforms
        const transforms = [];
        if (st.translateX || st.translateY) {
            transforms.push(`translate3d(${st.translateX || '0px'}, ${st.translateY || '0px'}, 0)`);
        }
        if (st.scale !== undefined && st.scale !== '' && Number(st.scale) !== 1) {
            transforms.push(`scale(${st.scale})`);
        }
        if (st.rotate !== undefined && st.rotate !== '' && Number(st.rotate) !== 0) {
            transforms.push(`rotate(${st.rotate}deg)`);
        }
        if (st.rotateX !== undefined && st.rotateX !== '' && Number(st.rotateX) !== 0) {
            transforms.push(`perspective(900px) rotateX(${st.rotateX}deg)`);
        }
        if (st.rotateY !== undefined && st.rotateY !== '' && Number(st.rotateY) !== 0) {
            transforms.push(`perspective(900px) rotateY(${st.rotateY}deg)`);
        }
        if (st.skewX !== undefined && st.skewX !== '' && Number(st.skewX) !== 0) {
            transforms.push(`skewX(${st.skewX}deg)`);
        }
        if (transforms.length > 0) {
            rules.push(`transform: ${transforms.join(' ')}${imp}`);
        }

        // Loop Animation (Continuous)
        if (!isHover && st.loopAnim && st.loopAnim !== 'none') {
            const dur = st.loopDuration || '3.2s';
            const amp = st.loopIntensity || '12px';
            rules.push(`--ovb-loop-amp: ${amp}`);
            rules.push(`animation: ${st.loopAnim} ${dur} ease-in-out infinite${imp}`);
        }

        if (isHover) {
            rules.push(`transition: all ${st.hoverTransition || '0.32s'} cubic-bezier(0.22, 1, 0.36, 1)${imp}`);
        }

        return rules.join('; ');
    }

    /**
     * Compiles all builderData into a single CSS string and updates #odyssee-vb-live-css
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
            const themeScope = elConfig.themeScope || 'all'; // 'all', 'dark', 'light'
            const prefix = themeScope === 'dark' ? 'body.theme-dark ' : (themeScope === 'light' ? 'body.theme-light ' : '');
            const fullSel = prefix + selector;

            // Desktop Normal
            if (elConfig.styles && elConfig.styles.desktop) {
                const dCss = compileRuleDeclarations(elConfig.styles.desktop, false);
                if (dCss) cssParts.push(`${fullSel} { ${dCss}; }`);
            }

            // Desktop Hover
            if (elConfig.styles && elConfig.styles.hover) {
                const hCss = compileRuleDeclarations(elConfig.styles.hover, true);
                if (hCss) {
                    cssParts.push(`${fullSel} { transition: all 0.32s cubic-bezier(0.22, 1, 0.36, 1); }`);
                    cssParts.push(`${fullSel}:hover { ${hCss}; }`);
                }
            }

            // Theme-specific sub-overrides (dark / light specific styles on the same element)
            if (elConfig.styles && elConfig.styles.dark) {
                const darkCss = compileRuleDeclarations(elConfig.styles.dark, false);
                if (darkCss) cssParts.push(`body.theme-dark ${selector} { ${darkCss}; }`);
            }
            if (elConfig.styles && elConfig.styles.light) {
                const lightCss = compileRuleDeclarations(elConfig.styles.light, false);
                if (lightCss) cssParts.push(`body.theme-light ${selector} { ${lightCss}; }`);
            }

            // Tablet Responsive
            if (elConfig.styles && elConfig.styles.tablet) {
                const tCss = compileRuleDeclarations(elConfig.styles.tablet, false);
                if (tCss) tabletRules.push(`${fullSel} { ${tCss}; }`);
            }

            // Mobile Responsive
            if (elConfig.styles && elConfig.styles.mobile) {
                const mCss = compileRuleDeclarations(elConfig.styles.mobile, false);
                if (mCss) mobileRules.push(`${fullSel} { ${mCss}; }`);
            }

            // Element-level Custom CSS (supports `selector` keyword like Elementor!)
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

        // 3. Global Custom CSS
        if (data.customCss && data.customCss.trim()) {
            cssParts.push(data.customCss);
        }

        return cssParts.join('\n');
    }

    /**
     * Injects or updates the live style tag on the page
     */
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
                p.innerHTML = c.html || '<p>Seu novo bloco de texto criativo. Clique para personalizar fontes, cores, glow e animações.</p>';
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

    /**
     * Renders custom blocks into the DOM non-destructively
     */
    function renderCustomBlocks() {
        // Remove previously rendered custom blocks so we can re-render cleanly
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
            const pos = block.position || 'after'; // 'before', 'after', 'prepend', 'append'

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
     * Applies DOM-level features: text overrides, image src, overlay layers, entrance animations, hover presets, 3D tilt
     */
    function applyDOMFeatures() {
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
            }, { threshold: 0.12 });
        }

        // Clean up existing overlay layers before re-applying
        document.querySelectorAll('.ovb-layer-overlay').forEach(el => el.remove());

        Object.entries(builderData.elements || {}).forEach(([selector, elConfig]) => {
            if (!elConfig || typeof elConfig !== 'object') return;
            let nodes = [];
            try {
                nodes = Array.from(document.querySelectorAll(selector));
            } catch (e) {
                return;
            }

            nodes.forEach(el => {
                // 1. Content Overrides (Non-destructive: store original in data-ovb-orig-*)
                if (elConfig.content) {
                    const c = elConfig.content;
                    if (c.text !== undefined && c.text !== '') {
                        if (!el.hasAttribute('data-ovb-orig-text')) {
                            el.setAttribute('data-ovb-orig-text', el.textContent);
                        }
                        if (el.children.length === 0) {
                            el.textContent = c.text;
                        }
                    } else if (el.hasAttribute('data-ovb-orig-text')) {
                        if (el.children.length === 0) {
                            el.textContent = el.getAttribute('data-ovb-orig-text');
                        }
                        el.removeAttribute('data-ovb-orig-text');
                    }

                    if (c.src !== undefined && c.src !== '' && el.tagName === 'IMG') {
                        if (!el.hasAttribute('data-ovb-orig-src')) {
                            el.setAttribute('data-ovb-orig-src', el.getAttribute('src') || '');
                        }
                        el.setAttribute('src', c.src);
                    } else if (el.hasAttribute('data-ovb-orig-src') && el.tagName === 'IMG') {
                        el.setAttribute('src', el.getAttribute('data-ovb-orig-src'));
                        el.removeAttribute('data-ovb-orig-src');
                    }

                    if (c.href !== undefined && c.href !== '' && el.tagName === 'A') {
                        if (!el.hasAttribute('data-ovb-orig-href')) {
                            el.setAttribute('data-ovb-orig-href', el.getAttribute('href') || '');
                        }
                        el.setAttribute('href', c.href);
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

                // 3. Extra Layer Overlay (Blend Mode Layer inside Element)
                if (st.overlayEnabled && st.overlayColor) {
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
                if (st.tiltEnabled && window.VanillaTilt) {
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
    }

    /**
     * Triggers an entrance animation immediately on a selector (for the "Test Animation" button in Studio)
     */
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
            void el.offsetWidth; // Force reflow
            el.style.setProperty('animation', `${animName} ${duration || '0.75s'} ${easing || 'cubic-bezier(0.22, 1, 0.36, 1)'} ${delay || '0s'} both`, 'important');
        });
    }

    /**
     * Generates a clean, human-readable, stable CSS selector for a clicked DOM element
     */
    function generateSelector(el) {
        if (!el || el.nodeType !== 1) return null;

        // If it's a custom block or inside a custom block, check if user clicked the block or child
        if (el.hasAttribute('data-ovb-block-id')) {
            return `#${el.getAttribute('data-ovb-block-id')}`;
        }

        // If element has a unique ID (that isn't transient)
        if (el.id && !el.id.startsWith('ovb-')) {
            return `#${CSS.escape(el.id)}`;
        }

        // If element has a unique data-key (used throughout Odyssee theme for headings/texts/buttons!)
        const dataKey = el.getAttribute('data-key');
        if (dataKey) {
            const tag = el.tagName.toLowerCase();
            const candidate = `${tag}[data-key="${CSS.escape(dataKey)}"]`;
            if (document.querySelectorAll(candidate).length === 1) {
                return candidate;
            }
        }

        // Build concise path from nearest ancestor with ID
        const parts = [];
        let cur = el;
        while (cur && cur.nodeType === 1 && cur !== document.body && cur !== document.documentElement) {
            if (cur.id && !cur.id.startsWith('ovb-')) {
                parts.unshift(`#${CSS.escape(cur.id)}`);
                break;
            }

            let part = cur.tagName.toLowerCase();
            const validClasses = Array.from(cur.classList).filter(c =>
                !c.startsWith('ovb-') &&
                !['theme-dark', 'theme-light', 'color-purple', 'color-red', 'modo-onboarding', 'transparent', 'active', 'visible'].includes(c)
            );

            if (validClasses.length > 0) {
                part += '.' + validClasses.slice(0, 2).map(c => CSS.escape(c)).join('.');
            }

            // Check if this class selector is already unique within its parent or document
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
     * Friendly label for an element in the UI / Navigator
     */
    function getElementLabel(el) {
        if (!el || el.nodeType !== 1) return 'Elemento';
        if (el.hasAttribute('data-ovb-block-id')) {
            return `Bloco · #${el.getAttribute('data-ovb-block-id')}`;
        }
        const tag = el.tagName.toUpperCase();
        if (el.id) return `${tag}#${el.id}`;
        const key = el.getAttribute('data-key');
        if (key) return `${tag} [${key}]`;
        const cls = Array.from(el.classList).filter(c => !c.startsWith('ovb-'))[0];
        if (cls) return `${tag}.${cls}`;
        return tag;
    }

    /**
     * Computes current effective styles of an element to populate the editor sidebar
     */
    function getComputedSnapshot(el) {
        if (!el || el.nodeType !== 1) return {};
        const cs = window.getComputedStyle(el);
        return {
            tagName: el.tagName.toLowerCase(),
            label: getElementLabel(el),
            text: el.children.length === 0 ? (el.textContent || '').trim() : '',
            src: el.tagName === 'IMG' ? (el.getAttribute('src') || '') : '',
            href: el.tagName === 'A' ? (el.getAttribute('href') || '') : '',
            isCustomBlock: el.hasAttribute('data-ovb-block-id') || !!el.closest('[data-ovb-block-id]'),
            blockId: el.getAttribute('data-ovb-block-id') || (el.closest('[data-ovb-block-id]') ? el.closest('[data-ovb-block-id]').getAttribute('data-ovb-block-id') : null),
            computed: {
                fontSize: cs.fontSize,
                fontWeight: cs.fontWeight,
                color: cs.color,
                backgroundColor: cs.backgroundColor,
                borderRadius: cs.borderRadius,
                paddingTop: cs.paddingTop,
                paddingRight: cs.paddingRight,
                paddingBottom: cs.paddingBottom,
                paddingLeft: cs.paddingLeft,
                marginTop: cs.marginTop,
                marginRight: cs.marginRight,
                marginBottom: cs.marginBottom,
                marginLeft: cs.marginLeft,
                mixBlendMode: cs.mixBlendMode,
                opacity: Math.round(parseFloat(cs.opacity || '1') * 100)
            }
        };
    }

    /**
     * Collects a structured page tree for the Layer Navigator in the Studio sidebar
     */
    function collectPageTree() {
        const items = [];
        const mainNodes = document.querySelectorAll('header.main-header, section[id], footer.site-footer, .ovb-custom-block[data-ovb-block-id]');
        mainNodes.forEach(node => {
            const sel = generateSelector(node);
            const children = [];
            node.querySelectorAll('h1, h2, h3, p, a, button, img, .category-banner-wrapper, .hero-logo-container, .ovb-custom-block').forEach(child => {
                if (child.closest('#ovb-Floating-Badge, #ovb-Hover-Badge')) return;
                const cSel = generateSelector(child);
                if (cSel) {
                    children.push({
                        selector: cSel,
                        label: getElementLabel(child),
                        hasCustom: !!builderData.elements[cSel],
                        isBlock: child.hasAttribute('data-ovb-block-id')
                    });
                }
            });
            items.push({
                selector: sel,
                label: getElementLabel(node),
                hasCustom: !!builderData.elements[sel],
                isBlock: node.hasAttribute('data-ovb-block-id'),
                children: children.slice(0, 25)
            });
        });
        return items;
    }

    /**
     * Initializes the Interactive Canvas Inspector when loaded inside the Studio iframe
     */
    function initPreviewInspector() {
        document.body.classList.add('ovb-editor-active');

        // Bypass onboarding by default in preview so the user can edit the site immediately
        try {
            localStorage.setItem('onboardingFeito', 'sim');
        } catch (e) {}
        document.body.classList.remove('modo-onboarding');

        // Create floating selection & hover badges
        const hoverBadge = document.createElement('div');
        hoverBadge.id = 'ovb-Hover-Badge';
        document.body.appendChild(hoverBadge);

        const floatBadge = document.createElement('div');
        floatBadge.id = 'ovb-Floating-Badge';
        floatBadge.innerHTML = `
            <span class="ovb-badge-title">Elemento</span>
            <button type="button" class="ovb-badge-btn" data-act="parent" title="Selecionar Elemento Pai">⬆ Pai</button>
            <button type="button" class="ovb-badge-btn" data-act="add-after" title="Inserir Novo Bloco Abaixo">＋ Bloco</button>
            <button type="button" class="ovb-badge-btn" data-act="reset" title="Resetar Estilo deste Elemento">↺</button>
        `;
        document.body.appendChild(floatBadge);

        function updateBadgesPosition() {
            if (selectedElement && document.body.contains(selectedElement) && !isInteractiveMode) {
                const rect = selectedElement.getBoundingClientRect();
                floatBadge.style.display = 'flex';
                const top = Math.max(6, rect.top - 30);
                const left = Math.max(6, Math.min(window.innerWidth - 260, rect.left));
                floatBadge.style.top = `${top}px`;
                floatBadge.style.left = `${left}px`;
            } else {
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

        window.addEventListener('scroll', updateBadgesPosition, true);
        window.addEventListener('resize', updateBadgesPosition);

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
            updateBadgesPosition();

            window.parent.postMessage({
                type: 'OVB_ELEMENT_SELECTED',
                selector: selectedSelector,
                snapshot: getComputedSnapshot(el)
            }, '*');
        }

        // Badge quick buttons
        floatBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const btn = e.target.closest('[data-act]');
            if (!btn || !selectedElement) return;
            const act = btn.getAttribute('data-act');
            if (act === 'parent' && selectedElement.parentElement && selectedElement.parentElement !== document.body) {
                selectElement(selectedElement.parentElement, false);
            } else if (act === 'add-after') {
                window.parent.postMessage({
                    type: 'OVB_OPEN_ADD_BLOCK',
                    targetSelector: selectedSelector
                }, '*');
            } else if (act === 'reset') {
                window.parent.postMessage({
                    type: 'OVB_RESET_ELEMENT',
                    selector: selectedSelector
                }, '*');
            }
        });

        // Mouseover highlight
        document.addEventListener('mouseover', (e) => {
            if (isInteractiveMode) return;
            const target = e.target;
            if (!target || target === document.body || target === document.documentElement) return;
            if (target.closest('#ovb-Floating-Badge, #ovb-Hover-Badge, #wpadminbar')) return;

            if (hoveredElement && hoveredElement !== target) {
                hoveredElement.removeAttribute('data-ovb-hover');
            }
            hoveredElement = target;
            hoveredElement.setAttribute('data-ovb-hover', 'true');
            hoverBadge.textContent = getElementLabel(target);
            updateBadgesPosition();
        }, true);

        document.addEventListener('mouseout', (e) => {
            if (hoveredElement && e.target === hoveredElement) {
                hoveredElement.removeAttribute('data-ovb-hover');
                hoveredElement = null;
                hoverBadge.style.display = 'none';
            }
        }, true);

        // Click to select element
        document.addEventListener('click', (e) => {
            if (isInteractiveMode) return;
            const target = e.target;
            if (!target || target.closest('#ovb-Floating-Badge, #ovb-Hover-Badge, #wpadminbar')) return;

            e.preventDefault();
            e.stopPropagation();
            selectElement(target, false);
        }, true);

        // Listen for commands from the Studio Editor parent window
        window.addEventListener('message', (event) => {
            const msg = event.data;
            if (!msg || typeof msg !== 'object' || !msg.type) return;

            switch (msg.type) {
                case 'OVB_SYNC_DATA': {
                    builderData = normalizeData(msg.data);
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
                    updateBadgesPosition();
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
                    } else {
                        updateBadgesPosition();
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

        // Notify parent Studio that preview iframe is ready
        window.parent.postMessage({
            type: 'OVB_PREVIEW_READY',
            url: window.location.href,
            theme: document.body.classList.contains('theme-light') ? 'light' : 'dark',
            color: document.body.classList.contains('color-red') ? 'red' : 'purple',
            tree: collectPageTree()
        }, '*');
    }

    /**
     * Bootstraps everything on DOMContentLoaded
     */
    function init() {
        renderCustomBlocks();
        updateLiveStyleTag();
        applyDOMFeatures();

        // Re-apply DOM features when dynamic carousels or service cards finish rendering
        let debounceTimer = null;
        const domObserver = new MutationObserver((mutations) => {
            let shouldReapply = false;
            for (const m of mutations) {
                if (m.addedNodes && m.addedNodes.length > 0) {
                    for (const n of m.addedNodes) {
                        if (n.nodeType === 1 && !n.classList.contains('ovb-layer-overlay') && !n.classList.contains('ovb-custom-block') && n.id !== 'ovb-Floating-Badge' && n.id !== 'ovb-Hover-Badge') {
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
                }, 180);
            }
        });

        if (document.body) {
            domObserver.observe(document.body, { childList: true, subtree: true });
        }

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
