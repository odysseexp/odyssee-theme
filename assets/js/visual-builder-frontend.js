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

    let builderData = null; // inicializado após DEFAULT_PALETTES (evita TDZ)
    let isInteractiveMode = false; // When true in preview, allows clicking links/buttons normally
    let dragModeEnabled = true;    // Allows dragging any selected/clicked element on canvas
    let selectedSelector = null;
    let selectedElement = null;
    let hoveredElement = null;
    let scrollObserver = null;
    let isApplyingDOM = false;

    const DEFAULT_PALETTES = [
        {
            id: 'purple',
            name: 'Roxo Odyssee',
            nameEn: 'Odyssee Purple',
            accent: '#8b5cf6',
            accentHover: '#7c3aed',
            nebula1: '#9333ea',
            nebula2: '#c026d3',
            nebula3: '#7c3aed',
            bgDark: '#0d1538',
            bgLight: '#f8fafc',
            isBuiltin: true
        },
        {
            id: 'red',
            name: 'Vermelho Crimson',
            nameEn: 'Crimson Red',
            accent: '#ef4444',
            accentHover: '#dc2626',
            nebula1: '#dc2626',
            nebula2: '#e11d48',
            nebula3: '#991b1b',
            bgDark: '#1f0910',
            bgLight: '#fff5f5',
            isBuiltin: true
        }
    ];

    builderData = normalizeData(config.data);

    function normalizePalettesList(rawList) {
        const list = Array.isArray(rawList) ? rawList.filter(p => p && p.id && p.accent) : [];
        const result = [];
        DEFAULT_PALETTES.forEach(def => {
            const customOverride = list.find(p => p.id === def.id);
            result.push(customOverride ? Object.assign({}, def, customOverride) : Object.assign({}, def));
        });
        list.forEach(p => {
            if (!result.some(r => r.id === p.id)) {
                result.push({
                    id: String(p.id),
                    name: p.name || 'Nova Paleta',
                    nameEn: p.nameEn || p.name || 'Custom Palette',
                    accent: p.accent || '#06b6d4',
                    accentHover: p.accentHover || p.accent || '#0891b2',
                    nebula1: p.nebula1 || p.accent || '#06b6d4',
                    nebula2: p.nebula2 || p.accentHover || '#3b82f6',
                    nebula3: p.nebula3 || p.accent || '#0ea5e9',
                    bgDark: p.bgDark || '#0b132b',
                    bgLight: p.bgLight || '#f8fafc'
                });
            }
        });
        return result;
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
            pagePresets: d.pagePresets && typeof d.pagePresets === 'object' ? d.pagePresets : {},
            sitePresets: d.sitePresets && typeof d.sitePresets === 'object' ? d.sitePresets : {},
            colorPalettes: normalizePalettesList(d.colorPalettes),
            activeGlobalPalette: typeof d.activeGlobalPalette === 'string' && d.activeGlobalPalette ? d.activeGlobalPalette : 'purple',
            pagePalettes: d.pagePalettes && typeof d.pagePalettes === 'object' && !Array.isArray(d.pagePalettes) ? d.pagePalettes : {},
            allowVisitorColorSwitch: d.allowVisitorColorSwitch !== undefined ? !!d.allowVisitorColorSwitch : true,
            uiStyleColors: d.uiStyleColors && typeof d.uiStyleColors === 'object' && !Array.isArray(d.uiStyleColors) ? d.uiStyleColors : {},
            shortcuts: d.shortcuts && typeof d.shortcuts === 'object' && !Array.isArray(d.shortcuts) ? d.shortcuts : {}
        };
    }

    function getCookieVal(name) {
        try {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? decodeURIComponent(match[2]) : '';
        } catch (e) {
            return '';
        }
    }

    function setCookieVal(name, value) {
        try {
            document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
        } catch (e) {}
    }

    function getNormalizedPageKey() {
        let p = (window.location.pathname || '/').toLowerCase();
        if (p === '' || p === '/index.php') return '/';
        if (!p.endsWith('/')) p += '/';
        return p;
    }

    function applyColorPalettesEngine() {
        const palettes = normalizePalettesList(builderData.colorPalettes);
        const allowVisitor = builderData.allowVisitorColorSwitch !== false;
        const pageKey = getNormalizedPageKey();
        const pagePalettes = builderData.pagePalettes || {};

        // 1. Check if current page has an individual per-page palette assigned
        let pageSpecificId = pagePalettes[pageKey] || '';
        if (!pageSpecificId) {
            // Also check matching suffix (e.g., '/servicos/' inside subdirectory install)
            Object.entries(pagePalettes).forEach(([k, v]) => {
                if (v && k !== '/' && pageKey.endsWith(k)) {
                    pageSpecificId = v;
                }
            });
        }

        // 2. Determine visitor session/cookie choice if allowed
        let visitorChoice = '';
        if (allowVisitor) {
            visitorChoice = getCookieVal('odyssee_user_palette') || '';
            if (!visitorChoice) {
                try {
                    visitorChoice = localStorage.getItem('userColor') || '';
                } catch (e) {}
            }
        }

        // Priority: Visitor Cookie/Session (if visitor explicitly switched and allowed, unless page forces a specific palette and visitor hasn't overridden on this session) -> Per-Page Palette -> Global Palette
        let activeId = pageSpecificId || builderData.activeGlobalPalette || 'purple';
        if (allowVisitor && visitorChoice && palettes.some(p => p.id === visitorChoice)) {
            if (!pageSpecificId || window._ovbVisitorExplicitlyPickedColor) {
                activeId = visitorChoice;
            }
        }

        const pal = palettes.find(p => p.id === activeId) || palettes[0];
        if (!pal) return;

        // Update body classes for backward compatibility with style.css
        document.body.classList.toggle('color-red', pal.id === 'red');
        document.body.classList.toggle('color-purple', pal.id !== 'red');
        document.body.setAttribute('data-ovb-palette', pal.id);

        // Inject dynamic CSS variables for the active palette (supports unlimited custom palettes!)
        let palStyleEl = document.getElementById('odyssee-vb-palette-css');
        if (!palStyleEl) {
            palStyleEl = document.createElement('style');
            palStyleEl.id = 'odyssee-vb-palette-css';
            document.head.appendChild(palStyleEl);
        }

        const accentRgbaGlow = hexToRgba(pal.accent, 0.45);
        const n1Rgba = hexToRgba(pal.nebula1 || pal.accent, 0.55);
        const n2Rgba = hexToRgba(pal.nebula2 || pal.accentHover || pal.accent, 0.5);
        const n3Rgba = hexToRgba(pal.nebula3 || pal.accent, 0.45);

        if (pal.id === 'purple' && !pal.customModified) {
            palStyleEl.textContent = '';
        } else if (pal.id === 'red' && !pal.customModified) {
            palStyleEl.textContent = '';
        } else {
            palStyleEl.textContent = `
                :root, body, body.color-purple, body.color-red {
                    --color-accent: ${pal.accent} !important;
                    --color-accent-hover: ${pal.accentHover || pal.accent} !important;
                    --color-accent-glow: ${accentRgbaGlow} !important;
                    --nebula-1: ${pal.nebula1 || pal.accent} !important;
                    --nebula-2: ${pal.nebula2 || pal.accentHover || pal.accent} !important;
                    --nebula-3: ${pal.nebula3 || pal.accent} !important;
                }
                ${pal.bgDark ? `body.theme-dark { --bg-page: ${pal.bgDark} !important; }` : ''}
                ${pal.bgLight ? `body.theme-light { --bg-page: ${pal.bgLight} !important; }` : ''}
                .gradients-container .g1, .onboarding-aurora .g1 {
                    background: radial-gradient(circle at center, ${n1Rgba} 0, transparent 50%) no-repeat !important;
                }
                .gradients-container .g2, .onboarding-aurora .g2 {
                    background: radial-gradient(circle at center, ${n2Rgba} 0, transparent 50%) no-repeat !important;
                }
                .gradients-container .g3, .onboarding-aurora .g3,
                .gradients-container .g4, .onboarding-aurora .g4,
                .gradients-container .g5, .onboarding-aurora .g5 {
                    background: radial-gradient(circle at center, ${n3Rgba} 0, transparent 50%) no-repeat !important;
                }
            `;
        }

        // Update #settings-sidebar & #onboarding-container color-picker-grid for visitors
        const isEn = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en');
        document.querySelectorAll('.color-picker-grid').forEach(grid => {
            const settingGroup = grid.closest('.setting-group, .onboarding-step-color');
            if (!allowVisitor) {
                if (settingGroup) settingGroup.style.display = 'none';
                else grid.style.display = 'none';
                return;
            } else {
                if (settingGroup) settingGroup.style.display = '';
                grid.style.display = 'grid';
            }

            // Rebuild palette buttons if palette count or IDs changed
            const sig = palettes.map(p => `${p.id}:${p.name}:${p.accent}`).join('|') + `|lang:${isEn ? 'en' : 'pt'}`;
            if (grid.getAttribute('data-ovb-pal-sig') !== sig) {
                grid.setAttribute('data-ovb-pal-sig', sig);
                grid.innerHTML = '';
                palettes.forEach(p => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'color-option-btn' + (p.id === pal.id ? ' active' : '');
                    btn.setAttribute('data-color', p.id);
                    if (p.id === 'purple') btn.id = 'set-color-purple';
                    if (p.id === 'red') btn.id = 'set-color-red';
                    const label = isEn ? (p.nameEn || p.name) : p.name;
                    btn.innerHTML = `
                        <span class="color-dot" style="background:${p.accent};box-shadow:0 0 8px ${p.accent};"></span>
                        <span class="color-name">${label}</span>
                    `;
                    btn.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        window._ovbVisitorExplicitlyPickedColor = true;
                        setCookieVal('odyssee_user_palette', p.id);
                        try {
                            localStorage.setItem('userColor', p.id);
                        } catch (e) {}
                        applyColorPalettesEngine();
                    });
                    grid.appendChild(btn);
                });
            } else {
                grid.querySelectorAll('.color-option-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-color') === pal.id);
                });
            }
        });
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
        if (st.aspectRatio) rules.push(`aspect-ratio: ${st.aspectRatio}${imp}`);
        if (st.objectFit) rules.push(`object-fit: ${st.objectFit}${imp}`);
        if (st.transformOrigin) rules.push(`transform-origin: ${st.transformOrigin}${imp}`);

        // Independent Translate / Scale (Uniform + X/Y + Flip) / Rotate (Composes cleanly with existing animations and VanillaTilt!)
        const tx = st.translateX !== undefined && st.translateX !== '' ? st.translateX : '0px';
        const ty = st.translateY !== undefined && st.translateY !== '' ? st.translateY : '0px';
        if (tx !== '0px' || ty !== '0px') {
            const normTx = /^-?\d+(\.\d+)?$/.test(String(tx)) ? `${tx}px` : tx;
            const normTy = /^-?\d+(\.\d+)?$/.test(String(ty)) ? `${ty}px` : ty;
            rules.push(`translate: ${normTx} ${normTy}${imp}`);
        }

        const hasScale = (st.scale !== undefined && st.scale !== '') ||
                         (st.scaleX !== undefined && st.scaleX !== '') ||
                         (st.scaleY !== undefined && st.scaleY !== '') ||
                         st.flipX || st.flipY;
        if (hasScale) {
            const baseS = (st.scale !== undefined && st.scale !== '') ? parseFloat(st.scale) : 1;
            const rawSx = (st.scaleX !== undefined && st.scaleX !== '') ? parseFloat(st.scaleX) : baseS;
            const rawSy = (st.scaleY !== undefined && st.scaleY !== '') ? parseFloat(st.scaleY) : baseS;
            const sx = (isNaN(rawSx) ? 1 : rawSx) * (st.flipX ? -1 : 1);
            const sy = (isNaN(rawSy) ? 1 : rawSy) * (st.flipY ? -1 : 1);
            if (sx !== 1 || sy !== 1) {
                rules.push(`scale: ${sx} ${sy}${imp}`);
            }
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

        // 2. Per-Element Rules (Strictly isolated per device: Desktop >=1025px, Tablet 769px-1024px, Mobile <=768px, plus Global)
        const desktopRules = [];
        const tabletRules = [];
        const mobileRules = [];

        Object.entries(data.elements || {}).forEach(([selector, elConfig]) => {
            if (!elConfig || typeof elConfig !== 'object') return;
            const themeScope = elConfig.themeScope || 'all';
            const prefix = themeScope === 'dark' ? 'body.theme-dark ' : (themeScope === 'light' ? 'body.theme-light ' : '');
            const fullSel = prefix + selector;

            // Global rules (when user chooses "Global - Todos os Dispositivos")
            if (elConfig.styles && elConfig.styles.global) {
                const gCss = compileRuleDeclarations(elConfig.styles.global, false);
                if (gCss) cssParts.push(`${fullSel} { ${gCss}; }`);
            }

            // Desktop-only rules (>= 1025px)
            if (elConfig.styles && elConfig.styles.desktop) {
                const dCss = compileRuleDeclarations(elConfig.styles.desktop, false);
                if (dCss) desktopRules.push(`${fullSel} { ${dCss}; }`);
            }

            // Tablet-only rules (769px to 1024px)
            if (elConfig.styles && elConfig.styles.tablet) {
                const tCss = compileRuleDeclarations(elConfig.styles.tablet, false);
                if (tCss) tabletRules.push(`${fullSel} { ${tCss}; }`);
            }

            // Mobile-only rules (<= 768px)
            if (elConfig.styles && elConfig.styles.mobile) {
                const mCss = compileRuleDeclarations(elConfig.styles.mobile, false);
                if (mCss) mobileRules.push(`${fullSel} { ${mCss}; }`);
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

            if (elConfig.customCss && elConfig.customCss.trim()) {
                const parsedCustom = elConfig.customCss.replace(/\bselector\b/g, fullSel);
                cssParts.push(parsedCustom);
            }
        });

        if (desktopRules.length > 0) {
            cssParts.push(`@media (min-width: 1025px) {\n  ${desktopRules.join('\n  ')}\n}`);
        }
        if (tabletRules.length > 0) {
            cssParts.push(`@media (min-width: 769px) and (max-width: 1024px) {\n  ${tabletRules.join('\n  ')}\n}`);
        }
        if (mobileRules.length > 0) {
            cssParts.push(`@media (max-width: 768px) {\n  ${mobileRules.join('\n  ')}\n}`);
        }

        // Recolor dos estilos UI (Frutiger, GTK4, Material, etc.) sem perder o caráter do estilo
        if (window.ODYSSEE_VB_STYLE_COLORS && data.uiStyleColors) {
            try { cssParts.push(window.ODYSSEE_VB_STYLE_COLORS.compile(data.uiStyleColors)); } catch (e) {}
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
        loadUsedGoogleFonts(builderData);
    }

    const GOOGLE_FONTS = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato', 'Nunito', 'Raleway', 'Playfair Display', 'Merriweather', 'Lora', 'Oswald', 'Bebas Neue', 'Pacifico', 'Caveat', 'JetBrains Mono', 'Fira Code', 'Space Grotesk', 'DM Sans', 'Rubik'];

    /**
     * Carrega do Google Fonts apenas as famílias realmente usadas pelos elementos editados
     */
    function loadUsedGoogleFonts(data) {
        const used = new Set();
        Object.values((data && data.elements) || {}).forEach(el => {
            Object.values((el && el.styles) || {}).forEach(st => {
                if (!st || !st.fontFamily) return;
                GOOGLE_FONTS.forEach(name => {
                    if (String(st.fontFamily).indexOf(name) !== -1) used.add(name);
                });
            });
        });
        used.forEach(name => {
            const id = 'ovb-gf-' + name.replace(/\s+/g, '-').toLowerCase();
            if (document.getElementById(id)) return;
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(name).replace(/%20/g, '+') + ':ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap';
            document.head.appendChild(link);
        });
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
            case 'shape-square': {
                wrapper.className += ' ovb-shape-element ovb-shape-square';
                wrapper.innerHTML = c.html || (c.text ? `<span>${c.text}</span>` : '');
                break;
            }
            case 'shape-circle': {
                wrapper.className += ' ovb-shape-element ovb-shape-circle';
                wrapper.innerHTML = c.html || (c.text ? `<span>${c.text}</span>` : '');
                break;
            }
            case 'shape-bar': {
                wrapper.className += ' ovb-shape-element ovb-shape-bar';
                wrapper.innerHTML = c.html || (c.text ? `<span>${c.text}</span>` : '');
                break;
            }
            case 'shape-squircle': {
                wrapper.className += ' ovb-shape-element ovb-shape-squircle';
                wrapper.innerHTML = c.html || (c.text ? `<span>${c.text}</span>` : '');
                break;
            }
            case 'html': {
                const htmlBox = document.createElement('div');
                htmlBox.className = 'ovb-block-html';
                htmlBox.innerHTML = c.html || '<div style="padding:20px;text-align:center;">Bloco HTML / SVG Personalizado</div>';
                wrapper.appendChild(htmlBox);
                break;
            }
            default: {
                const catalog = window.ODYSSEE_VB_PRESETS_CATALOG || [];
                const presetDef = catalog.find(p => p.id === block.type);
                if (presetDef) {
                    const presetEl = document.createElement(presetDef.tag || 'div');
                    presetEl.className = `ovb-custom-block ovb-preset-block ${presetDef.className || ''}`.trim();
                    presetEl.setAttribute('data-ovb-block-id', block.id);
                    presetEl.setAttribute('data-ovb-preset-id', presetDef.id);
                    presetEl.id = block.id;
                    presetEl.innerHTML = (c && c.html) ? c.html : (presetDef.html || '');
                    const mergedCfg = Object.assign({}, presetDef.defaultConfig || {}, block.config || {});
                    if (window.odysseeVBApplyElementConfig) {
                        setTimeout(() => window.odysseeVBApplyElementConfig(presetEl, mergedCfg), 40);
                    }
                    return presetEl;
                } else if (block.type === 'user-component-preset' && c.html) {
                    wrapper.className = 'ovb-custom-block ovb-user-component-preset';
                    wrapper.innerHTML = c.html;
                    if (window.odysseeVBApplyElementConfig) {
                        setTimeout(() => window.odysseeVBApplyElementConfig(wrapper, block.config || {}), 40);
                    }
                }
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
     * Motor de Evasão Suave do Mouse (Repel Physics — igual aos cards da Home)
     */
    let evadeBound = false;
    function initEvadeMouseEngine() {
        if (evadeBound) return;
        evadeBound = true;
        document.addEventListener('mousemove', function (e) {
            const evaders = document.querySelectorAll('[data-ovb-evade-mouse="1"]');
            if (!evaders.length) return;
            const mx = e.clientX;
            const my = e.clientY;
            const RADIUS = 140;

            evaders.forEach(el => {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = mx - cx;
                const dy = my - cy;
                const dist = Math.hypot(dx, dy);

                if (dist < RADIUS && dist > 0) {
                    const force = (RADIUS - dist) / RADIUS;
                    const angle = Math.atan2(dy, dx);
                    const pushX = Math.round(-Math.cos(angle) * force * 52);
                    const pushY = Math.round(-Math.sin(angle) * force * 52);
                    el.style.transform = `translate3d(${pushX}px, ${pushY}px, 0)`;
                } else if (el.style.transform && el.style.transform.includes('translate3d')) {
                    el.style.transform = '';
                }
            });
        }, { passive: true });
    }

    /**
     * Modal Lightbox para Imagem Única e Galeria
     */
    function openLightbox(images, startIndex) {
        if (!Array.isArray(images) || !images.length) return;
        const validUrls = images.filter(u => typeof u === 'string' && u.trim().length > 0);
        if (!validUrls.length) return;

        let currentIndex = startIndex || 0;
        if (currentIndex >= validUrls.length) currentIndex = 0;

        let overlay = document.querySelector('.ovb-lightbox-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'ovb-lightbox-overlay';
            overlay.innerHTML = `
                <div class="ovb-lightbox-backdrop" style="position:absolute;inset:0;cursor:pointer;"></div>
                <div class="ovb-lightbox-container" style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;max-width:92vw;max-height:90vh;">
                    <button type="button" class="ovb-lightbox-close" title="Fechar (Esc)" style="position:absolute;top:-40px;right:0;background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:24px;width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">&times;</button>
                    <div style="display:flex;align-items:center;justify-content:center;gap:16px;">
                        <button type="button" class="ovb-lightbox-nav ovb-lb-prev" title="Anterior" style="background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:28px;width:44px;height:44px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">&#8249;</button>
                        <div class="ovb-lightbox-content" style="max-width:82vw;max-height:80vh;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.7);">
                            <img src="" alt="" class="ovb-lightbox-img" style="max-width:100%;max-height:80vh;object-fit:contain;border-radius:12px;display:block;">
                        </div>
                        <button type="button" class="ovb-lightbox-nav ovb-lb-next" title="Próxima" style="background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:28px;width:44px;height:44px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">&#8250;</button>
                    </div>
                    <div class="ovb-lightbox-counter" style="margin-top:12px;color:#cbd5e1;font-size:13px;font-weight:600;text-shadow:0 1px 3px #000;"></div>
                </div>
            `;
            document.body.appendChild(overlay);

            const closeBtn = overlay.querySelector('.ovb-lightbox-close');
            const backdrop = overlay.querySelector('.ovb-lightbox-backdrop');
            const prevBtn = overlay.querySelector('.ovb-lb-prev');
            const nextBtn = overlay.querySelector('.ovb-lb-next');

            const closeLb = () => {
                overlay.classList.remove('is-open');
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
                setTimeout(() => { overlay.style.display = 'none'; }, 260);
            };

            closeBtn.addEventListener('click', closeLb);
            backdrop.addEventListener('click', closeLb);

            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (validUrls.length <= 1) return;
                currentIndex = (currentIndex - 1 + validUrls.length) % validUrls.length;
                updateLb();
            });

            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (validUrls.length <= 1) return;
                currentIndex = (currentIndex + 1) % validUrls.length;
                updateLb();
            });

            document.addEventListener('keydown', (e) => {
                if (!overlay.classList.contains('is-open')) return;
                if (e.key === 'Escape') closeLb();
                if (e.key === 'ArrowLeft' && validUrls.length > 1) {
                    currentIndex = (currentIndex - 1 + validUrls.length) % validUrls.length;
                    updateLb();
                }
                if (e.key === 'ArrowRight' && validUrls.length > 1) {
                    currentIndex = (currentIndex + 1) % validUrls.length;
                    updateLb();
                }
            });
        }

        function updateLb() {
            const img = overlay.querySelector('.ovb-lightbox-img');
            const counter = overlay.querySelector('.ovb-lightbox-counter');
            const prevBtn = overlay.querySelector('.ovb-lb-prev');
            const nextBtn = overlay.querySelector('.ovb-lb-next');

            img.src = validUrls[currentIndex];
            if (validUrls.length > 1) {
                counter.textContent = `${currentIndex + 1} / ${validUrls.length}`;
                counter.style.display = 'block';
                prevBtn.style.display = 'flex';
                nextBtn.style.display = 'flex';
            } else {
                counter.style.display = 'none';
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
            }
        }

        updateLb();
        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            overlay.classList.add('is-open');
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
        });
    }

    /**
     * Applies DOM-level features: Global UI Design System, Icon Pack, Color Palettes, Blank Canvas Mode, text overrides (PT/EN), image src (Dark/Light), HTML attributes, Interactive Element Role (button/link/none), overlay layers, entrance animations, hover presets, 3D tilt, and Special Configs
     */
    function applyDOMFeatures() {
        if (isApplyingDOM) return;
        isApplyingDOM = true;

        try {
            initEvadeMouseEngine();
            // Apply Global UI Design System & Icon Pack to <body> and <html>
            const activeUiStyle = builderData.uiStyle || 'odysseexp';
            const activeIconPack = builderData.iconPack || 'default';
            if (document.body.getAttribute('data-ovb-ui-style') !== activeUiStyle) {
                document.body.setAttribute('data-ovb-ui-style', activeUiStyle);
                document.documentElement.setAttribute('data-ovb-ui-style', activeUiStyle);
            }
            if (document.body.getAttribute('data-ovb-icon-pack') !== activeIconPack) {
                document.body.setAttribute('data-ovb-icon-pack', activeIconPack);
            }
            document.body.classList.toggle('ovb-blank-canvas', !!builderData.blankMode);

            // Apply Custom Color Palettes Engine (Global, Per-Page, and Visitor Cookie/Session)
            applyColorPalettesEngine();

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
                    // 0. Special Interactive Configs (Carousel #5, Floating Cards #6, Gradient Bridge #8)
                    if (elConfig.specialConfig && typeof elConfig.specialConfig === 'object' && window.odysseeVBApplyElementConfig) {
                        const serializedCfg = JSON.stringify(elConfig.specialConfig);
                        if (el._ovbLastSpecialConfig !== serializedCfg) {
                            el._ovbLastSpecialConfig = serializedCfg;
                            window.odysseeVBApplyElementConfig(el, elConfig.specialConfig);
                        }
                    }

                    // 0b. Layer Lock status (Photoshop/Illustrator layer lock)
                    if (elConfig.locked) {
                        el.setAttribute('data-ovb-locked', 'true');
                    } else if (el.hasAttribute('data-ovb-locked')) {
                        el.removeAttribute('data-ovb-locked');
                    }

                    // 1. Content & Native Attributes Overrides
                    if (elConfig.content) {
                        const c = elConfig.content;

                        // Direct Raw HTML / SVG Override (from Code Editor "Código HTML / SVG do Elemento")
                        if (c.innerHTML !== undefined && c.innerHTML !== '') {
                            const rawCode = String(c.innerHTML).trim();
                            if (el._ovbLastAppliedRawCode !== rawCode) {
                                el._ovbLastAppliedRawCode = rawCode;

                                if (el.tagName === 'IMG') {
                                    if (el._ovbOrigSrc === undefined) {
                                        el._ovbOrigSrc = el.getAttribute('src') || '';
                                    }
                                    if (/^<svg[\s>]/i.test(rawCode) || rawCode.includes('<svg')) {
                                        let svgMarkup = rawCode;
                                        if (!svgMarkup.includes('xmlns=')) {
                                            svgMarkup = svgMarkup.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
                                        }
                                        const svgDataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup);
                                        el.setAttribute('src', svgDataUri);
                                    } else if (/^<img[\s>]/i.test(rawCode)) {
                                        const tmpDiv = document.createElement('div');
                                        tmpDiv.innerHTML = rawCode;
                                        const parsedImg = tmpDiv.querySelector('img');
                                        if (parsedImg && parsedImg.getAttribute('src')) {
                                            el.setAttribute('src', parsedImg.getAttribute('src'));
                                        }
                                    }
                                } else if (el instanceof SVGElement) {
                                    const isRootSvg = el.tagName.toLowerCase() === 'svg';
                                    if (el._ovbOrigHtml === undefined) {
                                        el._ovbOrigHtml = el.innerHTML;
                                        el._ovbOrigSvgAttrs = {};
                                        Array.from(el.attributes).forEach(a => {
                                            if (!a.name.startsWith('data-ovb-')) el._ovbOrigSvgAttrs[a.name] = a.value;
                                        });
                                    }

                                    if (isRootSvg) {
                                        if (/^<svg[\s>]/i.test(rawCode)) {
                                            const tmpDiv = document.createElement('div');
                                            tmpDiv.innerHTML = rawCode;
                                            const parsedSvg = tmpDiv.querySelector('svg');
                                            if (parsedSvg) {
                                                Array.from(parsedSvg.attributes).forEach(a => {
                                                    if (a.name !== 'id' && !a.name.startsWith('data-ovb-')) {
                                                        try { el.setAttribute(a.name, a.value); } catch (e) {}
                                                    }
                                                });
                                                el.innerHTML = parsedSvg.innerHTML;
                                            }
                                        } else {
                                            el.innerHTML = rawCode;
                                        }
                                    } else {
                                        // Child SVG element (<path>, <g>, <rect>, <circle>, <polygon>, etc.)
                                        if (/^<svg[\s>]/i.test(rawCode) && el.ownerSVGElement) {
                                            const rootSvg = el.ownerSVGElement;
                                            if (rootSvg._ovbOrigHtml === undefined) {
                                                rootSvg._ovbOrigHtml = rootSvg.innerHTML;
                                            }
                                            const tmpDiv = document.createElement('div');
                                            tmpDiv.innerHTML = rawCode;
                                            const parsedSvg = tmpDiv.querySelector('svg');
                                            if (parsedSvg) {
                                                Array.from(parsedSvg.attributes).forEach(a => {
                                                    if (a.name !== 'id' && !a.name.startsWith('data-ovb-')) {
                                                        try { rootSvg.setAttribute(a.name, a.value); } catch (e) {}
                                                    }
                                                });
                                                rootSvg.innerHTML = parsedSvg.innerHTML;
                                            }
                                        } else {
                                            const tmpSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                            tmpSvg.innerHTML = rawCode;
                                            const firstChild = tmpSvg.firstElementChild;
                                            if (firstChild && firstChild.tagName.toLowerCase() === el.tagName.toLowerCase()) {
                                                Array.from(firstChild.attributes).forEach(a => {
                                                    if (a.name !== 'id' && !a.name.startsWith('data-ovb-')) {
                                                        try { el.setAttribute(a.name, a.value); } catch (e) {}
                                                    }
                                                });
                                                el.innerHTML = firstChild.innerHTML;
                                            } else {
                                                el.innerHTML = rawCode;
                                            }
                                        }
                                    }
                                } else {
                                    // Regular HTML element (<div>, <button>, <a>, <span>, custom block)
                                    if (el._ovbOrigHtml === undefined) {
                                        const cleanClone = el.cloneNode(true);
                                        cleanClone.querySelectorAll('.ovb-layer-overlay').forEach(o => o.remove());
                                        el._ovbOrigHtml = cleanClone.innerHTML;
                                    }
                                    el.innerHTML = rawCode;
                                    // Ensure any inline <svg> pasted inside an HTML element is visible and responsive
                                    el.querySelectorAll('svg').forEach(svgNode => {
                                        if (!svgNode.getAttribute('width') && !svgNode.style.width) {
                                            svgNode.style.maxWidth = '100%';
                                            svgNode.style.height = 'auto';
                                            svgNode.style.display = 'inline-block';
                                        }
                                    });
                                }
                            }
                        } else if (el._ovbLastAppliedRawCode !== undefined) {
                            delete el._ovbLastAppliedRawCode;
                            if (el.tagName === 'IMG' && el._ovbOrigSrc !== undefined) {
                                el.setAttribute('src', el._ovbOrigSrc);
                                delete el._ovbOrigSrc;
                            } else if (el._ovbOrigHtml !== undefined) {
                                el.innerHTML = el._ovbOrigHtml;
                                if (el._ovbOrigSvgAttrs) {
                                    Object.entries(el._ovbOrigSvgAttrs).forEach(([k, v]) => {
                                        try { el.setAttribute(k, v); } catch (e) {}
                                    });
                                    delete el._ovbOrigSvgAttrs;
                                }
                                delete el._ovbOrigHtml;
                            }
                        }

                        const activeText = (curLang === 'en' && c.textEn) ? c.textEn : c.text;

                        if (activeText !== undefined && activeText !== '' && !c.innerHTML) {
                            if (!el.hasAttribute('data-ovb-orig-text')) {
                                el.setAttribute('data-ovb-orig-text', el.textContent);
                            }
                            if (el.children.length === 0 || el.tagName === 'TEXT' || el.tagName === 'TSPAN') {
                                if (el.textContent !== activeText) {
                                    el.textContent = activeText;
                                }
                            } else {
                                const textSpan = el.querySelector('span[data-key], span');
                                if (textSpan && textSpan.textContent !== activeText) {
                                    textSpan.textContent = activeText;
                                }
                            }
                        } else if (el.hasAttribute('data-ovb-orig-text') && !c.innerHTML) {
                            if (el.children.length === 0) {
                                el.textContent = el.getAttribute('data-ovb-orig-text');
                            }
                            el.removeAttribute('data-ovb-orig-text');
                        }

                        // Image Src (supports general src, srcDark, srcLight) when not overridden by raw SVG innerHTML
                        if (el.tagName === 'IMG' && !c.innerHTML) {
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

                    // 1b. Per-Element Individual UI Design System Override ([data-ovb-el-ui-style])
                    // Supports 'none' ("Tema Não Aplicável / Imune") as well as specific UI themes!
                    if (elConfig.elUiStyle && elConfig.elUiStyle !== 'inherit') {
                        el.setAttribute('data-ovb-el-ui-style', elConfig.elUiStyle);
                    } else if (el.hasAttribute('data-ovb-el-ui-style')) {
                        el.removeAttribute('data-ovb-el-ui-style');
                    }

                    // 1c. Standalone Element Interactive Role (Button, Hyperlink, Page Direct, Lightbox, or No User Interaction)
                    const st = Object.assign(
                        {},
                        (elConfig.styles && elConfig.styles.global) || {},
                        (elConfig.styles && elConfig.styles.desktop) || {}
                    );
                    const effectiveRole = elConfig.elementRole || st.elementRole;

                    if (effectiveRole) {
                        el.setAttribute('data-ovb-role', effectiveRole);
                        if (effectiveRole === 'none' && (elConfig.passEvents || st.passEvents)) {
                            el.setAttribute('data-ovb-pass-events', 'true');
                        } else {
                            el.removeAttribute('data-ovb-pass-events');
                        }
                        el._ovbRoleType = effectiveRole;
                        el._ovbRoleUrl = elConfig.roleUrl || st.roleUrl || (elConfig.content && elConfig.content.href) || '';
                        el._ovbRoleNewTab = !!(elConfig.roleNewTab || st.roleNewTab);
                        el._ovbRolePage = elConfig.roleSitePage || st.roleSitePage || '/';
                        el._ovbLightboxImages = elConfig.lightboxImages || st.lightboxImages || '';

                        if (['button', 'link', 'page', 'lightbox-image', 'lightbox-gallery', 'scroll'].includes(effectiveRole) && !el._ovbRoleBound) {
                            el._ovbRoleBound = true;
                            el.addEventListener('click', function (ev) {
                                if (config.isPreview && !isInteractiveMode) return;
                                const rType = el._ovbRoleType;
                                if (!rType || rType === 'none') return;
                                ev.preventDefault();

                                if (rType === 'page') {
                                    window.location.href = el._ovbRolePage || '/';
                                } else if (rType === 'lightbox-image') {
                                    const src = el._ovbRoleUrl || el.getAttribute('src') || el.getAttribute('href') || (el.querySelector('img') && el.querySelector('img').src) || '';
                                    if (src) openLightbox([src], 0);
                                } else if (rType === 'lightbox-gallery') {
                                    const raw = el._ovbLightboxImages || el._ovbRoleUrl || '';
                                    const list = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                                    if (!list.length && el.getAttribute('src')) list.push(el.getAttribute('src'));
                                    if (list.length) openLightbox(list, 0);
                                } else if (rType === 'scroll' || (el._ovbRoleUrl && el._ovbRoleUrl.startsWith('#'))) {
                                    const targetSec = document.querySelector(el._ovbRoleUrl);
                                    if (targetSec) targetSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                } else if (el._ovbRoleNewTab) {
                                    window.open(el._ovbRoleUrl, '_blank', 'noopener,noreferrer');
                                } else if (el._ovbRoleUrl) {
                                    window.location.href = el._ovbRoleUrl;
                                }
                            });
                        }
                    } else if (el.hasAttribute('data-ovb-role')) {
                        el.removeAttribute('data-ovb-role');
                        el.removeAttribute('data-ovb-pass-events');
                    }

                    // 1d. Cross-Element Triggers (Disparar exibição ou animação em outro elemento)
                    const clickTargetSel = elConfig.clickTargetSelector || st.clickTargetSelector;
                    const clickTargetAct = elConfig.clickTargetAction || st.clickTargetAction;
                    if (clickTargetSel && clickTargetAct && !el._ovbCrossClickBound) {
                        el._ovbCrossClickBound = true;
                        el.addEventListener('click', function (ev) {
                            if (config.isPreview && !isInteractiveMode) return;
                            try {
                                const targets = document.querySelectorAll(clickTargetSel);
                                targets.forEach(tgt => {
                                    if (clickTargetAct === 'toggle-show') {
                                        const isHidden = (tgt.style.display === 'none' || window.getComputedStyle(tgt).display === 'none');
                                        tgt.style.display = isHidden ? '' : 'none';
                                    } else if (clickTargetAct === 'show') {
                                        tgt.style.display = '';
                                    } else if (clickTargetAct === 'hide') {
                                        tgt.style.display = 'none';
                                    } else if (clickTargetAct === 'trigger-anim') {
                                        tgt.classList.remove('ovb-click-pop', 'ovb-hover-jelly', 'ovb-hover-soft-hop');
                                        void tgt.offsetWidth;
                                        tgt.classList.add('ovb-click-pop');
                                    }
                                });
                            } catch (e) {}
                        });
                    }

                    const hoverTargetSel = elConfig.hoverTargetSelector || st.hoverTargetSelector;
                    const hoverTargetAct = elConfig.hoverTargetAction || st.hoverTargetAction;
                    if (hoverTargetSel && hoverTargetAct && !el._ovbCrossHoverBound) {
                        el._ovbCrossHoverBound = true;
                        el.addEventListener('mouseenter', function () {
                            try {
                                const targets = document.querySelectorAll(hoverTargetSel);
                                targets.forEach(tgt => {
                                    if (hoverTargetAct === 'show-while-hover') {
                                        tgt.style.display = '';
                                    } else if (hoverTargetAct === 'toggle-show') {
                                        const isHidden = (tgt.style.display === 'none' || window.getComputedStyle(tgt).display === 'none');
                                        tgt.style.display = isHidden ? '' : 'none';
                                    } else if (hoverTargetAct === 'trigger-anim') {
                                        tgt.classList.remove('ovb-click-pop', 'ovb-hover-jelly');
                                        void tgt.offsetWidth;
                                        tgt.classList.add('ovb-hover-jelly');
                                    }
                                });
                            } catch (e) {}
                        });
                        el.addEventListener('mouseleave', function () {
                            try {
                                if (hoverTargetAct === 'show-while-hover') {
                                    const targets = document.querySelectorAll(hoverTargetSel);
                                    targets.forEach(tgt => { tgt.style.display = 'none'; });
                                }
                            } catch (e) {}
                        });
                    }

                    // 2. Hover Animation Preset Class & Evade Mouse Physics
                    const hoverClasses = [
                        'ovb-hover-lift', 'ovb-hover-grow', 'ovb-hover-shrink', 'ovb-hover-tilt', 'ovb-hover-glow-boost',
                        'ovb-hover-scale-up', 'ovb-hover-scale-down', 'ovb-hover-soft-hop', 'ovb-hover-spin',
                        'ovb-hover-slide-side', 'ovb-hover-slide-up', 'ovb-hover-slide-corner', 'ovb-hover-jelly'
                    ];
                    hoverClasses.forEach(cls => el.classList.remove(cls));
                    el.removeAttribute('data-ovb-evade-mouse');

                    const isHoverEnabled = !!(elConfig.enableHoverAnim !== undefined ? elConfig.enableHoverAnim : st.enableHoverAnim);
                    const hoverPreset = st.hoverAnimPreset || st.hoverPreset;
                    if (isHoverEnabled && hoverPreset && hoverPreset !== 'none') {
                        if (hoverPreset === 'evade-mouse') {
                            el.setAttribute('data-ovb-evade-mouse', '1');
                        } else {
                            el.classList.add(hoverPreset.startsWith('ovb-hover-') ? hoverPreset : `ovb-hover-${hoverPreset}`);
                        }
                    }

                    // 2b. Click or Touch Animation
                    const isClickEnabled = !!(elConfig.enableClickAnim !== undefined ? elConfig.enableClickAnim : st.enableClickAnim);
                    const clickPreset = st.clickAnimPreset;
                    if (isClickEnabled && clickPreset && clickPreset !== 'none' && !el._ovbClickAnimBound) {
                        el._ovbClickAnimBound = true;
                        el.addEventListener('click', function () {
                            const animClass = (clickPreset === 'jelly') ? 'ovb-hover-jelly'
                                : (clickPreset === 'soft-hop') ? 'ovb-hover-soft-hop'
                                : (clickPreset === 'spin') ? 'ovb-hover-spin'
                                : (clickPreset === 'scale-down') ? 'ovb-click-pop'
                                : 'ovb-click-pop';
                            el.classList.remove(animClass);
                            void el.offsetWidth;
                            el.classList.add(animClass);
                            const onEnd = () => {
                                el.classList.remove(animClass);
                                el.removeEventListener('animationend', onEnd);
                            };
                            el.addEventListener('animationend', onEnd);
                        });
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

        // Build clean editable HTML or SVG source code for the Code Editor
        let editableHtml = '';
        let parentSvgSelector = '';
        try {
            const cleanClone = el.cloneNode(true);
            const stripOvbAttrs = (node) => {
                if (!node || !node.attributes) return;
                Array.from(node.attributes).forEach(attr => {
                    if (attr.name.startsWith('data-ovb-')) {
                        node.removeAttribute(attr.name);
                    }
                });
                Array.from(node.children || []).forEach(child => {
                    if (child.classList && child.classList.contains('ovb-layer-overlay')) {
                        child.remove();
                    } else {
                        stripOvbAttrs(child);
                    }
                });
            };
            stripOvbAttrs(cleanClone);

            if (el instanceof SVGElement) {
                editableHtml = cleanClone.outerHTML || el.outerHTML || '';
                if (el.tagName.toLowerCase() !== 'svg' && el.ownerSVGElement) {
                    parentSvgSelector = buildUniqueSelector(el.ownerSVGElement) || '';
                }
            } else if (el.tagName === 'IMG') {
                const imgSrc = el.getAttribute('src') || '';
                if (imgSrc.startsWith('data:image/svg+xml')) {
                    const commaIdx = imgSrc.indexOf(',');
                    if (commaIdx !== -1) {
                        const rawPayload = imgSrc.substring(commaIdx + 1);
                        editableHtml = imgSrc.includes(';base64,') ? atob(rawPayload) : decodeURIComponent(rawPayload);
                    }
                } else {
                    editableHtml = cleanClone.outerHTML || `<img src="${imgSrc}" alt="${el.getAttribute('alt') || ''}">`;
                }
            } else {
                editableHtml = cleanClone.innerHTML || '';
            }
        } catch (e) {
            editableHtml = el.innerHTML || '';
        }

        return {
            tagName: el.tagName.toLowerCase(),
            isSvg: el instanceof SVGElement,
            parentSvgSelector: parentSvgSelector,
            label: getElementLabel(el),
            innerHTML: editableHtml,
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
                backgroundImage: cs.backgroundImage !== 'none' ? cs.backgroundImage : '',
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
     * Generates a rich Photoshop / Illustrator visual thumbnail descriptor for any DOM element
     */
    function getLayerVisualPreview(el) {
        const cs = window.getComputedStyle(el);
        const tag = el.tagName.toUpperCase();

        // 1. Direct <img>
        if (tag === 'IMG' && el.getAttribute('src')) {
            return {
                thumbType: 'image',
                thumbSrc: el.getAttribute('src'),
                thumbBg: '#0f172a'
            };
        }

        // 2. SVG or SVG sub-layer (<g>, <path>, <text>)
        if (el instanceof SVGElement) {
            // Check if SVG group contains an embedded <image href="..."> (like in #dg-animated-banner!)
            const svgImg = el.tagName.toLowerCase() === 'image' ? el : (el.querySelector && el.querySelector('image'));
            if (svgImg) {
                const href = svgImg.getAttribute('href') || svgImg.getAttribute('xlink:href');
                if (href) {
                    return {
                        thumbType: 'image',
                        thumbSrc: href,
                        thumbBg: '#0f172a'
                    };
                }
            }
            if (el.tagName.toLowerCase() === 'text' || el.tagName.toLowerCase() === 'tspan') {
                return {
                    thumbType: 'text',
                    thumbText: (el.textContent || ' SVG ').trim().slice(0, 8),
                    thumbColor: cs.fill && cs.fill !== 'none' ? cs.fill : '#ffffff',
                    thumbBg: '#1e1b4b'
                };
            }
            // Serialize inline SVG vector preview (e.g., #header-logotype, .hero-symbol, .onboarding-logo)
            if (el.tagName.toLowerCase() === 'svg') {
                try {
                    const clone = el.cloneNode(true);
                    clone.removeAttribute('id');
                    clone.setAttribute('width', '38');
                    clone.setAttribute('height', '26');
                    if (!clone.getAttribute('viewBox')) {
                        clone.setAttribute('viewBox', '0 0 100 100');
                    }
                    // Ensure visible fill in thumbnail
                    clone.style.fill = cs.fill && cs.fill !== 'none' && cs.fill !== 'rgb(0, 0, 0)' ? cs.fill : '#a855f7';
                    clone.style.color = '#ffffff';
                    const svgRaw = new XMLSerializer().serializeToString(clone);
                    if (svgRaw.length < 18000) {
                        return {
                            thumbType: 'svg',
                            thumbSrc: 'data:image/svg+xml;utf8,' + encodeURIComponent(svgRaw),
                            thumbBg: '#0f172a'
                        };
                    }
                } catch (e) {}
            }
            return {
                thumbType: 'text',
                thumbText: 'SVG',
                thumbColor: '#38bdf8',
                thumbBg: '#0f172a'
            };
        }

        // 3. Element containing a direct visual <img> (e.g. .logo-link, .category-banner-wrapper, .ovb-block-image-wrap)
        const childImg = el.querySelector && el.querySelector(':scope > img, :scope > .card-image-wrapper > img');
        if (childImg && childImg.getAttribute('src')) {
            return {
                thumbType: 'image',
                thumbSrc: childImg.getAttribute('src'),
                thumbBg: '#0f172a'
            };
        }

        // 4. Element containing a direct <svg> logo/icon
        const childSvg = el.querySelector && el.querySelector(':scope > svg');
        if (childSvg && el.children.length === 1) {
            return getLayerVisualPreview(childSvg);
        }

        // 5. Text / Heading / Button / Link with text
        const bgImg = cs.backgroundImage && cs.backgroundImage !== 'none' ? cs.backgroundImage : '';
        const bgCol = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent' ? cs.backgroundColor : '';
        const effectiveBg = bgImg || bgCol || 'rgba(30, 41, 59, 0.85)';

        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'A', 'BUTTON', 'SPAN'].includes(tag)) {
            const rawTxt = (el.textContent || '').replace(/\s+/g, ' ').trim();
            return {
                thumbType: 'text',
                thumbText: rawTxt ? rawTxt.slice(0, 9) : tag,
                thumbColor: cs.color || '#ffffff',
                thumbBg: effectiveBg,
                thumbRadius: cs.borderRadius || '4px'
            };
        }

        // 6. Shapes, Nebulas (.g1..g5), Cards, Sections
        return {
            thumbType: 'box',
            thumbBg: effectiveBg,
            thumbBorder: cs.borderTopColor && cs.borderTopStyle !== 'none' ? cs.borderTopColor : 'rgba(139, 92, 246, 0.45)',
            thumbRadius: cs.borderRadius || '6px',
            thumbText: el.classList.contains('ovb-shape-circle') ? '●' : (el.classList.contains('ovb-shape-square') ? '■' : '')
        };
    }

    /**
     * Collects a complete, categorized Scene Graph of ALL base elements on the current page
     * with Photoshop / Illustrator Layer Thumbnails, Z-Index, Eye (Visibility) & Lock state!
     */
    function collectPageTree() {
        const groups = [];
        let domOrderCounter = 1;

        function makeNode(el, customLabel, parentName) {
            if (!el || el.nodeType !== 1) return null;
            const sel = generateSelector(el);
            if (!sel) return null;
            const cs = window.getComputedStyle(el);
            const rec = builderData.elements[sel] || {};
            const st = Object.assign({}, (rec.styles && rec.styles.global) || {}, (rec.styles && rec.styles.desktop) || {});
            const preview = getLayerVisualPreview(el);
            const zVal = st.zIndex !== undefined && st.zIndex !== '' ? st.zIndex : (cs.zIndex !== 'auto' ? cs.zIndex : '');

            return {
                selector: sel,
                label: customLabel || getElementLabel(el),
                parentLabel: parentName || '',
                tagName: el.tagName.toUpperCase(),
                hasCustom: !!builderData.elements[sel],
                isBlock: el.hasAttribute('data-ovb-block-id') || el.hasAttribute('data-ovb-clone-id'),
                hidden: !!(st.hidden || cs.display === 'none'),
                locked: !!rec.locked,
                elUiStyle: rec.elUiStyle || '',
                zIndex: zVal,
                stackOrder: domOrderCounter++,
                thumbType: preview.thumbType,
                thumbSrc: preview.thumbSrc || '',
                thumbBg: preview.thumbBg || '#1e293b',
                thumbBorder: preview.thumbBorder || '',
                thumbRadius: preview.thumbRadius || '4px',
                thumbText: preview.thumbText || '',
                thumbColor: preview.thumbColor || '#ffffff'
            };
        }

        // 1. Cabeçalho & Navegação
        const headerEl = document.querySelector('header.main-header');
        if (headerEl) {
            const hChildren = [];
            headerEl.querySelectorAll('#header-logotype, .logo-link, .main-nav, .main-nav a, .header-mobile-buttons a, #btn-faq, #btn-settings, #btn-mobile-menu').forEach(el => {
                const n = makeNode(el, null, 'Cabeçalho');
                if (n) hChildren.push(n);
            });
            const sidebarEl = document.getElementById('settings-sidebar');
            if (sidebarEl) hChildren.push(makeNode(sidebarEl, 'ASIDE #settings-sidebar (Gaveta Config)', 'Cabeçalho'));
            const hGroup = makeNode(headerEl, '🧭 Camada: Cabeçalho & Menu Principal');
            if (hGroup) {
                hGroup.children = hChildren;
                groups.push(hGroup);
            }
        }

        // 2. Tela de Onboarding & Aurora
        const onbEl = document.getElementById('onboarding-container');
        if (onbEl) {
            const onbChildren = [];
            document.querySelectorAll('.onboarding-aurora, .onboarding-aurora .g1, .onboarding-aurora .g2, .onboarding-aurora .g3, .onboarding-aurora .g4, .onboarding-aurora .g5').forEach(el => {
                const n = makeNode(el, null, 'Onboarding');
                if (n) onbChildren.push(n);
            });
            onbEl.querySelectorAll('.onboarding-logo, .onboarding-subtitle, #step-language, #lang-pt, #lang-en, #step-theme, #btn-light, #btn-dark, .color-option-btn, #btn-continuar').forEach(el => {
                const n = makeNode(el, null, 'Onboarding');
                if (n) onbChildren.push(n);
            });
            const onbGroup = makeNode(onbEl, '🚪 Camada: Tela de Onboarding & Aurora');
            if (onbGroup) {
                onbGroup.children = onbChildren;
                groups.push(onbGroup);
            }
        }

        // 3. Nebulosas & Fundo Imersivo (Home)
        const gradContainer = document.querySelector('.immersive-wrapper > .gradients-container');
        if (gradContainer) {
            const gChildren = [];
            gradContainer.querySelectorAll('.g1, .g2, .g3, .g4, .g5').forEach((el, idx) => {
                const n = makeNode(el, `Nebulosa .g${idx + 1}`, 'Nebulosas');
                if (n) gChildren.push(n);
            });
            const fadeBot = document.querySelector('.gradient-fade-bottom');
            if (fadeBot) gChildren.push(makeNode(fadeBot, 'Fade Inferior (.gradient-fade-bottom)', 'Nebulosas'));
            const gGroup = makeNode(gradContainer, '🌌 Camada: Nebulosas de Fundo (.gradients-container)');
            if (gGroup) {
                gGroup.children = gChildren;
                groups.push(gGroup);
            }
        }

        // 4. Todas as Seções da Página (<section>)
        document.querySelectorAll('section').forEach(sec => {
            const secLabel = `📦 Camada Seção: ${getElementLabel(sec)}`;
            const secChildren = [];

            sec.querySelectorAll(
                '#artcraft-orbit-container, .hero-content-centered, .hero-logo-container, .hero-symbol, .hero-slogan, .scroll-indicator, ' +
                'h1, h2, h3, h4, p, .category-banner-wrapper, img.category-banner, svg#dg-animated-banner, ' +
                'svg#dg-animated-banner g.dg-item[id], svg#dg-animated-banner text.dg-item, ' +
                '.portfolio-showcase, .carousel-wrapper, .category-buttons, .category-image-placeholder, .category-posts-link, ' +
                '.services-grid, .service-card, .package-card, .btn-primary, button, a.btn, .ovb-custom-block'
            ).forEach(child => {
                if (child.closest('#ovb-Floating-Badge, #ovb-Hover-Badge, #ovb-Selection-Box')) return;
                let customName = null;
                if (child.matches && child.matches('.hero-slogan')) {
                    customName = `🔤 Título Principal Abaixo da Logo (.hero-slogan)`;
                } else if (child.matches && child.matches('.hero-symbol')) {
                    customName = `🎨 Logo Símbolo Central (.hero-symbol)`;
                } else if (child.matches && child.matches('svg#dg-animated-banner g.dg-item[id]')) {
                    customName = `🎨 Ícone SVG: ${child.id.replace('.png', '')}`;
                } else if (child.matches && child.matches('svg#dg-animated-banner text.dg-item')) {
                    customName = `🔤 Texto SVG: ${child.textContent.trim()}`;
                }
                const n = makeNode(child, customName, getElementLabel(sec));
                if (n) secChildren.push(n);
            });

            const secGroup = makeNode(sec, secLabel);
            if (secGroup) {
                secGroup.children = secChildren;
                groups.push(secGroup);
            }
        });

        // 5. Páginas sem <section> ou elementos de Currículo/FAQ/Blog + Blocos Customizados na Raiz
        document.querySelectorAll('.cv-container, .faq-container, .posts-page-container, article, footer.site-footer').forEach(box => {
            const bChildren = [];
            box.querySelectorAll('h1, h2, h3, h4, p, img, button, a, .faq-item, .cv-card, .cv-section, .ovb-custom-block').forEach(ch => {
                const n = makeNode(ch, null, getElementLabel(box));
                if (n) bChildren.push(n);
            });
            const bGroup = makeNode(box, `📄 Camada: ${getElementLabel(box)}`);
            if (bGroup) {
                bGroup.children = bChildren.slice(0, 50);
                groups.push(bGroup);
            }
        });

        return groups;
    }

    /**
     * Initializes the Interactive Canvas Manipulation Engine (Figma/Illustrator style Drag, 8 Resize Handles, Corner Radius Handle, Aspect Lock, Adaptive Illustrator Shortcuts)
     */
    function initPreviewInspector() {
        document.body.classList.add('ovb-editor-active');
        let lockAspectRatio = true; // Constrain proportions by default so elements don't stretch accidentally!
        let spotlightElement = null;

        try {
            localStorage.setItem('onboardingFeito', 'sim');
        } catch (e) {}
        document.body.classList.remove('modo-onboarding');

        // 1. Hover Badge
        const hoverBadge = document.createElement('div');
        hoverBadge.id = 'ovb-Hover-Badge';
        document.body.appendChild(hoverBadge);

        // 2. Selection Frame with 8 Resize Handles + 1 Figma Corner Radius Handle
        const selBox = document.createElement('div');
        selBox.id = 'ovb-Selection-Box';
        selBox.innerHTML = `
            <div class="ovb-resize-handle ovb-rh-nw" data-rh="nw" title="Redimensionar Tamanho Proporcional (Escala)"></div>
            <div class="ovb-resize-handle ovb-rh-n"  data-rh="n"  title="Redimensionar Altura"></div>
            <div class="ovb-resize-handle ovb-rh-ne" data-rh="ne" title="Redimensionar Tamanho Proporcional (Escala)"></div>
            <div class="ovb-resize-handle ovb-rh-e"  data-rh="e"  title="Redimensionar Largura"></div>
            <div class="ovb-resize-handle ovb-rh-se" data-rh="se" title="Redimensionar Tamanho Proporcional (Escala)"></div>
            <div class="ovb-resize-handle ovb-rh-s"  data-rh="s"  title="Redimensionar Altura"></div>
            <div class="ovb-resize-handle ovb-rh-sw" data-rh="sw" title="Redimensionar Tamanho Proporcional (Escala)"></div>
            <div class="ovb-resize-handle ovb-rh-w"  data-rh="w"  title="Redimensionar Largura"></div>
            <div class="ovb-radius-handle" title="Arraste para arredondar os cantos do elemento"></div>
        `;
        document.body.appendChild(selBox);

        // 3. Floating Action Toolbar on Selected Element
        let badgePlacePreference = 'auto'; // 'auto' | 'bottom' | 'top' | 'dock-bottom'
        const floatBadge = document.createElement('div');
        floatBadge.id = 'ovb-Floating-Badge';
        floatBadge.innerHTML = `
            <span class="ovb-badge-drag-handle" title="Arraste aqui (ou arraste o próprio elemento) para mover livremente em X/Y">
                <i class="fas fa-arrows-alt"></i> <span class="ovb-badge-title">Elemento</span>
            </span>
            <button type="button" class="ovb-badge-btn" data-act="toggle-lock" title="Travar/Destravar Proporção ao Redimensionar"><i class="fas fa-lock"></i> Proporção</button>
            <button type="button" class="ovb-badge-btn" data-act="unstretch" title="Desfazer Esticamento / Restaurar Proporção Original 1:1">1:1</button>
            <button type="button" class="ovb-badge-btn" data-act="toggle-immune" title="Marcar/Desmarcar como 'Tema Não Aplicável (Imune a Temas)' — ideal para Logos e Banners SVG"><i class="fas fa-shield-alt"></i> Imune</button>
            <button type="button" class="ovb-badge-btn" data-act="move-up" title="Mover Acima na Ordem da Página (HTML)"><i class="fas fa-arrow-up"></i></button>
            <button type="button" class="ovb-badge-btn" data-act="move-down" title="Mover Abaixo na Ordem da Página (HTML)"><i class="fas fa-arrow-down"></i></button>
            <button type="button" class="ovb-badge-btn" data-act="parent" title="Selecionar Elemento Pai (Atalho: A)"><i class="fas fa-level-up-alt"></i> Pai</button>
            <button type="button" class="ovb-badge-btn" data-act="duplicate" title="Duplicar Elemento (Atalho: Ctrl+D ou Alt+Arrastar)"><i class="fas fa-copy"></i></button>
            <button type="button" class="ovb-badge-btn" data-act="hide" title="Ocultar Elemento"><i class="fas fa-eye-slash"></i></button>
            <button type="button" class="ovb-badge-btn" data-act="add-after" title="Inserir Novo Bloco Abaixo"><i class="fas fa-plus"></i></button>
            <button type="button" class="ovb-badge-btn" data-act="reset" title="Resetar Posição e Estilo deste Elemento"><i class="fas fa-undo-alt"></i></button>
            <button type="button" class="ovb-badge-btn" data-act="flip-bar" style="background:rgba(56,189,248,0.28);border-color:rgba(56,189,248,0.55);" title="Mudar posição desta barra rápida (Acima / Abaixo / Rodapé da Tela)"><i class="fas fa-sort"></i> Posição</button>
        `;
        document.body.appendChild(floatBadge);

        // 4. Live Transform HUD & Smart Center Snap Guides (V + H)
        const hud = document.createElement('div');
        hud.id = 'ovb-Transform-HUD';
        document.body.appendChild(hud);

        const snapGuideV = document.createElement('div');
        snapGuideV.id = 'ovb-Snap-Guide-V';
        document.body.appendChild(snapGuideV);

        const snapGuideH = document.createElement('div');
        snapGuideH.id = 'ovb-Snap-Guide-H';
        document.body.appendChild(snapGuideH);

        function updateSelectionOverlay() {
            if (selectedElement && document.body.contains(selectedElement) && !isInteractiveMode) {
                const rect = selectedElement.getBoundingClientRect();
                selBox.style.display = 'block';
                selBox.style.top = `${rect.top}px`;
                selBox.style.left = `${rect.left}px`;
                selBox.style.width = `${Math.max(8, rect.width)}px`;
                selBox.style.height = `${Math.max(8, rect.height)}px`;

                floatBadge.style.display = 'flex';
                // Reset left temporarily so wrapping calculation gets full available viewport width on Mobile/Tablet
                floatBadge.style.left = '8px';
                const badgeRect = floatBadge.getBoundingClientRect();
                const bW = badgeRect.width || 320;
                const bH = badgeRect.height || 42;
                const CLEARANCE = 22; // 22px clear of the top/bottom resize handles so it NEVER covers them!

                const maxLeft = Math.max(8, window.innerWidth - bW - 8);
                const badgeLeft = Math.max(8, Math.min(maxLeft, rect.left));

                let badgeTop;
                const topCandidate = rect.top - bH - CLEARANCE;
                const bottomCandidate = rect.bottom + CLEARANCE;

                if (badgePlacePreference === 'dock-bottom') {
                    badgeTop = Math.max(8, window.innerHeight - bH - 12);
                } else if (badgePlacePreference === 'bottom') {
                    if (bottomCandidate + bH <= window.innerHeight - 8) {
                        badgeTop = bottomCandidate;
                    } else if (topCandidate >= 8) {
                        badgeTop = topCandidate;
                    } else {
                        badgeTop = Math.max(8, window.innerHeight - bH - 12);
                    }
                } else {
                    // 'auto' or 'top': prefer 22px above top border; if not enough space above, place 22px below bottom border
                    if (topCandidate >= 8) {
                        badgeTop = topCandidate;
                    } else if (bottomCandidate + bH <= window.innerHeight - 8) {
                        badgeTop = bottomCandidate;
                    } else {
                        badgeTop = Math.max(8, window.innerHeight - bH - 12);
                    }
                }

                floatBadge.style.top = `${Math.round(badgeTop)}px`;
                floatBadge.style.left = `${Math.round(badgeLeft)}px`;
            } else {
                selBox.style.display = 'none';
                floatBadge.style.display = 'none';
            }

            if (hoveredElement && hoveredElement !== selectedElement && document.body.contains(hoveredElement) && !isInteractiveMode) {
                const rect = hoveredElement.getBoundingClientRect();
                hoverBadge.style.display = 'block';
                hoverBadge.style.top = `${Math.max(4, rect.top - 24)}px`;
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

            const immuneBtn = floatBadge.querySelector('[data-act="toggle-immune"]');
            if (immuneBtn) {
                const isImmune = el.getAttribute('data-ovb-el-ui-style') === 'none';
                immuneBtn.style.background = isImmune ? '#10b981' : '';
            }

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

        function getElementCurrentTranslate(el) {
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
            if (el.getAttribute('data-ovb-locked') === 'true') return;
            const sel = generateSelector(el);
            const curT = getElementCurrentTranslate(el);

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
                altDuplicate: !!e.altKey,
                moved: false
            };
        }

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

            let elToAct = target;
            const svgGroup = target.closest && target.closest('g.dg-item[id]');
            if (svgGroup && selectedElement !== target) {
                elToAct = svgGroup;
            }

            selectElement(elToAct, false);
            startDraggingElement(e, elToAct);
            e.preventDefault();
        }, true);

        // --- 8-POINT RESIZE HANDLES ENGINE (With Aspect Ratio Lock so it never stretches accidentally!) ---
        selBox.querySelectorAll('.ovb-resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (e.button !== 0 || !selectedElement) return;
                e.preventDefault();
                e.stopPropagation();

                const dir = handle.getAttribute('data-rh');
                const rect = selectedElement.getBoundingClientRect();
                const cs = window.getComputedStyle(selectedElement);
                const curScale = parseFloat(cs.scale && cs.scale !== 'none' ? cs.scale.split(' ')[0] : '1') || 1;
                const aspect = (rect.width > 0 && rect.height > 0) ? (rect.width / rect.height) : 1;

                dragState = {
                    mode: 'resize',
                    dir: dir,
                    el: selectedElement,
                    selector: selectedSelector,
                    startX: e.clientX,
                    startY: e.clientY,
                    origW: Math.max(10, rect.width),
                    origH: Math.max(10, rect.height),
                    aspect: aspect,
                    origScale: curScale,
                    isCorner: ['nw', 'ne', 'se', 'sw'].includes(dir),
                    moved: false
                };
            });
        });

        // --- FIGMA / ILLUSTRATOR CORNER RADIUS HANDLE ---
        const radiusHandle = selBox.querySelector('.ovb-radius-handle');
        if (radiusHandle) {
            radiusHandle.addEventListener('mousedown', (e) => {
                if (e.button !== 0 || !selectedElement) return;
                e.preventDefault();
                e.stopPropagation();
                const cs = window.getComputedStyle(selectedElement);
                const curRadius = parseFloat(cs.borderRadius) || 0;
                dragState = {
                    mode: 'radius',
                    el: selectedElement,
                    selector: selectedSelector,
                    startX: e.clientX,
                    startY: e.clientY,
                    origRadius: curRadius,
                    moved: false
                };
            });
        }

        window.addEventListener('mousemove', (e) => {
            if (!dragState) return;
            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;

            if (!dragState.moved && Math.hypot(dx, dy) < 3) return;
            dragState.moved = true;
            document.body.classList.add('ovb-is-dragging');

            if (dragState.mode === 'move') {
                let newX = Math.round(dragState.origX + dx * dragState.svgScale);
                let newY = Math.round(dragState.origY + dy * dragState.svgScale);

                // Shift key constrains movement to strictly horizontal or vertical axis (like Illustrator/Figma!)
                if (e.shiftKey) {
                    if (Math.abs(dx) >= Math.abs(dy)) {
                        newY = Math.round(dragState.origY);
                    } else {
                        newX = Math.round(dragState.origX);
                    }
                }

                // Snap to 0 center X/Y if within 6px
                if (Math.abs(newX) <= 6) {
                    newX = 0;
                    snapGuideV.style.display = 'block';
                } else {
                    snapGuideV.style.display = 'none';
                }

                if (Math.abs(newY) <= 6) {
                    newY = 0;
                    snapGuideH.style.display = 'block';
                } else {
                    snapGuideH.style.display = 'none';
                }

                dragState.currentX = `${newX}px`;
                dragState.currentY = `${newY}px`;

                dragState.el.style.setProperty('translate', `${newX}px ${newY}px`, 'important');

                hud.style.display = 'block';
                hud.style.top = `${e.clientY + 16}px`;
                hud.style.left = `${e.clientX + 16}px`;
                hud.textContent = `${dragState.altDuplicate ? '⧉ Duplicar  |  ' : ''}X: ${newX >= 0 ? '+' : ''}${newX}px  |  Y: ${newY >= 0 ? '+' : ''}${newY}px`;
                updateSelectionOverlay();
            } else if (dragState.mode === 'resize') {
                const constrain = lockAspectRatio || e.shiftKey;

                if (dragState.el instanceof SVGElement || (dragState.isCorner && constrain)) {
                    const sign = (dragState.dir === 'nw' || dragState.dir === 'sw') ? -1 : 1;
                    const delta = (dx * sign) / Math.max(80, dragState.origW);
                    const newScale = Math.max(0.1, Math.min(5, Number((dragState.origScale + delta).toFixed(2))));
                    dragState.currentScale = newScale;
                    dragState.el.style.setProperty('scale', String(newScale), 'important');

                    hud.style.display = 'block';
                    hud.style.top = `${e.clientY + 16}px`;
                    hud.style.left = `${e.clientX + 16}px`;
                    hud.textContent = `🔒 Tamanho Proporcional: ${Math.round(newScale * 100)}% (${newScale}x)`;
                } else {
                    let newW = dragState.origW;
                    let newH = dragState.origH;
                    if (dragState.dir.includes('e')) newW = Math.max(16, Math.round(dragState.origW + dx));
                    if (dragState.dir.includes('w')) newW = Math.max(16, Math.round(dragState.origW - dx));
                    if (dragState.dir.includes('s')) newH = Math.max(16, Math.round(dragState.origH + dy));
                    if (dragState.dir.includes('n')) newH = Math.max(16, Math.round(dragState.origH - dy));

                    if (constrain && dragState.aspect > 0) {
                        if (dragState.dir === 'e' || dragState.dir === 'w') {
                            newH = Math.max(16, Math.round(newW / dragState.aspect));
                            dragState.currentH = `${newH}px`;
                            dragState.el.style.setProperty('height', `${newH}px`, 'important');
                        } else if (dragState.dir === 'n' || dragState.dir === 's') {
                            newW = Math.max(16, Math.round(newH * dragState.aspect));
                            dragState.currentW = `${newW}px`;
                            dragState.el.style.setProperty('width', `${newW}px`, 'important');
                        }
                    }

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
                    hud.textContent = `${constrain ? '🔒 ' : ''}L: ${Math.round(newW)}px  ×  A: ${Math.round(newH)}px`;
                }
                updateSelectionOverlay();
            } else if (dragState.mode === 'radius') {
                const delta = Math.round((dx + dy) * 0.6);
                const newRad = Math.max(0, Math.min(200, Math.round(dragState.origRadius + delta)));
                dragState.currentRadius = `${newRad}px`;
                dragState.el.style.setProperty('border-radius', `${newRad}px`, 'important');

                hud.style.display = 'block';
                hud.style.top = `${e.clientY + 16}px`;
                hud.style.left = `${e.clientX + 16}px`;
                hud.textContent = `╭ Raio da Borda: ${newRad}px`;
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
            snapGuideH.style.display = 'none';

            if (st.moved) {
                st.el.style.removeProperty('translate');
                st.el.style.removeProperty('scale');
                st.el.style.removeProperty('width');
                st.el.style.removeProperty('height');
                st.el.style.removeProperty('border-radius');

                if (st.mode === 'move' && st.altDuplicate) {
                    // Illustrator Alt+Drag: Duplicate element at the new coordinates while leaving original in place!
                    window.parent.postMessage({
                        type: 'OVB_DUPLICATE_ELEMENT',
                        selector: st.selector,
                        translateX: st.currentX,
                        translateY: st.currentY
                    }, '*');
                    return;
                }

                const changes = {};
                if (st.mode === 'move') {
                    changes.translateX = st.currentX;
                    changes.translateY = st.currentY;
                } else if (st.mode === 'resize') {
                    if (st.currentScale !== undefined) changes.scale = st.currentScale;
                    if (st.currentW !== undefined) changes.width = st.currentW;
                    if (st.currentH !== undefined) changes.height = st.currentH;
                } else if (st.mode === 'radius') {
                    if (st.currentRadius !== undefined) changes.borderRadius = st.currentRadius;
                }

                window.parent.postMessage({
                    type: 'OVB_CANVAS_TRANSFORMED',
                    selector: st.selector,
                    changes: changes,
                    snapshot: getComputedSnapshot(st.el)
                }, '*');
            }
        }, true);

        // ==========================================
        // ADOBE ILLUSTRATOR ADAPTIVE KEYBOARD SHORTCUTS + CTRL+Z / CTRL+SHIFT+Z + ARROW NUDGE
        // ==========================================
        document.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (e.target && e.target.isContentEditable);

            // 1. Ctrl+Z (Undo), Ctrl+Shift+Z / Ctrl+Y (Redo), Ctrl+S (Save), Ctrl+D (Duplicate)
            if (e.ctrlKey || e.metaKey) {
                const k = e.key.toLowerCase();
                if (k === 'z' && !e.shiftKey && !isTyping) {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'undo' }, '*');
                    return;
                }
                if ((k === 'z' && e.shiftKey) || (k === 'y' && !isTyping)) {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'redo' }, '*');
                    return;
                }
                if (k === 's') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'save' }, '*');
                    return;
                }
                if (k === 'd' && !isTyping && selectedSelector) {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_DUPLICATE_ELEMENT', selector: selectedSelector }, '*');
                    return;
                }
            }

            if (isTyping) return;

            // 2. Arrow Nudging (↑ ↓ ← → by 1px, or 10px with Shift)
            if (!isInteractiveMode && selectedElement && selectedSelector && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                const curT = getElementCurrentTranslate(selectedElement);
                let nx = curT.x;
                let ny = curT.y;
                if (e.key === 'ArrowLeft') nx -= step;
                if (e.key === 'ArrowRight') nx += step;
                if (e.key === 'ArrowUp') ny -= step;
                if (e.key === 'ArrowDown') ny += step;

                window.parent.postMessage({
                    type: 'OVB_CANVAS_TRANSFORMED',
                    selector: selectedSelector,
                    changes: {
                        translateX: `${Math.round(nx)}px`,
                        translateY: `${Math.round(ny)}px`
                    }
                }, '*');
                return;
            }

            // 3. Single-Key Adaptive Illustrator Shortcuts (when not holding Ctrl/Alt/Meta)
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                const key = e.key.toLowerCase();
                if (key === 'v') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'tool-select' }, '*');
                } else if (key === 'a') {
                    e.preventDefault();
                    if (selectedElement && selectedElement.parentElement && selectedElement.parentElement !== document.body) {
                        selectElement(selectedElement.parentElement, false);
                    }
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'tool-direct' }, '*');
                } else if (key === 'm') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'insert-shape-square' }, '*');
                } else if (key === 'l') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'insert-shape-circle' }, '*');
                } else if (key === 'u') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'insert-shape-bar' }, '*');
                } else if (key === 't') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'tool-text' }, '*');
                } else if (key === 'g') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'tool-gradient' }, '*');
                } else if (key === 'i') {
                    e.preventDefault();
                    window.parent.postMessage({
                        type: 'OVB_SHORTCUT_COMMAND',
                        command: e.shiftKey ? 'eyedropper-paste' : 'eyedropper-copy'
                    }, '*');
                } else if (key === 'h') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'toggle-hand' }, '*');
                } else if (e.key === '[') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'z-backward' }, '*');
                } else if (e.key === ']') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'z-forward' }, '*');
                } else if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (selectedSelector) {
                        e.preventDefault();
                        window.parent.postMessage({ type: 'OVB_SHORTCUT_COMMAND', command: 'delete-or-hide' }, '*');
                    }
                }
            }
        });

        // Prevent accidental click navigation when in Editor Mode & Guarantee Element Selection on Click
        document.addEventListener('click', (e) => {
            if (isInteractiveMode) return;
            const target = e.target;
            if (!target || target === document.body || target === document.documentElement) return;
            if (target.closest('#ovb-Floating-Badge, #ovb-Hover-Badge, #ovb-Selection-Box, #wpadminbar, .ovb-lightbox-overlay')) return;
            e.preventDefault();
            e.stopPropagation();

            let elToAct = target;
            const svgGroup = target.closest && target.closest('g.dg-item[id]');
            if (svgGroup && selectedElement !== target) {
                elToAct = svgGroup;
            }
            if (selectedElement !== elToAct) {
                selectElement(elToAct, false);
            }
        }, true);

        // Floating Badge Action Buttons
        floatBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const btn = e.target.closest('[data-act]');
            if (!btn || !selectedElement) return;
            const act = btn.getAttribute('data-act');

            if (act === 'toggle-lock') {
                lockAspectRatio = !lockAspectRatio;
                btn.innerHTML = lockAspectRatio ? '<i class="fas fa-lock"></i> Proporção' : '<i class="fas fa-lock-open"></i> Livre';
                window.parent.postMessage({
                    type: 'OVB_ASPECT_LOCK_CHANGED',
                    locked: lockAspectRatio
                }, '*');
            } else if (act === 'flip-bar') {
                if (badgePlacePreference === 'auto' || badgePlacePreference === 'top') {
                    badgePlacePreference = 'bottom';
                } else if (badgePlacePreference === 'bottom') {
                    badgePlacePreference = 'dock-bottom';
                } else {
                    badgePlacePreference = 'top';
                }
                updateSelectionOverlay();
            } else if (act === 'unstretch') {
                selectedElement.style.removeProperty('width');
                selectedElement.style.removeProperty('height');
                selectedElement.style.removeProperty('scale');
                window.parent.postMessage({
                    type: 'OVB_UNSTRETCH_ELEMENT',
                    selector: selectedSelector
                }, '*');
            } else if (act === 'toggle-immune') {
                window.parent.postMessage({
                    type: 'OVB_TOGGLE_IMMUNE_ELEMENT',
                    selector: selectedSelector
                }, '*');
            } else if (act === 'parent' && selectedElement.parentElement && selectedElement.parentElement !== document.body) {
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
                selectedElement.removeAttribute('data-ovb-el-ui-style');
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
                    window.parent.postMessage({
                        type: 'OVB_COMPILED_CSS',
                        compiledCss: compileAllCSS(builderData)
                    }, '*');
                    break;
                }
                case 'OVB_SPOTLIGHT_SELECTOR': {
                    if (spotlightElement) {
                        spotlightElement.removeAttribute('data-ovb-spotlight');
                        spotlightElement = null;
                    }
                    if (msg.selector) {
                        try {
                            const el = document.querySelector(msg.selector);
                            if (el) {
                                spotlightElement = el;
                                spotlightElement.setAttribute('data-ovb-spotlight', 'true');
                            }
                        } catch (err) {}
                    }
                    break;
                }
                case 'OVB_SET_ASPECT_LOCK': {
                    lockAspectRatio = !!msg.locked;
                    const lockBtn = floatBadge.querySelector('[data-act="toggle-lock"]');
                    if (lockBtn) lockBtn.innerHTML = lockAspectRatio ? '<i class="fas fa-lock"></i> Proporção' : '<i class="fas fa-lock-open"></i> Livre';
                    break;
                }
                case 'OVB_TOGGLE_GRID': {
                    document.body.classList.toggle('ovb-show-grid', !!(msg.showGrid || msg.show));
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
                case 'OVB_ALIGN_ELEMENT': {
                    const sel = msg.selector || selectedSelector;
                    if (!sel) break;
                    let el = null;
                    try { el = document.querySelector(sel); } catch (e) { break; }
                    if (!el) break;

                    const align = msg.align;
                    const scope = msg.scope || 'parent';
                    const elRect = el.getBoundingClientRect();

                    let containerRect;
                    if (scope === 'global' || !el.parentElement || el.parentElement === document.body || el.parentElement === document.documentElement) {
                        containerRect = {
                            top: 0,
                            left: 0,
                            width: window.innerWidth,
                            height: window.innerHeight,
                            right: window.innerWidth,
                            bottom: window.innerHeight
                        };
                    } else {
                        containerRect = el.parentElement.getBoundingClientRect();
                    }

                    let curTx = 0;
                    let curTy = 0;
                    const transformMatch = (el.style.transform || '').match(/translate(?:3d)?\(([-0-9.]+)px,\s*([-0-9.]+)px/);
                    if (transformMatch) {
                        curTx = parseFloat(transformMatch[1]) || 0;
                        curTy = parseFloat(transformMatch[2]) || 0;
                    }

                    let newTx = curTx;
                    let newTy = curTy;

                    if (align === 'left') {
                        const deltaX = containerRect.left - elRect.left;
                        newTx = Math.round(curTx + deltaX);
                    } else if (align === 'center-h') {
                        const containerCenter = containerRect.left + (containerRect.width / 2);
                        const elCenter = elRect.left + (elRect.width / 2);
                        const deltaX = containerCenter - elCenter;
                        newTx = Math.round(curTx + deltaX);
                    } else if (align === 'right') {
                        const deltaX = containerRect.right - elRect.right;
                        newTx = Math.round(curTx + deltaX);
                    } else if (align === 'top') {
                        const deltaY = containerRect.top - elRect.top;
                        newTy = Math.round(curTy + deltaY);
                    } else if (align === 'center-v') {
                        const containerCenter = containerRect.top + (containerRect.height / 2);
                        const elCenter = elRect.top + (elRect.height / 2);
                        const deltaY = containerCenter - elCenter;
                        newTy = Math.round(curTy + deltaY);
                    } else if (align === 'bottom') {
                        const deltaY = containerRect.bottom - elRect.bottom;
                        newTy = Math.round(curTy + deltaY);
                    }

                    el.style.transform = `translate(${newTx}px, ${newTy}px)`;
                    updateSelectionOverlay();

                    window.parent.postMessage({
                        type: 'OVB_ELEMENT_ALIGNED',
                        selector: sel,
                        translateX: newTx + 'px',
                        translateY: newTy + 'px'
                    }, '*');
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
                case 'OVB_PING_INIT': {
                    window.parent.postMessage({
                        type: 'OVB_PREVIEW_READY',
                        url: window.location.href,
                        pageKey: getNormalizedPageKey(),
                        theme: document.body.classList.contains('theme-light') ? 'light' : 'dark',
                        color: document.body.getAttribute('data-ovb-palette') || (document.body.classList.contains('color-red') ? 'red' : 'purple'),
                        tree: collectPageTree(),
                        compiledCss: compileAllCSS(builderData)
                    }, '*');
                    break;
                }
                case 'OVB_SET_PREVIEW_THEME': {
                    if (msg.theme === 'light') {
                        document.body.classList.remove('theme-dark');
                        document.body.classList.add('theme-light');
                        document.documentElement.setAttribute('data-theme', 'light');
                        try { localStorage.setItem('userTheme', 'light'); } catch (e) {}
                    } else if (msg.theme === 'dark') {
                        document.body.classList.remove('theme-light');
                        document.body.classList.add('theme-dark');
                        document.documentElement.setAttribute('data-theme', 'dark');
                        try { localStorage.setItem('userTheme', 'dark'); } catch (e) {}
                    }
                    if (msg.color) {
                        window._ovbVisitorExplicitlyPickedColor = true;
                        setCookieVal('odyssee_user_palette', msg.color);
                        try { localStorage.setItem('userColor', msg.color); } catch (e) {}
                        document.body.classList.toggle('color-red', msg.color === 'red');
                        document.body.classList.toggle('color-purple', msg.color !== 'red');
                        document.body.setAttribute('data-ovb-palette', msg.color);
                        applyColorPalettesEngine();
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
                case 'OVB_EXPORT_FIGMA_SVG': {
                    if (typeof window.odysseeVBExportFigmaLunacySVG === 'function') {
                        const targetSel = msg.scope === 'element' ? (msg.selector || selectedSelector || null) : null;
                        const svgStr = window.odysseeVBExportFigmaLunacySVG(targetSel, msg.target || 'figma');
                        window.parent.postMessage({
                            type: 'OVB_FIGMA_SVG_RESULT',
                            svgContent: svgStr,
                            target: msg.target || 'figma',
                            scope: msg.scope || 'page'
                        }, '*');
                    }
                    break;
                }
                case 'OVB_CAPTURE_COMPONENT_PRESET': {
                    const targetEl = (msg.selector && document.querySelector(msg.selector)) || selectedElement;
                    if (!targetEl) return;
                    const sel = generateSelector(targetEl);
                    const clone = targetEl.cloneNode(true);
                    clone.removeAttribute('data-ovb-selected');
                    clone.removeAttribute('data-ovb-hover');
                    clone.removeAttribute('data-ovb-block-id');
                    window.parent.postMessage({
                        type: 'OVB_COMPONENT_PRESET_CAPTURED',
                        name: msg.name || getElementLabel(targetEl),
                        selector: sel,
                        html: clone.outerHTML,
                        elConfig: builderData.elements[sel] || {}
                    }, '*');
                    break;
                }
            }
        });

        function sendPreviewReady() {
            window.parent.postMessage({
                type: 'OVB_PREVIEW_READY',
                url: window.location.href,
                pageKey: getNormalizedPageKey(),
                theme: document.body.classList.contains('theme-light') ? 'light' : 'dark',
                color: document.body.getAttribute('data-ovb-palette') || (document.body.classList.contains('color-red') ? 'red' : 'purple'),
                tree: collectPageTree(),
                compiledCss: compileAllCSS(builderData)
            }, '*');
        }
        sendPreviewReady();
        setTimeout(sendPreviewReady, 250);
    }

    function init() {
        // Cada etapa isolada: uma falha não pode impedir o inspetor de seleção de iniciar
        [applyDOMMoves, renderClonedElements, renderCustomBlocks, updateLiveStyleTag, applyDOMFeatures].forEach(function (step) {
            try { step(); } catch (err) { if (window.console) console.error('[Odyssee VB] falha em ' + (step.name || 'etapa') + ':', err); }
        });

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

        const isInsideIframe = (window.parent && window.parent !== window);
        const hasPreviewParam = window.location.search.indexOf('odyssee_vb_preview=1') !== -1;
        if (isInsideIframe || hasPreviewParam || (config && config.isPreview)) {
            try { initPreviewInspector(); } catch (err) { if (window.console) console.error('[Odyssee VB] falha no inspetor:', err); }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
