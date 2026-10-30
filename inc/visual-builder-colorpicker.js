/**
 * Odyssee Visual Studio — Seletor de Cores com Roda (Color Wheel)
 * Anel de matiz + quadrado de saturação/brilho, campos HEX / RGB / HSB, opacidade,
 * amostras recentes e conta-gotas. Substitui TODO <input type="color"> do painel.
 *
 * API: window.OVBColorPicker.create(container, opts) -> instância reutilizável
 *      window.OVBColorPicker.openPopover(anchorEl, { color, alpha, title, onChange })
 */
(function ($) {
    'use strict';

    const RECENT_KEY = 'ovb_recent_colors';
    const WHEEL = 240, CX = 120, CY = 120, RING_R = 98, RING_W = 22, SQ = 108;

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function hsvToRgb(h, s, v) {
        const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
        return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
    }

    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        let h = 0;
        if (d) {
            if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
            h *= 60; if (h < 0) h += 360;
        }
        return [h, max ? d / max : 0, max];
    }

    function toHex(rgb) { return '#' + rgb.map(c => clamp(c, 0, 255).toString(16).padStart(2, '0')).join(''); }

    function parseColor(str) {
        str = String(str || '').trim();
        let m = str.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
        if (m) {
            let h = m[1];
            if (h.length === 3) h = h.split('').map(c => c + c).join('');
            return { rgb: [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)], a: 1 };
        }
        m = str.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)$/i);
        if (m) return { rgb: [+m[1], +m[2], +m[3]], a: m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : 1 };
        return null;
    }

    function getRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; } }
    function pushRecent(hex) {
        if (!hex) return;
        const list = getRecent().filter(c => c !== hex);
        list.unshift(hex);
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 20))); } catch (e) {}
    }

    function create(container, opts) {
        opts = opts || {};
        const st = { h: 0, s: 1, v: 1, a: 1 };
        let original = '#000000', onChange = opts.onChange || null, ringCache = null;

        const $root = $(`
            <div class="ovb-cp-inner">
                <div class="ovb-cp-body">
                    <canvas class="ovb-cp-wheel" width="${WHEEL}" height="${WHEEL}"></canvas>
                    <div class="ovb-cp-side">
                        <div class="ovb-cp-compare" title="Nova cor (cima) / Cor original (baixo — clique para restaurar)">
                            <div class="ovb-cp-new"></div><div class="ovb-cp-old"></div>
                        </div>
                        <label class="ovb-cp-field ovb-cp-hexrow"><span>#</span><input type="text" class="ovb-cp-hex" maxlength="6" spellcheck="false"></label>
                        <div class="ovb-cp-grid">
                            <label><span>R</span><input type="number" class="ovb-cp-r" min="0" max="255"></label>
                            <label><span>G</span><input type="number" class="ovb-cp-g" min="0" max="255"></label>
                            <label><span>B</span><input type="number" class="ovb-cp-b" min="0" max="255"></label>
                            <label><span>H</span><input type="number" class="ovb-cp-hh" min="0" max="360"></label>
                            <label><span>S</span><input type="number" class="ovb-cp-ss" min="0" max="100"></label>
                            <label><span>B</span><input type="number" class="ovb-cp-vv" min="0" max="100"></label>
                        </div>
                    </div>
                </div>
                <div class="ovb-cp-alpha-row">
                    <span>Opacidade</span>
                    <input type="range" class="ovb-cp-alpha" min="0" max="100" value="100">
                    <span class="ovb-cp-alpha-val">100%</span>
                </div>
                <div class="ovb-cp-swatches-label">Recentes</div>
                <div class="ovb-cp-swatches"></div>
                <div class="ovb-cp-actions">
                    <button type="button" class="ovb-cp-eyedrop" title="Conta-gotas (capturar cor da tela)"><i class="fas fa-eye-dropper"></i> Conta-gotas</button>
                </div>
            </div>
        `);
        $(container).append($root);

        const canvas = $root.find('.ovb-cp-wheel')[0];
        const ctx = canvas.getContext('2d');

        function buildRing() {
            ringCache = document.createElement('canvas');
            ringCache.width = WHEEL; ringCache.height = WHEEL;
            const c = ringCache.getContext('2d');
            c.lineWidth = RING_W + 1;
            for (let i = 0; i < 360; i++) {
                c.beginPath();
                c.strokeStyle = 'hsl(' + i + ',100%,50%)';
                c.arc(CX, CY, RING_R - RING_W / 2, (i - 0.8) * Math.PI / 180, (i + 1.4) * Math.PI / 180);
                c.stroke();
            }
        }

        function render() {
            if (!ringCache) buildRing();
            ctx.clearRect(0, 0, WHEEL, WHEEL);
            ctx.drawImage(ringCache, 0, 0);

            const x0 = CX - SQ / 2, y0 = CY - SQ / 2;
            const img = ctx.createImageData(SQ, SQ);
            for (let y = 0; y < SQ; y++) {
                for (let x = 0; x < SQ; x++) {
                    const rgb = hsvToRgb(st.h, x / (SQ - 1), 1 - y / (SQ - 1));
                    const i = (y * SQ + x) * 4;
                    img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2]; img.data[i + 3] = 255;
                }
            }
            ctx.putImageData(img, x0, y0);
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x0 - 0.5, y0 - 0.5, SQ + 1, SQ + 1);

            // marcador do matiz
            const ang = st.h * Math.PI / 180, mr = RING_R - RING_W / 2;
            marker(CX + Math.cos(ang) * mr, CY + Math.sin(ang) * mr, 'hsl(' + st.h + ',100%,50%)');
            // marcador de saturação/brilho
            marker(x0 + st.s * (SQ - 1), y0 + (1 - st.v) * (SQ - 1), toHex(hsvToRgb(st.h, st.s, st.v)));
        }

        function marker(x, y, fill) {
            ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fillStyle = fill; ctx.fill();
            ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, 8.5, 0, Math.PI * 2);
            ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.stroke();
        }

        function currentHex() { return toHex(hsvToRgb(st.h, st.s, st.v)); }

        function currentCss() {
            const rgb = hsvToRgb(st.h, st.s, st.v);
            return st.a < 1 ? 'rgba(' + rgb.join(', ') + ', ' + (Math.round(st.a * 100) / 100) + ')' : toHex(rgb);
        }

        function syncInputs(skip) {
            const rgb = hsvToRgb(st.h, st.s, st.v);
            if (skip !== 'hex') $root.find('.ovb-cp-hex').val(toHex(rgb).slice(1));
            if (skip !== 'rgb') { $root.find('.ovb-cp-r').val(rgb[0]); $root.find('.ovb-cp-g').val(rgb[1]); $root.find('.ovb-cp-b').val(rgb[2]); }
            if (skip !== 'hsv') {
                $root.find('.ovb-cp-hh').val(Math.round(st.h));
                $root.find('.ovb-cp-ss').val(Math.round(st.s * 100));
                $root.find('.ovb-cp-vv').val(Math.round(st.v * 100));
            }
            $root.find('.ovb-cp-alpha').val(Math.round(st.a * 100));
            $root.find('.ovb-cp-alpha-val').text(Math.round(st.a * 100) + '%');
            $root.find('.ovb-cp-new').css('background', currentCss());
        }

        function emit(skip) {
            render();
            syncInputs(skip);
            if (onChange) onChange(currentHex(), st.a, currentCss());
        }

        function renderSwatches() {
            const $sw = $root.find('.ovb-cp-swatches').empty();
            const list = getRecent();
            if (!list.length) { $sw.append('<span class="ovb-cp-empty">As cores usadas aparecem aqui</span>'); return; }
            list.forEach(hex => $sw.append($('<button type="button" class="ovb-cp-sw"></button>').attr({ 'data-hex': hex, title: hex }).css('background', hex)));
        }

        function pointer(e) {
            const rect = canvas.getBoundingClientRect();
            const sc = WHEEL / rect.width;
            return [(e.clientX - rect.left) * sc, (e.clientY - rect.top) * sc];
        }

        let mode = null;
        $(canvas).on('pointerdown', function (e) {
            const p = pointer(e), dx = p[0] - CX, dy = p[1] - CY, dist = Math.hypot(dx, dy);
            if (dist >= RING_R - RING_W - 4 && dist <= RING_R + 6) mode = 'hue';
            else if (Math.abs(dx) <= SQ / 2 + 4 && Math.abs(dy) <= SQ / 2 + 4) mode = 'sv';
            else return;
            canvas.setPointerCapture(e.originalEvent.pointerId);
            move(e);
        }).on('pointermove', function (e) { if (mode) move(e); })
          .on('pointerup pointercancel', function () { if (mode) { mode = null; pushRecent(currentHex()); renderSwatches(); } });

        function move(e) {
            const p = pointer(e), dx = p[0] - CX, dy = p[1] - CY;
            if (mode === 'hue') {
                let a = Math.atan2(dy, dx) * 180 / Math.PI; if (a < 0) a += 360;
                st.h = a;
            } else {
                st.s = clamp((dx + SQ / 2) / (SQ - 1), 0, 1);
                st.v = clamp(1 - (dy + SQ / 2) / (SQ - 1), 0, 1);
            }
            emit();
        }

        $root.on('input change', '.ovb-cp-hex', function () {
            const c = parseColor($(this).val());
            if (!c) return;
            const hsv = rgbToHsv(c.rgb[0], c.rgb[1], c.rgb[2]);
            if (hsv[1] > 0) st.h = hsv[0];
            st.s = hsv[1]; st.v = hsv[2];
            emit('hex');
        });
        $root.on('input change', '.ovb-cp-r, .ovb-cp-g, .ovb-cp-b', function () {
            const rgb = ['.ovb-cp-r', '.ovb-cp-g', '.ovb-cp-b'].map(s => clamp(parseInt($root.find(s).val(), 10) || 0, 0, 255));
            const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
            if (hsv[1] > 0) st.h = hsv[0];
            st.s = hsv[1]; st.v = hsv[2];
            emit('rgb');
        });
        $root.on('input change', '.ovb-cp-hh, .ovb-cp-ss, .ovb-cp-vv', function () {
            st.h = clamp(parseFloat($root.find('.ovb-cp-hh').val()) || 0, 0, 360);
            st.s = clamp((parseFloat($root.find('.ovb-cp-ss').val()) || 0) / 100, 0, 1);
            st.v = clamp((parseFloat($root.find('.ovb-cp-vv').val()) || 0) / 100, 0, 1);
            emit('hsv');
        });
        $root.on('input change', '.ovb-cp-alpha', function () {
            st.a = clamp((parseInt($(this).val(), 10) || 0) / 100, 0, 1);
            emit();
        });
        $root.on('click', '.ovb-cp-sw', function () { api.setColor($(this).attr('data-hex'), 1, true); });
        $root.on('click', '.ovb-cp-old', function () { api.setColor(original, 1, true); });
        $root.on('click', '.ovb-cp-eyedrop', async function () {
            if (!window.EyeDropper) { alert('Seu navegador não suporta o conta-gotas nativo (use Chrome/Edge).'); return; }
            try {
                const res = await new window.EyeDropper().open();
                api.setColor(res.sRGBHex, 1, true);
                pushRecent(res.sRGBHex); renderSwatches();
            } catch (e) {}
        });

        const api = {
            setColor: function (value, alpha, silent) {
                const c = parseColor(value);
                if (!c) return;
                const hsv = rgbToHsv(c.rgb[0], c.rgb[1], c.rgb[2]);
                if (hsv[1] > 0.001 && hsv[2] > 0.001) st.h = hsv[0];
                st.s = hsv[1]; st.v = hsv[2];
                st.a = alpha !== undefined && alpha !== null ? alpha : c.a;
                if (silent === true) { emit(); } else { render(); syncInputs(); }
            },
            setOriginal: function (value) {
                const c = parseColor(value);
                original = c ? toHex(c.rgb) : '#000000';
                $root.find('.ovb-cp-old').css('background', value || original);
            },
            setOnChange: function (fn) { onChange = fn; },
            getHex: currentHex,
            getCss: currentCss,
            getAlpha: function () { return st.a; },
            refreshSwatches: renderSwatches,
            commit: function () { pushRecent(currentHex()); renderSwatches(); }
        };

        render(); syncInputs(); renderSwatches();
        return api;
    }

    // ------------------------------------------------------------------
    // Popover global (substitui o seletor nativo de cor)
    // ------------------------------------------------------------------
    let $pop = null, popApi = null, popAnchor = null;

    function ensurePopover() {
        if ($pop) return;
        $pop = $(`
            <div id="ovb-cp-popover" class="ovb-cp-popover" style="display:none;">
                <div class="ovb-cp-head"><span class="ovb-cp-title">Seletor de Cor</span><button type="button" class="ovb-cp-close" title="Fechar">&times;</button></div>
                <div class="ovb-cp-host"></div>
            </div>
        `);
        $('body').append($pop);
        popApi = create($pop.find('.ovb-cp-host'));

        $pop.on('click', '.ovb-cp-close', closePopover);

        // arrastar pelo cabeçalho
        let drag = null;
        $pop.on('pointerdown', '.ovb-cp-head', function (e) {
            if ($(e.target).closest('.ovb-cp-close').length) return;
            const r = $pop[0].getBoundingClientRect();
            drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
            this.setPointerCapture(e.originalEvent.pointerId);
        }).on('pointermove', '.ovb-cp-head', function (e) {
            if (!drag) return;
            $pop.css({ left: clamp(e.clientX - drag.dx, 0, window.innerWidth - 60), top: clamp(e.clientY - drag.dy, 0, window.innerHeight - 40), right: 'auto', bottom: 'auto' });
        }).on('pointerup pointercancel', '.ovb-cp-head', function () { drag = null; });

        $(document).on('mousedown', function (e) {
            if (!$pop.is(':visible')) return;
            if ($(e.target).closest('#ovb-cp-popover').length) return;
            if (popAnchor && $(e.target).closest(popAnchor).length) return;
            closePopover();
        });
        $(document).on('keydown', function (e) { if (e.key === 'Escape' && $pop.is(':visible')) { closePopover(); } });
    }

    function closePopover() {
        if (!$pop) return;
        if (popApi) popApi.commit();
        $pop.hide();
        popAnchor = null;
    }

    function openPopover(anchor, o) {
        o = o || {};
        ensurePopover();
        popAnchor = anchor || null;
        $pop.find('.ovb-cp-title').text(o.title || 'Seletor de Cor');
        popApi.setOnChange(null);
        popApi.setColor(o.color || '#8b5cf6', o.alpha !== undefined ? o.alpha : null);
        popApi.setOriginal(o.color || '#8b5cf6');
        popApi.refreshSwatches();
        popApi.setOnChange(o.onChange || null);

        $pop.show();
        const pw = $pop.outerWidth(), ph = $pop.outerHeight();
        let left, top;
        if (window.innerWidth < 640) {
            left = Math.max(8, (window.innerWidth - pw) / 2);
            top = Math.max(8, window.innerHeight - ph - 12);
        } else if (anchor) {
            const r = $(anchor)[0].getBoundingClientRect();
            left = r.left - pw - 12;
            if (left < 8) left = r.right + 12;
            top = r.top - 20;
        } else {
            left = (window.innerWidth - pw) / 2; top = 80;
        }
        left = clamp(left, 8, Math.max(8, window.innerWidth - pw - 8));
        top = clamp(top, 8, Math.max(8, window.innerHeight - ph - 8));
        $pop.css({ left: left, top: top, right: 'auto', bottom: 'auto' });
    }

    // ------------------------------------------------------------------
    // Intercepta todo <input type="color"> do painel
    // ------------------------------------------------------------------
    $(document).on('click', 'input[type="color"]', function (e) {
        if ($(this).closest('#ovb-cp-popover, .ovb-cm-panel').length) return;
        e.preventDefault();
        const input = this;
        const $in = $(input);
        const $txt = $in.closest('.ovb-color-wrap').find('input[type="text"]').first();
        const raw = $txt.length && parseColor($txt.val()) ? $txt.val() : $in.val();
        const label = $in.closest('.ovb-field').find('.ovb-label').first().text().trim() || $in.attr('title') || 'Seletor de Cor';

        openPopover(input, {
            color: raw,
            title: label,
            onChange: function (hex, alpha, css) {
                $in.val(hex);
                if (alpha < 1 && $txt.length) {
                    $txt.val(css).trigger('input').trigger('change');
                } else {
                    $in.trigger('input').trigger('change');
                    if ($txt.length && alpha >= 1) $txt.val(hex);
                }
            }
        });
    });

    window.OVBColorPicker = {
        create: create,
        openPopover: openPopover,
        closePopover: closePopover,
        parseColor: parseColor,
        toHex: toHex,
        hsvToRgb: hsvToRgb,
        rgbToHsv: rgbToHsv
    };
})(jQuery);
