import { useEffect, useRef } from "react";

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	rotation: number;
	rotationSpeed: number;
	scale: number;
	opacity: number;
	emoji: string;
}

const EMOJIS = ["🐱", "😸", "😽", "😻", "🐾", "🐟", "🐈", "🐈‍⬛"];

export function CatConfetti() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}

		// Handle resize
		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		// Check for reduced motion
		const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		const particles: Particle[] = [];
		const particleCount = prefersReducedMotion ? 12 : 68;

		// Spawn particles from bottom center or center
		const spawnX = canvas.width / 2;
		const spawnY = canvas.height * 0.45; // Center near the Trophy icon

		for (let i = 0; i < particleCount; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 8 + 4;
			particles.push({
				x: spawnX,
				y: spawnY,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed - 2, // Slight upward bias
				rotation: Math.random() * Math.PI * 2,
				rotationSpeed: (Math.random() - 0.5) * 0.1,
				scale: Math.random() * 0.6 + 0.6,
				opacity: 1,
				emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)] || "🐱",
			});
		}

		let animationFrameId: number;

		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			let activeParticles = 0;

			for (const p of particles) {
				if (p.opacity <= 0) {
					continue;
				}
				activeParticles++;

				// Physics
				p.x += p.vx;
				p.y += p.vy;

				if (!prefersReducedMotion) {
					p.vy += 0.18; // Gravity
					p.vx *= 0.98; // Friction
					p.rotation += p.rotationSpeed;
				}

				p.opacity -= 0.009; // Fade out

				// Draw emoji
				ctx.save();
				ctx.globalAlpha = Math.max(0, p.opacity);
				ctx.translate(p.x, p.y);
				ctx.rotate(p.rotation);

				// Set text properties
				const fontSize = Math.round(32 * p.scale);
				ctx.font = `${fontSize}px ui-sans-serif, system-ui`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";

				ctx.fillText(p.emoji, 0, 0);
				ctx.restore();
			}

			if (activeParticles > 0) {
				animationFrameId = requestAnimationFrame(animate);
			}
		};

		animate();

		return () => {
			cancelAnimationFrame(animationFrameId);
			window.removeEventListener("resize", resizeCanvas);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="pointer-events-none fixed inset-0 z-[1000] h-full w-full"
			style={{ mixBlendMode: "screen" }}
		/>
	);
}
