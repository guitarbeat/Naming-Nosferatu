import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { memo, useEffect, useRef } from "react";
import { isMobileOrLowPowerDevice } from "@/lib/uiUtils";

interface IridescenceProps {
	color?: [number, number, number] | number[];
	speed?: number;
	amplitude?: number;
	mouseReact?: boolean;
	className?: string;
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

function getFragmentShader(isLowPower: boolean): string {
	const precision = isLowPower ? "mediump" : "highp";
	const iterations = isLowPower ? "5.0" : "8.0";
	return `
precision ${precision} float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < ${iterations}; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }

  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;
}

// ⚡ Bolt Performance Optimization: Wrapped expensive WebGL Iridescence component in React.memo()
export const Iridescence = memo(function Iridescence({
	color = [1, 1, 1],
	speed = 1.0,
	amplitude = 0.1,
	mouseReact = true,
	className = "",
}: IridescenceProps) {
	const ctnDom = useRef<HTMLDivElement>(null);
	const mousePos = useRef({ x: 0.5, y: 0.5 });
	const programRef = useRef<Program | null>(null);

	const r = color[0] ?? 1;
	const g = color[1] ?? 1;
	const b = color[2] ?? 1;

	const rRef = useRef(r);
	const gRef = useRef(g);
	const bRef = useRef(b);
	const speedRef = useRef(speed);
	const amplitudeRef = useRef(amplitude);

	// Update uniforms dynamically without re-initializing WebGL or re-compiling shaders
	useEffect(() => {
		rRef.current = r;
		gRef.current = g;
		bRef.current = b;
		speedRef.current = speed;
		amplitudeRef.current = amplitude;
		const program = programRef.current;
		if (program) {
			program.uniforms.uColor.value.set(r, g, b);
			program.uniforms.uSpeed.value = speed;
			program.uniforms.uAmplitude.value = amplitude;
		}
	}, [r, g, b, speed, amplitude]);

	useEffect(() => {
		const ctn = ctnDom.current;
		if (!ctn) {
			return;
		}

		let animateId = 0;
		let renderer: Renderer | null = null;
		let program: Program | null = null;
		let handleMouseMove: ((e: MouseEvent) => void) | null = null;
		let resize: (() => void) | null = null;
		let handleVisibilityChange: (() => void) | null = null;
		let isElementVisible = true;

		let cachedWidth = ctn.clientWidth || window.innerWidth || 1;
		let cachedHeight = ctn.clientHeight || window.innerHeight || 1;
		let cachedLeft = 0;
		let cachedTop = 0;

		const isLowPower = isMobileOrLowPowerDevice();
		const prefersReduced =
			typeof window !== "undefined" &&
			Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

		// Limit DPR on mobile/budget devices to save fillrate and battery
		const maxDpr = isLowPower ? 1.0 : 1.25;

		try {
			renderer = new Renderer({
				alpha: true,
				antialias: !isLowPower,
				dpr: Math.min(window.devicePixelRatio || 1, maxDpr),
			});
			const gl = renderer.gl;
			gl.clearColor(0, 0, 0, 0);

			resize = () => {
				if (!renderer || !ctn) {
					return;
				}
				const rect = ctn.getBoundingClientRect();
				cachedWidth = rect.width || ctn.clientWidth || window.innerWidth || 1;
				cachedHeight = rect.height || ctn.clientHeight || window.innerHeight || 1;
				cachedLeft = rect.left;
				cachedTop = rect.top;

				renderer.setSize(cachedWidth, cachedHeight);
				if (program) {
					program.uniforms.uResolution.value.set(
						gl.canvas.width,
						gl.canvas.height,
						gl.canvas.width / (gl.canvas.height || 1),
					);
				}
			};

			window.addEventListener("resize", resize, false);
			resize();

			const geometry = new Triangle(gl);
			const baseColor = new Color(rRef.current, gRef.current, bRef.current);

			program = new Program(gl, {
				vertex: vertexShader,
				fragment: getFragmentShader(isLowPower),
				uniforms: {
					uTime: { value: 0 },
					uColor: { value: baseColor },
					uResolution: {
						value: new Color(
							gl.canvas.width,
							gl.canvas.height,
							gl.canvas.width / (gl.canvas.height || 1),
						),
					},
					uMouse: {
						value: new Float32Array([mousePos.current.x, mousePos.current.y]),
					},
					uAmplitude: { value: amplitudeRef.current },
					uSpeed: { value: speedRef.current },
				},
			});
			programRef.current = program;

			const mesh = new Mesh(gl, { geometry, program });

			let lastFrameTime = 0;
			const minFrameInterval = isLowPower ? 33.3 : 16.6; // ~30fps cap on budget mobile to prevent thermal throttling

			const update = (t: number) => {
				if (document.hidden || !isElementVisible) {
					animateId = 0;
					return;
				}

				const elapsed = t - lastFrameTime;
				if (elapsed >= minFrameInterval) {
					lastFrameTime = t - (elapsed % minFrameInterval);
					if (program && renderer) {
						program.uniforms.uTime.value = t * 0.001;
						renderer.render({ scene: mesh });
					}
				}

				if (!prefersReduced) {
					animateId = requestAnimationFrame(update);
				}
			};

			if (prefersReduced) {
				update(0);
			} else {
				animateId = requestAnimationFrame(update);
			}

			// Intersection observer to pause rendering when background is not visible
			const observer =
				typeof IntersectionObserver === "undefined"
					? null
					: new IntersectionObserver(([entry]) => {
							isElementVisible = entry.isIntersecting;
							if (isElementVisible && !animateId && !prefersReduced && !document.hidden) {
								animateId = requestAnimationFrame(update);
							}
						});

			if (observer && ctn) {
				observer.observe(ctn);
			}

			handleVisibilityChange = () => {
				if (!document.hidden && !animateId && !prefersReduced && isElementVisible) {
					animateId = requestAnimationFrame(update);
				}
			};
			document.addEventListener("visibilitychange", handleVisibilityChange);

			gl.canvas.style.display = "block";
			gl.canvas.style.width = "100%";
			gl.canvas.style.height = "100%";
			gl.canvas.style.pointerEvents = "none";
			ctn.appendChild(gl.canvas);

			handleMouseMove = (e: MouseEvent) => {
				const x = (e.clientX - cachedLeft) / cachedWidth;
				const y = 1.0 - (e.clientY - cachedTop) / cachedHeight;
				mousePos.current = { x, y };
				if (program) {
					(program.uniforms.uMouse.value as Float32Array)[0] = x;
					(program.uniforms.uMouse.value as Float32Array)[1] = y;
					if (prefersReduced && renderer) {
						renderer.render({ scene: mesh });
					}
				}
			};

			if (mouseReact && !isLowPower) {
				window.addEventListener("mousemove", handleMouseMove, { passive: true });
			}
		} catch (err) {
			console.warn("Iridescence WebGL init failed or unsupported", err);
		}

		return () => {
			programRef.current = null;
			if (animateId) {
				cancelAnimationFrame(animateId);
			}
			if (resize) {
				window.removeEventListener("resize", resize);
			}
			if (handleVisibilityChange) {
				document.removeEventListener("visibilitychange", handleVisibilityChange);
			}
			if (mouseReact && handleMouseMove) {
				window.removeEventListener("mousemove", handleMouseMove);
			}
			if (renderer && ctn?.contains(renderer.gl.canvas)) {
				ctn.removeChild(renderer.gl.canvas);
				renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
			}
		};
	}, [mouseReact]);

	return <div ref={ctnDom} className={`iridescence-container ${className}`} aria-hidden="true" />;
});
