import * as THREE from "three";

// Procedurally generated cloud layer.
//
// Instead of sampling an equirectangular Clouds.jpg (which pinches at the poles
// and seams at ±180°), we evaluate 3D domain-warped fBm noise directly on the
// sphere surface in the fragment shader. Sampling in 3D means it wraps
// seamlessly and never distorts. Domain warping (offsetting the noise lookup by
// another noise field) is what produces the swirling, filamentary, cyclonic
// look of real satellite cloud maps.

const vertexShader = /* glsl */ `
  varying vec3 vDir;          // local-space direction, used as noise coordinate
  varying vec3 vWorldNormal;  // world-space normal, used for day/night lighting

  void main() {
    vDir = normalize(position);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vDir;
  varying vec3 vWorldNormal;

  uniform float uTime;
  uniform vec3  uSunDir;     // world-space direction to the sun
  uniform float uScale;      // base noise frequency (detail size)
  uniform float uWarp;       // domain-warp strength (swirlyness)
  uniform float uCoverage;   // threshold: higher = fewer clouds
  uniform float uSharpness;  // edge softness of cloud boundaries
  uniform float uDrift;      // shape-evolution (morph) speed
  uniform float uWindBands;  // number of alternating wind bands per hemisphere
  uniform float uWindSpeed;  // wind cycle rate (how fast the flow advances)
  uniform float uWindAmp;    // radians a band advects per cycle (shear amount)
  uniform float uOpacity;

  // Rotate a point around the Y (polar) axis — used to advect a latitude
  // band eastward or westward.
  vec3 rotateY(vec3 p, float a){
    float s = sin(a), c = cos(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  // --- Ashima / Stefan Gustavson 3D simplex noise -------------------------
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  // -----------------------------------------------------------------------

  // Fractal Brownian motion: stacked octaves of noise for turbulent detail.
  float fbm(vec3 p){
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 6; i++){
      sum += amp * snoise(p);
      p   *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }

  // Cloud density at a point, with the whole field rotated around the axis by
  // 'advect' radians. Kept as a function so we can sample it at two different
  // advection phases and blend them (see main).
  float density(vec3 baseDir, float advect){
    vec3 p = rotateY(baseDir, advect) * uScale;
    vec3 t = vec3(0.0, uTime * uDrift, 0.0);

    // Domain warp: displace the sample point by a low-frequency noise field.
    // This bends the filaments into swirls and cyclones.
    vec3 q = vec3(
      fbm(p + vec3(0.0, 0.0, 0.0) + t),
      fbm(p + vec3(5.2, 1.3, 2.7) + t),
      fbm(p + vec3(9.2, 7.8, 4.1) + t)
    );

    float n = fbm(p + uWarp * q + t);
    return n * 0.5 + 0.5; // -> 0..1
  }

  void main(){
    // Zonal wind: each latitude band drifts around the axis at its own speed
    // and direction (equatorial easterlies, mid-latitude westerlies, polar
    // easterlies), so bands shear past each other like real wind.
    float lat  = asin(clamp(vDir.y, -1.0, 1.0));   // -PI/2 (S) .. +PI/2 (N)
    float wind = sin(lat * uWindBands);            // alternates sign per band

    // Flow-map blend: instead of letting the rotation grow forever (which
    // shears the noise into ever-thinner ribbons), advance over one short cycle
    // then reset. Two copies run half a cycle apart and cross-fade, so the
    // reset is never visible and the shear stays bounded — no long strips.
    float phase = uTime * uWindSpeed;
    float f0 = fract(phase);
    float f1 = fract(phase + 0.5);
    float blend = abs(1.0 - 2.0 * f0);             // 1 at reset, 0 mid-cycle

    float base = wind * uWindAmp;                  // radians advected per cycle
    float d0 = density(vDir, base * f0);
    float d1 = density(vDir, base * f1);
    float d  = mix(d0, d1, blend);

    // Threshold into sparse, bright clouds over a mostly-clear sphere, then
    // fade the thin wispy edges so filaments trail off softly.
    float clouds = smoothstep(uCoverage, uCoverage + uSharpness, d);
    clouds *= smoothstep(0.0, 0.35, d);

    // Day/night: clouds are lit white on the sun side, dark on the night side.
    float light = clamp(dot(normalize(vWorldNormal), normalize(uSunDir)), 0.0, 1.0);
    float shade = 0.08 + 0.92 * light;

    float alpha = clouds * uOpacity;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(vec3(shade), alpha);
  }
`;

async function loadAtmosphere() {
  const cloudsGeometry = new THREE.SphereGeometry(2 * 1.005, 77, 77);

  const cloudsMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0, 0, 1) },
      uScale: { value: 5 }, // detail size — higher = smaller clouds
      uWarp: { value: 0.9 }, // swirlyness — higher = more cyclonic
      uCoverage: { value: 0.5 }, // higher = fewer clouds
      uSharpness: { value: 0.5 }, // edge softness
      uDrift: { value: 0.00005 }, // morph speed
      uWindBands: { value: 5.0 }, // alternating wind bands per hemisphere
      uWindSpeed: { value: 0.0006 }, // flow cycle rate
      uWindAmp: { value: 0.35 }, // shear per cycle (lower = fewer strips)
      uOpacity: { value: 0.8 },
    },
  });

  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);

  return clouds;
}

export default loadAtmosphere;
