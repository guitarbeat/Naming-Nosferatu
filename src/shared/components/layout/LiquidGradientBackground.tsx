import { type FC, useEffect, useRef } from "react";
import * as THREE from "three";
import "./LiquidGradient.css";

// --- TouchTexture Class ---
class TouchTexture {
	size: number;
	width: number;
	height: number;
	maxAge: number;
	radius: number;
	speed: number;
	trail: {
		x: number;
		y: number;
		age: number;
		force: number;
		vx: number;
		vy: number;
	}[];
	last: { x: number; y: number } | null;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	texture: THREE.Texture;

	constructor() {
		this.size = 64;
		this.width = this.height = this.size;
		this.maxAge = 64;
		this.radius = 0.25 * this.size; // Much larger touch radius for more obvious effect
		this.speed = 1 / this.maxAge;
		this.trail = [];
		this.last = null;

		this.canvas = document.createElement("canvas");
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		const context = this.canvas.getContext("2d");
		if (!context) {
			throw new Error("Could not get 2D context");
		}
		this.ctx = context;
		this.ctx.fillStyle = "black";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.texture = new THREE.Texture(this.canvas);

		this.initTexture();
	}

	initTexture() {
		this.ctx.fillStyle = "black";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	update() {
		this.clear();
		const speed = this.speed;
		// Use reverse iteration to safely remove items
		for (let i = this.trail.length - 1; i >= 0; i--) {
			const point = this.trail[i];
			if (!point) {
				continue;
			}
			const f = point.force * speed * (1 - point.age / this.maxAge);
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
			// const d = Math.sqrt(dd); // Unused
			vx = dx / Math.sqrt(dd);
			vy = dy / Math.sqrt(dd);
			force = Math.min(dd * 20000, 2.0); // Much stronger force for very noticeable effect
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
		const color = `${((point.vx + 1) / 2) * 255}, ${
			((point.vy + 1) / 2) * 255
		}, ${intensity * 255}`;
		const offset = this.size * 5;
		this.ctx.shadowOffsetX = offset;
		this.ctx.shadowOffsetY = offset;
		this.ctx.shadowBlur = radius * 1;
		this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;

		this.ctx.beginPath();
		this.ctx.fillStyle = "rgba(255,0,0,1)";
		this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
		this.ctx.fill();
	}
}

// --- GradientBackground Class ---
class GradientBackground {
	sceneManager: LiquidGradientManager;
	mesh: THREE.Mesh | null;
	uniforms: {
		uTime: { value: number };
		uResolution: { value: THREE.Vector2 };
		uColor1: { value: THREE.Vector3 };
		uColor2: { value: THREE.Vector3 };
		uColor3: { value: THREE.Vector3 };
		uColor4: { value: THREE.Vector3 };
		uColor5: { value: THREE.Vector3 };
		uColor6: { value: THREE.Vector3 };
		uSpeed: { value: number };
		uIntensity: { value: number };
		uTouchTexture: { value: THREE.Texture | null };
		uGrainIntensity: { value: number };
		uZoom: { value: number };
		uDarkNavy: { value: THREE.Vector3 };
		uGradientSize: { value: number };
		uGradientCount: { value: number };
		uColor1Weight: { value: number };
		uColor2Weight: { value: number };
	};

	constructor(sceneManager: LiquidGradientManager) {
		this.sceneManager = sceneManager;
		this.mesh = null;
		this.uniforms = {
			uTime: { value: 0 },
			uResolution: {
				value: new THREE.Vector2(window.innerWidth, window.innerHeight),
			},
			uColor1: { value: new THREE.Vector3(0.945, 0.353, 0.133) }, // F15A22 - Orange
			uColor2: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // 0a0e27 - Navy Blue
			uColor3: { value: new THREE.Vector3(0.945, 0.353, 0.133) }, // F15A22 - Orange
			uColor4: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // 0a0e27 - Navy Blue
			uColor5: { value: new THREE.Vector3(0.945, 0.353, 0.133) }, // F15A22 - Orange
			uColor6: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // 0a0e27 - Navy Blue
			uSpeed: { value: 1.2 }, // Faster animation
			uIntensity: { value: 1.8 },
			uTouchTexture: { value: null },
			uGrainIntensity: { value: 0.08 },
			uZoom: { value: 1.0 }, // Zoom/scale control - lower = less zoomed (more visible)
			uDarkNavy: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // #0a0e27 - Dark navy base color
			uGradientSize: { value: 1.0 }, // Control gradient size (smaller = more gradients)
			uGradientCount: { value: 6.0 }, // Number of gradient centers
			uColor1Weight: { value: 1.0 }, // Weight for color1 (orange) - reduce for more navy
			uColor2Weight: { value: 1.0 }, // Weight for color2 (navy) - increase for more navy
		};
	}

	init() {
		const viewSize = this.sceneManager.getViewSize();
		const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);

		const material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: `
            varying vec2 vUv;
            void main() {
              vec3 pos = position.xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
              vUv = uv;
            }
          `,
			fragmentShader: `
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

            // Grain function for film grain effect
            float grain(vec2 uv, float time) {
              vec2 grainUv = uv * uResolution * 0.5;
              float grainValue = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
              return grainValue * 2.0 - 1.0;
            }

            void main() {
              // Apply zoom
              vec2 uv = (vUv - 0.5) * uZoom + 0.5;
              float time = uTime;

              // Sample touch texture for displacement
              vec4 touch = texture2D(uTouchTexture, vUv);
              uv -= touch.xy * 0.15;
              
              // Dynamic gradient size based on uniform
              float gradientRadius = uGradientSize;

              // Multiple animated centers with different speeds and patterns
              // Support up to 12 centers for more gradient action
              vec2 center1 = vec2(
                0.5 + sin(time * uSpeed * 0.4) * 0.4,
                0.5 + cos(time * uSpeed * 0.5) * 0.4
              );
              vec2 center2 = vec2(
                0.5 + cos(time * uSpeed * 0.6) * 0.5,
                0.5 + sin(time * uSpeed * 0.45) * 0.5
              );
              vec2 center3 = vec2(
                0.5 + sin(time * uSpeed * 0.35) * 0.45,
                0.5 + cos(time * uSpeed * 0.55) * 0.45
              );
              vec2 center4 = vec2(
                0.5 + cos(time * uSpeed * 0.5) * 0.4,
                0.5 + sin(time * uSpeed * 0.4) * 0.4
              );
              vec2 center5 = vec2(
                0.5 + sin(time * uSpeed * 0.7) * 0.35,
                0.5 + cos(time * uSpeed * 0.6) * 0.35
              );
              vec2 center6 = vec2(
                0.5 + cos(time * uSpeed * 0.45) * 0.5,
                0.5 + sin(time * uSpeed * 0.65) * 0.5
              );

              // Additional centers for more gradient action (7-12)
              vec2 center7 = vec2(
                0.5 + sin(time * uSpeed * 0.55) * 0.38,
                0.5 + cos(time * uSpeed * 0.48) * 0.42
              );
              vec2 center8 = vec2(
                0.5 + cos(time * uSpeed * 0.65) * 0.36,
                0.5 + sin(time * uSpeed * 0.52) * 0.44
              );
              vec2 center9 = vec2(
                0.5 + sin(time * uSpeed * 0.42) * 0.41,
                0.5 + cos(time * uSpeed * 0.58) * 0.39
              );
              vec2 center10 = vec2(
                0.5 + cos(time * uSpeed * 0.48) * 0.37,
                0.5 + sin(time * uSpeed * 0.62) * 0.43
              );
              vec2 center11 = vec2(
                0.5 + sin(time * uSpeed * 0.68) * 0.33,
                0.5 + cos(time * uSpeed * 0.44) * 0.46
              );
              vec2 center12 = vec2(
                0.5 + cos(time * uSpeed * 0.38) * 0.39,
                0.5 + sin(time * uSpeed * 0.56) * 0.41
              );

              float dist1 = length(uv - center1);
              float dist2 = length(uv - center2);
              float dist3 = length(uv - center3);
              float dist4 = length(uv - center4);
              float dist5 = length(uv - center5);
              float dist6 = length(uv - center6);
              float dist7 = length(uv - center7);
              float dist8 = length(uv - center8);
              float dist9 = length(uv - center9);
              float dist10 = length(uv - center10);
              float dist11 = length(uv - center11);
              float dist12 = length(uv - center12);

              // Smaller, tighter influence areas based on uGradientSize
              float influence1 = 1.0 - smoothstep(0.0, gradientRadius, dist1);
              float influence2 = 1.0 - smoothstep(0.0, gradientRadius, dist2);
              float influence3 = 1.0 - smoothstep(0.0, gradientRadius, dist3);
              float influence4 = 1.0 - smoothstep(0.0, gradientRadius, dist4);
              float influence5 = 1.0 - smoothstep(0.0, gradientRadius, dist5);
              float influence6 = 1.0 - smoothstep(0.0, gradientRadius, dist6);
              float influence7 = 1.0 - smoothstep(0.0, gradientRadius, dist7);
              float influence8 = 1.0 - smoothstep(0.0, gradientRadius, dist8);
              float influence9 = 1.0 - smoothstep(0.0, gradientRadius, dist9);
              float influence10 = 1.0 - smoothstep(0.0, gradientRadius, dist10);
              float influence11 = 1.0 - smoothstep(0.0, gradientRadius, dist11);
              float influence12 = 1.0 - smoothstep(0.0, gradientRadius, dist12);

              // Multiple rotation layers for depth
              vec2 rotatedUv1 = uv - 0.5;
              float angle1 = time * uSpeed * 0.15;
              rotatedUv1 = vec2(
                rotatedUv1.x * cos(angle1) - rotatedUv1.y * sin(angle1),
                rotatedUv1.x * sin(angle1) + rotatedUv1.y * cos(angle1)
              );
              rotatedUv1 += 0.5;

              vec2 rotatedUv2 = uv - 0.5;
              float angle2 = -time * uSpeed * 0.12;
              rotatedUv2 = vec2(
                rotatedUv2.x * cos(angle2) - rotatedUv2.y * sin(angle2),
                rotatedUv2.x * sin(angle2) + rotatedUv2.y * cos(angle2)
              );
              rotatedUv2 += 0.5;

              float radialGradient1 = length(rotatedUv1 - 0.5);
              float radialGradient2 = length(rotatedUv2 - 0.5);
              float radialInfluence1 = 1.0 - smoothstep(0.0, 0.8, radialGradient1);
              float radialInfluence2 = 1.0 - smoothstep(0.0, 0.8, radialGradient2);

              // Blend all colors with dynamic intensities - increased for more contrast
              vec3 color = vec3(0.0);
              color += uColor1 * influence1 * (0.6 + 0.4 * sin(time * uSpeed)) * uColor1Weight;
              color += uColor2 * influence2 * (0.6 + 0.4 * cos(time * uSpeed * 1.2)) * uColor2Weight;
              color += uColor3 * influence3 * (0.6 + 0.4 * sin(time * uSpeed * 0.8)) * uColor1Weight;
              color += uColor4 * influence4 * (0.6 + 0.4 * cos(time * uSpeed * 1.3)) * uColor2Weight;
              color += uColor5 * influence5 * (0.6 + 0.4 * sin(time * uSpeed * 1.1)) * uColor1Weight;
              color += uColor6 * influence6 * (0.6 + 0.4 * cos(time * uSpeed * 0.9)) * uColor2Weight;

              // Add extra centers if uGradientCount > 6
              if (uGradientCount > 6.0) {
                color += uColor1 * influence7 * (0.6 + 0.4 * sin(time * uSpeed * 1.4)) * uColor1Weight;
                color += uColor2 * influence8 * (0.6 + 0.4 * cos(time * uSpeed * 1.5)) * uColor2Weight;
                color += uColor3 * influence9 * (0.6 + 0.4 * sin(time * uSpeed * 1.6)) * uColor1Weight;
                color += uColor4 * influence10 * (0.6 + 0.4 * cos(time * uSpeed * 1.7)) * uColor2Weight;
              }
              if (uGradientCount > 10.0) {
                color += uColor5 * influence11 * (0.6 + 0.4 * sin(time * uSpeed * 1.8)) * uColor1Weight;
                color += uColor6 * influence12 * (0.6 + 0.4 * cos(time * uSpeed * 1.9)) * uColor2Weight;
              }

              // Add radial overlays with more contrast
              color += mix(uColor1, uColor3, radialInfluence1) * 0.5 * uColor1Weight;
              color += mix(uColor2, uColor4, radialInfluence2) * 0.5 * uColor2Weight;

              // Clamp and apply intensity
              color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;

              // High saturation and contrast
              float luminance = dot(color, vec3(0.299, 0.587, 0.114));
              color = mix(vec3(luminance), color, 1.5); // More saturation
              color = pow(color, vec3(0.85)); // Contrast boost

              // Base background mix - less aggressive so colors show more
              float brightness1 = length(color);
              float mixFactor1 = smoothstep(0.05, 0.4, brightness1); 
              color = mix(uDarkNavy * 0.5, color, mixFactor1);

              // Cap maximum brightness
              float maxBrightness = 1.0;
              float brightness = length(color);
              if (brightness > maxBrightness) {
                color = color * (maxBrightness / brightness);
              }

              // Apply grain
              color += grain(vUv, time) * uGrainIntensity;
              
              gl_FragColor = vec4(color, 1.0);
            }
          `,
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.z = 0;
		this.sceneManager.scene.add(this.mesh);
	}

	update(delta: number) {
		if (this.uniforms.uTime) {
			this.uniforms.uTime.value += delta;
		}
	}

	onResize(width: number, height: number) {
		const viewSize = this.sceneManager.getViewSize();
		if (this.mesh) {
			this.mesh.geometry.dispose();
			this.mesh.geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
		}
		if (this.uniforms.uResolution) {
			this.uniforms.uResolution.value.set(width, height);
		}
	}
}

// --- LiquidGradientManager Class ---
class LiquidGradientManager {
	container: HTMLElement;
	renderer: THREE.WebGLRenderer;
	camera: THREE.PerspectiveCamera;
	scene: THREE.Scene;
	clock: THREE.Clock;
	touchTexture: TouchTexture;
	gradientBackground: GradientBackground;
	colorSchemes: Record<
		number,
		{
			color1: THREE.Vector3;
			color2: THREE.Vector3;
			color3?: THREE.Vector3;
			bgColor: number;
		}
	>;
	currentScheme: number;
	animationFrameId: number | null = null;

	constructor(container: HTMLElement) {
		this.container = container;

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			powerPreference: "high-performance",
			alpha: false,
			stencil: false,
			depth: false,
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.container.appendChild(this.renderer.domElement);
		this.renderer.domElement.id = "webGLApp";

		this.camera = new THREE.PerspectiveCamera(
			45,
			window.innerWidth / window.innerHeight,
			0.1,
			10000,
		);
		this.camera.position.z = 50;

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x0a0e27); // Dark navy

		this.clock = new THREE.Clock();

		this.touchTexture = new TouchTexture();
		this.gradientBackground = new GradientBackground(this);
		this.gradientBackground.uniforms.uTouchTexture.value = this.touchTexture.texture;

		this.colorSchemes = {
			1: {
				// Sunset Inferno
				color1: new THREE.Vector3(0.96, 0.35, 0.13), // Orange
				color2: new THREE.Vector3(0.48, 0.12, 1.0), // Deep Purple
				bgColor: 0x05051a,
			},
			2: {
				// Neon Cyber
				color1: new THREE.Vector3(0.0, 1.0, 0.8), // Cyan
				color2: new THREE.Vector3(1.0, 0.0, 0.8), // Magenta
				bgColor: 0x0a0514,
			},
			3: {
				// Deep Ocean
				color1: new THREE.Vector3(0.1, 0.4, 1.0), // Blue
				color2: new THREE.Vector3(0.0, 1.0, 0.5), // Mint
				color3: new THREE.Vector3(0.5, 0.0, 1.0), // Violet
				bgColor: 0x020a1a,
			},
			4: {
				// Golden Hour
				color1: new THREE.Vector3(1.0, 0.8, 0.2), // Gold
				color2: new THREE.Vector3(1.0, 0.4, 0.0), // Hot Orange
				color3: new THREE.Vector3(0.4, 0.1, 0.0), // Dark Sienna
				bgColor: 0x1a0d02,
			},
			5: {
				// Forest Spirit
				color1: new THREE.Vector3(0.1, 0.9, 0.3), // Emerald
				color2: new THREE.Vector3(0.0, 0.3, 0.1), // Moss
				color3: new THREE.Vector3(1.0, 1.0, 1.0), // Mist
				bgColor: 0x041a05,
			},
		};
		this.currentScheme = 2;

		this.gradientBackground.init();
		this.setColorScheme(2);
	}

	getViewSize() {
		const fovInRadians = (this.camera.fov * Math.PI) / 180;
		const height = Math.abs(this.camera.position.z * Math.tan(fovInRadians / 2) * 2);
		return { width: height * this.camera.aspect, height };
	}

	setColorScheme(scheme: number) {
		if (!this.colorSchemes[scheme]) {
			return;
		}
		this.currentScheme = scheme;
		const colors = this.colorSchemes[scheme];
		const uniforms = this.gradientBackground.uniforms;

		this.scene.background = new THREE.Color(colors.bgColor);
		const bgVec = new THREE.Vector3(
			this.scene.background.r,
			this.scene.background.g,
			this.scene.background.b,
		);
		uniforms.uDarkNavy.value.copy(bgVec);

		if (scheme === 1) {
			uniforms.uColor1.value.copy(colors.color1);
			uniforms.uColor2.value.copy(colors.color2);
			uniforms.uColor3.value.copy(colors.color1);
			uniforms.uColor4.value.copy(colors.color2);
			uniforms.uColor5.value.copy(colors.color1);
			uniforms.uColor6.value.copy(colors.color2);
			uniforms.uGradientSize.value = 0.85;
			uniforms.uSpeed.value = 1.0;
		} else if (scheme === 2) {
			uniforms.uColor1.value.copy(colors.color1);
			uniforms.uColor2.value.copy(colors.color2);
			uniforms.uColor3.value.copy(colors.color1);
			uniforms.uColor4.value.copy(colors.color2);
			uniforms.uColor5.value.copy(colors.color1);
			uniforms.uColor6.value.copy(colors.color2);
			uniforms.uGradientSize.value = 1.2;
			uniforms.uSpeed.value = 1.5;
		} else if (scheme >= 3) {
			uniforms.uColor1.value.copy(colors.color1);
			uniforms.uColor2.value.copy(colors.color2);
			uniforms.uColor3.value.copy(colors.color3 ?? colors.color1);
			uniforms.uColor4.value.copy(colors.color1);
			uniforms.uColor5.value.copy(colors.color2);
			uniforms.uColor6.value.copy(colors.color3 ?? colors.color1);
			uniforms.uGradientSize.value = 1.0;
			uniforms.uSpeed.value = 1.0;
		}
	}

	update(delta: number) {
		this.touchTexture.update();
		this.gradientBackground.update(delta);
	}

	render() {
		const delta = this.clock.getDelta();
		const clampedDelta = Math.min(delta, 0.1);
		this.renderer.render(this.scene, this.camera);
		this.update(clampedDelta);
		this.animationFrameId = requestAnimationFrame(() => this.render());
	}

	onResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.gradientBackground.onResize(window.innerWidth, window.innerHeight);
	}

	onMouseMove(clientX: number, clientY: number) {
		const x = clientX / window.innerWidth;
		const y = 1 - clientY / window.innerHeight;
		this.touchTexture.addTouch({ x, y });
	}

	cleanup() {
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
		}
		this.renderer.dispose();
		if (this.renderer.domElement?.parentNode) {
			this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
		}
	}
}

// --- React Component ---
const LiquidGradientBackground: FC = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const managerRef = useRef<LiquidGradientManager | null>(null);
	const activeScheme = 2;
	// Initialize Three.js
	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		managerRef.current = new LiquidGradientManager(containerRef.current);
		managerRef.current.setColorScheme(activeScheme);
		managerRef.current.render();

		const handleResize = () => managerRef.current?.onResize();
		window.addEventListener("resize", handleResize);

		const handlePointerMove = (e: PointerEvent) => {
			managerRef.current?.onMouseMove(e.clientX, e.clientY);
		};

		window.addEventListener("pointermove", handlePointerMove);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("pointermove", handlePointerMove);
			managerRef.current?.cleanup();
		};
	}, []);

	return <div ref={containerRef} className="liquid-gradient-container" />;
};

export default LiquidGradientBackground;
