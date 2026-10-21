"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface LatentSpaceVisualizerProps {
  mode?: "slerp" | "lerp";
  className?: string;
}

export const LatentSpaceVisualizer: React.FC<LatentSpaceVisualizerProps> = ({
  mode = "slerp",
  className,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 320;
    const height = mountRef.current.clientHeight || 240;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const mountEl = mountRef.current;
    mountEl.appendChild(renderer.domElement);

    // 2. Hypersphere shell representation (wireframe sphere)
    const sphereGeo = new THREE.SphereGeometry(1.4, 24, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x8b7cff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // 3. Anchor points zA and zB on sphere
    const posA = new THREE.Vector3(-1.0, 0.4, 0.9).normalize().multiplyScalar(1.4);
    const posB = new THREE.Vector3(1.1, -0.3, 0.8).normalize().multiplyScalar(1.4);

    const pointGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const pointMatA = new THREE.MeshBasicMaterial({ color: 0xffb88a });
    const pointMatB = new THREE.MeshBasicMaterial({ color: 0x38e1ff });

    const meshA = new THREE.Mesh(pointGeo, pointMatA);
    meshA.position.copy(posA);
    scene.add(meshA);

    const meshB = new THREE.Mesh(pointGeo, pointMatB);
    meshB.position.copy(posB);
    scene.add(meshB);

    // 4. Lerp chord line (straight chord through interior, warm)
    const lerpPoints = [posA, posB];
    const lerpGeo = new THREE.BufferGeometry().setFromPoints(lerpPoints);
    const lerpMat = new THREE.LineBasicMaterial({
      color: 0xffb88a,
      linewidth: 2,
      transparent: true,
      opacity: mode === "lerp" ? 0.95 : 0.4,
    });
    const lerpLine = new THREE.Line(lerpGeo, lerpMat);
    scene.add(lerpLine);

    // 5. Slerp arc (curved on sphere shell, cyan)
    const slerpCurvePoints: THREE.Vector3[] = [];
    const count = 32;
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      // Slerp formula in 3D
      const theta = posA.angleTo(posB);
      const sinTheta = Math.sin(theta);
      const v = new THREE.Vector3()
        .addScaledVector(posA, Math.sin((1 - t) * theta) / sinTheta)
        .addScaledVector(posB, Math.sin(t * theta) / sinTheta);
      slerpCurvePoints.push(v);
    }
    const slerpGeo = new THREE.BufferGeometry().setFromPoints(slerpCurvePoints);
    const slerpMat = new THREE.LineBasicMaterial({
      color: 0x38e1ff,
      linewidth: 3,
      transparent: true,
      opacity: mode === "slerp" ? 1.0 : 0.4,
    });
    const slerpLine = new THREE.Line(slerpGeo, slerpMat);
    scene.add(slerpLine);

    // 6. Animation loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      sphere.rotation.y += 0.005;
      sphere.rotation.x += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [mode]);

  return (
    <div className={className}>
      <div className="relative w-full h-48 rounded-2xl border border-white/[0.08] bg-[#0E1018]/90 overflow-hidden flex items-center justify-center">
        <div ref={mountRef} className="w-full h-full" />
        <div className="absolute top-2 left-3 text-[10px] font-mono text-[#8B8FA3] flex items-center gap-2">
          <span className="flex items-center gap-1 text-[#38E1FF]">
            <span className="w-2 h-0.5 bg-[#38E1FF] inline-block" /> Slerp (Hypersphere shell)
          </span>
          <span className="flex items-center gap-1 text-[#FFB88A]">
            <span className="w-2 h-0.5 bg-[#FFB88A] inline-block" /> Lerp (Interior chord)
          </span>
        </div>
      </div>
    </div>
  );
};
