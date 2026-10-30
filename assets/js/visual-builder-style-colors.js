/**
 * Odyssee Visual Studio — Recolor de Estilos UI
 * Permite trocar as cores de Frutiger Aero, GTK4, Breeze, MacTahoe, Material e Material 3 Expressive
 * SEM descaracterizar o estilo: cada cor original do estilo é deslocada (matiz/saturação/luminosidade)
 * mantendo a relação entre as cores — só a "personalidade cromática" muda, a estrutura continua igual.
 */
(function () {
    'use strict';

    const REGISTRY = {"frutiger-aero":{"abbr":"fa","primary":[14,165,233],"secondary":null,"vars":[["--ovb-fa-1",56,189,248,"a"],["--ovb-fa-2",2,132,199,"a"],["--ovb-fa-3",16,185,129,"a"],["--ovb-fa-4",15,23,42,"a"],["--ovb-fa-5",14,165,233,"a"],["--ovb-fa-6",125,211,252,"a"],["--ovb-fa-7",6,182,212,"a"],["--ovb-fa-8",14,116,144,"a"],["--ovb-fa-9",125,232,255,"a"],["--ovb-fa-10",0,148,218,"a"],["--ovb-fa-11",0,212,255,"a"],["--ovb-fa-12",0,150,210,"a"],["--ovb-fa-13",0,45,75,"a"]]},"gtk4":{"abbr":"gt","primary":[53,132,228],"secondary":null,"vars":[["--ovb-gt-1",53,132,228,"a"]]},"breeze":{"abbr":"br","primary":[61,174,233],"secondary":null,"vars":[["--ovb-br-1",61,174,233,"a"]]},"mactahoe":{"abbr":"mt","primary":[56,189,248],"secondary":null,"vars":[]},"material":{"abbr":"md","primary":[98,0,238],"secondary":null,"vars":[]},"material-3-expressive":{"abbr":"m3","primary":[208,188,255],"secondary":null,"vars":[["--ovb-m3-1",139,92,246,"a"],["--ovb-m3-2",79,55,139,"a"],["--ovb-m3-3",208,188,255,"a"]]}};

    const STYLE_LABELS = {
        'odysseexp': 'OdysseeXP',
        'frutiger-aero': 'Frutiger Aero',
        'gtk4': 'GTK4 Libadwaita',
        'breeze': 'KDE Breeze',
        'mactahoe': 'MacTahoe Liquid Glass',
        'material': 'Material Design',
        'material-3-expressive': 'Material 3 Expressive'
    };

    // Cor de destaque original de cada estilo (usada como ponto de partida nos seletores)
    const STYLE_DEFAULT_ACCENT = {
        'odysseexp': '#8b5cf6',
        'frutiger-aero': '#0ea5e9',
        'gtk4': '#3584e4',
        'breeze': '#3daee9',
        'mactahoe': '#38bdf8',
        'material': '#6200ee',
        'material-3-expressive': '#d0bcff'
    };

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function hexToRgb(hex) {
        let h = String(hex || '').replace('#', '').trim();
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }

    function rgbToHex(rgb) {
        return '#' + rgb.map(c => clamp(Math.round(c), 0, 255).toString(16).padStart(2, '0')).join('');
    }

    function rgbToHsl(rgb) {
        const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h *= 60;
        }
        return [h, s, l];
    }

    function hslToRgb(hsl) {
        const h = ((hsl[0] % 360) + 360) % 360 / 360, s = hsl[1], l = hsl[2];
        if (s === 0) { const v = l * 255; return [v, v, v]; }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const f = t => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
    }

    /**
     * Desloca uma cor original de modo que a referência `from` vire `to`, preservando a relação das demais.
     */
    function recolorRgb(rgb, from, to) {
        const c = rgbToHsl(rgb), f = rgbToHsl(from), t = rgbToHsl(to);
        const hue = c[0] + (t[0] - f[0]);
        const ratio = f[1] > 0.02 ? clamp(t[1] / f[1], 0.25, 2.2) : 1;
        const sat = clamp(c[1] * ratio, 0, 1);
        const lig = clamp(c[2] + (t[2] - f[2]) * 0.85, 0.02, 0.98);
        return hslToRgb([hue, sat, lig]).map(v => clamp(Math.round(v), 0, 255));
    }

    function shade(hex, delta) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        const hsl = rgbToHsl(rgb);
        hsl[2] = clamp(hsl[2] + delta, 0, 1);
        return rgbToHex(hslToRgb(hsl));
    }

    function rgba(hex, a) {
        const rgb = hexToRgb(hex);
        return rgb ? 'rgba(' + rgb.join(', ') + ', ' + a + ')' : hex;
    }

    function isValidHex(v) { return !!hexToRgb(v); }

    /**
     * Compila o CSS de recolor a partir de data.uiStyleColors:
     * { 'gtk4': { accent:'#..', secondary:'#..', dark:{page,surface}, light:{page,surface} }, ... }
     */
    function compile(uiStyleColors) {
        if (!uiStyleColors || typeof uiStyleColors !== 'object') return '';
        const out = [];
        Object.keys(uiStyleColors).forEach(style => {
            const cfg = uiStyleColors[style];
            if (!cfg || typeof cfg !== 'object') return;
            const reg = REGISTRY[style];
            const scope = 'html body[data-ovb-ui-style="' + style + '"], html [data-ovb-el-ui-style="' + style + '"]';
            const accent = isValidHex(cfg.accent) ? cfg.accent : '';
            const secondary = isValidHex(cfg.secondary) ? cfg.secondary : '';

            if (reg && (accent || secondary)) {
                const decls = [];
                reg.vars.forEach(v => {
                    const rgb = [v[1], v[2], v[3]];
                    const isB = v[4] === 'b' && reg.secondary;
                    const toHex = isB ? (secondary || '') : accent;
                    const from = isB ? reg.secondary : reg.primary;
                    if (!toHex) return;
                    const res = recolorRgb(rgb, from, hexToRgb(toHex));
                    decls.push(v[0] + ': ' + res.join(' ') + ' !important;');
                });
                if (decls.length) out.push(':root { ' + decls.join(' ') + ' }');
            }

            if (accent) {
                out.push(scope + ' { --color-accent: ' + accent + ' !important; --color-accent-hover: ' + shade(accent, -0.07) +
                    ' !important; --color-accent-glow: ' + rgba(accent, 0.45) + ' !important; --ovb-style-accent: ' + accent + ' !important; }');
            }

            ['dark', 'light'].forEach(mode => {
                const m = cfg[mode];
                if (!m || typeof m !== 'object') return;
                const decls = [];
                if (isValidHex(m.page)) decls.push('--bg-page: ' + m.page + ' !important;');
                if (isValidHex(m.surface)) {
                    decls.push('--bg-card: ' + m.surface + ' !important;');
                    decls.push('--bg-card-hover: ' + shade(m.surface, mode === 'dark' ? 0.04 : -0.04) + ' !important;');
                }
                if (decls.length) {
                    out.push('html body.theme-' + mode + '[data-ovb-ui-style="' + style + '"], html body.theme-' + mode +
                        ' [data-ovb-el-ui-style="' + style + '"] { ' + decls.join(' ') + ' }');
                }
            });
        });
        return out.join('\n');
    }

    window.ODYSSEE_VB_STYLE_COLORS = {
        REGISTRY: REGISTRY,
        STYLE_LABELS: STYLE_LABELS,
        STYLE_DEFAULT_ACCENT: STYLE_DEFAULT_ACCENT,
        compile: compile,
        recolorRgb: recolorRgb,
        hexToRgb: hexToRgb,
        rgbToHex: rgbToHex,
        rgbToHsl: rgbToHsl,
        hslToRgb: hslToRgb,
        shade: shade,
        rgba: rgba,
        isValidHex: isValidHex
    };
})();
