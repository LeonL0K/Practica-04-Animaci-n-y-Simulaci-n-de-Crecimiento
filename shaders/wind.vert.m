// Shader de viento: desplaza los vértices según una onda sinusoidal
uniform float uTime;
uniform float uWindStrength;
uniform vec3 uWindDirection;

varying vec3 vPosition;

void main() {
  vPosition = position;
  vec3 pos = position;

  float fase = sin(uTime * 2.0 + position.x * 3.0 + position.y * 5.0);
  float factor = max(0.0, position.y) * 0.5;

  pos.x += uWindDirection.x * fase * uWindStrength * 0.05 * factor;
  pos.z += uWindDirection.z * fase * uWindStrength * 0.05 * factor;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}