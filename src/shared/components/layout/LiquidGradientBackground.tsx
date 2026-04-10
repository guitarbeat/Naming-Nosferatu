import { useEffect, useRef } from "react";
import * as THREE from "three";

class TouchTexture {
	size: number;
	width: number;
	height: number;
	maxAge: number;
	radius: number;
	speed: number;
	trail: Array<{ x: number; y: number; age: number; force: number; vx: number; vy: number }>;
	last: { x: number; y: number } | null;
	canvas!: HTMLCanvasElement;
	ctx!: CanvasRenderingContext2D;
	texture!: THREE.Texture;

	constructor() {
		this.size = 64;
		this.width = this.height = this.size;
		this.maxAge = 64;
		this.radius = 0.25 * this.size;
		this.speed = 1 / this.maxAge;
		this.trail = [];
		this.last = null;
		this.initTexture();
	}

	initTexture() {
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		const context = this.canvas.getContext("2d");
		if (!context) {
			throw new Error("2D canvas context is unavailable.");
		}
		this.ctx = context;
		this.ctx.fillStyle = "black";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.texture = new THREE.Texture(this.canvas);
	}

	update() {
		this.clear();
		for (let i = this.trail.length - 1; i >= 0; i--) {
			const point = this.trail[i];
			const f = point.force * this.speed * (1 - point.age / this.maxAge);
			point.x += point.vx * f;
			point.y += point.vy * f;
			point.age++;
			if (point.age > this.maxAge) {
				this.trail.splice(i, 1);
			} else {
				this.drawPoint(point);
			}
		}
		this.texture.needsUpdate = true;
	}

	clear() {
		this.ctx.fillStyle = "black";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	addTouch(point: { x: number; y: number }) {
		let force = 0;
		let vx = 0;
		let vy = 0;
		const last = this.last;
		if (last) {
			const dx = point.x - last.x;
			const dy = point.y - last.y;
			if (dx === 0 && dy === 0) {
				return;
			}
			const dd = dx * dx + dy * dy;
			const d = Math.sqrt(dd);
			vx = dx / d;
			vy = dy / d;
			force = Math.min(dd * 20000, 2.0);
		}
		this.last = { x: point.x, y: point.y };
		this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
	}

	drawPoint(point: { x: number; y: number; age: number; force: number; vx: number; vy: number }) {
		const pos = {
			x: point.x * this.width,
			y: (1 - point.y) * this.height,
		};
		let intensity = 1;
		if (point.age < this.maxAge * 0.3) {
			intensity = Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2));
		} else {
			const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
			intensity = -t * (t - 2);
		}
		intensity *= point.force;
		const radius = this.radius;
		const color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) * 255}, ${intensity * 255}`;
		const offset = this.size * 5;
		this.ctx.shadowOffsetX = offset;
		this.ctx.shadowOffsetY = offset;
		this.ctx.shadowBlur = radius;
		this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;
		this.ctx.beginPath();
		this.ctx.fillStyle = "rgba(255,0,0,1)";
		this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
		this.ctx.fill();
	}

	dispose() {
		this.texture.dispose();
	}
}

interface Uniforms {
	uTime: THREE.IUniform<number>;
	uResolution: THREE.IUniform<THREE.Vector2>;
	uColor1: THREE.IUniform<THREE.Vector3>;
	uColor2: THREE.IUniform<THREE.Vector3>;
	uColor3: THREE.IUniform<THREE.Vector3>;
	uColor4: THREE.IUniform<THREE.Vector3>;
	uColor5: THREE.IUniform<THREE.Vector3>;
	uColor6: THREE.IUniform<THREE.Vector3>;
	uSpeed: THREE.IUniform<number>;
	uIntensity: THREE.IUniform<number>;
	uTouchTexture: THREE.IUniform<THREE.Texture | null>;
	uGrainIntensity: THREE.IUniform<number>;
	uZoom: THREE.IUniform<number>;
	uDarkNavy: THREE.IUniform<THREE.Vector3>;
	uGradientSize: THREE.IUniform<number>;
	uGradientCount: THREE.IUniform<number>;
	uColor1Weight: THREE.IUniform<number>;
	uColor2Weight: THREE.IUniform<number>;
}

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.);
  vUv = uv;
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uColor6;
uniform float uSpeed;
uniform float uIntensity;
uniform sampler2D uTouchTexture;
uniform float uGrainIntensity;
uniform float uZoom;
uniform vec3 uDarkNavy;
uniform float uGradientSize;
uniform float uGradientCount;
uniform float uColor1Weight;
uniform float uColor2Weight;

varying vec2 vUv;

#define PI 3.14159265359

float grain(vec2 uv, float time) {
  vec2 grainUv = uv * uResolution * 0.5;
  float grainValue = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
  return grainValue * 2.0 - 1.0;
}

vec3 getGradientColor(vec2 uv, float time) {
  float gradientRadius = uGradientSize;

  vec2 center1  = vec2(0.5 + sin(time * uSpeed * 0.40) * 0.4,  0.5 + cos(time * uSpeed * 0.50) * 0.4);
  vec2 center2  = vec2(0.5 + cos(time * uSpeed * 0.60) * 0.5,  0.5 + sin(time * uSpeed * 0.45) * 0.5);
  vec2 center3  = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
  vec2 center4  = vec2(0.5 + cos(time * uSpeed * 0.50) * 0.4,  0.5 + sin(time * uSpeed * 0.40) * 0.4);
  vec2 center5  = vec2(0.5 + sin(time * uSpeed * 0.70) * 0.35, 0.5 + cos(time * uSpeed * 0.60) * 0.35);
  vec2 center6  = vec2(0.5 + cos(time * uSpeed * 0.45) * 0.5,  0.5 + sin(time * uSpeed * 0.65) * 0.5);
  vec2 center7  = vec2(0.5 + sin(time * uSpeed * 0.55) * 0.38, 0.5 + cos(time * uSpeed * 0.48) * 0.42);
  vec2 center8  = vec2(0.5 + cos(time * uSpeed * 0.65) * 0.36, 0.5 + sin(time * uSpeed * 0.52) * 0.44);
  vec2 center9  = vec2(0.5 + sin(time * uSpeed * 0.42) * 0.41, 0.5 + cos(time * uSpeed * 0.58) * 0.39);
  vec2 center10 = vec2(0.5 + cos(time * uSpeed * 0.48) * 0.37, 0.5 + sin(time * uSpeed * 0.62) * 0.43);
  vec2 center11 = vec2(0.5 + sin(time * uSpeed * 0.68) * 0.33, 0.5 + cos(time * uSpeed * 0.44) * 0.46);
  vec2 center12 = vec2(0.5 + cos(time * uSpeed * 0.38) * 0.39, 0.5 + sin(time * uSpeed * 0.56) * 0.41);

  float influence1  = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center1));
  float influence2  = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center2));
  float influence3  = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center3));
  float influence4  = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center4));
  float influence5  = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center5));
  float influence6  = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center6));
  float influence7  = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center7));
  float influence8  = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center8));
  float influence9  = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center9));
  float influence10 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center10));
  float influence11 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center11));
  float influence12 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center12));

  vec2 rotatedUv1 = uv - 0.5;
  float angle1 = time * uSpeed * 0.15;
  rotatedUv1 = vec2(rotatedUv1.x * cos(angle1) - rotatedUv1.y * sin(angle1),
                    rotatedUv1.x * sin(angle1) + rotatedUv1.y * cos(angle1));
  rotatedUv1 += 0.5;

  vec2 rotatedUv2 = uv - 0.5;
  float angle2 = -time * uSpeed * 0.12;
  rotatedUv2 = vec2(rotatedUv2.x * cos(angle2) - rotatedUv2.y * sin(angle2),
                    rotatedUv2.x * sin(angle2) + rotatedUv2.y * cos(angle2));
  rotatedUv2 += 0.5;

  float radialInfluence1 = 1.0 - smoothstep(0.0, 0.8, length(rotatedUv1 - 0.5));
  float radialInfluence2 = 1.0 - smoothstep(0.0, 0.8, length(rotatedUv2 - 0.5));

  vec3 color = vec3(0.0);
  color += uColor1 * influence1  * (0.55 + 0.45 * sin(time * uSpeed))        * uColor1Weight;
  color += uColor2 * influence2  * (0.55 + 0.45 * cos(time * uSpeed * 1.2))  * uColor2Weight;
  color += uColor3 * influence3  * (0.55 + 0.45 * sin(time * uSpeed * 0.8))  * uColor1Weight;
  color += uColor4 * influence4  * (0.55 + 0.45 * cos(time * uSpeed * 1.3))  * uColor2Weight;
  color += uColor5 * influence5  * (0.55 + 0.45 * sin(time * uSpeed * 1.1))  * uColor1Weight;
  color += uColor6 * influence6  * (0.55 + 0.45 * cos(time * uSpeed * 0.9))  * uColor2Weight;

  if (uGradientCount > 6.0) {
    color += uColor1 * influence7  * (0.55 + 0.45 * sin(time * uSpeed * 1.4)) * uColor1Weight;
    color += uColor2 * influence8  * (0.55 + 0.45 * cos(time * uSpeed * 1.5)) * uColor2Weight;
    color += uColor3 * influence9  * (0.55 + 0.45 * sin(time * uSpeed * 1.6)) * uColor1Weight;
    color += uColor4 * influence10 * (0.55 + 0.45 * cos(time * uSpeed * 1.7)) * uColor2Weight;
  }
  if (uGradientCount > 10.0) {
    color += uColor5 * influence11 * (0.55 + 0.45 * sin(time * uSpeed * 1.8)) * uColor1Weight;
    color += uColor6 * influence12 * (0.55 + 0.45 * cos(time * uSpeed * 1.9)) * uColor2Weight;
  }

  color += mix(uColor1, uColor3, radialInfluence1) * 0.45 * uColor1Weight;
  color += mix(uColor2, uColor4, radialInfluence2) * 0.40 * uColor2Weight;

  color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;

  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luminance), color, 1.35);
  color = pow(color, vec3(0.92));

  float brightness1 = length(color);
  color = mix(uDarkNavy, color, max(brightness1 * 1.2, 0.15));

  float brightness = length(color);
  if (brightness > 1.0) color *= 1.0 / brightness;

  return color;
}

void main() {
  vec2 uv = vUv;

  vec4 touchTex = texture2D(uTouchTexture, uv);
  float vx = -(touchTex.r * 2.0 - 1.0);
  float vy = -(touchTex.g * 2.0 - 1.0);
  float intensity = touchTex.b;
  uv.x += vx * 0.8 * intensity;
  uv.y += vy * 0.8 * intensity;

  vec2 center = vec2(0.5);
  float dist = length(uv - center);
  float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.04 * intensity;
  float wave   = sin(dist * 15.0 - uTime * 2.0) * 0.03 * intensity;
  uv += vec2(ripple + wave);

  vec3 color = getGradientColor(uv, uTime);

  color += grain(uv, uTime) * uGrainIntensity;

  float timeShift = uTime * 0.5;
  color.r += sin(timeShift) * 0.02;
  color.g += cos(timeShift * 1.4) * 0.02;
  color.b += sin(timeShift * 1.2) * 0.02;

  float brightness2 = length(color);
  color = mix(uDarkNavy, color, max(brightness2 * 1.2, 0.15));
  color = clamp(color, vec3(0.0), vec3(1.0));

  float brightness = length(color);
  if (brightness > 1.0) color *= 1.0 / brightness;

  gl_FragColor = vec4(color, 1.0);
}
`;

export function LiquidGradientBackground() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		// Bail out gracefully when WebGL is unavailable (e.g. headless environments)
		const testCanvas = document.createElement("canvas");
		const hasWebGL = !!testCanvas.getContext("webgl") || !!testCanvas.getContext("webgl2");
		if (!hasWebGL) {
			return;
		}

		let renderer: THREE.WebGLRenderer;
		try {
			renderer = new THREE.WebGLRenderer({
				antialias: true,
				powerPreference: "high-performance",
				alpha: false,
				stencil: false,
				depth: false,
			});
		} catch {
			return;
		}
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		container.appendChild(renderer.domElement);

		const camera = new THREE.PerspectiveCamera(
			45,
			window.innerWidth / window.innerHeight,
			0.1,
			10000,
		);
		camera.position.z = 50;

		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x0a0e27);

		const clock = new THREE.Clock();

		const getViewSize = () => {
			const fovInRadians = (camera.fov * Math.PI) / 180;
			const height = Math.abs(camera.position.z * Math.tan(fovInRadians / 2) * 2);
			return { width: height * camera.aspect, height };
		};

		const touchTexture = new TouchTexture();

		const uniforms: Uniforms = {
			uTime: { value: 0 },
			uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
			uColor1: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
			uColor2: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
			uColor3: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
			uColor4: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
			uColor5: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
			uColor6: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
			uSpeed: { value: 1.5 },
			uIntensity: { value: 1.8 },
			uTouchTexture: { value: touchTexture.texture },
			uGrainIntensity: { value: 0.08 },
			uZoom: { value: 1.0 },
			uDarkNavy: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
			uGradientSize: { value: 0.45 },
			uGradientCount: { value: 12.0 },
			uColor1Weight: { value: 0.5 },
			uColor2Weight: { value: 1.8 },
		};

		const viewSize = getViewSize();
		const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
		const material = new THREE.ShaderMaterial({
			uniforms,
			vertexShader: VERTEX_SHADER,
			fragmentShader: FRAGMENT_SHADER,
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.z = 0;
		scene.add(mesh);

		let rafId: number;

		const tick = () => {
			const delta = Math.min(clock.getDelta(), 0.1);
			touchTexture.update();
			uniforms.uTime.value += delta;
			renderer.render(scene, camera);
			rafId = requestAnimationFrame(tick);
		};
		tick();

		const onMouseMove = (ev: MouseEvent) => {
			touchTexture.addTouch({
				x: ev.clientX / window.innerWidth,
				y: 1 - ev.clientY / window.innerHeight,
			});
		};
		const onTouchMove = (ev: TouchEvent) => {
			const t = ev.touches[0];
			touchTexture.addTouch({
				x: t.clientX / window.innerWidth,
				y: 1 - t.clientY / window.innerHeight,
			});
		};
		const onResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
			uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
			const vs = getViewSize();
			mesh.geometry.dispose();
			mesh.geometry = new THREE.PlaneGeometry(vs.width, vs.height, 1, 1);
		};

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("touchmove", onTouchMove, { passive: true });
		window.addEventListener("resize", onResize);

		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("touchmove", onTouchMove);
			window.removeEventListener("resize", onResize);
			mesh.geometry.dispose();
			material.dispose();
			touchTexture.dispose();
			renderer.dispose();
			container.removeChild(renderer.domElement);
		};
	}, []);

	return <div ref={containerRef} className="fixed inset-0 -z-10" aria-hidden="true" />;
}
