// =========================================================
//  Ema chibi low-poly (estilo figura simple de PS1/PS2)
//  Cabeza grande con cara plana dibujada, pelo en piezas
//  angulares, cuerpo de formas simples y fondo de cuadros.
//  Rasgos: jellyfish cut negro con puntas menta, frente algo
//  descubierta, lentes sin marco, arete de cruz, sudadera azul
//  marino, chaleco negro con reflejante amarillo, lanyard y pin.
// =========================================================
import { THREE, createStage, canvasTexture, px, lambert } from './ps2.js';

// ---------- Paleta ----------
const SKIN = '#E6B48F';
const HAIR = '#1B1A20';
const HAIR_HI = '#34323C';
const MINT = '#86DDBD';
const MINT_DK = '#3FA987';
const NAVY = '#24305A';
const VEST = '#1E2024';
const NEON = '#E3F23A';
const PANTS = '#2B2F3A';
const SHOES = '#3B2B24';
const INK = '#141016';

const soft = (c, extra = {}) => lambert(c, { flatShading: false, snap: false, ...extra });
const flat = (c, extra = {}) => lambert(c, { flatShading: true, snap: false, ...extra });

function m(geo, material, { pos, rot, scale, parent } = {}) {
    const o = new THREE.Mesh(geo, material);
    if (pos) o.position.set(...pos);
    if (rot) o.rotation.set(...rot);
    if (scale != null) Array.isArray(scale) ? o.scale.set(...scale) : o.scale.setScalar(scale);
    if (parent) parent.add(o);
    return o;
}

// ---------- Cara (se pinta en la cara frontal de la cabeza) ----------
function faceTexture(blink = false) {
    return canvasTexture(128, 128, (ctx, w, h) => {
        px(ctx, 0, 0, SKIN, w, h);

        const ey = 72;
        for (const ex of [45, 83]) {
            if (blink) {
                ctx.strokeStyle = INK;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(ex - 7, ey + 2);
                ctx.lineTo(ex + 7, ey + 2);
                ctx.stroke();
            } else {
                // ojo: contorno negro, blanco, pupila grande y brillo
                ctx.fillStyle = INK;
                ctx.beginPath(); ctx.ellipse(ex, ey, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath(); ctx.ellipse(ex, ey, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = INK;
                ctx.beginPath(); ctx.ellipse(ex + (ex < 64 ? 1 : -1), ey + 1.5, 4, 6.5, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath(); ctx.arc(ex - 1.5, ey - 2.5, 1.8, 0, Math.PI * 2); ctx.fill();
            }
            // cejas rectas
            ctx.fillStyle = '#2A1E1C';
            ctx.fillRect(ex - 8, ey - 17, 16, 3);
        }

        // lentes sin marco: tinte azulado, borde inferior claro, puente y patitas
        ctx.fillStyle = 'rgba(170,195,255,0.16)';
        ctx.fillRect(32, 60, 26, 22);
        ctx.fillRect(70, 60, 26, 22);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(32, 82, 26, 1);
        ctx.fillRect(70, 82, 26, 1);
        ctx.fillRect(53, 62, 3, 2);
        ctx.fillRect(91, 62, 3, 2);
        ctx.fillStyle = '#B7BEC8';
        ctx.fillRect(58, 63, 12, 2);
        ctx.fillRect(0, 63, 32, 2);
        ctx.fillRect(96, 63, 32, 2);

        // nariz (sombra mínima) y boca pequeña neutra
        ctx.fillStyle = 'rgba(170,110,80,0.45)';
        ctx.fillRect(63, 88, 3, 2);
        ctx.strokeStyle = '#7A4636';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(58, 99);
        ctx.quadraticCurveTo(64, 101, 70, 99);
        ctx.stroke();
    });
}

// ---------- Pelo ----------
// Pieza angular (pirámide de 4 lados) con la base en el origen y la punta hacia abajo.
const spikeGeo = (() => {
    const g = new THREE.ConeGeometry(0.5, 1, 4, 1);
    g.rotateY(Math.PI / 4);
    g.rotateX(Math.PI);
    g.translate(0, -0.5, 0);
    return g;
})();

// En el cono, la fila de arriba del canvas queda en la punta.
function hairTex(mintRows) {
    return canvasTexture(4, 32, (ctx, w, h) => {
        px(ctx, 0, 0, HAIR, w, h);
        px(ctx, 1, 0, HAIR_HI, 1, h);
        for (let y = 0; y < mintRows; y++) px(ctx, 0, y, y < mintRows * 0.45 ? MINT : MINT_DK, w, 1);
        if (mintRows) px(ctx, 0, mintRows, '#1F4A3E', w, 2);
    });
}
const blackHair = flat(hairTex(0));
const tipsHair = flat(hairTex(14));
const mintHair = flat(hairTex(26));

function spike(parent, { x, y, z, w, len, d, rx = 0, rz = 0, ry = 0, mat = blackHair }) {
    const o = new THREE.Mesh(spikeGeo, mat);
    o.position.set(x, y, z);
    o.rotation.set(rx, ry, rz);
    o.scale.set(w, len, d);
    parent.add(o);
    return o;
}

// Cabeza: caja redondeada, con la cara plana al frente y quijada algo más angosta
function headGeometry(W, H, D) {
    const geo = new THREE.BoxGeometry(W, H, D, 4, 4, 4);
    const p = geo.attributes.position;
    const hx = W / 2, hy = H / 2, hz = D / 2, k = 0.42;
    for (let i = 0; i < p.count; i++) {
        let nx = p.getX(i) / hx, ny = p.getY(i) / hy, nz = p.getZ(i) / hz;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx = nx * (1 - k) + (nx / len) * k;
        ny = ny * (1 - k) + (ny / len) * k;
        nz = nz * (1 - k) + (nz / len) * k;
        if (ny < 0) nx *= 1 - 0.14 * -ny;
        p.setXYZ(i, nx * hx, ny * hy, nz * hz);
    }
    geo.computeVertexNormals();
    return geo;
}

// ---------- Ropa ----------
const vestTex = canvasTexture(64, 32, (ctx, w, h) => {
    px(ctx, 0, 0, VEST, w, h);
    for (let y = 0; y < h; y += 2) for (let x = (y / 2) % 2; x < w; x += 2) px(ctx, x, y, '#272A30');
    for (const x0 of [0, w - 6]) {
        px(ctx, x0, 0, NEON, 6, h);
        px(ctx, x0 + 2, 0, '#CDD2D8', 2, h);
    }
    px(ctx, 0, 22, NEON, w, 4);
    px(ctx, 0, 23, '#CDD2D8', w, 2);
});

const lanyardTex = canvasTexture(4, 16, (ctx, w, h) => {
    for (let y = 0; y < h; y++) px(ctx, 0, y, y % 4 < 2 ? '#F4F6F2' : '#5FBE97', w, 1);
});

const pinTex = canvasTexture(16, 16, (ctx, w, h) => {
    ctx.fillStyle = '#B04A3C';
    ctx.beginPath(); ctx.arc(8, 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#EBD3BF';
    ctx.beginPath(); ctx.arc(8, 7, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2A2224';
    ctx.fillRect(4, 3, 8, 2);
    ctx.fillStyle = '#D9B64C';
    ctx.fillRect(6, 11, 4, 3);
});

// ---------- Personaje ----------
function buildEma() {
    const g = new THREE.Group();
    const skin = soft(SKIN);
    const navy = soft(NAVY);
    const silver = soft('#DCE0E6');

    // Piernas y zapatos
    for (const sx of [-1, 1]) {
        m(new THREE.BoxGeometry(0.2, 0.62, 0.22), soft(PANTS), { pos: [sx * 0.12, 0.43, 0], parent: g });
        m(new THREE.BoxGeometry(0.22, 0.13, 0.3), soft(SHOES), { pos: [sx * 0.12, 0.065, 0.04], parent: g });
    }

    // Torso (sudadera)
    m(new THREE.CylinderGeometry(0.25, 0.28, 0.64, 10), navy, { pos: [0, 1.03, 0], scale: [1, 1, 0.66], parent: g });
    m(new THREE.SphereGeometry(0.15, 8, 6), navy, { pos: [0, 1.33, -0.1], scale: [1.5, 0.6, 0.8], parent: g });   // capucha

    // Chaleco abierto al frente
    const gap = 1.0;
    m(new THREE.CylinderGeometry(0.265, 0.295, 0.56, 14, 1, true, gap / 2, Math.PI * 2 - gap),
        soft(vestTex, { side: THREE.DoubleSide }), { pos: [0, 1.0, 0], scale: [1, 1, 0.68], parent: g });

    // Lanyard + gafete
    for (const sx of [-1, 1]) {
        const a = [sx * 0.1, 1.36], b = [sx * 0.03, 0.96];
        const len = Math.hypot(a[0] - b[0], a[1] - b[1]);
        m(new THREE.BoxGeometry(0.035, len, 0.01), soft(lanyardTex), {
            pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.195],
            rot: [0.05, 0, Math.atan2(a[0] - b[0], a[1] - b[1])],
            parent: g
        });
    }
    m(new THREE.BoxGeometry(0.05, 0.05, 0.02), silver, { pos: [0, 0.94, 0.2], parent: g });

    // Pin
    m(new THREE.CylinderGeometry(0.055, 0.055, 0.015, 12), [soft('#8A3328'), soft(pinTex), soft('#8A3328')],
        { pos: [-0.17, 0.93, 0.205], rot: [Math.PI / 2, 0, 0], parent: g });

    // Brazo en reposo (lado derecho de la imagen)
    const rest = new THREE.Group();
    rest.position.set(0.31, 1.27, 0);
    rest.rotation.z = 0.35;
    g.add(rest);
    m(new THREE.CylinderGeometry(0.085, 0.08, 0.56, 8), navy, { pos: [0, -0.28, 0], parent: rest });
    m(new THREE.SphereGeometry(0.085, 8, 6), skin, { pos: [0, -0.6, 0], scale: [1, 1.1, 0.85], parent: rest });

    // Brazo saludando (lado izquierdo de la imagen)
    const wave = new THREE.Group();
    wave.position.set(-0.31, 1.27, 0);
    wave.rotation.z = -2.25;
    g.add(wave);
    m(new THREE.CylinderGeometry(0.085, 0.085, 0.32, 8), navy, { pos: [0, -0.16, 0], parent: wave });

    const elbow = new THREE.Group();
    elbow.position.y = -0.32;
    wave.add(elbow);
    m(new THREE.SphereGeometry(0.085, 8, 6), navy, { parent: elbow });
    m(new THREE.CylinderGeometry(0.08, 0.085, 0.28, 8), navy, { pos: [0, -0.14, 0], parent: elbow });

    const hand = new THREE.Group();
    hand.position.y = -0.3;
    elbow.add(hand);
    m(new THREE.SphereGeometry(0.09, 8, 6), skin, { pos: [0, -0.06, 0], scale: [1, 1.2, 0.7], parent: hand });
    m(new THREE.SphereGeometry(0.035, 6, 4), skin, { pos: [0.075, -0.02, 0.01], scale: [1, 1.5, 1], rot: [0, 0, 0.6], parent: hand });

    // Cuello
    m(new THREE.CylinderGeometry(0.075, 0.085, 0.14, 8), skin, { pos: [0, 1.4, 0], parent: g });

    // ---- Cabeza ----
    const head = new THREE.Group();
    head.position.y = 1.79;
    g.add(head);

    const faceOpen = faceTexture(false);
    const faceBlink = faceTexture(true);
    const faceMat = soft(faceOpen);
    m(headGeometry(0.72, 0.7, 0.62), [skin, skin, skin, skin, faceMat, skin], { parent: head });

    // Arete de cruz (oreja izquierda del personaje, derecha de la imagen)
    const ear = new THREE.Group();
    ear.position.set(0.33, -0.2, 0.17);
    head.add(ear);
    m(new THREE.TorusGeometry(0.018, 0.006, 4, 8), silver, { parent: ear });
    m(new THREE.BoxGeometry(0.012, 0.07, 0.012), silver, { pos: [0, -0.055, 0], parent: ear });
    m(new THREE.BoxGeometry(0.04, 0.012, 0.012), silver, { pos: [0, -0.04, 0], parent: ear });

    // ---- Pelo: jellyfish cut ----
    const hair = new THREE.Group();
    head.add(hair);

    // Casco: cubre arriba y atrás, sin salirse por la frente
    const capGeo = new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.56);
    m(capGeo, blackHair, { pos: [0, 0.1, -0.06], scale: [0.41, 0.36, 0.36], parent: hair });

    // Fleco tipo cortina partido en medio: piezas anchas y planas que se abren
    // hacia los lados y dejan la frente un poco descubierta al centro.
    for (const sx of [-1, 1]) {
        spike(hair, { x: sx * 0.1, y: 0.37, z: 0.27, w: 0.22, len: 0.24, d: 0.08, rx: -0.5, rz: sx * 0.3, mat: blackHair });
        spike(hair, { x: sx * 0.22, y: 0.34, z: 0.25, w: 0.2, len: 0.32, d: 0.09, rx: -0.35, rz: sx * 0.2, mat: sx < 0 ? mintHair : blackHair });
        spike(hair, { x: sx * 0.32, y: 0.28, z: 0.2, w: 0.16, len: 0.42, d: 0.1, rx: -0.14, rz: sx * 0.08, mat: blackHair });
    }

    // Lados: el "hongo" (corto) encima de la capa larga lacia con puntas menta
    for (const sx of [-1, 1]) {
        spike(hair, { x: sx * 0.37, y: 0.24, z: 0.0, w: 0.17, len: 0.42, d: 0.46, rz: sx * 0.1, mat: blackHair });
        spike(hair, { x: sx * 0.35, y: 0.0, z: 0.08, w: 0.13, len: 0.56, d: 0.2, rz: sx * 0.05, mat: tipsHair });
        spike(hair, { x: sx * 0.35, y: 0.0, z: -0.12, w: 0.15, len: 0.66, d: 0.3, rz: sx * 0.08, mat: tipsHair });
    }

    // Mullet atrás
    [-0.24, -0.08, 0.08, 0.24].forEach((x) => {
        spike(hair, { x, y: 0.22, z: -0.3, w: 0.2, len: 0.44, d: 0.14, rx: 0.18 });
        spike(hair, { x, y: 0.0, z: -0.3, w: 0.19, len: 0.68, d: 0.12, rx: 0.12, mat: tipsHair });
    });

    return { g, head, wave, elbow, hand, faceMat, faceOpen, faceBlink };
}

// ---------- Fondo de cuadros ----------
function checkerTexture() {
    const t = canvasTexture(16, 16, (ctx, w, h) => {
        for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
            px(ctx, x, y, ((x + y) / 2) % 2 ? '#F7D560' : '#FBE58A', 2, 2);
        }
    });
    return t;
}

// ---------- Montaje ----------
export function mount(container, opts = {}) {
    const stage = createStage(container, {
        pixel: 2,
        fov: 24,
        camera: [0, 1.3, 5.4],
        target: [0, 1.22, 0],
        baseYaw: 0.12,
        sway: 0,
        interactive: false,
        ...opts
    });
    if (!stage) return null;

    const { scene, root } = stage;
    scene.background = checkerTexture();

    // Luz suave, frontal (sin sombras duras)
    scene.children.filter((o) => o.isLight).forEach((l) => scene.remove(l));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8f86, 1.55));
    const key = new THREE.DirectionalLight(0xfff6ea, 1.2);
    key.position.set(1.5, 2.5, 5);
    scene.add(key);

    const ema = buildEma();
    root.add(ema.g);

    let nextBlink = 2.2;
    stage.start((t) => {
        // saludo
        ema.elbow.rotation.z = -0.9 + Math.sin(t * 6.5) * 0.35;
        ema.wave.rotation.z = -2.25 + Math.sin(t * 6.5) * 0.04;
        // idle
        ema.g.position.y = Math.abs(Math.sin(t * 2)) * 0.012;
        ema.head.rotation.z = Math.sin(t * 1.3) * 0.03;
        // parpadeo
        const blinking = t > nextBlink && t < nextBlink + 0.14;
        const want = blinking ? ema.faceBlink : ema.faceOpen;
        if (ema.faceMat.map !== want) { ema.faceMat.map = want; ema.faceMat.needsUpdate = true; }
        if (t > nextBlink + 0.14) nextBlink = t + 2.5 + Math.random() * 2;
    });

    return stage;
}
