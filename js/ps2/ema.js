// =========================================================
//  Ema - escena de bienvenida estilo personaje PS2 (2000s)
//  Proporciones realistas, sombreado suave, pelo en planos
//  grandes y angulosos (jellyfish cut con frente despejada),
//  ojos de tamaño normal. Saluda con la mano.
//  Rasgos: pelo negro con puntas verdes, lentes sin marco,
//  arete, playera azul marino, chaleco de seguridad, lanyard y pin.
// =========================================================
import { THREE, createStage, canvasTexture, px, lambert, makeRng } from './ps2.js';

const rand = makeRng(77);

// ---------- Paleta ----------
const SKIN = '#D9A887';
const SKIN_SH = '#B98466';
const SKIN_HI = '#EBC2A4';
const HAIR = '#16141A';
const HAIR_HI = '#3B3742';
const GREEN = '#3E9E78';
const GREEN_HI = '#6FCFA2';
const NAVY = '#1E2A4C';

const mat = (map, extra = {}) => lambert(map, { flatShading: false, snap: false, ...extra });
const flatMat = (map, extra = {}) => { const m = lambert(map, { flatShading: true, snap: false, ...extra }); m.userData.keepFlat = true; return m; };

const smooth = (w, h, draw) => canvasTexture(w, h, draw, { linear: true });

// ---------- Cara ----------
// Textura equirectangular de la esfera de la cabeza; el frente queda en u = 0.25.
// 256x128: cada pixel horizontal ~ 1.4°, vertical ~ 1.4°.
function faceTexture() {
    return smooth(256, 128, (ctx, w, h) => {
        ctx.imageSmoothingEnabled = true;
        // piel base con un poco de volumen
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, SKIN_HI);
        g.addColorStop(0.55, SKIN);
        g.addColorStop(1, SKIN_SH);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        const cx = 64;            // frente (u = 0.25 en SphereGeometry de three.js)
        const ey = 60;            // línea de ojos

        // sombra suave a los lados de la cara (pómulos)
        for (const sx of [-1, 1]) {
            const rg = ctx.createRadialGradient(cx + sx * 30, 74, 2, cx + sx * 30, 74, 22);
            rg.addColorStop(0, 'rgba(160,105,80,0.28)');
            rg.addColorStop(1, 'rgba(160,105,80,0)');
            ctx.fillStyle = rg;
            ctx.fillRect(cx + sx * 30 - 24, 50, 48, 48);
        }

        // cejas: rectas y gruesas (masculinas)
        ctx.fillStyle = '#1E1816';
        for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(cx + sx * 4, ey - 9);
            ctx.lineTo(cx + sx * 21, ey - 10);
            ctx.lineTo(cx + sx * 22, ey - 8);
            ctx.lineTo(cx + sx * 5, ey - 6);
            ctx.closePath();
            ctx.fill();
        }

        // ojos: almendrados, de tamaño realista, mirada tranquila
        for (const sx of [-1, 1]) {
            const ex = cx + sx * 13;
            // cuenca un poco más oscura
            ctx.fillStyle = 'rgba(150,100,80,0.25)';
            ctx.beginPath();
            ctx.ellipse(ex, ey - 1, 10, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // blanco
            ctx.fillStyle = '#EFE6DE';
            ctx.beginPath();
            ctx.moveTo(ex - 8, ey);
            ctx.quadraticCurveTo(ex, ey - 4.5, ex + 8, ey);
            ctx.quadraticCurveTo(ex, ey + 3, ex - 8, ey);
            ctx.fill();
            // iris café oscuro
            ctx.fillStyle = '#3A2418';
            ctx.beginPath();
            ctx.arc(ex + sx * 0.5, ey - 0.5, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#120B08';
            ctx.beginPath();
            ctx.arc(ex + sx * 0.5, ey - 0.5, 1.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(ex + sx * 0.5 + 0.8, ey - 2.4, 1.2, 1.2);
            // párpado superior (línea), pliegue y párpado inferior sutil
            ctx.strokeStyle = '#1C1210';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(ex - 8.5, ey + 0.5);
            ctx.quadraticCurveTo(ex, ey - 5, ex + 8.5, ey + 0.5);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(120,75,55,0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ex - 7, ey - 3.5);
            ctx.quadraticCurveTo(ex, ey - 7, ex + 7, ey - 3.5);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(120,75,55,0.45)';
            ctx.beginPath();
            ctx.moveTo(ex - 6, ey + 2.5);
            ctx.quadraticCurveTo(ex, ey + 4, ex + 6, ey + 2.5);
            ctx.stroke();
        }

        // nariz: sombra lateral + base
        ctx.fillStyle = 'rgba(150,95,70,0.45)';
        ctx.beginPath();
        ctx.moveTo(cx - 2, ey + 2);
        ctx.lineTo(cx - 4, ey + 15);
        ctx.lineTo(cx - 1, ey + 15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(120,70,55,0.6)';
        ctx.fillRect(cx - 5, ey + 16, 3, 1.5);
        ctx.fillRect(cx + 2, ey + 16, 3, 1.5);
        ctx.fillStyle = 'rgba(150,95,70,0.3)';
        ctx.fillRect(cx - 5, ey + 17.5, 10, 1);

        // boca: neutra, labios naturales (sin pintar)
        ctx.fillStyle = '#A4705E';
        ctx.beginPath();
        ctx.moveTo(cx - 8, ey + 25);
        ctx.quadraticCurveTo(cx, ey + 23.5, cx + 8, ey + 25);
        ctx.quadraticCurveTo(cx, ey + 28.5, cx - 8, ey + 25);
        ctx.fill();
        ctx.strokeStyle = '#6E4234';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 8, ey + 25);
        ctx.quadraticCurveTo(cx, ey + 25.5, cx + 8, ey + 25);
        ctx.stroke();
        // sombra bajo el labio y barbilla
        ctx.fillStyle = 'rgba(150,95,70,0.3)';
        ctx.fillRect(cx - 4, ey + 30, 8, 2);
    });
}

// ---------- Pelo: degradado negro → verde (las puntas quedan verdes) ----------
// El canvas se mapea de arriba (raíz) a abajo (punta) con geometría propia.
function hairTexture(greenFrom = 0.62) {
    const clamp = (v) => Math.min(1, Math.max(0, v));
    return smooth(32, 64, (ctx, w, h) => {
        ctx.imageSmoothingEnabled = true;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, HAIR_HI);
        g.addColorStop(0.18, HAIR);
        if (greenFrom >= 1) {
            g.addColorStop(1, HAIR);              // capa sin verde
        } else {
            g.addColorStop(clamp(Math.max(0.2, greenFrom - 0.12)), HAIR);
            g.addColorStop(clamp(greenFrom), '#1F4A3C');
            g.addColorStop(clamp(greenFrom + 0.2), GREEN);
            g.addColorStop(1, GREEN_HI);
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // vetas verticales sutiles (mechones)
        for (let x = 0; x < w; x += 3) {
            ctx.fillStyle = `rgba(255,255,255,${(0.02 + rand() * 0.04).toFixed(3)})`;
            ctx.fillRect(x, 0, 1, h);
        }
        // banda de brillo tipo "anillo de luz" arriba
        ctx.fillStyle = 'rgba(120,130,150,0.28)';
        ctx.fillRect(0, h * 0.12, w, 3);
    });
}

/**
 * Capa de pelo "en cortina": una tira alrededor de la cabeza desde el ángulo a0 al a1
 * (0 = frente, PI = atrás), que sale desde (yTop, rTop) y cae hasta (yBot, rBot).
 * Los cortes de abajo son en picos anchos, como pelo de PS2.
 */
function hairCurtain({ a0, a1, segs = 12, yTop, rTop, yBot, yBot1 = yBot, rBot, jag = 0.06, zScale = 1, map, cx = 0 }) {
    const pos = [];
    const uv = [];
    const idx = [];
    for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const a = a0 + (a1 - a0) * t;
        const sinA = Math.sin(a);
        const cosA = Math.cos(a);
        const drop = (i % 2 ? jag : 0) + Math.sin(t * Math.PI * 3.1) * jag * 0.35;
        const yb = yBot + (yBot1 - yBot) * t;
        pos.push(cx + sinA * rTop, yTop, cosA * rTop * zScale);
        pos.push(cx + sinA * rBot, yb - drop, cosA * rBot * zScale);
        uv.push(t, 1, t, 0);
        if (i < segs) {
            const k = i * 2;
            idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, flatMat(map, { side: THREE.DoubleSide }));
}

// ---------- Ropa ----------
const shirtTex = smooth(32, 32, (ctx, w, h) => {
    ctx.imageSmoothingEnabled = true;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#27345C');
    g.addColorStop(1, '#18213D');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
});

// Chaleco: u=0 y u=1 = orillas del frente con banda fluorescente y reflejante
const vestTex = smooth(128, 64, (ctx, w, h) => {
    px(ctx, 0, 0, '#25282E', w, h);
    for (let y = 0; y < h; y += 2) for (let x = (y / 2) % 2; x < w; x += 2) px(ctx, x, y, '#2E3238');
    for (const x0 of [0, w - 14]) {
        px(ctx, x0, 0, '#CFE635', 14, h);
        px(ctx, x0 + 4, 0, '#C9CED4', 6, h);
        px(ctx, x0 + 4, 0, 'rgba(255,255,255,0.25)', 2, h);
    }
    px(ctx, 0, 44, '#CFE635', w, 10);
    px(ctx, 0, 47, '#C9CED4', w, 4);
});

const lanyardTex = canvasTexture(4, 16, (ctx, w, h) => {
    for (let y = 0; y < h; y++) px(ctx, 0, y, y % 4 < 2 ? '#F2F5F0' : '#5BB58A', w, 1);
});

const pinTex = smooth(32, 32, (ctx, w, h) => {
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = '#9E2F2F';
    ctx.beginPath(); ctx.arc(16, 16, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#E9D2BF';
    ctx.beginPath(); ctx.ellipse(16, 13, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2E2222';
    ctx.beginPath(); ctx.ellipse(16, 9, 7, 4, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#D8B24A';
    ctx.fillRect(12, 21, 8, 6);
});

const skinMat = mat(SKIN);
const shirtMat = mat(shirtTex);
const silverMat = mat('#D5D9DE');

// ---------- Utilidades de forma ----------
function m(geo, material, { pos, rot, scale, parent } = {}) {
    const o = new THREE.Mesh(geo, material);
    if (pos) o.position.set(...pos);
    if (rot) o.rotation.set(...rot);
    if (scale != null) Array.isArray(scale) ? o.scale.set(...scale) : o.scale.setScalar(scale);
    if (parent) parent.add(o);
    return o;
}

// Cabeza: esfera deformada con quijada definida y barbilla (masculina)
function headGeometry(R) {
    const geo = new THREE.SphereGeometry(R, 20, 16);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        x *= 0.9;                                     // cara un poco más angosta que alta
        if (y < 0) {
            const k = -y / R;                          // 0 en el ecuador, 1 en la barbilla
            x *= 1 - 0.22 * k * k;                     // quijada recta, no en punta
            z *= 1 - 0.08 * k;
            y *= 1.12;
            if (z > 0) z += 0.03 * R * k;              // barbilla hacia el frente
        } else {
            z *= 0.98;
        }
        if (z > 0 && y < 0.15 * R && y > -0.45 * R && Math.abs(x) < 0.25 * R) {
            z += 0.07 * R * (1 - Math.abs(x) / (0.25 * R));    // volumen de la nariz
        }
        p.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    return geo;
}

// ---------- Personaje ----------
function buildEma() {
    const g = new THREE.Group();

    // ---- Torso (hombros anchos) ----
    m(new THREE.CylinderGeometry(0.47, 0.42, 1.0, 16), shirtMat, { pos: [0, 0.52, 0], scale: [1, 1, 0.56], parent: g });
    for (const sx of [-1, 1]) {
        m(new THREE.SphereGeometry(0.2, 12, 8), shirtMat, { pos: [sx * 0.45, 0.95, 0], scale: [1, 0.78, 0.82], parent: g });
    }
    m(new THREE.TorusGeometry(0.14, 0.03, 6, 16), mat('#18213D'), { pos: [0, 1.03, 0.04], rot: [Math.PI / 2 - 0.25, 0, 0], scale: [1, 0.8, 1], parent: g });

    // ---- Chaleco abierto ----
    const gap = 1.0;
    m(new THREE.CylinderGeometry(0.49, 0.445, 0.86, 20, 1, true, gap / 2, Math.PI * 2 - gap), mat(vestTex, { side: THREE.DoubleSide }), { pos: [0, 0.48, 0], scale: [1, 1, 0.6], parent: g });
    for (const sx of [-1, 1]) {
        m(new THREE.BoxGeometry(0.14, 0.035, 0.5), mat('#25282E'), { pos: [sx * 0.29, 0.98, 0], rot: [0, 0, -sx * 0.18], parent: g });
    }

    // ---- Lanyard + gafete ----
    for (const sx of [-1, 1]) {
        const a = [sx * 0.11, 1.03], b = [sx * 0.02, 0.5];
        const len = Math.hypot(a[0] - b[0], a[1] - b[1]);
        m(new THREE.BoxGeometry(0.04, len, 0.01), mat(lanyardTex), {
            pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.275],
            rot: [0.06, 0, Math.atan2(a[0] - b[0], a[1] - b[1])],
            parent: g
        });
    }
    m(new THREE.BoxGeometry(0.045, 0.045, 0.025), silverMat, { pos: [0, 0.48, 0.28], parent: g });

    // ---- Pin ----
    m(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20), [mat('#7E2626'), mat(pinTex), mat('#7E2626')], { pos: [-0.3, 0.6, 0.235], rot: [Math.PI / 2, 0, 0], parent: g });

    // ---- Brazo abajo ----
    const restArm = new THREE.Group();
    restArm.position.set(0.5, 0.92, 0);
    restArm.rotation.z = 0.08;
    g.add(restArm);
    m(new THREE.CylinderGeometry(0.11, 0.1, 0.62, 10), shirtMat, { pos: [0, -0.31, 0], parent: restArm });

    // ---- Brazo saludando ----
    const wave = new THREE.Group();
    wave.position.set(-0.5, 0.93, 0.02);
    wave.rotation.z = 0.78;
    g.add(wave);
    m(new THREE.CylinderGeometry(0.1, 0.11, 0.46, 10), shirtMat, { pos: [0, 0.23, 0], parent: wave });

    const elbow = new THREE.Group();
    elbow.position.y = 0.45;
    wave.add(elbow);
    m(new THREE.SphereGeometry(0.1, 10, 8), shirtMat, { parent: elbow });
    // antebrazo con piel (manga corta)
    m(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 10), shirtMat, { pos: [0, 0.06, 0], parent: elbow });
    m(new THREE.CylinderGeometry(0.065, 0.08, 0.32, 10), skinMat, { pos: [0, 0.27, 0], parent: elbow });

    const hand = new THREE.Group();
    hand.position.y = 0.43;
    elbow.add(hand);
    // palma con algo de grosor y dedos juntos (mano de PS2)
    m(new THREE.BoxGeometry(0.15, 0.15, 0.055), skinMat, { pos: [0, 0.06, 0], parent: hand });
    [-0.052, -0.018, 0.018, 0.052].forEach((x, i) => {
        const len = [0.1, 0.12, 0.115, 0.095][i];
        m(new THREE.BoxGeometry(0.032, len, 0.045), skinMat, { pos: [x, 0.135 + len / 2, 0], rot: [0, 0, -x * 0.8], parent: hand });
    });
    m(new THREE.BoxGeometry(0.038, 0.09, 0.045), skinMat, { pos: [0.09, 0.05, 0.01], rot: [0, 0, -0.85], parent: hand });

    // ---- Cuello ----
    m(new THREE.CylinderGeometry(0.11, 0.13, 0.26, 12), skinMat, { pos: [0, 1.14, 0], parent: g });

    // ---- Cabeza ----
    const head = new THREE.Group();
    head.position.y = 1.56;
    g.add(head);

    const R = 0.36;
    const face = new THREE.Mesh(headGeometry(R), mat(faceTexture()));
    head.add(face);

    // orejas
    for (const sx of [-1, 1]) {
        m(new THREE.SphereGeometry(0.06, 8, 6), skinMat, { pos: [sx * 0.32, -0.03, -0.01], scale: [0.45, 1, 0.8], parent: head });
    }
    // arete (aro + colgante) en la oreja izquierda del personaje
    m(new THREE.TorusGeometry(0.022, 0.006, 6, 12), silverMat, { pos: [0.335, -0.1, 0.01], rot: [0, Math.PI / 2, 0], parent: head });
    m(new THREE.ConeGeometry(0.012, 0.05, 4), silverMat, { pos: [0.335, -0.15, 0.01], rot: [Math.PI, 0, 0], parent: head });

    // lentes sin marco: dos cristales planos + puente y patitas finas
    const lens = new THREE.MeshBasicMaterial({ color: 0xbfd4ff, transparent: true, opacity: 0.1, depthWrite: false });
    for (const sx of [-1, 1]) {
        m(new THREE.PlaneGeometry(0.13, 0.075), lens, { pos: [sx * 0.1, 0.035, 0.335], rot: [0, sx * 0.18, 0], parent: head });
        m(new THREE.BoxGeometry(0.008, 0.008, 0.3), silverMat, { pos: [sx * 0.29, 0.05, 0.17], rot: [0, -sx * 0.1, 0], parent: head });
    }
    m(new THREE.BoxGeometry(0.05, 0.008, 0.008), silverMat, { pos: [0, 0.055, 0.345], parent: head });

    // ---- Pelo: jellyfish cut, plano y anguloso ----
    const hair = new THREE.Group();
    head.add(hair);
    const topTex = hairTexture(1.1);       // capa de arriba: casi toda negra
    const longTex = hairTexture(0.45);     // capa larga: puntas verdes

    // Casco base (sombreado plano, se ve como una pieza sólida de PS2)
    const capGeo = new THREE.SphereGeometry(R * 1.06, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    capGeo.scale(0.95, 1, 1.02);
    const cap = m(capGeo, flatMat(topTex), { pos: [0, 0.03, -0.03], rot: [-0.62, 0, 0], parent: hair });

    // Capa de arriba (el "hongo" del jellyfish): a los lados termina a la altura
    // del pómulo; al frente se abre en un fleco tipo cortina, partido en medio,
    // que deja la frente descubierta y baja en diagonal hacia las sienes.
    for (const sx of [-1, 1]) {
        // fleco cortina: corto en el centro (arriba de las cejas), más largo hacia la sien
        hair.add(hairCurtain({
            a0: sx * 0.1, a1: sx * 0.85, segs: 5,
            yTop: 0.33, rTop: R * 0.9,
            yBot: 0.27, yBot1: 0.04, rBot: R * 1.05,
            jag: 0.025, map: topTex
        }));
        // lados del hongo
        hair.add(hairCurtain({
            a0: sx * 0.85, a1: sx * 1.75, segs: 6,
            yTop: 0.26, rTop: R * 0.96,
            yBot: 0.0, yBot1: -0.03, rBot: R * 1.1,
            jag: 0.035, map: topTex
        }));
    }
    hair.add(hairCurtain({ a0: 1.75, a1: Math.PI * 2 - 1.75, segs: 10, yTop: 0.24, rTop: R * 0.95, yBot: -0.03, rBot: R * 1.12, jag: 0.03, map: topTex }));

    // Capa larga de abajo: lacia, sale por debajo del hongo y cae a los hombros
    for (const sx of [-1, 1]) {
        hair.add(hairCurtain({
            a0: sx * 1.2, a1: sx * 1.75, segs: 4,
            yTop: 0.02, rTop: R * 1.05,
            yBot: -0.46, yBot1: -0.52, rBot: R * 1.02,
            jag: 0.06, map: longTex
        }));
    }
    hair.add(hairCurtain({ a0: 1.7, a1: Math.PI * 2 - 1.7, segs: 12, yTop: 0.0, rTop: R * 1.07, yBot: -0.58, rBot: R * 1.1, jag: 0.07, map: longTex }));

    return { g, head, wave, elbow, hand, cap };
}

// ---------- Fondo: oficina, sombreado suave ----------
function buildRoom(scene) {
    const room = new THREE.Group();
    scene.add(room);

    const wallTex = smooth(64, 64, (ctx, w, h) => {
        ctx.imageSmoothingEnabled = true;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#DCE2E6');
        g.addColorStop(1, '#C6CED4');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    });
    m(new THREE.PlaneGeometry(8, 5), mat(wallTex), { pos: [0, 1.4, -2.6], parent: room });

    const ceilTex = smooth(32, 32, (ctx, w, h) => {
        px(ctx, 0, 0, '#ECEFF0', w, h);
        px(ctx, 0, 0, '#C2C9CE', w, 1);
        px(ctx, 0, 0, '#C2C9CE', 1, h);
    });
    ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping;
    ceilTex.repeat.set(8, 5);
    m(new THREE.PlaneGeometry(8, 5), mat(ceilTex), { pos: [0, 3.0, -0.5], rot: [Math.PI / 2, 0, 0], parent: room });
    m(new THREE.PlaneGeometry(8, 5), mat('#8A949C'), { pos: [0, -0.3, -0.5], rot: [-Math.PI / 2, 0, 0], parent: room });

    // cajas de cartón
    const boxTex = smooth(32, 32, (ctx, w, h) => {
        ctx.imageSmoothingEnabled = true;
        px(ctx, 0, 0, '#C29A6E', w, h);
        px(ctx, 14, 0, '#D6B488', 4, h);
        px(ctx, 4, 20, '#EEEEEA', 8, 6);
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(255,255,255,0.08)');
        g.addColorStop(1, 'rgba(0,0,0,0.12)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    });
    const boxMat = flatMat(boxTex);
    [[1.35, 0.2, -2.0, 0.95, 0.75, 0.75, 0.1], [1.4, 0.95, -2.05, 0.85, 0.65, 0.65, -0.08], [1.3, 1.6, -2.0, 0.75, 0.6, 0.6, 0.15],
     [-1.45, 2.15, -2.1, 0.85, 0.6, 0.65, -0.1], [-0.65, 2.3, -2.2, 0.75, 0.5, 0.55, 0.05]].forEach(([x, y, z, w, h, d, ry]) => {
        m(new THREE.BoxGeometry(w, h, d), boxMat, { pos: [x, y, z], rot: [0, ry, 0], parent: room });
    });

    // gabinete
    const cabTex = smooth(32, 64, (ctx, w, h) => {
        px(ctx, 0, 0, '#A6ACB2', w, h);
        for (let y = 15; y < h; y += 16) px(ctx, 0, y, '#878D93', w, 1);
        for (let y = 6; y < h; y += 16) px(ctx, 12, y, '#666C72', 8, 2);
    });
    m(new THREE.BoxGeometry(0.85, 2.0, 0.6), flatMat(cabTex), { pos: [-1.6, 0.7, -2.0], rot: [0, 0.2, 0], parent: room });

    // monitor
    const screenTex = smooth(64, 40, (ctx, w, h) => {
        px(ctx, 0, 0, '#2A2D33', w, h);
        px(ctx, 2, 2, '#0F1A1F', w - 4, h - 4);
        for (let y = 6; y < h - 4; y += 4) px(ctx, 6 + (y % 8 ? 4 : 0), y, y % 12 ? '#33CCBB' : '#FFD166', 12 + Math.floor(rand() * 30), 2);
    });
    const monitor = new THREE.Group();
    monitor.position.set(1.1, 0.9, -1.0);
    monitor.rotation.y = -0.45;
    room.add(monitor);
    const dark = mat('#2A2D33');
    m(new THREE.BoxGeometry(0.78, 0.5, 0.05), [dark, dark, dark, dark, mat(screenTex), dark], { parent: monitor });
    m(new THREE.BoxGeometry(0.08, 0.3, 0.06), dark, { pos: [0, -0.37, -0.03], parent: monitor });

    return room;
}

// ---------- Montaje ----------
export function mount(container, opts = {}) {
    const stage = createStage(container, {
        pixel: 2,
        fov: 28,
        camera: [0, 1.42, 4.1],
        target: [0, 1.28, 0],
        baseYaw: 0.12,
        sway: 0,
        interactive: false,
        ...opts
    });
    if (!stage) return null;

    const { scene, root } = stage;
    scene.background = new THREE.Color('#D4DBE0');
    scene.fog = new THREE.Fog('#D8DFE3', 3.8, 9);

    // Iluminación PS2: luz principal cálida + relleno frío
    scene.children.filter((o) => o.isLight).forEach((l) => scene.remove(l));
    scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x6a7078, 1.35));
    const key = new THREE.DirectionalLight(0xfff0e0, 1.5);
    key.position.set(2.5, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fd8ff, 0.6);
    rim.position.set(-3, 2, -2);
    scene.add(rim);

    buildRoom(scene);

    const ema = buildEma();
    root.position.x = 0.1;
    root.add(ema.g);

    stage.start((t) => {
        // saludo
        ema.elbow.rotation.z = -0.92 + Math.sin(t * 6) * 0.3;
        ema.hand.rotation.z = Math.sin(t * 6 - 0.7) * 0.12;
        ema.wave.rotation.z = 0.78 + Math.sin(t * 6) * 0.03;
        // idle sutil
        ema.g.position.y = Math.sin(t * 2) * 0.006;
        ema.head.rotation.z = 0.04 + Math.sin(t * 1.2) * 0.02;
        ema.head.rotation.y = -0.06 + Math.sin(t * 0.7) * 0.04;
    });

    return stage;
}
