// One instanced cube, morphing between two formations on the GPU.
// World space is CSS pixels: 1 unit on the z=0 plane is 1px on screen.

export const vertex = /* glsl */ `
uniform vec3 uFromC;
uniform vec3 uToC;
uniform float uFromS;
uniform float uToS;
uniform mat3 uFromR;
uniform mat3 uToR;
uniform float uFromZ;
uniform float uToZ;
uniform float uProgress;
uniform float uStagger;
uniform float uArc;
uniform float uLift;
uniform float uSpin;
uniform float uExplode;
uniform float uExplodeR;
uniform float uVel;
uniform float uGap;
uniform vec3 uPalette[8];
uniform float uLit;
uniform float uLitFrom;
uniform float uLitTo;
uniform float uGold;

attribute vec4 aFrom;
attribute vec4 aFromM;
attribute vec4 aTo;
attribute vec4 aToM;
attribute vec4 aSeed;
attribute vec3 aOffset;
attribute vec4 aTint;

varying vec3 vNormal;
varying vec3 vLocal;
varying vec3 vColor;
varying vec3 vView;
varying float vLit;
varying float vGlow;

mat3 axisAngle(vec3 a, float ang) {
  float s = sin(ang);
  float c = cos(ang);
  float oc = 1.0 - c;
  return mat3(
    oc * a.x * a.x + c, oc * a.x * a.y + a.z * s, oc * a.z * a.x - a.y * s,
    oc * a.x * a.y - a.z * s, oc * a.y * a.y + c, oc * a.y * a.z + a.x * s,
    oc * a.z * a.x + a.y * s, oc * a.y * a.z - a.x * s, oc * a.z * a.z + c
  );
}

void main() {
  // per-instance stagger, then smootherstep so every cube starts and lands softly
  float t = clamp(uProgress * (1.0 + uStagger) - aTo.w * uStagger, 0.0, 1.0);
  t = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);

  vec3 zA = vec3(1.0, 1.0, uFromZ);
  vec3 zB = vec3(1.0, 1.0, uToZ);
  vec3 pA = uFromC + uFromR * (aFrom.xyz * zA) * uFromS;
  vec3 pB = uToC + uToR * (aTo.xyz * zB) * uToS;

  float arc = sin(3.14159265 * t);
  vec3 sd = aSeed.xyz - 0.5;
  float sMix = mix(uFromS, uToS, t);
  vec3 p = mix(pA, pB, t) + sd * uArc * sMix * arc + vec3(0.0, 0.0, uLift * sMix * arc);

  vec3 dir = normalize(sd + vec3(0.0001));
  p += dir * uExplode * uExplodeR * (0.55 + 0.45 * aSeed.w);

  // cubes spin only mid-flight, so they are square at both ends
  float spin = arc * uSpin + uExplode * (1.5 + 3.5 * aSeed.w);
  mat3 R = axisAngle(normalize(sd.zxy + vec3(0.0001)), spin);
  mat3 F = uFromR * (1.0 - t) + uToR * t;
  vec3 zs = mix(zA, zB, t);
  float size = mix(aFromM.y * uFromS, aToM.y * uToS, t) * (1.0 - uGap);

  vec3 local = F * (R * (position * zs)) * size;
  local.y *= 1.0 + min(abs(uVel), 1.0) * 0.5;
  vec3 world = p + local + aOffset;

  vNormal = normalize(F * (R * (normal / zs)));
  vLocal = position;
  vColor = mix(uPalette[int(aFromM.x + 0.5)], uPalette[int(aToM.x + 0.5)], t);
  vColor = mix(vColor, aTint.rgb, aTint.a);

  float seq = t < 0.5 ? aFromM.z : aToM.z;
  float litOn = t < 0.5 ? uLitFrom : uLitTo;
  vLit = (litOn > 0.5 && seq >= 0.0) ? smoothstep(seq, seq + 0.75, uLit) : 1.0;
  float pal = t < 0.5 ? aFromM.x : aToM.x;
  vGlow = (abs(pal - 1.0) < 0.5) ? uGold : 0.0;

  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

export const fragment = /* glsl */ `
uniform vec3 uOff;
uniform vec3 uRim;
uniform float uFlat;
uniform float uWire;
uniform float uFade;

varying vec3 vNormal;
varying vec3 vLocal;
varying vec3 vColor;
varying vec3 vView;
varying float vLit;
varying float vGlow;

void main() {
  // distance to the nearest cube edge, from the cube-local position
  vec3 a = abs(vLocal) * 2.0;
  float mx = max(max(a.x, a.y), a.z);
  float mn = min(min(a.x, a.y), a.z);
  float mid = a.x + a.y + a.z - mx - mn;
  float edge = smoothstep(0.80, 0.97, mid);
  if (uWire > 0.5 && edge < 0.35) discard;

  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 L = normalize(vec3(-0.4, 0.7, 0.65));
  float wrap = max(dot(N, L) * 0.6 + 0.4, 0.0);
  float hemi = 0.6 + 0.4 * (N.y * 0.5 + 0.5);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float spec = pow(max(dot(N, normalize(L + V)), 0.0), 40.0);

  vec3 base = mix(uOff, vColor, vLit);
  vec3 col = base * (0.42 * hemi + 0.72 * wrap);
  col += uRim * rim * 0.32 + vec3(spec * 0.12);
  col += base * edge * 0.2;
  col += vGlow * vec3(0.35, 0.25, 0.02) * (0.6 + 0.4 * edge);
  col = mix(col, base, uFlat);
  if (uWire > 0.5) col = vColor;

  gl_FragColor = vec4(col * uFade, uFade);
  #include <colorspace_fragment>
}
`;
