// =========================================================
//  Pangolín low-poly con una carta en la boca (modal de contacto)
//  Pose: de pie sobre las patas traseras (como hacen los pangolines),
//  cola larga apoyada atrás, carta mordida en la punta del hocico.
// =========================================================
import { THREE, createStage, canvasTexture, px, bake, lambert, mesh, blobShadow, pedestal, makeRng, ps2ify } from './ps2.js';

const rand = makeRng(39);

// ---------- Paleta ----------
const SCALE_BASE = '#B9824F';
const SCALE_DARK = '#7E5230';
const SCALE_LIGHT = '#E3B47E';
const SKIN = '#F4D3B0';
const INK = '#1F2328';

// ---------- Texturas ----------
// Placa de escama: borde oscuro, brillo arriba, estrías verticales
const plateTex = canvasTexture(16, 16, (ctx, w, h) => {
    px(ctx, 0, 0, SCALE_BASE, w, h);
    for (let x = 3; x < w; x += 4) px(ctx, x, 3, SCALE_DARK, 1, h - 6);
    px(ctx, 0, 0, SCALE_LIGHT, w, 3);
    px(ctx, 0, h - 2, SCALE_DARK, w, 2);
    bake(ctx, w, h, { noise: 0.05, shade: 0.18, bands: 4, rand });
});

const skinTex = canvasTexture(16, 16, (ctx, w, h) => {
    px(ctx, 0, 0, SKIN, w, h);
    bake(ctx, w, h, { noise: 0.04, shade: 0.12, bands: 3, rand });
});

const letterFront = canvasTexture(32, 20, (ctx, w, h) => {
    px(ctx, 0, 0, INK, w, h);
    px(ctx, 1, 1, '#FFFDF6', w - 2, h - 2);
    for (let x = 1; x < w - 1; x++) {
        const y = Math.round(1 + (x < w / 2 ? x : w - 1 - x) * (8 / (w / 2)));
        px(ctx, x, y, '#A9A396');
    }
    // sello de corazón rosa
    const heart = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
    heart.forEach((row, y) => [...row].forEach((b, x) => b === '1' && px(ctx, 13 + x, 8 + y, '#FF7FA0')));
    bake(ctx, w, h, { noise: 0.03, shade: 0.08, bands: 3, rand });
});
const letterBack = canvasTexture(32, 20, (ctx, w, h) => {
    px(ctx, 0, 0, INK, w, h);
    px(ctx, 1, 1, '#F4EFE3', w - 2, h - 2);
    px(ctx, 5, 9, '#6B7178', 13, 1);
    px(ctx, 5, 12, '#6B7178', 9, 1);
    px(ctx, 5, 15, '#33CCBB', 11, 1);
    px(ctx, 22, 3, INK, 7, 7);
    px(ctx, 23, 4, '#33CCBB', 5, 5);
    bake(ctx, w, h, { noise: 0.03, shade: 0.08, bands: 3, rand });
});

const plateMat = lambert(plateTex, { snap: false });
plateMat.userData.keepFlat = true;   // las escamas se quedan angulosas
const skinMat = lambert(skinTex);
const darkMat = lambert(INK);
const clawMat = lambert('#4A3A2E');
const blushMat = lambert('#FF9EB5');
const whiteMat = lambert('#FFFFFF');
const paperEdge = lambert('#E8E2D4');

// Escama tipo "teja": prisma triangular aplanado (se ve como placa con punta)
const plateGeo = (() => {
    const g = new THREE.ConeGeometry(0.2, 0.3, 3, 1);
    g.rotateX(Math.PI);          // punta hacia abajo
    g.scale(1.25, 1, 0.38);
    return g;
})();

const plate = (parent, pos, rot, s = 1) => mesh(plateGeo, plateMat, { pos, rot, scale: s, edges: 0.45, parent });

// Coloca escamas siguiendo la superficie de un elipsoide (solo la parte de atrás/lados)
function shingle(parent, { cx, cy, cz, rx, ry, rz, rows, cols, from = -0.95, to = 0.95, arc = 0.6, s = 1 }) {
    for (let r = 0; r < rows; r++) {
        const v = rows === 1 ? 0.5 : r / (rows - 1);
        const phi = from + (to - from) * v;            // altura en el elipsoide
        const ring = Math.cos(phi);
        const y = cy + Math.sin(phi) * ry;
        const n = Math.max(2, Math.round(cols * (0.55 + 0.45 * ring)));
        for (let c = 0; c < n; c++) {
            const u = n === 1 ? 0.5 : c / (n - 1);
            // arco de 'arc' * 2PI alrededor de la espalda (centrado en -Z)
            const theta = Math.PI + (u - 0.5) * arc * Math.PI * 2 + (r % 2 ? 0.12 : 0);
            const x = cx + Math.sin(theta) * rx * ring * 1.04;
            const z = cz + Math.cos(theta) * rz * ring * 1.04;
            plate(parent, [x, y, z], [-(phi * 0.6) - 0.25, theta + Math.PI, 0], s * (0.75 + 0.35 * ring));
        }
    }
}

// ---------- Modelo ----------
function buildPangolin() {
    const g = new THREE.Group();

    // ---- Cuerpo (lágrima, más ancho abajo) ----
    const bodyGeo = new THREE.IcosahedronGeometry(0.55, 1);
    mesh(bodyGeo, lambert(SCALE_DARK), { pos: [0, 0.95, -0.02], scale: [0.95, 1.25, 0.88], edges: 0.25, parent: g });

    // Panza clara al frente
    mesh(new THREE.IcosahedronGeometry(0.46, 1), skinMat, { pos: [0, 0.9, 0.2], scale: [0.82, 1.18, 0.58], edges: 0.2, parent: g });

    // Escamas sobre espalda y lados
    shingle(g, { cx: 0, cy: 0.95, cz: -0.02, rx: 0.52, ry: 0.68, rz: 0.48, rows: 6, cols: 6, from: -1.0, to: 1.05, arc: 0.62 });

    // ---- Cola larga hacia atrás, apoyada en el piso ----
    const tail = new THREE.Group();
    tail.position.set(0, 0.38, -0.32);
    g.add(tail);
    const segs = 6;
    for (let i = 0; i < segs; i++) {
        const t = i / (segs - 1);
        const z = -t * 1.05;
        const y = 0.1 - t * 0.22 + Math.sin(t * Math.PI) * 0.12;
        const w = 0.34 - t * 0.2;
        const seg = new THREE.Group();
        seg.position.set(0, y, z);
        seg.rotation.x = -0.35 + t * 0.25;
        tail.add(seg);
        mesh(new THREE.CylinderGeometry(w * 0.85, w, 0.26, 6), lambert(SCALE_DARK), { rot: [Math.PI / 2, 0, 0], edges: 0.25, parent: seg });
        // placas: arriba y a los lados
        for (const a of [-0.9, 0, 0.9]) {
            plate(seg, [Math.sin(a) * w, Math.cos(a) * w * 0.9, 0.02], [-1.25, a * 0.6, -a * 0.5], 0.55 + w);
        }
    }

    // ---- Patas traseras grandes (se para sobre ellas) ----
    for (const sx of [-1, 1]) {
        mesh(new THREE.IcosahedronGeometry(0.2, 0), skinMat, { pos: [sx * 0.3, 0.32, 0.06], scale: [0.95, 1.2, 1.05], edges: 0.25, parent: g });
        mesh(new THREE.BoxGeometry(0.22, 0.09, 0.34), skinMat, { pos: [sx * 0.32, 0.05, 0.16], edges: 0.25, parent: g });
        for (let c = -1; c <= 1; c++) {
            mesh(new THREE.ConeGeometry(0.03, 0.11, 4), clawMat, { pos: [sx * 0.32 + c * 0.065, 0.05, 0.37], rot: [Math.PI / 2, 0, 0], edges: 0, parent: g });
        }
    }

    // ---- Brazitos cortos doblados al pecho ----
    for (const sx of [-1, 1]) {
        mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.3, 5), skinMat, { pos: [sx * 0.3, 1.18, 0.33], rot: [-0.9, 0, sx * 0.55], edges: 0.25, parent: g });
        for (let c = -1; c <= 1; c++) {
            mesh(new THREE.ConeGeometry(0.025, 0.1, 4), clawMat, { pos: [sx * 0.2 + c * 0.035, 1.07, 0.47], rot: [Math.PI / 2 + 0.7, 0, 0], edges: 0, parent: g });
        }
    }

    // ---- Cabeza (pequeña, con hocico largo) ----
    const head = new THREE.Group();
    head.position.set(0, 1.74, 0.16);
    g.add(head);

    mesh(new THREE.IcosahedronGeometry(0.27, 1), skinMat, { scale: [1, 0.9, 1.05], edges: 0.22, parent: head });

    // Hocico: cono largo hacia el frente y un poco hacia abajo
    const snout = new THREE.Group();
    snout.position.set(0, -0.06, 0.2);
    snout.rotation.x = 0.35;
    head.add(snout);
    mesh(new THREE.ConeGeometry(0.15, 0.48, 6), skinMat, { pos: [0, 0, 0.24], rot: [Math.PI / 2, 0, 0], scale: [1, 1, 0.82], edges: 0.22, parent: snout });
    mesh(new THREE.IcosahedronGeometry(0.04, 0), darkMat, { pos: [0, 0.005, 0.48], edges: 0, parent: snout });

    // Escamas de la coronilla
    plate(head, [0, 0.21, -0.02], [-0.35, 0, 0], 0.7);
    plate(head, [-0.13, 0.17, -0.1], [-0.55, -0.6, 0], 0.6);
    plate(head, [0.13, 0.17, -0.1], [-0.55, 0.6, 0], 0.6);
    plate(head, [0, 0.12, -0.24], [-1.0, 0, 0], 0.8);

    // Ojos, brillo, mejillas y orejitas
    for (const sx of [-1, 1]) {
        mesh(new THREE.BoxGeometry(0.065, 0.085, 0.03), darkMat, { pos: [sx * 0.13, 0.04, 0.23], rot: [0, sx * 0.35, 0], edges: 0, parent: head });
        mesh(new THREE.BoxGeometry(0.022, 0.022, 0.02), whiteMat, { pos: [sx * 0.13 + 0.012, 0.062, 0.25], rot: [0, sx * 0.35, 0], edges: 0, parent: head });
        mesh(new THREE.BoxGeometry(0.07, 0.035, 0.025), blushMat, { pos: [sx * 0.18, -0.05, 0.2], rot: [0, sx * 0.5, 0], edges: 0, parent: head });
        mesh(new THREE.ConeGeometry(0.05, 0.08, 4), skinMat, { pos: [sx * 0.24, 0.1, -0.04], rot: [0, 0, -sx * 1.0], edges: 0.22, parent: head });
    }

    // ---- Carta mordida en la punta del hocico (cuelga hacia un lado) ----
    const letter = new THREE.Group();
    letter.position.set(0, -0.02, 0.46);
    snout.add(letter);
    mesh(
        new THREE.BoxGeometry(0.5, 0.32, 0.025),
        [paperEdge, paperEdge, paperEdge, paperEdge, lambert(letterFront), lambert(letterBack)],
        { pos: [0.12, -0.13, 0.03], rot: [-0.25, -0.35, -0.4], edges: 0.5, parent: letter }
    );

    return { g, head, tail, letter };
}

// ---------- Montaje ----------
export function mount(container, opts = {}) {
    const stage = createStage(container, {
        pixel: 2,
        fov: 28,
        camera: [0, 1.5, 5.6],
        target: [0, 0.98, 0],
        baseYaw: -0.55,
        sway: 0.3,
        swaySpeed: 0.6,
        ...opts
    });
    if (!stage) return null;

    const { root } = stage;
    root.add(pedestal(1.05, 0.22, rand));

    const { g, head, tail, letter } = buildPangolin();
    g.position.set(0, 0.22, 0.3);
    root.add(g);

    const shadow = blobShadow(0.8, 0.2);
    shadow.scale.set(1, 1.5, 1);
    shadow.position.set(0, 0.225, -0.05);
    root.add(shadow);

    // Look PS2: sin aristas negras, sombreado suave y texturas filtradas
    ps2ify(root);

    stage.start((t) => {
        g.position.y = 0.22 + Math.abs(Math.sin(t * 2.0)) * 0.025;
        head.rotation.z = Math.sin(t * 1.3) * 0.08;
        head.rotation.x = Math.sin(t * 2.0) * 0.05;
        letter.rotation.z = Math.sin(t * 2.6) * 0.08;
        tail.rotation.y = Math.sin(t * 1.1) * 0.12;
    });

    return stage;
}
