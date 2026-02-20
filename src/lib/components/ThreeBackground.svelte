<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		camera.position.z = 5;

		const geometry = new THREE.CircleGeometry(0.02, 8);
		const particles: THREE.Mesh[] = [];

		for (let i = 0; i < 50; i++) {
			const material = new THREE.MeshBasicMaterial({
				color: 0x18181B,
				transparent: true,
				opacity: 0.1
			});
			const particle = new THREE.Mesh(geometry, material);
			particle.position.x = (Math.random() - 0.5) * 10;
			particle.position.y = (Math.random() - 0.5) * 10;
			particle.position.z = (Math.random() - 0.5) * 5;
			(particle as THREE.Mesh & { vx: number; vy: number; vz: number }).vx = (Math.random() - 0.5) * 0.002;
			(particle as THREE.Mesh & { vx: number; vy: number; vz: number }).vy = (Math.random() - 0.5) * 0.002;
			(particle as THREE.Mesh & { vx: number; vy: number; vz: number }).vz = (Math.random() - 0.5) * 0.001;
			particles.push(particle);
			scene.add(particle);
		}

		function animate() {
			requestAnimationFrame(animate);
			for (const p of particles) {
				const pp = p as THREE.Mesh & { vx: number; vy: number; vz: number };
				p.position.x += pp.vx;
				p.position.y += pp.vy;
				p.position.z += pp.vz;
				if (Math.abs(p.position.x) > 5) pp.vx *= -1;
				if (Math.abs(p.position.y) > 5) pp.vy *= -1;
				if (Math.abs(p.position.z) > 2.5) pp.vz *= -1;
			}
			renderer.render(scene, camera);
		}
		animate();

		function onResize() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		}
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});
</script>

<canvas bind:this={canvas} class="fixed top-0 left-0 w-full h-full pointer-events-none z-10"></canvas>
