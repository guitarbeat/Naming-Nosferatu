import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";

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

const fragmentShader = `
precision highp float;

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
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }

  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

export function Iridescence({
	color = [1, 1, 1],
	speed = 1.0,
	amplitude = 0.1,
	mouseReact = true,
	className = "",
}: IridescenceProps) {
	const ctnDom = useRef<HTMLDivElement>(null);
	const mousePos = useRef({ x: 0.5, y: 0.5 });

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

		try {
			renderer = new Renderer({
				alpha: true,
				antialias: true,
				dpr: Math.min(window.devicePixelRatio || 1, 2),
			});
			const gl = renderer.gl;
			gl.clearColor(1, 1, 1, 1);

			resize = () => {
				if (!renderer || !ctn) {
					return;
				}
				const width = ctn.clientWidth || window.innerWidth;
				const height = ctn.clientHeight || window.innerHeight;
				renderer.setSize(width, height);
				if (program) {
					program.uniforms.uResolution.value = new Color(
						gl.canvas.width,
						gl.canvas.height,
						gl.canvas.width / (gl.canvas.height || 1),
					);
				}
			};

			window.addEventListener("resize", resize, false);
			resize();

			const geometry = new Triangle(gl);
			const baseColor = new Color(color[0] ?? 1, color[1] ?? 1, color[2] ?? 1);

			program = new Program(gl, {
				vertex: vertexShader,
				fragment: fragmentShader,
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
					uAmplitude: { value: amplitude },
					uSpeed: { value: speed },
				},
			});

			const mesh = new Mesh(gl, { geometry, program });

			const update = (t: number) => {
				animateId = requestAnimationFrame(update);
				if (program && renderer) {
					program.uniforms.uTime.value = t * 0.001;
					renderer.render({ scene: mesh });
				}
			};

			animateId = requestAnimationFrame(update);

			gl.canvas.style.display = "block";
			gl.canvas.style.width = "100%";
			gl.canvas.style.height = "100%";
			gl.canvas.style.pointerEvents = "none";
			ctn.appendChild(gl.canvas);

			handleMouseMove = (e: MouseEvent) => {
				if (!ctn) {
					return;
				}
				const rect = ctn.getBoundingClientRect();
				const x = (e.clientX - rect.left) / (rect.width || 1);
				const y = 1.0 - (e.clientY - rect.top) / (rect.height || 1);
				mousePos.current = { x, y };
				if (program) {
					(program.uniforms.uMouse.value as Float32Array)[0] = x;
					(program.uniforms.uMouse.value as Float32Array)[1] = y;
				}
			};

			if (mouseReact) {
				window.addEventListener("mousemove", handleMouseMove, { passive: true });
			}
		} catch (err) {
			console.warn("Iridescence WebGL init failed or unsupported", err);
		}

		return () => {
			if (animateId) {
				cancelAnimationFrame(animateId);
			}
			if (resize) {
				window.removeEventListener("resize", resize);
			}
			if (mouseReact && handleMouseMove) {
				window.removeEventListener("mousemove", handleMouseMove);
			}
			if (renderer && ctn?.contains(renderer.gl.canvas)) {
				ctn.removeChild(renderer.gl.canvas);
				renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
			}
		};
	}, [color, speed, amplitude, mouseReact]);

	return <div ref={ctnDom} className={`iridescence-container ${className}`} aria-hidden="true" />;
}
