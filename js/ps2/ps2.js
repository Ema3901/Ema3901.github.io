// =========================================================
//  ps2.js - utilidades compartidas para escenas low-poly
//  estilo PS2 / Nintendo DS (texturas pixeladas, flat shading,
//  aristas visibles, render a baja resolución y 30 fps).
//  Requiere un import map que defina "three".
// =========================================================
import * as THREE from 'three';

export { THREE };

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Aleatorio con semilla (texturas iguales en cada carga) ----------
export function makeRng(seed = 1) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ---------- Texturas ----------
export function nearest(tex) {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

export function canvasTexture(w, h, draw, { linear = false } = {}) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    draw(ctx, w, h);
    const t = nearest(new THREE.CanvasTexture(c));
    // PS2: filtrado bilineal (suave). PS1/pixel art: nearest.
    if (linear) {
        t.magFilter = THREE.LinearFilter;
        t.minFilter = THREE.LinearFilter;
    }
    return t;
}

/**
 * Convierte un modelo al look PS2: quita las aristas negras, usa sombreado
 * suave (salvo materiales marcados con userData.keepFlat) y filtrado bilineal.
 */
export function ps2ify(obj) {
    const lines = [];
    obj.traverse((o) => {
        if (o.isLineSegments) lines.push(o);
        if (!o.isMesh) return;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            if (m.flatShading && !m.userData.keepFlat) {
                m.flatShading = false;
                m.needsUpdate = true;
            }
            if (m.map && m.map.magFilter !== THREE.LinearFilter) {
                m.map.magFilter = THREE.LinearFilter;
                m.map.minFilter = THREE.LinearFilter;
                m.map.needsUpdate = true;
            }
        });
    });
    lines.forEach((l) => l.parent.remove(l));
}

// ---------- Sombreado "horneado" (estilo texturas pintadas a mano) ----------
// En vez de luces en tiempo real, cada vértice guarda su color de luz/sombra.
// Sombra fría (azul-lila), luz cálida suave y un poco de oclusión hacia abajo.
const BAKE_LIGHT = new THREE.Vector3(0.45, 0.75, 0.55).normalize();

export function unlit(mapOrColor, extra = {}) {
    const opts = { vertexColors: true, ...extra };
    if (mapOrColor && mapOrColor.isTexture) opts.map = mapOrColor;
    else if (mapOrColor != null) opts.color = new THREE.Color(mapOrColor);
    return new THREE.MeshBasicMaterial(opts);
}

/**
 * Pinta en cada vértice la iluminación de la escena (una sola vez).
 * Las normales y posiciones se toman en coordenadas del mundo al momento de llamarla.
 * opts: { shadow, light, ao, aoTop, aoBottom, strength }
 */
export function bakeVertexLight(obj, opts = {}) {
    const {
        shadow = new THREE.Color('#8E93C4'),    // tono de sombra (frío)
        light = new THREE.Color('#FFF6EC'),     // tono de luz (cálido)
        ao = 0.22,                               // cuánto se oscurece hacia abajo
        aoTop = 2.2,
        aoBottom = 0,
        strength = 1
    } = opts;
    obj.updateMatrixWorld(true);
    const n = new THREE.Vector3();
    const p = new THREE.Vector3();
    const nm = new THREE.Matrix3();
    const c = new THREE.Color();
    obj.traverse((o) => {
        if (!o.isMesh || !o.material || !(Array.isArray(o.material) ? o.material : [o.material]).some((mm) => mm.vertexColors)) return;
        let geo = o.geometry;
        if (geo.userData.baked) { geo = geo.clone(); o.geometry = geo; }
        geo.userData.baked = true;
        if (!geo.attributes.normal) geo.computeVertexNormals();
        const pos = geo.attributes.position;
        const nor = geo.attributes.normal;
        const cols = new Float32Array(pos.count * 3);
        nm.getNormalMatrix(o.matrixWorld);
        for (let i = 0; i < pos.count; i++) {
            n.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
            p.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
            // wrap lighting suave (como pintado), mezcla de sombra fría a luz cálida
            let l = (n.dot(BAKE_LIGHT) * 0.5 + 0.5);
            l = Math.pow(l, 1.15);
            c.copy(shadow).lerp(light, l);
            // oclusión hacia abajo
            const k = THREE.MathUtils.clamp((p.y - aoBottom) / (aoTop - aoBottom), 0, 1);
            c.multiplyScalar(1 - ao * (1 - k));
            // borde suave (fresnel) claro
            const rim = Math.pow(1 - Math.max(0, n.z), 3) * 0.12;
            c.r += rim; c.g += rim; c.b += rim * 1.1;
            if (strength !== 1) c.lerp(new THREE.Color(1, 1, 1), 1 - strength);
            cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    });
}

/** Cambia todos los materiales Lambert de un objeto por materiales sin luz con vertex color. */
export function toUnlit(obj) {
    obj.traverse((o) => {
        if (!o.isMesh) return;
        const conv = (mm) => {
            if (!mm.isMeshLambertMaterial) return mm;
            const u = new THREE.MeshBasicMaterial({
                map: mm.map || null,
                color: mm.color ? mm.color.clone() : 0xffffff,
                vertexColors: true,
                transparent: mm.transparent,
                opacity: mm.opacity,
                side: mm.side,
                depthWrite: mm.depthWrite
            });
            if (u.map) { u.map.magFilter = THREE.LinearFilter; u.map.minFilter = THREE.LinearFilter; u.map.needsUpdate = true; }
            return u;
        };
        o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
    });
}

export function px(ctx, x, y, color, w = 1, h = 1) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// Ruido + iluminación "horneada" en bandas (más oscuro hacia abajo)
export function bake(ctx, w, h, { noise = 0.06, shade = 0.16, bands = 4, rand = Math.random } = {}) {
    for (let y = 0; y < h; y++) {
        const band = Math.floor((y / h) * bands) / bands;
        ctx.fillStyle = `rgba(0,0,0,${(band * shade).toFixed(3)})`;
        ctx.fillRect(0, y, w, 1);
    }
    for (let i = 0; i < w * h * 0.25; i++) {
        const x = Math.floor(rand() * w);
        const y = Math.floor(rand() * h);
        ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${noise})` : `rgba(0,0,0,${noise})`;
        ctx.fillRect(x, y, 1, 1);
    }
}

// Cielo en pocas bandas de color (banding retro intencional)
export function skyTexture(dark) {
    const steps = 14;
    return canvasTexture(1, steps, (ctx) => {
        const top = dark ? [11, 30, 42] : [126, 214, 204];
        const bot = dark ? [33, 78, 82] : [255, 246, 224];
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            const col = top.map((v, k) => Math.round(v + (bot[k] - v) * t));
            px(ctx, 0, i, `rgb(${col})`);
        }
    });
}

// ---------- Materiales y mallas ----------
// "Wobble" de PS1: los vértices se ajustan a una cuadrícula de baja resolución,
// por eso las figuras tiemblan un poquito al moverse.
const SNAP = { value: new THREE.Vector2(60, 60) };

function ps1Snap(mat) {
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uSnap = SNAP;
        shader.vertexShader = 'uniform vec2 uSnap;\n' + shader.vertexShader.replace(
            '#include <project_vertex>',
            '#include <project_vertex>\n\tgl_Position.xy = floor(gl_Position.xy / gl_Position.w * uSnap + 0.5) / uSnap * gl_Position.w;'
        );
    };
    mat.customProgramCacheKey = () => 'ps1snap';
    return mat;
}

export function lambert(mapOrColor, extra = {}) {
    const { snap = true, ...rest } = extra;
    const opts = { flatShading: true, ...rest };
    if (mapOrColor && mapOrColor.isTexture) opts.map = mapOrColor;
    else if (mapOrColor != null) opts.color = new THREE.Color(mapOrColor);
    const m = new THREE.MeshLambertMaterial(opts);
    return snap ? ps1Snap(m) : m;
}

const edgeMats = new Map();
function edgeMaterial(opacity) {
    if (!edgeMats.has(opacity)) {
        edgeMats.set(opacity, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity }));
    }
    return edgeMats.get(opacity);
}

// Aristas visibles de los polígonos
export function withEdges(m, opacity = 0.3, thresholdAngle = 1) {
    if (opacity > 0) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, thresholdAngle), edgeMaterial(opacity)));
    return m;
}

/**
 * Crea una malla en una línea.
 * mesh(geo, mat, { pos:[x,y,z], rot:[x,y,z], scale:[x,y,z]|n, edges:0.3, parent })
 */
export function mesh(geo, mat, { pos, rot, scale, edges = 0.3, parent } = {}) {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (scale != null) Array.isArray(scale) ? m.scale.set(...scale) : m.scale.setScalar(scale);
    withEdges(m, edges);
    if (parent) parent.add(m);
    return m;
}

// Sombra "blob" típica de juegos de PS2
export function blobShadow(radius = 1, opacity = 0.22) {
    const s = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 8),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity, depthWrite: false })
    );
    s.rotation.x = -Math.PI / 2;
    return s;
}

// Pedestal octagonal tipo figura coleccionable (turquesa de la página)
export function pedestal(radius = 0.9, height = 0.24, rand = Math.random) {
    const side = canvasTexture(32, 8, (ctx, w, h) => {
        px(ctx, 0, 0, '#1FA89A', w, h);
        px(ctx, 0, 0, '#5FE0D1', w, 1);
        px(ctx, 0, h - 1, '#127A70', w, 1);
        bake(ctx, w, h, { noise: 0.05, shade: 0.2, bands: 3, rand });
    });
    const top = canvasTexture(16, 16, (ctx, w, h) => {
        px(ctx, 0, 0, '#33CCBB', w, h);
        for (let y = 0; y < h; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < w; x += 8) px(ctx, x, y, '#2EBBAA', 4, 4);
        bake(ctx, w, h, { noise: 0.05, shade: 0, bands: 1, rand });
    });
    const geo = new THREE.CylinderGeometry(radius, radius * 1.08, height, 8);
    const m = mesh(geo, [lambert(side), lambert(top), lambert('#127A70')], { edges: 0.45 });
    m.position.y = height / 2;
    return m;
}

// ---------- Escena ----------
/**
 * Crea una escena PS2 dentro de `container`.
 * Devuelve null si no hay WebGL (se queda visible el contenido de respaldo).
 */
export function createStage(container, opts = {}) {
    const {
        pixel = 3,
        fov = 35,
        camera: camPos = [0, 1, 6],
        target = [0, 1, 0],
        sky = false,
        baseYaw = 0,
        sway = 0.35,
        swaySpeed = 0.5,
        fixedYaw = null,      // solo para capturas de vista previa
        fixedTime = null,
        interactive = true    // false = escena tipo "imagen" (sin arrastrar)
    } = opts;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: !sky,
            preserveDrawingBuffer: true,
            powerPreference: 'low-power'
        });
    } catch (e) {
        return null;
    }
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
    if (sky) {
        scene.background = skyTexture(isDark());
        new MutationObserver(() => {
            scene.background.dispose();
            scene.background = skyTexture(isDark());
            needsRender = true;
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 60);
    camera.position.set(...camPos);
    camera.lookAt(...target);

    scene.add(new THREE.HemisphereLight(0xfff6e0, 0x4a5a5a, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(3, 5, 4);
    scene.add(sun);

    const root = new THREE.Group();
    scene.add(root);

    // Resolución baja: cada pixel del render = `pixel` x `pixel` en pantalla
    let needsRender = true;
    const resize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        renderer.setSize(Math.max(1, Math.round(w / pixel)), Math.max(1, Math.round(h / pixel)), false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        needsRender = true;
    };
    new ResizeObserver(resize).observe(container);
    resize();

    // Arrastrar para girar
    let userYaw = 0;
    let dragging = false;
    let lastX = 0;
    if (interactive) {
        container.addEventListener('pointerdown', (e) => {
            dragging = true;
            lastX = e.clientX;
            container.setPointerCapture(e.pointerId);
        });
        container.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            userYaw += (e.clientX - lastX) * 0.012;
            lastX = e.clientX;
            needsRender = true;
        });
        const stopDrag = () => { dragging = false; };
        container.addEventListener('pointerup', stopDrag);
        container.addEventListener('pointercancel', stopDrag);
    }

    // Pausa cuando no está en pantalla (o el modal está cerrado)
    let visible = true;
    new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) needsRender = true;
    }).observe(container);

    // Loop a ~30 fps
    let update = null;
    let t = 0;
    let acc = 0;
    const FRAME = 1 / 30;
    const clock = new THREE.Clock();

    const frame = () => {
        requestAnimationFrame(frame);
        const dt = Math.min(clock.getDelta(), 0.1);
        if (!visible) return;
        acc += dt;
        if (acc < FRAME) return;
        const step = acc;
        acc = 0;

        const idle = reduceMotion && !dragging && Math.abs(userYaw) < 0.001;
        if (idle && !needsRender) return;

        if (!reduceMotion) t += step;
        if (fixedTime != null) t = fixedTime;
        if (!dragging) userYaw *= 0.95;
        root.rotation.y = fixedYaw != null
            ? fixedYaw
            : baseYaw + (reduceMotion ? 0 : Math.sin(t * swaySpeed) * sway) + userYaw;
        if (update) update(t, step);

        // cuadrícula del wobble: ~3 pixeles del render por paso
        SNAP.value.set(renderer.domElement.width / 3, renderer.domElement.height / 3);
        renderer.render(scene, camera);
        needsRender = false;
    };

    return {
        THREE,
        scene,
        camera,
        renderer,
        root,
        start(fn) {
            update = fn || null;
            frame();
            container.classList.add('ready');
        }
    };
}
