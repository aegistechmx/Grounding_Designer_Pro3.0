import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const WebGLViewer = ({ gridLength, gridWidth, numParallel, numRods, rodLength }) => {
  const mountRef = useRef(null);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008);
    
    // Cámara
    const clientWidth = Math.max(1, mountRef.current.clientWidth);
    const clientHeight = Math.max(1, mountRef.current.clientHeight);
    const aspectRatio = clientWidth / clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(clientWidth, clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    
    // Luz
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Suelo (grid helper)
    const gridHelper = new THREE.GridHelper(30, 20, 0x3b82f6, 0x3b82f6);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);
    
    // Conductores (líneas azules)
    const conductorMaterial = new THREE.LineBasicMaterial({ color: 0x3b82f6 });
    const spacingX = gridLength / Math.max(1, numParallel);
    const spacingZ = gridWidth / Math.max(1, numParallel);
    
    for (let i = 0; i <= Math.max(1, numParallel); i++) {
      const x = -gridLength/2 + i * spacingX;
      const points = [];
      points.push(new THREE.Vector3(x, 0, -gridWidth/2));
      points.push(new THREE.Vector3(x, 0, gridWidth/2));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, conductorMaterial);
      scene.add(line);
    }
    
    for (let j = 0; j <= Math.max(1, numParallel); j++) {
      const z = -gridWidth/2 + j * spacingZ;
      const points = [];
      points.push(new THREE.Vector3(-gridLength/2, 0, z));
      points.push(new THREE.Vector3(gridLength/2, 0, z));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, conductorMaterial);
      scene.add(line);
    }
    
    // Varillas (cilindros rojos)
    const rodMaterial = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 });
    const rodPositions = [
      [-gridLength/2, -rodLength/2, -gridWidth/2], [gridLength/2, -rodLength/2, -gridWidth/2],
      [-gridLength/2, -rodLength/2, gridWidth/2], [gridLength/2, -rodLength/2, gridWidth/2],
      [0, -rodLength/2, -gridWidth/2], [0, -rodLength/2, gridWidth/2],
      [-gridLength/2, -rodLength/2, 0], [gridLength/2, -rodLength/2, 0]
    ];
    
    for (let i = 0; i < Math.min(numRods, rodPositions.length); i++) {
      const geometry = new THREE.CylinderGeometry(0.1, 0.1, rodLength, 8);
      const rod = new THREE.Mesh(geometry, rodMaterial);
      rod.position.set(rodPositions[i][0], rodPositions[i][1], rodPositions[i][2]);
      rod.castShadow = true;
      scene.add(rod);
    }
    
    // Animación
    let angle = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      angle += 0.005;
      camera.position.x = 15 * Math.sin(angle);
      camera.position.z = 15 * Math.cos(angle);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();
    
    // Cleanup
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [gridLength, gridWidth, numParallel, numRods, rodLength]);
  
  return <div ref={mountRef} style={{ width: '100%', height: '500px' }} />;
};

export default WebGLViewer;
