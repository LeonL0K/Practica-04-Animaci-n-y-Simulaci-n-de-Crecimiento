// Joel Iván Juárez León
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
// 1. CONFIGURACIÓN GLOBAL
// ============================================================
const DURACION_TOTAL = 10;
const DESFASE_PLANTAS = [0, 3, 6];
let velocidadCrecimiento = 1.0;
let intensidadViento = 1.0;
let pausado = false;

// ============================================================
// 2. ESCENA / CÁMARA / RENDERER
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8d8e8);
scene.fog = new THREE.Fog(0xdfe8f0, 60, 220);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
const camaraInicial = new THREE.Vector3(0, 8, 16);
camera.position.copy(camaraInicial);
camera.lookAt(0, 3, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// ============================================================
// 3. CONTROLES
// ============================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 60;
controls.target.set(0, 3, 0);

// ============================================================
// 4. LUCES
// ============================================================
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3a5f3a, 0.4));

const solLight = new THREE.DirectionalLight(0xfff2cc, 1.6);
solLight.position.set(0, 25, -25);
solLight.castShadow = true;
solLight.shadow.mapSize.set(2048, 2048);
solLight.shadow.camera.left = -30;
solLight.shadow.camera.right = 30;
solLight.shadow.camera.top = 30;
solLight.shadow.camera.bottom = -30;
solLight.shadow.camera.far = 80;
scene.add(solLight);

// ============================================================
// 5. SUELO
// ============================================================
const texturas = new THREE.TextureLoader();

const sueloMat = new THREE.MeshStandardMaterial({
  map: texturas.load('./assets/ground/Ground003_1K-JPG_Color.jpg',
    undefined, undefined, () => console.warn('⚠️ Sin textura suelo')),
  normalMap: texturas.load('./assets/ground/Ground003_1K-JPG_NormalGL.jpg',
    undefined, undefined, () => {}),
  roughnessMap: texturas.load('./assets/ground/Ground003_1K-JPG_Roughness.jpg',
    undefined, undefined, () => {}),
  roughness: 1,
  metalness: 0
});
if (sueloMat.map) {
  sueloMat.map.wrapS = sueloMat.map.wrapT = THREE.RepeatWrapping;
  sueloMat.map.repeat.set(4, 4);
  sueloMat.map.colorSpace = THREE.SRGBColorSpace;
}

const suelo = new THREE.Mesh(new THREE.CircleGeometry(40, 64), sueloMat);
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
scene.add(suelo);

// ============================================================
// 6. DATOS GLOBALES
// ============================================================
const plantas = [];
const partesSeleccionables = [];
const hojasTodas = [];
const materialesHoja = [];

// ============================================================
// 7. CREAR PLANTA PROCEDURAL
// ============================================================
function crearPlanta(posX, posZ, desfase, colorFlor) {
  const grupo = new THREE.Group();
  grupo.position.set(posX, 0, posZ);

  const plantaData = {
    grupo: grupo,
    desfase: desfase,
    tiempoLocal: -desfase,
    partes: [],
    // Referencia al grupo del tallo (donde aplicamos el viento)
    talloGrupo: null,
    faseViento: Math.random() * Math.PI * 2
  };

  // --- MACETA ---
  const maceta = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 0.75, 1.2, 24),
    new THREE.MeshStandardMaterial({ color: 0xb05a2d, roughness: 0.85 })
  );
  maceta.position.y = 0.6;
  maceta.castShadow = true;
  maceta.receiveShadow = true;
  maceta.name = 'Maceta';
  maceta.userData.esSeleccionable = true;
  grupo.add(maceta);
  partesSeleccionables.push(maceta);

  // --- TIERRA ---
  const tierra = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.15, 24),
    new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 1 })
  );
  tierra.position.y = 1.15;
  tierra.receiveShadow = true;
  tierra.name = 'Tierra';
  tierra.userData.esSeleccionable = true;
  grupo.add(tierra);
  partesSeleccionables.push(tierra);

  // --- TALLO (agrupado para poder moverlo con el viento) ---
  const talloGrupo = new THREE.Group();
  talloGrupo.position.y = 1.2;
  grupo.add(talloGrupo);
  plantaData.talloGrupo = talloGrupo;

  const talloMat = new THREE.MeshStandardMaterial({ color: 0x3a8a3a, roughness: 0.75 });
  const talloGeo = new THREE.CylinderGeometry(0.08, 0.14, 3, 12);
  talloGeo.translate(0, 1.5, 0);

  const tallo = new THREE.Mesh(talloGeo, talloMat);
  tallo.castShadow = true;
  tallo.receiveShadow = true;
  tallo.name = 'Tallo';
  tallo.userData.esSeleccionable = true;
  talloGrupo.add(tallo);
  partesSeleccionables.push(tallo);

  plantaData.partes.push({
    mesh: tallo,
    rango: [0.0, 0.30],
    tipo: 'Tallo',
    esRama: false
  });

  // --- RAMAS + HOJAS ---
  const NUM_RAMAS = 5;

  for (let i = 0; i < NUM_RAMAS; i++) {
    const altura = 0.8 + i * 0.45;
    const ang = (i * Math.PI * 2) / NUM_RAMAS + (i * 0.4);

    // Grupo de la rama con pivote en la base
    const ramaGrupo = new THREE.Group();
    ramaGrupo.position.set(Math.cos(ang) * 0.12, altura, Math.sin(ang) * 0.12);
    ramaGrupo.rotation.z = -Math.PI / 3.2;
    ramaGrupo.rotation.y = -ang;
    talloGrupo.add(ramaGrupo);

    // Malla de la rama (pivote en la base)
    const ramaGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.2, 10);
    ramaGeo.translate(0, 0.6, 0);
    const ramaMat = new THREE.MeshStandardMaterial({ color: 0x4a9a4a, roughness: 0.7 });

    const rama = new THREE.Mesh(ramaGeo, ramaMat);
    rama.castShadow = true;
    rama.receiveShadow = true;
    rama.name = 'Rama';
    rama.userData.esSeleccionable = true;
    ramaGrupo.add(rama);
    partesSeleccionables.push(rama);

    // --- HOJA (pegada a la punta de la rama) ---
    const hojaGeo = new THREE.SphereGeometry(0.32, 12, 10);
    hojaGeo.scale(1, 0.12, 1.7);

    const hojaMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc40,
      roughness: 0.55,
      side: THREE.DoubleSide
    });
    materialesHoja.push(hojaMat);

    const hoja = new THREE.Mesh(hojaGeo, hojaMat);

    // En coords locales del ramaGrupo, la punta está en (0, 1.2, 0)
    hoja.position.set(0, 1.2, 0);
    // Contra-rotación para que quede horizontal
    hoja.rotation.z = Math.PI / 3.2;
    hoja.castShadow = true;
    hoja.receiveShadow = true;
    hoja.name = 'Hoja';
    hoja.userData.esSeleccionable = true;
    ramaGrupo.add(hoja);
    partesSeleccionables.push(hoja);
    hojasTodas.push(hoja);

    // Registrar rama y hoja
    plantaData.partes.push({
      mesh: ramaGrupo,
      rango: [0.30, 0.55],
      tipo: 'Rama',
      esRama: true,
      rama: rama,
      hoja: hoja,
      rangoHoja: [0.55, 0.80]
    });
  }

  // --- FLOR ---
  const florGrupo = new THREE.Group();
  florGrupo.position.y = 3;
  talloGrupo.add(florGrupo);

  const centro = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 14, 12),
    new THREE.MeshStandardMaterial({
      color: colorFlor,
      emissive: colorFlor,
      emissiveIntensity: 0.2,
      roughness: 0.4
    })
  );
  centro.castShadow = true;
  centro.name = 'Flor';
  centro.userData.esSeleccionable = true;
  florGrupo.add(centro);
  partesSeleccionables.push(centro);

  plantaData.partes.push({
    mesh: centro,
    rango: [0.80, 0.90],
    tipo: 'Flor',
    esRama: false
  });

  const petaloMat = new THREE.MeshStandardMaterial({
    color: colorFlor,
    roughness: 0.4,
    emissive: new THREE.Color(colorFlor).multiplyScalar(0.3)
  });

  for (let i = 0; i < 8; i++) {
    const petalo = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), petaloMat);
    const ang = (i * Math.PI * 2) / 8;
    petalo.position.set(Math.cos(ang) * 0.25, 0, Math.sin(ang) * 0.25);
    petalo.rotation.z = Math.PI / 2;
    petalo.rotation.y = -ang;
    petalo.castShadow = true;
    petalo.name = 'Pétalo';
    petalo.userData.esSeleccionable = true;
    florGrupo.add(petalo);
    partesSeleccionables.push(petalo);

    plantaData.partes.push({
      mesh: petalo,
      rango: [0.90, 1.0],
      tipo: 'Pétalo',
      esRama: false
    });
  }

  // Estado inicial: escala 0
  plantaData.partes.forEach((p) => {
    if (p.esRama) {
      p.rama.scale.set(1, 0.001, 1);
      p.hoja.scale.set(0.001, 0.001, 0.001);
    } else {
      p.mesh.scale.set(0.001, 0.001, 0.001);
    }
  });

  plantas.push(plantaData);
  scene.add(grupo);
  return grupo;
}

// ============================================================
// 8. CREAR 3 PLANTAS
// ============================================================
crearPlanta(-6, -1, DESFASE_PLANTAS[0], 0xdd3344);
crearPlanta(0, 0, DESFASE_PLANTAS[1], 0x9b59d0);
crearPlanta(6, 1, DESFASE_PLANTAS[2], 0xf5cc33);

// ============================================================
// 9. INFO DE PARTES
// ============================================================
const infoPartes = {
  'Maceta': { tipo: 'Cilindro', desc: 'Recipiente que sostiene la planta.' },
  'Tierra': { tipo: 'Cilindro plano', desc: 'Sustrato con nutrientes.' },
  'Tallo': { tipo: 'Cilindro', desc: 'Transporta agua y nutrientes.' },
  'Rama': { tipo: 'Cilindro', desc: 'Sostiene hojas y flores.' },
  'Hoja': { tipo: 'Esfera aplanada', desc: 'Realiza la fotosíntesis.' },
  'Flor': { tipo: 'Esfera', desc: 'Órgano reproductor.' },
  'Pétalo': { tipo: 'Cono', desc: 'Atrae polinizadores.' }
};

// ============================================================
// 10. RAYCASTING
// ============================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const infoNombre = document.getElementById('info-nombre');
const infoTipo = document.getElementById('info-tipo');
const infoProgreso = document.getElementById('info-progreso');
const infoDesc = document.getElementById('info-desc');

let seleccionado = null;
let colorOriginalSel = null;

addEventListener('click', (event) => {
  mouse.x = (event.clientX / innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(partesSeleccionables, false);

  if (seleccionado && colorOriginalSel !== null) {
    seleccionado.material.color.setHex(colorOriginalSel);
  }

  if (hits.length > 0) {
    const obj = hits[0].object;
    seleccionado = obj;
    colorOriginalSel = obj.material.color.getHex();
    obj.material.color.set(0xffff00);

    let progreso = 100;
    for (const p of plantas) {
      const estaEnPlanta = p.partes.some((parte) =>
        parte.mesh === obj || parte.rama === obj || parte.hoja === obj
      );
      if (estaEnPlanta) {
        progreso = Math.round(Math.max(0, Math.min(1,
          p.tiempoLocal / DURACION_TOTAL
        )) * 100);
        break;
      }
    }

    const info = infoPartes[obj.name] || { tipo: '—', desc: 'Sin información.' };
    infoNombre.textContent = obj.name;
    infoTipo.textContent = info.tipo;
    infoProgreso.textContent = progreso + '%';
    infoDesc.textContent = info.desc;
  } else {
    infoNombre.textContent = 'Selecciona una parte';
    infoTipo.textContent = '—';
    infoProgreso.textContent = '—';
    infoDesc.textContent = 'Haz clic sobre una parte de la planta.';
    seleccionado = null;
  }
});

// ============================================================
// 11. CONTROLES HTML
// ============================================================
const sliderVelocidad = document.getElementById('velocidad');
const sliderViento = document.getElementById('viento');
const velocidadValor = document.getElementById('velocidad-valor');
const vientoValor = document.getElementById('viento-valor');

sliderVelocidad.addEventListener('input', (e) => {
  velocidadCrecimiento = parseFloat(e.target.value);
  velocidadValor.textContent = velocidadCrecimiento.toFixed(1) + 'x';
});

sliderViento.addEventListener('input', (e) => {
  intensidadViento = parseFloat(e.target.value);
  vientoValor.textContent = intensidadViento.toFixed(1);
});

const btnPausa = document.getElementById('btn-pausa');
btnPausa.addEventListener('click', () => {
  pausado = !pausado;
  btnPausa.textContent = pausado ? '▶ Reanudar animación' : '⏸ Pausar animación';
});

document.getElementById('btn-reiniciar').addEventListener('click', () => {
  plantas.forEach((p) => {
    p.tiempoLocal = -p.desfase;
    p.partes.forEach((parte) => {
      if (parte.esRama) {
        parte.rama.scale.set(1, 0.001, 1);
        parte.hoja.scale.set(0.001, 0.001, 0.001);
      } else {
        parte.mesh.scale.set(0.001, 0.001, 0.001);
      }
    });
  });
  console.log('🔄 Crecimiento reiniciado');
});

document.getElementById('btn-color-hojas').addEventListener('click', () => {
  const nuevoColor = new THREE.Color().setHSL(
    0.2 + Math.random() * 0.3,
    0.7,
    0.4 + Math.random() * 0.2
  );
  materialesHoja.forEach((m) => m.color.copy(nuevoColor));
});

document.getElementById('btn-camara').addEventListener('click', () => {
  camera.position.copy(camaraInicial);
  controls.target.set(0, 3, 0);
  controls.update();
});

// ============================================================
// 12. BUCLE DE ANIMACIÓN
// ============================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  // ==========================================
  // CRECIMIENTO
  // ==========================================
  if (!pausado) {
    plantas.forEach((p) => {
      p.tiempoLocal += dt * velocidadCrecimiento;
      const progreso = Math.max(0, Math.min(1, p.tiempoLocal / DURACION_TOTAL));

      p.partes.forEach((parte) => {
        const [ini, fin] = parte.rango;
        const local = (progreso - ini) / (fin - ini);
        const clamped = Math.max(0, Math.min(1, local));
        const suave = 1 - Math.pow(1 - clamped, 3);
        const s = 0.001 + suave * 0.999;

        if (parte.esRama) {
          parte.rama.scale.set(1, s, 1);

          const [iniH, finH] = parte.rangoHoja;
          const localH = (progreso - iniH) / (finH - iniH);
          const clampedH = Math.max(0, Math.min(1, localH));
          const suaveH = 1 - Math.pow(1 - clampedH, 3);
          const sH = 0.001 + suaveH * 0.999;
          parte.hoja.scale.set(sH, sH, sH);
        } else {
          parte.mesh.scale.set(s, s, s);
        }
      });
    });
  }

  // ==========================================
  // VIENTO — toda la planta se mece
  // ==========================================
  // Solo el talloGrupo se rota, y como ramas/hojas/flor son hijos,
  // se mueven junto con él. La maceta y tierra NO se mueven.
  plantas.forEach((p) => {
    const fuerza = intensidadViento;
    const fase = p.faseViento;

    // Dos movimientos combinados para naturalidad
    p.talloGrupo.rotation.z = Math.sin(t * 1.6 + fase) * 0.08 * fuerza;
    p.talloGrupo.rotation.x = Math.cos(t * 1.3 + fase * 1.4) * 0.06 * fuerza;

    // Las hojas se mueven un poquito más (extra)
    p.talloGrupo.children.forEach((hijo) => {
      if (hijo.isGroup && hijo.children.length > 0) {
        // Es un ramaGrupo
        const ramaMesh = hijo.children[0];
        const hoja = hijo.children[1];
        if (hoja && hoja.name === 'Hoja') {
          // La hoja oscila sobre su propio eje
          hoja.rotation.y = Math.sin(t * 2.5 + fase + hijo.position.y) * 0.3 * fuerza;
          hoja.rotation.x = Math.cos(t * 2.0 + fase) * 0.2 * fuerza;
        }
      }
    });
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// ============================================================
// 13. RESIZE
// ============================================================
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

console.log('🌱 Simulador de crecimiento cargado.');