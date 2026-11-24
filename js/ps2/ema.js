// =========================================================
//  Ema - figura low-poly con sombreado "pintado" (sin luces)
//  Estilo: modelo simple con texturas pintadas y luz horneada
//  en los vértices (sombra fría lila, luz cálida suave), pelo en
//  mechones anchos y planos, cara dibujada, ventana de Paint
//  de fondo y dithering. Saluda con la mano.
//  Rasgos: jellyfish cut negro con puntas menta y frente algo
//  descubierta, lentes sin marco, arete de cruz, sudadera azul
//  marino, chaleco negro con reflejante, lanyard y pin.
// =========================================================
import { THREE, createStage, canvasTexture, px, unlit, bakeVertexLight } from './ps2.js';

// ---------- Paleta ----------
const SKIN = '#F1C9AE';
const HAIR = '#26232E';
const MINT = '#9BE6CB';
const NAVY = '#3A4A7E';
const VEST = '#2A2C33';
const NEON = '#E6F25A';
const PANTS = '#25272E';
const SHOE = '#4C5A93';

const tex = (w, h, draw) => canvasTexture(w, h, draw, { linear: true });

function m(geo, material, { pos, rot, scale, parent } = {}) {
    const o = new THREE.Mesh(geo, material);
    if (pos) o.position.set(...pos);
    if (rot) o.rotation.set(...rot);
    if (scale != null) Array.isArray(scale) ? o.scale.set(...scale) : o.scale.setScalar(scale);
    if (parent) parent.add(o);
    return o;
}

// ---------- Cara (plano frontal, pintada como en los modelos de referencia) ----------
function faceTexture(blink) {
    return tex(128, 128, (ctx) => {
        ctx.imageSmoothingEnabled = true;
        ctx.clearRect(0, 0, 128, 128);

        const ey = 62;
        for (const [ex, dir] of [[42, -1], [86, 1]]) {
            if (blink) {
                ctx.strokeStyle = '#2A2028';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(ex - 11, ey + 3);
                ctx.quadraticCurveTo(ex, ey + 7, ex + 11, ey + 3);
                ctx.stroke();
            } else {
                // ojo: blanco, iris oscuro con degradado, brillo
                ctx.fillStyle = '#FBF7F4';
                ctx.beginPath(); ctx.ellipse(ex, ey + 1, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
                const ig = ctx.createLinearGradient(0, ey - 8, 0, ey + 10);
                ig.addColorStop(0, '#1A1418');
                ig.addColorStop(1, '#5A3A30');
                ctx.fillStyle = ig;
                ctx.beginPath(); ctx.ellipse(ex - dir * 1, ey + 2, 6.5, 8, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#0D0A0C';
                ctx.beginPath(); ctx.ellipse(ex - dir * 1, ey + 1, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath(); ctx.arc(ex - dir * 1 - 2.5, ey - 2, 2, 0, Math.PI * 2); ctx.fill();
                // párpado superior grueso, recto (mirada neutra, un poco seria)
                ctx.fillStyle = '#231B22';
                ctx.beginPath();
                ctx.moveTo(ex - 13, ey - 4);
                ctx.lineTo(ex + 13, ey - 6);
                ctx.lineTo(ex + 13, ey - 3);
                ctx.lineTo(ex - 13, ey - 1);
                ctx.closePath();
                ctx.fill();
                // tapa el blanco por encima del párpado
                ctx.clearRect(ex - 14, ey - 14, 28, 9 - (dir > 0 ? 1 : 0));
                // línea inferior suave
                ctx.strokeStyle = 'rgba(120,80,80,0.5)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(ex - 8, ey + 10);
                ctx.quadraticCurveTo(ex, ey + 12, ex + 8, ey + 10);
                ctx.stroke();
            }
            // cejas rectas
            ctx.fillStyle = '#2B2128';
            ctx.fillRect(ex - 10, ey - 17, 20, 3);
        }

        // lentes sin marco: brillo diagonal + borde inferior
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1.2;
        for (const ex of [42, 86]) {
            ctx.beginPath();
            ctx.moveTo(ex - 15, ey + 13);
            ctx.lineTo(ex + 15, ey + 13);
            ctx.stroke();
            ctx.fillStyle = 'rgba(190,210,255,0.14)';
            ctx.fillRect(ex - 15, ey - 10, 30, 23);
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.moveTo(ex + 6, ey - 8);
            ctx.lineTo(ex + 11, ey - 3);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        }
        ctx.fillStyle = '#C0C6D2';
        ctx.fillRect(57, ey - 6, 14, 2);

        // nariz (sombra mínima) y boca neutra pequeña
        ctx.fillStyle = 'rgba(190,120,110,0.45)';
        ctx.fillRect(63, 84, 3, 2);
        ctx.strokeStyle = '#B0706A';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(59, 96);
        ctx.lineTo(69, 96);
        ctx.stroke();
    });
}

// ---------- Pelo: degradado negro → menta en las puntas ----------
// Para planos de mechón: v = 1 arriba (raíz), v = 0 abajo (punta)
function hairTexture(mintFrom) {
    return tex(16, 64, (ctx, w, h) => {
        ctx.imageSmoothingEnabled = true;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#3C3846');
        g.addColorStop(0.15, HAIR);
        if (mintFrom < 1) {
            g.addColorStop(Math.max(0.16, mintFrom - 0.15), HAIR);
            g.addColorStop(mintFrom, '#2F6B5A');
            g.addColorStop(Math.min(1, mintFrom + 0.18), '#6CCCA9');
            g.addColorStop(1, MINT);
        } else {
            g.addColorStop(1, '#1E1C24');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // líneas pintadas de mechón
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        for (let x = 2; x < w; x += 4) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 1, h);
            ctx.stroke();
        }
    });
}

/**
 * Mechón plano y ancho (como "hair card" de los modelos de referencia):
 * una tira curva de 2 segmentos que sale de la cabeza y termina en punta.
 * angle: alrededor de la cabeza (0 = frente). Sale en (yTop, rTop) y cae a (yBot, rBot).
 */
function lock(parent, { angle, yTop, rTop, yBot, rBot, width, curl = 0, map, tilt = 0 }) {
    const pivot = new THREE.Group();
    pivot.rotation.y = angle;
    pivot.rotation.z = tilt;
    parent.add(pivot);

    const pos = [];
    const uv = [];
    const rows = 4;
    for (let r = 0; r <= rows; r++) {
        const t = r / rows;
        const y = yTop + (yBot - yTop) * t;
        const z = rTop + (rBot - rTop) * t + Math.sin(t * Math.PI) * 0.05 + curl * t * t;
        const w = width * (1 - Math.pow(t, 2.2) * 0.9);   // se afila en la punta
        pos.push(-w / 2, y, z, w / 2, y, z);
        uv.push(0, 1 - t, 1, 1 - t);
    }
    const idx = [];
    for (let r = 0; r < rows; r++) {
        const k = r * 2;
        idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const o = new THREE.Mesh(geo, unlit(map, { side: THREE.DoubleSide }));
    pivot.add(o);
    return pivot;
}

// ---------- Ropa ----------
const navyTex = tex(32, 32, (ctx, w, h) => {
    ctx.imageSmoothingEnabled = true;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#4A5B92');
    g.addColorStop(1, NAVY);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
});

// Chaleco (u = 0 y u = 1 son las orillas del frente)
const vestTex = tex(128, 64, (ctx, w, h) => {
    px(ctx, 0, 0, VEST, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    for (const x0 of [0, w - 14]) {
        px(ctx, x0, 0, NEON, 14, h);
        px(ctx, x0 + 4, 0, '#D8DCE6', 6, h);
    }
    px(ctx, 0, 46, NEON, w, 9);
    px(ctx, 0, 48, '#D8DCE6', w, 4);
});

const lanyardTex = tex(8, 32, (ctx, w, h) => {
    for (let y = 0; y < h; y++) px(ctx, 0, y, y % 8 < 4 ? '#F6F7F3' : '#73C9A6', w, 1);
});

const pinTex = tex(32, 32, (ctx) => {
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = '#B4554A';
    ctx.beginPath(); ctx.arc(16, 16, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F0DCCB';
    ctx.beginPath(); ctx.ellipse(16, 13, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2E2426';
    ctx.beginPath(); ctx.ellipse(16, 8, 8, 4, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#E0BE55';
    ctx.fillRect(12, 22, 8, 5);
});

// Zapato con moño dibujado (como el de la referencia)
const shoeTex = tex(32, 32, (ctx, w, h) => {
    px(ctx, 0, 0, SHOE, w, h);
    ctx.strokeStyle = '#2A3360';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(11, 14, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(21, 14, 5, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
});

// ---------- Geometrías ----------
function headGeometry(R) {
    const geo = new THREE.SphereGeometry(R, 16, 12);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        x *= 1.02;
        if (y < 0) {
            const k = -y / R;
            x *= 1 - 0.3 * k * k;    // barbilla más angosta pero no en punta
            z *= 1 - 0.1 * k;
            y *= 1.06;
        }
        if (z > 0) z *= 0.9;          // cara más plana al frente
        p.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    return geo;
}

// Pantalón acampanado (más ancho abajo, como la referencia)
function pantLeg() {
    return new THREE.CylinderGeometry(0.11, 0.17, 0.8, 8, 2);
}

// Mano abierta grande (palma + dedos juntos, estilo figura)
function hand(parent, skinMat, { mirror = 1 } = {}) {
    const h = new THREE.Group();
    parent.add(h);
    m(new THREE.BoxGeometry(0.16, 0.15, 0.06, 2, 2, 1), skinMat, { pos: [0, -0.075, 0], parent: h });
    [-0.052, -0.017, 0.018, 0.053].forEach((x, i) => {
        const len = [0.11, 0.13, 0.125, 0.1][i];
        m(new THREE.CylinderGeometry(0.017, 0.019, len, 5), skinMat, { pos: [x, -0.15 - len / 2, 0], rot: [0, 0, x * 0.9], parent: h });
    });
    m(new THREE.CylinderGeometry(0.019, 0.021, 0.09, 5), skinMat, { pos: [mirror * 0.095, -0.06, 0.015], rot: [0, 0, mirror * 0.9], parent: h });
    return h;
}

// ---------- Personaje ----------
function buildEma() {
    const g = new THREE.Group();
    const skin = unlit(SKIN);
    const navy = unlit(navyTex);

    // ---- Piernas: pantalón acampanado + zapatos grandes ----
    for (const sx of [-1, 1]) {
        m(pantLeg(), unlit(PANTS), { pos: [sx * 0.13, 0.55, 0], parent: g });
        m(new THREE.SphereGeometry(0.13, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), unlit(shoeTex), {
            pos: [sx * 0.14, 0.09, 0.04], scale: [1.1, 0.9, 1.5], parent: g
        });
    }

    // ---- Torso: sudadera ----
    m(new THREE.CylinderGeometry(0.22, 0.26, 0.62, 12, 2), navy, { pos: [0, 1.22, 0], scale: [1, 1, 0.7], parent: g });
    m(new THREE.SphereGeometry(0.15, 10, 6), navy, { pos: [0, 1.5, -0.09], scale: [1.45, 0.6, 0.85], parent: g });   // capucha

    // ---- Chaleco abierto ----
    const gap = 1.05;
    m(new THREE.CylinderGeometry(0.235, 0.275, 0.54, 16, 1, true, gap / 2, Math.PI * 2 - gap),
        unlit(vestTex, { side: THREE.DoubleSide }), { pos: [0, 1.2, 0], scale: [1, 1, 0.72], parent: g });

    // ---- Lanyard, gafete y pin ----
    for (const sx of [-1, 1]) {
        const a = [sx * 0.09, 1.52], b = [sx * 0.025, 1.12];
        const len = Math.hypot(a[0] - b[0], a[1] - b[1]);
        m(new THREE.PlaneGeometry(0.035, len), unlit(lanyardTex, { side: THREE.DoubleSide }), {
            pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.172],
            rot: [0.08, 0, Math.atan2(a[0] - b[0], a[1] - b[1])],
            parent: g
        });
    }
    m(new THREE.BoxGeometry(0.05, 0.05, 0.02), unlit('#DCE0E8'), { pos: [0, 1.1, 0.18], parent: g });
    m(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 14), [unlit('#8E3B33'), unlit(pinTex), unlit('#8E3B33')],
        { pos: [-0.15, 1.08, 0.188], rot: [Math.PI / 2, 0, 0], parent: g });

    // ---- Brazo en reposo (derecha de la imagen) ----
    const rest = new THREE.Group();
    rest.position.set(0.27, 1.47, 0);
    rest.rotation.z = 0.28;
    g.add(rest);
    m(new THREE.CylinderGeometry(0.075, 0.09, 0.56, 8), navy, { pos: [0, -0.28, 0], parent: rest });
    const restHand = hand(rest, skin, { mirror: -1 });
    restHand.position.y = -0.55;
    restHand.rotation.y = -0.3;

    // ---- Brazo saludando (izquierda de la imagen) ----
    const wave = new THREE.Group();
    wave.position.set(-0.27, 1.47, 0);
    wave.rotation.z = -2.2;
    g.add(wave);
    m(new THREE.CylinderGeometry(0.075, 0.08, 0.3, 8), navy, { pos: [0, -0.15, 0], parent: wave });
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    wave.add(elbow);
    m(new THREE.SphereGeometry(0.078, 8, 6), navy, { parent: elbow });
    m(new THREE.CylinderGeometry(0.08, 0.09, 0.27, 8), navy, { pos: [0, -0.14, 0], parent: elbow });
    const waveHand = hand(elbow, skin, { mirror: 1 });
    waveHand.position.y = -0.27;

    // ---- Cuello ----
    m(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 8), skin, { pos: [0, 1.58, 0], parent: g });

    // ---- Cabeza ----
    const head = new THREE.Group();
    head.position.y = 1.9;
    g.add(head);
    const R = 0.3;
    m(headGeometry(R), skin, { parent: head });

    // cara en un plano apenas delante de la cabeza
    const faceOpen = faceTexture(false);
    const faceBlink = faceTexture(true);
    const faceMat = new THREE.MeshBasicMaterial({ map: faceOpen, transparent: true, depthWrite: false });
    m(new THREE.PlaneGeometry(0.42, 0.42), faceMat, { pos: [0, -0.05, R * 0.9 + 0.01], parent: head });

    // orejas + arete de cruz (oreja izquierda del personaje = derecha de la imagen)
    for (const sx of [-1, 1]) {
        m(new THREE.SphereGeometry(0.045, 6, 5), skin, { pos: [sx * 0.29, -0.05, 0], scale: [0.5, 1, 0.8], parent: head });
    }
    const silver = unlit('#E2E6EE');
    const ear = new THREE.Group();
    ear.position.set(0.31, -0.14, 0.01);
    head.add(ear);
    m(new THREE.TorusGeometry(0.014, 0.005, 4, 8), silver, { rot: [0, Math.PI / 2, 0], parent: ear });
    m(new THREE.BoxGeometry(0.01, 0.06, 0.01), silver, { pos: [0, -0.045, 0], parent: ear });
    m(new THREE.BoxGeometry(0.01, 0.01, 0.032), silver, { pos: [0, -0.032, 0], parent: ear });

    // ---- Pelo ----
    const hair = new THREE.Group();
    head.add(hair);
    const capMap = hairTexture(1);
    const tips = hairTexture(0.5);
    const fringeMap = hairTexture(1);
    const mintLock = hairTexture(0.08);

    // casco que cubre arriba y atrás (deja la frente libre)
    m(new THREE.SphereGeometry(R * 1.07, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.54), unlit(capMap), {
        pos: [0, 0.03, -0.03], rot: [-0.32, 0, 0], parent: hair
    });

    // fleco tipo cortina partido en medio: termina arriba de las cejas al centro
    // y baja hacia las sienes; la frente queda descubierta en medio.
    for (const sx of [-1, 1]) {
        lock(hair, { angle: sx * 0.3, yTop: 0.3, rTop: R * 0.85, yBot: 0.1, rBot: R * 1.04, width: 0.18, map: fringeMap, tilt: sx * 0.35 });
        lock(hair, { angle: sx * 0.78, yTop: 0.28, rTop: R * 0.95, yBot: -0.06, rBot: R * 1.12, width: 0.16, map: sx < 0 ? hairTexture(0.35) : fringeMap, tilt: sx * 0.15 });
    }
    // "hongo" a los lados (corto, plano)
    for (const sx of [-1, 1]) {
        lock(hair, { angle: sx * 1.0, yTop: 0.26, rTop: R * 1.02, yBot: -0.06, rBot: R * 1.2, width: 0.24, map: capMap, curl: 0.04 });
        lock(hair, { angle: sx * 1.45, yTop: 0.24, rTop: R * 1.04, yBot: -0.04, rBot: R * 1.24, width: 0.26, map: capMap, curl: 0.05 });
    }
    // capa larga lacia con puntas menta (cae a los hombros)
    for (const sx of [-1, 1]) {
        lock(hair, { angle: sx * 1.15, yTop: 0.0, rTop: R * 1.02, yBot: -0.5, rBot: R * 1.15, width: 0.2, map: tips, curl: 0.06 });
        lock(hair, { angle: sx * 1.6, yTop: 0.02, rTop: R * 1.04, yBot: -0.56, rBot: R * 1.22, width: 0.24, map: tips, curl: 0.08 });
        lock(hair, { angle: sx * 2.1, yTop: 0.04, rTop: R * 1.04, yBot: -0.6, rBot: R * 1.25, width: 0.26, map: tips, curl: 0.06 });
    }
    // mullet atrás
    for (let i = 0; i < 5; i++) {
        const a = Math.PI + (i - 2) * 0.32;
        lock(hair, { angle: a, yTop: 0.1, rTop: R * 1.04, yBot: -0.64, rBot: R * 1.18, width: 0.26, map: tips, curl: 0.05 });
    }
    // un mechón suelto arriba, pequeño (silueta despeinada sin parecer orejas)
    lock(hair, { angle: -0.2, yTop: 0.3, rTop: R * 0.3, yBot: 0.36, rBot: R * 0.95, width: 0.09, map: capMap, tilt: 0.25 });

    return { g, head, wave, elbow, waveHand, faceMat, faceOpen, faceBlink };
}

// ---------- Fondo: ventana de Paint retro + dithering ----------
function backgroundTexture(dark) {
    const W = 256, H = 256;
    return canvasTexture(W, H, (ctx) => {
        // fondo con dithering de dos tonos (tipo GIF viejo)
        const a = dark ? '#2A3550' : '#9DAAD8';
        const b = dark ? '#36446A' : '#B7C2EA';
        px(ctx, 0, 0, a, W, H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const t = y / H;
            const thr = ((x * 7 + y * 13) % 16) / 16;
            if (thr < 0.35 + 0.4 * Math.sin(x * 0.05) * Math.cos(y * 0.04) - t * 0.2) px(ctx, x, y, b);
        }
        // ventana estilo Windows 98
        const wx = 36, wy = 40, ww = 184, wh = 150;
        px(ctx, wx + 3, wy + 3, 'rgba(0,0,0,0.25)', ww, wh);
        px(ctx, wx, wy, '#C0C0C0', ww, wh);
        px(ctx, wx, wy, '#FFFFFF', ww, 1); px(ctx, wx, wy, '#FFFFFF', 1, wh);
        px(ctx, wx, wy + wh - 1, '#404040', ww, 1); px(ctx, wx + ww - 1, wy, '#404040', 1, wh);
        // barra de título
        for (let x = 0; x < ww - 6; x++) {
            const t = x / (ww - 6);
            const r = Math.round(0 + 16 * t), gg = Math.round(32 + 100 * t), bb = Math.round(128 + 80 * t);
            px(ctx, wx + 3 + x, wy + 3, `rgb(${r},${gg},${bb})`, 1, 11);
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('hola.bmp - Paint', wx + 6, wy + 11);
        for (let i = 0; i < 3; i++) {
            px(ctx, wx + ww - 14 - i * 11, wy + 4, '#C0C0C0', 9, 9);
            px(ctx, wx + ww - 14 - i * 11, wy + 4, '#FFFFFF', 9, 1);
        }
        // barra de herramientas a la izquierda
        px(ctx, wx + 3, wy + 17, '#B4B4B4', 18, wh - 40);
        for (let i = 0; i < 8; i++) px(ctx, wx + 6, wy + 21 + i * 13, '#E0E0E0', 12, 10);
        // lienzo turquesa con degradado
        for (let y = 0; y < wh - 44; y++) {
            const t = y / (wh - 44);
            px(ctx, wx + 23, wy + 17 + y, `rgb(${Math.round(51 + 40 * t)},${Math.round(160 + 30 * t)},${Math.round(170 + 30 * t)})`, ww - 28, 1);
        }
        // paleta de colores abajo
        const pal = ['#000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#33CCBB', '#FFD166', '#FF9EB5'];
        pal.forEach((c, i) => px(ctx, wx + 26 + i * 12, wy + wh - 22, c, 10, 10));
        px(ctx, wx + 5, wy + wh - 22, '#33CCBB', 14, 14);
    });
}

// ---------- Montaje ----------
export function mount(container, opts = {}) {
    const stage = createStage(container, {
        pixel: 2,
        fov: 26,
        camera: [0, 1.55, 4.3],
        target: [0, 1.5, 0],
        baseYaw: 0.15,
        sway: 0,
        interactive: false,
        ...opts
    });
    if (!stage) return null;

    const { scene, root, camera } = stage;
    scene.children.filter((o) => o.isLight).forEach((l) => scene.remove(l));

    // fondo como plano fijo detrás (sigue a la cámara)
    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
    const bgMat = new THREE.MeshBasicMaterial({ map: backgroundTexture(isDark()), depthWrite: false });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bgMat);
    bg.renderOrder = -1;
    scene.add(bg);
    const placeBg = () => {
        const d = 6;
        const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d;
        bg.scale.set(h * camera.aspect, h, 1);
        bg.position.copy(camera.position).add(new THREE.Vector3(0, 0, -d).applyQuaternion(camera.quaternion));
        bg.quaternion.copy(camera.quaternion);
    };
    new MutationObserver(() => {
        bgMat.map.dispose();
        bgMat.map = backgroundTexture(isDark());
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const ema = buildEma();
    root.add(ema.g);

    // luz pintada una sola vez (el personaje no tiene luces en tiempo real)
    root.rotation.y = 0.15;
    bakeVertexLight(ema.g, { ao: 0.25, aoTop: 2.3, aoBottom: 0.0 });

    let nextBlink = 2.2;
    stage.start((t) => {
        placeBg();
        // saludo
        ema.elbow.rotation.z = -0.85 + Math.sin(t * 6) * 0.35;
        ema.waveHand.rotation.z = Math.sin(t * 6 - 0.6) * 0.15;
        // idle muy sutil
        ema.g.position.y = Math.sin(t * 1.8) * 0.006;
        ema.head.rotation.z = Math.sin(t * 1.1) * 0.025;
        // parpadeo
        const blinking = t > nextBlink && t < nextBlink + 0.14;
        const want = blinking ? ema.faceBlink : ema.faceOpen;
        if (ema.faceMat.map !== want) { ema.faceMat.map = want; ema.faceMat.needsUpdate = true; }
        if (t > nextBlink + 0.14) nextBlink = t + 2.6 + Math.random() * 2;
    });

    return stage;
}
