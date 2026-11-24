// =========================================================
//  Ema - escena de bienvenida low-poly estilo Sinaboto / PS1
//  Toma de medio cuerpo saludando, cara anime pintada en la
//  textura, fondo de oficina. Se ve como "imagen", sin arrastrar.
//  Rasgos: mullet negro con puntas verdes, lentes sin marco,
//  playera azul marino, chaleco de seguridad, lanyard, pin y arete.
// =========================================================
import { THREE, createStage, canvasTexture, px, bake, lambert, mesh, makeRng } from './ps2.js';

const rand = makeRng(301);

// ---------- Paleta ----------
const SKIN = '#E9B892';
const SKIN_SH = '#D39C78';
const HAIR = '#1C1A1E';
const HAIR_HI = '#38343E';
const GREEN = '#3E9E78';
const GREEN_HI = '#74D6A8';
const NAVY = '#22305A';
const LINE = '#1A1214';

// ---------- Cara (textura equirectangular de la esfera; el frente está en x = 32) ----------
function drawFace(ctx, w, h, happy) {
    px(ctx, 0, 0, SKIN, w, h);
    px(ctx, 0, 50, SKIN_SH, w, h - 50);           // sombra bajo la barbilla

    const ey = 33;
    for (const [ex, outer] of [[25, -1], [39, 1]]) {
        if (happy) {
            // ojos cerrados felices  ^ ^
            const arc = [[-3, 1], [-2, 0], [-1, -1], [0, -1], [1, 0], [2, 1]];
            arc.forEach(([dx, dy]) => px(ctx, ex + dx, ey + dy, LINE, 1, 2));
        } else {
            px(ctx, ex - 3, ey - 2, '#F7F2EE', 6, 6);          // blanco
            px(ctx, ex - 2, ey - 2, '#4A2C22', 4, 6);          // iris
            px(ctx, ex - 2, ey - 2, '#2A1814', 4, 2);          // sombra superior del iris
            px(ctx, ex - 2, ey + 3, '#7A4A36', 4, 1);          // reflejo inferior
            px(ctx, ex - 1, ey - 1, '#FFFFFF');                // brillos
            px(ctx, ex + 1, ey + 2, '#FFFFFF');
            px(ctx, ex - 4, ey - 4, LINE, 8, 2);               // pestañas superiores (gruesas)
            px(ctx, outer < 0 ? ex - 5 : ex + 4, ey - 3, LINE); // "colita" exterior
            px(ctx, ex - 2, ey + 4, '#A0705C', 4, 1);          // pestaña inferior
        }
        // cejas (casi tapadas por el fleco)
        px(ctx, ex - 3, ey - 7, '#2A2020', 6, 1);
        // lentes sin marco: tinte azulado + brillo + borde inferior apenas visible
        ctx.fillStyle = 'rgba(170,195,255,0.22)';
        ctx.fillRect(ex - 5, ey - 5, 10, 11);
        px(ctx, ex - 5, ey + 5, 'rgba(255,255,255,0.55)', 10, 1);
        px(ctx, ex + 1, ey - 4, 'rgba(255,255,255,0.7)', 2, 1);
        px(ctx, ex + 2, ey - 3, 'rgba(255,255,255,0.7)', 1, 1);
    }
    // puente y patitas de los lentes
    px(ctx, 30, ey - 3, '#C8CDD4', 5, 1);
    px(ctx, 13, ey - 3, '#C8CDD4', 7, 1);
    px(ctx, 44, ey - 3, '#C8CDD4', 7, 1);

    // nariz
    px(ctx, 32, 39, '#C98A68');

    // boca abierta sonriendo  :D
    px(ctx, 29, 42, '#6A2A2A', 7, 1);
    px(ctx, 29, 43, '#8E3A3A', 7, 1);
    px(ctx, 30, 44, '#8E3A3A', 5, 1);
    px(ctx, 31, 44, '#E2777F', 3, 1);
    px(ctx, 31, 45, '#6A2A2A', 3, 1);
    px(ctx, 29, 43, '#6A2A2A');
    px(ctx, 35, 43, '#6A2A2A');

    // rubor con rayitas
    for (const bx of [18, 42]) {
        ctx.fillStyle = 'rgba(240,130,130,0.35)';
        ctx.fillRect(bx, 39, 5, 2);
        px(ctx, bx + 1, 39, '#E88A8A');
        px(ctx, bx + 3, 39, '#E88A8A');
    }
}

const faceOpen = canvasTexture(128, 64, (ctx, w, h) => drawFace(ctx, w, h, false));
const faceHappy = canvasTexture(128, 64, (ctx, w, h) => drawFace(ctx, w, h, true));

// ---------- Pelo ----------
// En el cono (apuntando hacia abajo) la fila superior del canvas es la punta
function hairGradient(greenRows) {
    return canvasTexture(4, 32, (ctx, w, h) => {
        px(ctx, 0, 0, HAIR, w, h);
        px(ctx, 1, 0, HAIR_HI, 1, h);
        for (let y = 0; y < greenRows; y++) {
            const t = y / Math.max(1, greenRows - 1);
            px(ctx, 0, y, t < 0.35 ? GREEN_HI : GREEN, w, 1);
        }
        if (greenRows) px(ctx, 0, greenRows, '#2B5C4A', w, 2);
    });
}
const tipsMat = lambert(hairGradient(14));
const bangsMat = lambert(hairGradient(5));
const bangsDarkMat = lambert(hairGradient(0));

const capTex = canvasTexture(32, 16, (ctx, w, h) => {
    px(ctx, 0, 0, HAIR, w, h);
    for (let x = 0; x < w; x += 2) px(ctx, x, 5, HAIR_HI, 1, 2);     // brillo tipo anime
    for (let i = 0; i < 6; i++) px(ctx, Math.floor(rand() * w), 8 + Math.floor(rand() * 8), GREEN, 1, 3);
});
const capMat = lambert(capTex);

const lockGeo = (() => {
    const g = new THREE.ConeGeometry(1, 1, 4, 1);
    g.rotateY(Math.PI / 4);   // cara plana hacia el frente
    g.rotateX(Math.PI);       // punta hacia abajo
    return g;
})();

// Mechón de pelo desde (y0, r0) hasta (y1, r1), a un ángulo alrededor de la cabeza
function lock(parent, angle, y0, r0, y1, r1, width, mat, thick = 0.42) {
    const pivot = new THREE.Group();
    pivot.rotation.y = angle;
    parent.add(pivot);
    const len = Math.hypot(y0 - y1, r1 - r0);
    const m = new THREE.Mesh(lockGeo, mat);
    m.position.set(0, (y0 + y1) / 2, (r0 + r1) / 2);
    m.rotation.x = -Math.asin((r1 - r0) / len);
    m.scale.set(width, len, width * thick);
    pivot.add(m);
    return pivot;
}

// ---------- Ropa ----------
const shirtMat = lambert(canvasTexture(16, 16, (ctx, w, h) => {
    px(ctx, 0, 0, NAVY, w, h);
    bake(ctx, w, h, { noise: 0.04, shade: 0.18, bands: 4, rand });
}));

// Chaleco: u=0 y u=1 son las orillas del frente (bandas fluorescentes + reflejante)
const vestTex = canvasTexture(64, 32, (ctx, w, h) => {
    px(ctx, 0, 0, '#26292F', w, h);
    for (let y = 0; y < h; y += 2) for (let x = (y / 2) % 2; x < w; x += 2) px(ctx, x, y, '#30343B');
    for (const x0 of [0, w - 7]) {
        px(ctx, x0, 0, '#D8F03A', 7, h);
        px(ctx, x0 + 2, 0, '#D3D8DE', 3, h);
    }
    px(ctx, 0, 22, '#D8F03A', w, 5);
    px(ctx, 0, 23, '#D3D8DE', w, 3);
    bake(ctx, w, h, { noise: 0.04, shade: 0.12, bands: 3, rand });
});
const vestMat = lambert(vestTex, { side: THREE.DoubleSide });

const lanyardMat = lambert(canvasTexture(4, 16, (ctx, w, h) => {
    for (let y = 0; y < h; y++) px(ctx, 0, y, y % 4 < 2 ? '#F4F7F2' : '#5BC08E', w, 1);
}));

const pinTex = canvasTexture(8, 8, (ctx, w, h) => {
    px(ctx, 0, 0, '#B23A3A', w, h);
    px(ctx, 2, 1, '#F0D9C8', 4, 4);
    px(ctx, 2, 1, '#3A2A2A', 4, 1);
    px(ctx, 3, 5, '#E9C24A', 2, 2);
});

const skinMat = lambert(SKIN, { flatShading: false });
const silverMat = lambert('#D7DBE0');

// ---------- Personaje ----------
function buildEma() {
    const g = new THREE.Group();
    const HEAD_Y = 1.62;

    // ---- Torso ----
    const torso = mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.95, 12), shirtMat, { pos: [0, 0.58, 0], scale: [1, 1, 0.62], edges: 0, parent: g });
    for (const sx of [-1, 1]) {
        mesh(new THREE.SphereGeometry(0.17, 8, 6), shirtMat, { pos: [sx * 0.42, 0.97, 0], scale: [1, 0.8, 0.8], edges: 0, parent: g });
    }
    // cuello de la playera
    mesh(new THREE.TorusGeometry(0.15, 0.035, 4, 10), lambert('#1A2547'), { pos: [0, 1.05, 0.02], rot: [Math.PI / 2, 0, 0], scale: [1, 0.75, 1], edges: 0, parent: g });

    // ---- Chaleco abierto al frente ----
    const gap = 0.95;
    mesh(new THREE.CylinderGeometry(0.445, 0.505, 0.8, 14, 1, true, gap / 2, Math.PI * 2 - gap), vestMat, { pos: [0, 0.52, 0], scale: [1, 1, 0.64], edges: 0, parent: g });
    for (const sx of [-1, 1]) {
        mesh(new THREE.BoxGeometry(0.13, 0.04, 0.5), lambert('#26292F'), { pos: [sx * 0.27, 1.0, 0], edges: 0, parent: g });
    }

    // ---- Lanyard (dos tiras que bajan al centro) + gafete ----
    for (const sx of [-1, 1]) {
        const a = [sx * 0.12, 1.06], b = [sx * 0.02, 0.52];
        const len = Math.hypot(a[0] - b[0], a[1] - b[1]);
        mesh(new THREE.BoxGeometry(0.045, len, 0.012), lanyardMat, {
            pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.3],
            rot: [0, 0, Math.atan2(a[0] - b[0], a[1] - b[1])],
            edges: 0, parent: g
        });
    }
    mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), silverMat, { pos: [0, 0.5, 0.31], edges: 0, parent: g });

    // ---- Pin ----
    mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 10), [lambert('#8A2B2B'), lambert(pinTex), lambert('#8A2B2B')], { pos: [-0.29, 0.62, 0.255], rot: [Math.PI / 2, 0, 0], edges: 0, parent: g });

    // ---- Brazo abajo (izquierdo del personaje, a la derecha de la imagen) ----
    const restArm = new THREE.Group();
    restArm.position.set(0.47, 0.95, 0);
    restArm.rotation.z = 0.12;
    g.add(restArm);
    mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.6, 7), shirtMat, { pos: [0, -0.3, 0], edges: 0, parent: restArm });

    // ---- Brazo saludando (derecho del personaje, a la izquierda de la imagen) ----
    const wave = new THREE.Group();
    wave.position.set(-0.46, 0.95, 0.02);
    wave.rotation.z = 0.72;
    g.add(wave);
    mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.44, 7), shirtMat, { pos: [0, 0.22, 0], edges: 0, parent: wave });

    const elbow = new THREE.Group();
    elbow.position.y = 0.43;
    wave.add(elbow);
    mesh(new THREE.SphereGeometry(0.09, 7, 5), shirtMat, { edges: 0, parent: elbow });
    mesh(new THREE.CylinderGeometry(0.075, 0.088, 0.36, 7), shirtMat, { pos: [0, 0.18, 0], edges: 0, parent: elbow });

    const hand = new THREE.Group();
    hand.position.y = 0.37;
    elbow.add(hand);
    mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.06, 7), skinMat, { pos: [0, 0.01, 0], edges: 0, parent: hand });  // muñeca
    mesh(new THREE.BoxGeometry(0.17, 0.16, 0.06), skinMat, { pos: [0, 0.1, 0], edges: 0, parent: hand });
    [-0.06, -0.02, 0.02, 0.06].forEach((x, i) => {
        const len = [0.1, 0.125, 0.12, 0.1][i];
        mesh(new THREE.BoxGeometry(0.036, len, 0.05), skinMat, { pos: [x * 1.05, 0.18 + len / 2, 0], rot: [0, 0, -x * 1.6], edges: 0, parent: hand });
    });
    mesh(new THREE.BoxGeometry(0.04, 0.1, 0.05), skinMat, { pos: [0.1, 0.09, 0.01], rot: [0, 0, -0.75], edges: 0, parent: hand });

    // ---- Cuello ----
    mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.28, 8), skinMat, { pos: [0, 1.17, 0], edges: 0, parent: g });

    // ---- Cabeza (esfera con mandíbula afilada estilo anime) ----
    const head = new THREE.Group();
    head.position.y = HEAD_Y;
    g.add(head);

    const R = 0.42;
    const headGeo = new THREE.SphereGeometry(R, 14, 10);
    const p = headGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        let x = p.getX(i) * 1.04, y = p.getY(i), z = p.getZ(i);
        if (y < 0) {
            const k = -y / R;
            x *= 1 - 0.34 * k;
            z *= 1 - 0.16 * k;
            y *= 1.1;
        }
        p.setXYZ(i, x, y, z);
    }
    headGeo.computeVertexNormals();
    const faceMat = lambert(faceOpen, { flatShading: false });
    head.add(new THREE.Mesh(headGeo, faceMat));

    // arete
    mesh(new THREE.TorusGeometry(0.03, 0.009, 3, 8), silverMat, { pos: [0.4, -0.16, 0.1], rot: [0, Math.PI / 2, 0], edges: 0, parent: head });
    mesh(new THREE.ConeGeometry(0.018, 0.06, 4), silverMat, { pos: [0.4, -0.22, 0.1], rot: [Math.PI, 0, 0], edges: 0, parent: head });

    // ---- Pelo ----
    const hair = new THREE.Group();
    head.add(hair);

    // casco (inclinado hacia atrás para dejar libre la frente)
    const cap = mesh(new THREE.SphereGeometry(0.455, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), capMat, { pos: [0, 0.03, -0.01], rot: [-0.34, 0, 0], scale: [1.05, 1, 1], edges: 0, parent: hair });

    // fleco con raya en medio
    const bangs = [
        [-0.62, 0.30, 0.27, 0.00, 0.44, 0.15, bangsMat],
        [-0.38, 0.33, 0.25, 0.06, 0.45, 0.14, bangsDarkMat],
        [-0.14, 0.34, 0.24, 0.10, 0.45, 0.12, bangsMat],
        [0.14, 0.34, 0.24, 0.10, 0.45, 0.12, bangsDarkMat],
        [0.38, 0.33, 0.25, 0.06, 0.45, 0.14, bangsMat],
        [0.62, 0.30, 0.27, 0.00, 0.44, 0.15, bangsDarkMat]
    ];
    bangs.forEach(([a, y0, r0, y1, r1, wdt, m]) => lock(hair, a, y0, r0, y1, r1, wdt, m));

    // mechones largos de los lados (enmarcan la cara, puntas verdes)
    for (const sx of [-1, 1]) {
        lock(hair, sx * 0.95, 0.22, 0.4, -0.55, 0.42, 0.14, tipsMat);
        lock(hair, sx * 1.3, 0.2, 0.43, -0.62, 0.47, 0.15, tipsMat);
        lock(hair, sx * 1.65, 0.18, 0.44, -0.7, 0.5, 0.16, tipsMat);
    }
    // mullet atrás
    for (let i = 0; i < 9; i++) {
        const a = Math.PI * 0.58 + (i / 8) * Math.PI * 0.84;
        lock(hair, a, 0.2, 0.44, -0.78 - (i % 2) * 0.06, 0.52, 0.17, tipsMat);
    }
    return { g, head, wave, elbow, hand, faceMat, torso, cap };
}

// ---------- Fondo: oficina ----------
function buildRoom(scene) {
    const room = new THREE.Group();
    scene.add(room);
    const flat = (m) => m;   // sin aristas: estilo Sinaboto

    const wallTex = canvasTexture(32, 32, (ctx, w, h) => {
        px(ctx, 0, 0, '#E4E9EC', w, h);
        for (let x = 0; x < w; x += 16) px(ctx, x, 0, '#D3DADF', 1, h);
        px(ctx, 0, h - 3, '#9AA4AC', w, 3);
        bake(ctx, w, h, { noise: 0.03, shade: 0.08, bands: 3, rand });
    });
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(3, 2);
    flat(mesh(new THREE.PlaneGeometry(7, 4.6), lambert(wallTex), { pos: [0, 1.4, -2.4], edges: 0, parent: room }));

    // techo de plafones
    const ceilTex = canvasTexture(16, 16, (ctx, w, h) => {
        px(ctx, 0, 0, '#F1F3F2', w, h);
        px(ctx, 0, 0, '#C9CFD3', w, 1);
        px(ctx, 0, 0, '#C9CFD3', 1, h);
        bake(ctx, w, h, { noise: 0.04, shade: 0, bands: 1, rand });
    });
    ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping;
    ceilTex.repeat.set(7, 4);
    mesh(new THREE.PlaneGeometry(7, 4), lambert(ceilTex), { pos: [0, 3.0, -0.4], rot: [Math.PI / 2, 0, 0], edges: 0, parent: room });

    // piso
    mesh(new THREE.PlaneGeometry(7, 5), lambert('#8C98A3'), { pos: [0, -0.3, -0.4], rot: [-Math.PI / 2, 0, 0], edges: 0, parent: room });

    // cajas de cartón apiladas (como en la foto)
    const boxTex = canvasTexture(16, 16, (ctx, w, h) => {
        px(ctx, 0, 0, '#C49A6C', w, h);
        px(ctx, 7, 0, '#D9B98A', 2, h);
        px(ctx, 0, 0, '#A57E54', w, 1);
        px(ctx, 2, 10, '#F2F2EE', 4, 3);
        bake(ctx, w, h, { noise: 0.05, shade: 0.15, bands: 3, rand });
    });
    const boxMat = lambert(boxTex);
    [[1.25, 0.25, -1.9, 0.9, 0.7, 0.7, 0.1], [1.3, 0.95, -1.95, 0.8, 0.6, 0.6, -0.08], [1.2, 1.55, -1.9, 0.7, 0.55, 0.55, 0.15],
     [-1.35, 2.1, -2.0, 0.8, 0.55, 0.6, -0.1], [-0.6, 2.25, -2.1, 0.7, 0.5, 0.5, 0.05]].forEach(([x, y, z, w, h, d, ry]) => {
        mesh(new THREE.BoxGeometry(w, h, d), boxMat, { pos: [x, y, z], rot: [0, ry, 0], edges: 0, parent: room });
    });

    // gabinete gris
    const cabTex = canvasTexture(16, 32, (ctx, w, h) => {
        px(ctx, 0, 0, '#A9AFB5', w, h);
        for (let y = 7; y < h; y += 8) px(ctx, 0, y, '#8B9197', w, 1);
        for (let y = 3; y < h; y += 8) px(ctx, 6, y, '#6E747A', 4, 1);
        bake(ctx, w, h, { noise: 0.04, shade: 0.12, bands: 3, rand });
    });
    mesh(new THREE.BoxGeometry(0.8, 1.9, 0.6), lambert(cabTex), { pos: [-1.5, 0.65, -1.9], rot: [0, 0.2, 0], edges: 0, parent: room });

    // monitor con código turquesa
    const screenTex = canvasTexture(32, 20, (ctx, w, h) => {
        px(ctx, 0, 0, '#2A2D33', w, h);
        px(ctx, 1, 1, '#0F1A1F', w - 2, h - 2);
        for (let y = 3; y < h - 2; y += 2) px(ctx, 3 + (y % 4 ? 2 : 0), y, y % 6 ? '#33CCBB' : '#FFD166', 6 + Math.floor(rand() * 16), 1);
    });
    const monitor = new THREE.Group();
    monitor.position.set(1.05, 0.95, -0.9);
    monitor.rotation.y = -0.45;
    room.add(monitor);
    const dark = lambert('#2A2D33');
    mesh(new THREE.BoxGeometry(0.75, 0.48, 0.05), [dark, dark, dark, dark, lambert(screenTex), dark], { edges: 0, parent: monitor });
    mesh(new THREE.BoxGeometry(0.08, 0.3, 0.06), dark, { pos: [0, -0.36, -0.03], edges: 0, parent: monitor });

    return room;
}

// ---------- Montaje ----------
export function mount(container, opts = {}) {
    const stage = createStage(container, {
        pixel: 2,
        fov: 30,
        camera: [0, 1.4, 4.15],
        target: [0, 1.28, 0],
        baseYaw: 0.1,
        sway: 0,
        interactive: false,
        ...opts
    });
    if (!stage) return null;

    const { scene, root } = stage;
    scene.background = new THREE.Color('#E4E9EC');
    scene.fog = new THREE.Fog('#E9EEF0', 3.6, 8);

    // Luz suave y brillante (look de Sinaboto)
    scene.children.filter((o) => o.isLight).forEach((l) => scene.remove(l));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9aa0, 1.7));
    const key = new THREE.DirectionalLight(0xfff4e6, 1.25);
    key.position.set(2, 3, 4);
    scene.add(key);

    buildRoom(scene);

    const ema = buildEma();
    root.position.x = 0.12;
    root.add(ema.g);

    let nextBlink = 2.5;
    stage.start((t) => {
        // saludo
        ema.elbow.rotation.z = -0.86 + Math.sin(t * 7) * 0.32;
        ema.hand.rotation.z = Math.sin(t * 7 - 0.7) * 0.14;
        ema.wave.rotation.z = 0.72 + Math.sin(t * 7) * 0.04;
        // idle: respiración y cabeza ladeada
        ema.g.position.y = Math.sin(t * 2) * 0.008;
        ema.head.rotation.z = 0.07 + Math.sin(t * 1.3) * 0.025;
        ema.head.rotation.y = -0.05 + Math.sin(t * 0.8) * 0.05;
        // parpadeo con ojitos felices
        const blinking = t > nextBlink && t < nextBlink + 0.16;
        ema.faceMat.map = blinking ? faceHappy : faceOpen;
        if (t > nextBlink + 0.16) nextBlink = t + 2.5 + Math.random() * 2.5;
    });

    return stage;
}
