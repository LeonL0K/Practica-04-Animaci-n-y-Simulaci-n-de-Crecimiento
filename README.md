# 🌱 Práctica 04 — Simulador de Crecimiento 3D

**Autor:** Joel Iván Juárez León (Joel Lechón)

## Descripción

Simulador botánico en 3D construido con **Three.js** donde tres plantas
crecen desde una semilla (escala 0) hasta su forma completa, en tiempo real.
El usuario puede controlar la velocidad de crecimiento, la intensidad del
viento, pausar/reanudar la animación, cambiar el color de las hojas y hacer
clic sobre cualquier parte de la planta para consultar su información.

## 🎯 Objetivo

Aprender a:

- Usar `requestAnimationFrame` para crear animaciones fluidas.
- Animar transformaciones (escala, rotación) para simular crecimiento.
- Organizar objetos en jerarquías (`THREE.Group`) para propagar el crecimiento.
- Simular viento con rotaciones sinusoidales.
- Implementar controles HTML que modifican la simulación en tiempo real.
- Aplicar raycasting para seleccionar partes de la planta.

## 📁 Estructura
practica-04-crecimiento/
├── index.html → Interfaz de usuario y controles
├── style.css → Estilos del menú, título y panel de info
├── main.js → Lógica de la escena, animación y controles
├── assets/
│ └── ground/ → Texturas PBR del suelo
│ ├── Ground003_1K-JPG_Color.jpg
│ ├── Ground003_1K-JPG_NormalGL.jpg
│ └── Ground003_1K-JPG_Roughness.jpg
├── captura.png → Captura de pantalla del visor
└── README.md