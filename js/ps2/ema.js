// =========================================================
//  Ema low-poly (figura estilo PS2 / DS, proporciones chibi)
//  Basado en: mullet oscuro con mechones verdes, lentes sin marco,
//  playera azul marino, chaleco de seguridad con reflejantes,
//  lanyard verde/blanco, arete y pin redondo.
// =========================================================
import { THREE, createStage, canvasTexture, px, bake, lambert, mesh, blobShadow, pedestal, makeRng } from './ps2.js';

const rand = makeRng(301);

// ---------- Paleta ----------
const SKIN = '#D9A27C';
const SKIN_SH = '#B98463';
const HAIR = '#1E1B1E';
const HAIR_HI = '#3A3436';
const GREEN = '#4FBF8E';
const GREEN_HI = '#8FE0B8';
const NAVY = '#1F2A44';
const VEST = '#2A2D33';
const HIVIS = '#D8F03A';
const REFLECT = '#C9CED6';
const INK = '#1F2328';

// ---------- Texturas ----------
// Cara: ojos, cejas, nariz y boca dibujados en pixeles (estilo DS)
const faceTex = canvasTexture(32, 32, (ctx, w, h) => {
    px(ctx, 0, 0, SKIN, w, h);
    // sombreado suave en bandas
    px(ctx, 0, 26, SKIN_SH, w, 6);
    // cejas
    px(ctx, 6, 11, '#2A2220', 7, 2);
    px(ctx, 19, 11, '#2A2220', 7, 2);
    // ojos (mirada tranquila / un poco seria, como en la foto)
    for (const ox of [7, 20]) {
        px(ctx, ox, 15, '#F4EDE6', 5, 3);
        px(ctx, ox + 1, 15, '#3B2A22', 3, 3);
        px(ctx, ox + 2, 15, '#120D0B', 1, 2);
        px(ctx, ox + 3, 15, '#FFFFFF', 1, 1);
        px(ctx, ox, 14, '#2A2220', 5, 1);   // párpado
    }
    // nariz
    px(ctx, 15, 19, SKIN_SH, 2, 3);
    px(ctx, 14, 22, SKIN_SH, 4, 1);
    // boca
    px(ctx, 13, 25, '#9C5B52', 6, 1);
    px(ctx, 14, 26, '#B8766B', 4, 1);
    // rubor
    px(ctx, 5, 21, '#E7A08C', 3, 1);
    px(ctx, 24, 21, '#E7A08C', 3, 1);
    bake(ctx, w, h, { noise: 0.03, shade: 0.06, bands: 3, rand });
});

// Lentes: solo el cristal azulado con brillo (sin marco)
const lensTex = canvasTexture(8, 6, (ctx, w, h) => {
    px(ctx, 0, 0, 'rgba(170,190,255,0.35)', w, h);
    px(ctx, 1, 1, 'rgba(255,255,255,0.8)', 2, 1);
    px(ctx, 0, h - 1, 'rgba(120,140,220,0.6)', w, 1);
});

// Pelo: mechones oscuros con vetas verdes
const hairTex = canvasTexture(16, 16, (ctx, w, h) => {
    px(ctx, 0, 0, HAIR, w, h);
    for (let x = 0; x < w; x += 3) px(ctx, x, 0, HAIR_HI, 1, h);
    for (let i = 0; i < 4; i++) px(ctx, Math.floor(rand() * w), 0, GREEN, 1, Math.floor(h * (0.4 + rand() * 0.6)));
    bake(ctx, w, h, { noise: 0.04, shade: 0.2, bands: 4, rand });
});
hairTex.wrapS = hairTex.wrapT = THREE.RepeatWrapping;

// Puntas verdes (degradado de oscuro a verde)
const tipTex = canvasTexture(8, 16, (ctx, w, h) => {
    for (let y = 0; y < h; y++) {
        const c = y < 5 ? HAIR : y < 9 ? '#2E6F58' : y < 13 ? GREEN : GREEN_HI;
        px(ctx, 0, y, c, w, 1);
    }
    for (let x = 1; x < w; x += 3) px(ctx, x, 0, HAIR_HI, 1, 5);
    bake(ctx, w, h, { noise: 0.05, shade: 0.08, bands: 2, rand });
});

// Chaleco de seguridad: malla oscura, bandas fluorescentes y reflejantes
const vestTex = canvasTexture(32, 32, (ctx, w, h) => {
    px(ctx, 0, 0, VEST, w, h);
    for (let y = 0; y < h; y += 2) for (let x = (y / 2) % 2; x < w; x += 2) px(ctx, x, y, '#33373E');  // malla
    // banda vertical fluorescente con reflejante al centro
    px(ctx, 0, 0, HIVIS, 9, h);
    px(ctx, 3, 0, REFLECT, 3, h);
    px(ctx, 9, 0, '#9BB02A', 1, h);
    bake(ctx, w, h, { noise: 0.05, shade: 0.16, bands: 4, rand });
});

const shirtTex = canvasTexture(16, 16, (ctx, w, h) => {
    px(ctx, 0, 0, NAVY, w, h);
    bake(ctx, w, h, { noise: 0.05, shade: 0.2, bands: 4, rand });
});

// Lanyard verde/blanco
const lanyardTex = canvasTexture(4, 16, (ctx, w, h) => {
    for (let y = 0; y < h; y++) px(ctx, 0, y, y % 4 < 2 ? '#F4F7F2' : GREEN, w, 1);
    px(ctx, 0, 0, '#7DBF9A', 1, h);
});

// Pin redondo (rojo con figura clara)
const pinTex = canvasTexture(8, 8, (ctx, w, h) => {
    px(ctx, 0, 0, '#B23A3A', w, h);
    px(ctx, 2, 1, '#F0D9C8', 4, 4);
    px(ctx, 3, 5, '#E9C24A', 2, 2);
    px(ctx, 2, 1, '#3A2A2A', 4, 1);
});

const pantsTex = canvasTexture(8, 16, (ctx, w, h) => {
    px(ctx, 0, 0, '#2B3140', w, h);
    bake(ctx, w, h, { noise: 0.05, shade: 0.22, bands: 4, rand });
});

const skinMat = lambert(SKIN);
const hairMat = lambert(hairTex);
const tipMat = lambert(tipTex);
const vestMat = lambert(vestTex);
const shirtMat = lambert(shirtTex);
const lensMat = new THREE.MeshBasicMaterial({ map: lensTex, transparent: true });
const lanyardMat = lambert(lanyardTex);
const pantsMat = lambert(pantsTex);
const shoeMat = lambert('#E9EAEC');
const silverMat = lambert('#D7DBE0');

// ---------- Modelo ----------
function buildEma() {
    const g = new THREE.Group();

    // ---- Piernas y tenis ----
    for (const sx of [-1, 1]) {
        mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.5, 6), pantsMat, { pos: [sx * 0.15, 0.32, 0], edges: 0.25, parent: g });
        mesh(new THREE.BoxGeometry(0.2, 0.12, 0.32), shoeMat, { pos: [sx * 0.15, 0.06, 0.05], edges: 0.4, parent: g });
        mesh(new THREE.BoxGeometry(0.2, 0.03, 0.32), lambert('#8B9098'), { pos: [sx * 0.15, 0.015, 0.05], edges: 0, parent: g });
    }

    // ---- Torso: playera + chaleco ----
    const torso = new THREE.Group();
    torso.position.y = 0.88;
    g.add(torso);
    mesh(new THREE.CylinderGeometry(0.3, 0.27, 0.66, 8), shirtMat, { edges: 0.2, parent: torso });

    // Chaleco abierto: dos paneles al frente + espalda
    for (const sx of [-1, 1]) {
        const panel = mesh(new THREE.BoxGeometry(0.22, 0.62, 0.06), vestMat, { pos: [sx * 0.17, -0.01, 0.25], rot: [0, -sx * 0.35, 0], edges: 0.4, parent: torso });
        if (sx < 0) panel.scale.x = -1;   // espejo para que la banda quede hacia el centro
    }
    mesh(new THREE.BoxGeometry(0.58, 0.62, 0.06), vestMat, { pos: [0, -0.01, -0.26], edges: 0.4, parent: torso });
    for (const sx of [-1, 1]) {
        mesh(new THREE.BoxGeometry(0.06, 0.62, 0.48), vestMat, { pos: [sx * 0.3, -0.01, 0], edges: 0.35, parent: torso });
    }

    // Lanyard: dos tiras que bajan del cuello al centro
    for (const sx of [-1, 1]) {
        mesh(new THREE.BoxGeometry(0.045, 0.5, 0.012), lanyardMat, { pos: [sx * 0.07, 0.08, 0.27], rot: [0.05, 0, sx * 0.22], edges: 0, parent: torso });
    }

    // Pin redondo en el chaleco
    mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 8), [lambert('#8A2B2B'), lambert(pinTex), lambert('#8A2B2B')], { pos: [-0.2, -0.17, 0.3], rot: [Math.PI / 2, 0, 0], edges: 0.4, parent: torso });

    // ---- Brazos (mangas cortas + antebrazo) ----
    const arms = [];
    for (const sx of [-1, 1]) {
        const arm = new THREE.Group();
        arm.position.set(sx * 0.36, 0.22, 0);
        arm.rotation.z = sx * 0.12;
        torso.add(arm);
        mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.22, 6), shirtMat, { pos: [0, -0.08, 0], edges: 0.25, parent: arm });
        mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.4, 6), skinMat, { pos: [0, -0.38, 0], edges: 0.22, parent: arm });
        mesh(new THREE.IcosahedronGeometry(0.08, 0), skinMat, { pos: [0, -0.6, 0.01], scale: [0.9, 1, 0.8], edges: 0.22, parent: arm });
        arms.push(arm);
    }

    // ---- Cuello ----
    mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 6), skinMat, { pos: [0, 1.25, 0], edges: 0.2, parent: g });

    // ---- Cabeza (grande, chibi) ----
    const head = new THREE.Group();
    head.position.set(0, 1.6, 0);
    g.add(head);

    const headGeo = new THREE.BoxGeometry(0.56, 0.6, 0.52, 1, 1, 1);
    // Biselar un poco la caja para que no sea un cubo perfecto
    const p = headGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        if (y < 0) { p.setX(i, p.getX(i) * 0.86); p.setZ(i, p.getZ(i) * 0.92); }
    }
    headGeo.computeVertexNormals();
    const skinPlain = lambert(SKIN);
    mesh(headGeo, [skinPlain, skinPlain, skinPlain, skinPlain, lambert(faceTex), skinPlain], { edges: 0.25, parent: head });

    // Orejas + arete
    for (const sx of [-1, 1]) {
        mesh(new THREE.BoxGeometry(0.06, 0.12, 0.08), skinMat, { pos: [sx * 0.29, -0.02, 0], edges: 0.2, parent: head });
    }
    mesh(new THREE.TorusGeometry(0.025, 0.008, 3, 6), silverMat, { pos: [0.31, -0.1, 0.01], rot: [0, Math.PI / 2, 0], edges: 0, parent: head });

    // Lentes sin marco: dos cristales + puente plateado
    for (const sx of [-1, 1]) {
        mesh(new THREE.PlaneGeometry(0.17, 0.1), lensMat, { pos: [sx * 0.13, 0.0, 0.265], edges: 0, parent: head });
        mesh(new THREE.BoxGeometry(0.02, 0.012, 0.25), silverMat, { pos: [sx * 0.285, 0.02, 0.14], edges: 0, parent: head });   // patitas
    }
    mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), silverMat, { pos: [0, 0.03, 0.268], edges: 0, parent: head });

    // ---- Pelo ----
    const hair = new THREE.Group();
    head.add(hair);
    const strands = [];

    // Casco superior (cubre toda la parte de arriba de la cabeza)
    mesh(new THREE.SphereGeometry(0.38, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat, { pos: [0, 0.05, -0.02], scale: [1, 0.95, 0.95], edges: 0.3, parent: hair });

    // Mullet: "cortina" abierta al frente que baja hasta los hombros,
    // oscura arriba y con las puntas verdes abajo
    const curtainMat = lambert(tipTex, { side: THREE.DoubleSide });
    const curtain = mesh(
        new THREE.CylinderGeometry(0.37, 0.43, 0.66, 8, 1, true, Math.PI * 0.3, Math.PI * 1.4),
        curtainMat,
        { pos: [0, -0.26, -0.03], edges: 0.3, parent: hair }
    );
    strands.push(curtain);

    // Puntas sueltas en el borde inferior de la cortina
    for (let i = 0; i < 9; i++) {
        const a = Math.PI * 0.35 + (i / 8) * Math.PI * 1.3;
        const tip = mesh(new THREE.ConeGeometry(0.07, 0.18, 4), tipMat, {
            pos: [Math.sin(a) * 0.42, -0.62 - (i % 2) * 0.04, Math.cos(a) * 0.42 - 0.03],
            rot: [Math.PI, 0, 0],
            edges: 0.3,
            parent: hair
        });
        strands.push(tip);
    }

    // Mechones de enfrente, a los lados de la cara
    for (const sx of [-1, 1]) {
        const lock = mesh(new THREE.BoxGeometry(0.11, 0.5, 0.07), tipMat, { pos: [sx * 0.3, -0.12, 0.17], rot: [0, 0, sx * 0.08], edges: 0.3, parent: hair });
        strands.push(lock);
    }

    // Fleco: mechones en punta sobre la frente (dejando ver los ojos)
    const bangs = [[-0.2, 0.17, 0.2, 0.24], [-0.07, 0.18, 0.08, 0.27], [0.07, 0.18, -0.1, 0.25], [0.2, 0.17, -0.22, 0.23]];
    bangs.forEach(([x, y, rz, len], i) => {
        mesh(new THREE.ConeGeometry(0.1, len, 4), i === 1 ? tipMat : hairMat, { pos: [x, y, 0.27], rot: [Math.PI + 0.2, 0, rz], scale: [1, 1, 0.5], edges: 0.3, parent: hair });
    });

    strands.forEach((s) => { s.userData.rz = s.rotation.z; });

    return { g, head, torso, arms, strands };
}

// ---------- Montaje ----------
export function mount(container, opts = {}) {
    const stage = createStage(container, {
        pixel: 3,
        fov: 30,
        camera: [0, 1.45, 5.6],
        target: [0, 1.05, 0],
        baseYaw: 0.25,
        sway: 0.35,
        swaySpeed: 0.5,
        ...opts
    });
    if (!stage) return null;

    const { root } = stage;
    root.add(pedestal(0.8, 0.2, rand));

    const ema = buildEma();
    ema.g.position.y = 0.2;
    root.add(ema.g);

    const shadow = blobShadow(0.55, 0.22);
    shadow.position.y = 0.205;
    root.add(shadow);

    stage.start((t) => {
        // Respiración y balanceo idle de videojuego
        const breathe = Math.sin(t * 2.0);
        ema.torso.scale.y = 1 + breathe * 0.015;
        ema.head.position.y = 1.6 + breathe * 0.012;
        ema.head.rotation.y = Math.sin(t * 0.7) * 0.12;
        ema.head.rotation.z = Math.sin(t * 0.9) * 0.03;
        ema.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 2.0 + i * Math.PI) * 0.05; });
        ema.strands.forEach((s, i) => { s.rotation.z = s.userData.rz + Math.sin(t * 2.2 + i) * 0.015; });
    });

    return stage;
}
