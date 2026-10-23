

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const orbitContainer = document.getElementById('artcraft-orbit-container');
        const dataElement = document.getElementById('odyssee-orbit-data');
        if (!orbitContainer || !dataElement) return;

        if (window.innerWidth < 768) {
            orbitContainer.style.display = 'none';
            return;
        }

        orbitContainer.innerHTML = '';

        const oldModal = document.getElementById('artcraft-expand-modal');
        if (oldModal) oldModal.remove();

        let items = [];
        try {
            items = JSON.parse(dataElement.textContent || '[]');
        } catch (e) {
            console.error('Erro ao ler dados orbitais:', e);
            return;
        }

        if (!items || items.length === 0) return;

        const canvas = document.createElement('canvas');
        canvas.id = 'artcraft-orbit-canvas';
        canvas.className = 'artcraft-orbit-canvas';
        orbitContainer.appendChild(canvas);

        const gl = canvas.getContext('webgl2', {
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });

        if (!gl) {
            console.warn('WebGL2 não suportado neste navegador.');
            return;
        }

        const vsSource = `#version 300 es
        precision highp float;

        in vec3 aPosition;
        in vec2 aUv;

        uniform mat4 uProjection;
        uniform mat4 uView;
        uniform mat4 uModel;

        uniform float uCurve;
        uniform float uWarp;
        uniform vec2 uMouse;
        uniform vec2 uSize;

        out vec2 vUv;

        void main() {
            vUv = aUv;
            vec4 pos = vec4(aPosition.x * uSize.x, aPosition.y * uSize.y, aPosition.z, 1.0);
            vec4 world = uModel * pos;

            float d2 = dot(aPosition.xy, aPosition.xy);
            world.z += uCurve * (0.25 - d2) * 2.0;

            vec2 dpx = (aPosition.xy - uMouse) * uSize;
            float rr = max(uSize.x, uSize.y) * 0.65;
            world.z += uWarp * exp(-dot(dpx, dpx) / (rr * rr));

            gl_Position = uProjection * uView * world;
        }`;

        const fsSource = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 outColor;

        uniform sampler2D uMap;
        uniform float uAber;
        uniform vec2 uSize;
        uniform float uRadius;
        uniform float uAlpha;
        uniform vec3 uFrameCol;
        uniform float uFrameA;
        uniform vec3 uBg;
        uniform float uBlur;
        uniform float uFadeCenter;

        uniform vec4 uClick[4];
        uniform float uClickW;

        uniform float uImgAspect;
        uniform float uCardAspect;

        void main() {
            vec2 baseUv = vUv;
            if (uImgAspect > 0.05 && uCardAspect > 0.05) {
                if (uImgAspect > uCardAspect) {
                    float s = uCardAspect / uImgAspect;
                    baseUv.x = (vUv.x - 0.5) * s + 0.5;
                } else {
                    float s = uImgAspect / uCardAspect;
                    baseUv.y = (vUv.y - 0.5) * s + 0.5;
                }
            }

            vec2 uvL = baseUv;
            for (int k = 0; k < 4; k++) {
                if (uClick[k].w > 0.001) {
                    vec2 q = (vUv - uClick[k].xy) * uSize;
                    float dq = length(q);
                    float ring = (dq - uClick[k].z) / max(1.0, uClickW);
                    uvL += (q / max(1.0, dq)) * (uClick[k].w * exp(-ring * ring)) / uSize;
                }
            }

            vec2 uv = clamp(uvL, vec2(0.001), vec2(0.999));

            vec2 d = vUv - 0.5;
            vec2 shift = d * dot(d, d) * 4.0 * uAber;

            vec3 col;
            if (uBlur > 0.008) {
                float b = uBlur * 0.024;
                vec3 acc = texture(uMap, uv).rgb * 2.0;
                acc += texture(uMap, clamp(uv + vec2(b, b), vec2(0.0), vec2(1.0))).rgb;
                acc += texture(uMap, clamp(uv + vec2(-b, b), vec2(0.0), vec2(1.0))).rgb;
                acc += texture(uMap, clamp(uv + vec2(b, -b), vec2(0.0), vec2(1.0))).rgb;
                acc += texture(uMap, clamp(uv + vec2(-b, -b), vec2(0.0), vec2(1.0))).rgb;
                col = acc * 0.1666667;
            } else if (uAber > 0.0006) {
                col = vec3(
                    texture(uMap, clamp(uv + shift, vec2(0.0), vec2(1.0))).r,
                    texture(uMap, clamp(uv, vec2(0.0), vec2(1.0))).g,
                    texture(uMap, clamp(uv - shift, vec2(0.0), vec2(1.0))).b
                );
            } else {
                col = texture(uMap, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
            }

            col = mix(col, uBg, clamp(uFadeCenter * 0.82, 0.0, 0.95));

            vec2 q = abs((vUv - 0.5) * uSize) - (0.5 * uSize - vec2(uRadius));
            float dEdge = length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - uRadius;
            float frameBand = 1.0 - smoothstep(0.5, 1.5, abs(dEdge + 1.0));
            col = mix(col, uFrameCol, frameBand * uFrameA * (1.0 - uFadeCenter * 0.6));
            float aa = 1.0 - smoothstep(-0.8, 0.8, dEdge);
            float finalAlpha = uAlpha * aa;
            if (finalAlpha < 0.005) {
                discard;
            }
            outColor = vec4(col, finalAlpha);
        }`;

        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            return;
        }

        const cols = 12;
        const rows = 8;
        const positions = [];
        const uvs = [];
        const indices = [];

        for (let r = 0; r <= rows; r++) {
            const y = (r / rows) - 0.5;
            const v = 1 - (r / rows);
            for (let c = 0; c <= cols; c++) {
                const x = (c / cols) - 0.5;
                const u = c / cols;
                positions.push(x, y, 0);
                uvs.push(u, v);
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const i0 = r * (cols + 1) + c;
                const i1 = i0 + 1;
                const i2 = (r + 1) * (cols + 1) + c;
                const i3 = i2 + 1;
                indices.push(i0, i2, i1);
                indices.push(i1, i2, i3);
            }
        }

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        const aPosLoc = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(aPosLoc);
        gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
        const aUvLoc = gl.getAttribLocation(program, 'aUv');
        gl.enableVertexAttribArray(aUvLoc);
        gl.vertexAttribPointer(aUvLoc, 2, gl.FLOAT, false, 0, 0);

        const idxBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        const uProjLoc = gl.getUniformLocation(program, 'uProjection');
        const uViewLoc = gl.getUniformLocation(program, 'uView');
        const uModelLoc = gl.getUniformLocation(program, 'uModel');
        const uCurveLoc = gl.getUniformLocation(program, 'uCurve');
        const uWarpLoc = gl.getUniformLocation(program, 'uWarp');
        const uMouseLoc = gl.getUniformLocation(program, 'uMouse');
        const uSizeLoc = gl.getUniformLocation(program, 'uSize');
        const uRadiusLoc = gl.getUniformLocation(program, 'uRadius');
        const uAlphaLoc = gl.getUniformLocation(program, 'uAlpha');
        const uAberLoc = gl.getUniformLocation(program, 'uAber');
        const uFrameColLoc = gl.getUniformLocation(program, 'uFrameCol');
        const uFrameALoc = gl.getUniformLocation(program, 'uFrameA');
        const uBgLoc = gl.getUniformLocation(program, 'uBg');
        const uBlurLoc = gl.getUniformLocation(program, 'uBlur');
        const uFadeCenterLoc = gl.getUniformLocation(program, 'uFadeCenter');
        const uClickLoc = gl.getUniformLocation(program, 'uClick');
        const uClickWLoc = gl.getUniformLocation(program, 'uClickW');
        const uImgAspectLoc = gl.getUniformLocation(program, 'uImgAspect');
        const uCardAspectLoc = gl.getUniformLocation(program, 'uCardAspect');

        function calcCardDimensions(rawAspect, isMob) {
            const targetArea = isMob ? (105 * 68) : (145 * 92);
            const aspect = Math.min(Math.max(rawAspect || (16 / 10), 0.65), 1.95);
            const h = Math.round(Math.sqrt(targetArea / aspect));
            const w = Math.round(h * aspect);
            return { width: w, height: h, aspect };
        }

        const cards = [];
        const textures = [];
        const dummyTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, dummyTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([30, 35, 45, 255]));

        items.forEach((item) => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = item.thumb;
            img.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    const natAspect = img.naturalWidth / img.naturalHeight;
                    item.naturalAspect = natAspect;
                    cards.forEach(c => {
                        if (c.item === item) {
                            c.imgAspect = natAspect;
                            const d = calcCardDimensions(natAspect, window.innerWidth < 768);
                            c.width = d.width;
                            c.height = d.height;
                            c.aspect = d.aspect;
                        }
                    });
                }
            };
            img.onerror = () => {
                if (item.full && img.src !== item.full) {
                    img.src = item.full;
                }
            };

            textures.push(tex);
        });

        const isMobile = window.innerWidth < 768;
        const ringConfigs = isMobile ? [
            { rx: 160, ry: 85, speed: 0.0032, count: 3 },
            { rx: 240, ry: 135, speed: -0.0024, count: 4 },
            { rx: 320, ry: 180, speed: 0.0019, count: 5 }
        ] : [
            { rx: 270, ry: 130, speed: 0.0020, count: 4 },
            { rx: 440, ry: 210, speed: -0.0015, count: 6 },
            { rx: 610, ry: 285, speed: 0.0011, count: 7 },
            { rx: 780, ry: 360, speed: -0.0008, count: 7 }
        ];

        const ringsSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        ringsSvg.setAttribute('class', 'orbit-rings-svg');
        ringsSvg.setAttribute('aria-hidden', 'true');
        orbitContainer.appendChild(ringsSvg);

        ringConfigs.forEach((ring, idx) => {
            const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            ellipse.setAttribute('class', `orbit-ring-line ring-${idx}`);
            ellipse.setAttribute('cx', '50%');
            ellipse.setAttribute('cy', '50%');
            ellipse.setAttribute('rx', ring.rx);
            ellipse.setAttribute('ry', ring.ry);
            ringsSvg.appendChild(ellipse);
        });

        let itemIndex = 0;

        ringConfigs.forEach((ring, ringIndex) => {
            const angleStep = (Math.PI * 2) / ring.count;
            for (let i = 0; i < ring.count; i++) {
                const item = items[itemIndex % items.length];
                const texture = textures[itemIndex % textures.length];
                itemIndex++;

                const initialAngle = (i * angleStep) + (ringIndex * 0.5);

                const metaW = item.width || 0;
                const metaH = item.height || 0;
                const initAspect = (metaW > 0 && metaH > 0) ? (metaW / metaH) : (16 / 10);
                const dims = calcCardDimensions(item.naturalAspect || initAspect, isMobile);

                cards.push({
                    id: itemIndex,
                    item,
                    texture,
                    ringIndex,
                    rx: ring.rx,
                    ry: ring.ry,
                    baseSpeed: ring.speed,
                    angle: initialAngle,
                    width: dims.width,
                    height: dims.height,
                    aspect: dims.aspect,
                    imgAspect: item.naturalAspect || initAspect,
                    radius: 12,
                    
                    x: 0,
                    y: 0,
                    z: 0,
                    scale: 1,
                    
                    isBoosted: false,
                    boostK: 0,
                    
                    clicks: [
                        { x: 0.5, y: 0.5, radius: 0, amp: 0, time: -99 }
                    ]
                });
            }
        });

        let mouseX = -9999;
        let mouseY = -9999;
        let isMouseActive = false;

        window.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - (rect.left + rect.width / 2);
            mouseY = -(e.clientY - (rect.top + rect.height / 2));
            isMouseActive = true;
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            isMouseActive = false;
            mouseX = -9999;
            mouseY = -9999;
        });

        let lastScrollY = window.scrollY || window.pageYOffset;
        let scrollVelocity = 0;
        let targetScrollVelocity = 0;
        let zoomScale = 1;
        let targetZoomScale = 1;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY || window.pageYOffset;
            const deltaY = currentScrollY - lastScrollY;
            lastScrollY = currentScrollY;

            if (currentScrollY < window.innerHeight * 1.5) {
                targetScrollVelocity = deltaY * 0.00035;
                const scrollProgress = Math.min(Math.max(currentScrollY / (window.innerHeight * 0.8), 0), 1);
                targetZoomScale = 1 + (scrollProgress * 0.18);
            } else {
                targetScrollVelocity = 0;
                targetZoomScale = 1;
            }
        }, { passive: true });

        window.addEventListener('wheel', (e) => {
            if (window.scrollY < window.innerHeight * 1.2) {
                targetScrollVelocity += e.deltaY * 0.00012;
            }
        }, { passive: true });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - (rect.left + rect.width / 2);
            const clickY = -(e.clientY - (rect.top + rect.height / 2));

            const sortedByZ = [...cards].sort((a, b) => b.z - a.z);
            let hitCard = null;

            for (const card of sortedByZ) {
                const w = card.width * card.scale;
                const h = card.height * card.scale;
                const left = card.x - w / 2;
                const right = card.x + w / 2;
                const bottom = card.y - h / 2;
                const top = card.y + h / 2;

                if (clickX >= left && clickX <= right && clickY >= bottom && clickY <= top) {
                    hitCard = card;
                    break;
                }
            }

            if (hitCard) {
                const w = hitCard.width * hitCard.scale;
                const h = hitCard.height * hitCard.scale;
                const clickUvX = (clickX - (hitCard.x - w / 2)) / w;
                const clickUvY = (clickY - (hitCard.y - h / 2)) / h;
                hitCard.clicks[0] = {
                    x: Math.max(0, Math.min(1, clickUvX)),
                    y: Math.max(0, Math.min(1, 1 - clickUvY)),
                    radius: 0,
                    amp: 24,
                    time: performance.now() / 1000
                };

                const willBoost = !hitCard.isBoosted;
                cards.forEach(c => c.isBoosted = false); 
                hitCard.isBoosted = willBoost;
            } else {
                cards.forEach(c => c.isBoosted = false);
            }
        });

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
            const width = orbitContainer.clientWidth || window.innerWidth;
            const height = orbitContainer.clientHeight || window.innerHeight;

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';

            gl.viewport(0, 0, canvas.width, canvas.height);

            const isMob = window.innerWidth < 768;
            cards.forEach(c => {
                const d = calcCardDimensions(c.imgAspect || c.aspect, isMob);
                c.width = d.width;
                c.height = d.height;
            });
        }

        window.addEventListener('resize', resize, { passive: true });
        resize();

        function createPerspective(fovRad, aspect, near, far) {
            const f = 1.0 / Math.tan(fovRad / 2);
            const rangeInv = 1.0 / (near - far);
            return [
                f / aspect, 0, 0, 0,
                0, f, 0, 0,
                0, 0, (near + far) * rangeInv, -1,
                0, 0, near * far * rangeInv * 2, 0
            ];
        }

        let lastTime = performance.now();

        function render(time) {
            lastTime = time;
            const nowSec = time / 1000;

            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            scrollVelocity += (targetScrollVelocity - scrollVelocity) * 0.1;
            targetScrollVelocity *= 0.92;
            zoomScale += (targetZoomScale - zoomScale) * 0.08;

            const fovDeg = 30;
            const fovRad = (fovDeg * Math.PI) / 180;
            const cameraZ = (height / 2) / Math.tan(fovRad / 2);
            const aspect = width / height;

            const projMat = createPerspective(fovRad, aspect, 1, cameraZ + 2500);
            const viewMat = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, -cameraZ, 1
            ];

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.disable(gl.DEPTH_TEST);
            gl.depthMask(false);

            gl.useProgram(program);
            gl.bindVertexArray(vao);

            gl.uniformMatrix4fv(uProjLoc, false, new Float32Array(projMat));
            gl.uniformMatrix4fv(uViewLoc, false, new Float32Array(viewMat));
            gl.uniform1f(uClickWLoc, 24.0);

            const isDark = document.body.classList.contains('theme-dark') || 
                           document.documentElement.getAttribute('data-theme') === 'dark' ||
                           (!document.body.classList.contains('theme-light') && document.documentElement.getAttribute('data-theme') !== 'light');
            gl.uniform3f(uFrameColLoc, isDark ? 1.0 : 0.0, isDark ? 1.0 : 0.0, isDark ? 1.0 : 0.0);
            gl.uniform1f(uFrameALoc, isDark ? 0.20 : 0.14);

            gl.uniform3f(uBgLoc, isDark ? 0.043 : 0.972, isDark ? 0.059 : 0.980, isDark ? 0.090 : 0.988);

            let hoveredCard = null;

            cards.forEach(card => {
                   const targetBoost = card.isBoosted ? 1.0 : 0.0;
                card.boostK += (targetBoost - card.boostK) * 0.14;

                const speedMult = 1.0 - (card.boostK * 0.88);
                const directionFactor = card.baseSpeed >= 0 ? 1 : -1;
                const totalSpeed = (card.baseSpeed + (scrollVelocity * directionFactor * 2.2)) * speedMult;
                card.angle += totalSpeed;

                const cosA = Math.cos(card.angle);
                const sinA = Math.sin(card.angle);

                const currentRx = card.rx * zoomScale;
                const currentRy = card.ry * zoomScale;

                let posX = cosA * currentRx;
                let posY = sinA * currentRy;

                const normalizedDepth = (sinA + 1) / 2; 
                const baseScale = (0.76 + (normalizedDepth * 0.44)) * zoomScale;
                const boostScaleFactor = 1.0 + (card.boostK * 0.45);
                card.scale = baseScale * boostScaleFactor;

                let warp = 0;
                let aber = 0.002;
                let localMouseX = -99;
                let localMouseY = -99;
                let isHover = false;

                if (isMouseActive) {
                    const dx = mouseX - posX;
                    const dy = mouseY - posY;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq);

                    const cardW = card.width * card.scale;
                    const cardH = card.height * card.scale;
                    if (Math.abs(dx) <= cardW * 0.50 && Math.abs(dy) <= cardH * 0.50) {
                        isHover = true;
                        if (!hoveredCard || card.scale > hoveredCard.scale) {
                            hoveredCard = card;
                        }
                    }

                    const fieldPx = 340;
                    const tugPx = 18;
                    const mouseWarpPx = 180;

                    if (dist < fieldPx) {
                        const factor = Math.exp(-distSq / (fieldPx * fieldPx));
                        const tug = (tugPx * factor) / Math.max(1, dist);
                        posX += dx * tug;
                        posY += dy * tug;

                        warp = mouseWarpPx * factor;
                        aber = 0.003 + (0.032 * factor);
                    }

                    localMouseX = (mouseX - posX) / cardW;
                    localMouseY = (mouseY - posY) / cardH;
                }

                if (card.isBoosted && isMouseActive && !isHover) {
                    const dx = mouseX - posX;
                    const dy = mouseY - posY;
                    const cardW = card.width * card.scale;
                    const cardH = card.height * card.scale;
                    if (Math.abs(dx) > cardW * 0.75 || Math.abs(dy) > cardH * 0.75) {
                        card.isBoosted = false;
                    }
                }

                card.x = posX;
                card.y = posY;
                card.warp = warp;
                card.aber = aber;
                card.localMouseX = localMouseX;
                card.localMouseY = localMouseY;
                card.isHover = isHover;

                const orbitZ = (sinA * card.ry * 0.45) + (card.ringIndex * 14.0);
                const hoverZ = isHover ? 60.0 : 0.0;
                const boostZ = card.boostK * 160.0;
                card.z = orbitZ + hoverZ + boostZ;

                const centerRx = 560;
                const centerRy = 300;
                const normX = posX / centerRx;
                const normY = posY / centerRy;
                const distFromCenter = Math.sqrt(normX * normX + normY * normY);

                let fadeCenter = 0.0;
                let cardBlur = 0.0;
                if (distFromCenter < 1.0 && !card.isBoosted) {
                    const centerFactor = 1.0 - distFromCenter;
                    const smoothFactor = centerFactor * centerFactor * (3.0 - 2.0 * centerFactor);
                    fadeCenter = smoothFactor;
                    cardBlur = smoothFactor * 1.0;
                }

                const baseAlpha = 0.65 + (normalizedDepth * 0.35);
                const centerAlphaFactor = card.isBoosted ? 1.0 : (1.0 - (fadeCenter * 0.42));
                card.finalAlpha = Math.min(1.0, (baseAlpha * centerAlphaFactor) + (card.boostK * 0.35));
                card.fadeCenter = fadeCenter;
                card.cardBlur = cardBlur;

                const clickUniform = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                const c = card.clicks[0];
                if (c && c.amp > 0.01) {
                    const elapsed = nowSec - c.time;
                    c.radius = elapsed * 500;
                    c.amp = Math.max(0, 24 * (1 - elapsed / 0.8));
                    clickUniform[0] = c.x;
                    clickUniform[1] = c.y;
                    clickUniform[2] = c.radius;
                    clickUniform[3] = c.amp;
                }
                card.clickUniform = clickUniform;
            });

            canvas.style.cursor = hoveredCard ? 'pointer' : 'default';

            cards.sort((a, b) => (a.z - b.z) || (a.id - b.id));

            cards.forEach(card => {
                const modelMat = [
                    card.scale, 0, 0, 0,
                    0, card.scale, 0, 0,
                    0, 0, card.scale, 0,
                    card.x, card.y, card.z, 1
                ];

                gl.uniformMatrix4fv(uModelLoc, false, new Float32Array(modelMat));
                gl.uniform2f(uSizeLoc, card.width, card.height);
                gl.uniform1f(uRadiusLoc, card.radius);
                gl.uniform1f(uCurveLoc, 24.0);
                gl.uniform1f(uWarpLoc, card.warp);
                gl.uniform2f(uMouseLoc, card.localMouseX, card.localMouseY);
                gl.uniform1f(uAberLoc, card.aber);
                gl.uniform1f(uAlphaLoc, card.finalAlpha);
                gl.uniform1f(uBlurLoc, card.cardBlur);
                gl.uniform1f(uFadeCenterLoc, card.fadeCenter);
                gl.uniform4fv(uClickLoc, new Float32Array(card.clickUniform));
                gl.uniform1f(uImgAspectLoc, card.imgAspect || card.aspect || (card.width / card.height));
                gl.uniform1f(uCardAspectLoc, card.width / card.height);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, card.texture || dummyTex);

                gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
            });

            gl.bindVertexArray(null);

            if (isHeroVisible) {
                animFrameId = requestAnimationFrame(render);
            } else {
                animFrameId = null;
            }
        }

        let isHeroVisible = true;
        let animFrameId = null;

        function startLoop() {
            if (!animFrameId && isHeroVisible) {
                lastTime = performance.now();
                animFrameId = requestAnimationFrame(render);
            }
        }

        function stopLoop() {
            if (animFrameId) {
                cancelAnimationFrame(animFrameId);
                animFrameId = null;
            }
        }

        if ('IntersectionObserver' in window) {
            const heroObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isHeroVisible = entry.isIntersecting;
                    if (isHeroVisible) {
                        startLoop();
                    } else {
                        stopLoop();
                    }
                });
            }, { threshold: 0.05 });
            heroObserver.observe(orbitContainer);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopLoop();
            } else if (isHeroVisible) {
                startLoop();
            }
        });

        startLoop();
    });
})();
