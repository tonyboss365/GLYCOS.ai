import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural connected floating metabolic node graph
const MetabolicLattice = ({ mouseRef, currentQuestionIndex }) => {
  const meshRef = useRef();
  const lineGeomRef = useRef();
  const pointsRef = useRef();
  const cursorLightRef = useRef();
  const orbitGroupRef = useRef();

  // Create 32 nodes with unique floating offsets, speeds, and colors
  // The first 8 nodes correspond to the 8 metrics (Glucose, BMI, Age, BP, Insulin, Skin Thickness, Pregnancies, Pedigree)
  const nodes = useMemo(() => {
    const arr = [];
    const colorChoices = [
      new THREE.Color('#D96846'), // Coral Orange (Active/Highlights)
      new THREE.Color('#596235'), // Olive Green (Structural)
      new THREE.Color('#2F3020'), // Dark Charcoal Green (Background)
    ];

    // Predefined baseline positions for the 8 key metric nodes
    const metricPositions = [
      [-3.0, 3.0, -1.0],  // 0: Glucose (top-left)
      [-1.0, 2.0, -0.5],  // 1: BMI (top-mid-left)
      [1.5, 2.5, -1.0],   // 2: Age (top-right)
      [3.0, 0.5, -0.8],   // 3: Blood Pressure (mid-right)
      [2.0, -2.0, -1.0],  // 4: Insulin (bottom-right)
      [0.0, -3.0, -0.5],  // 5: Skin Thickness (bottom-mid)
      [-2.0, -2.5, -1.0], // 6: Pregnancies (bottom-left)
      [-3.5, 0.0, -0.8],  // 7: Pedigree Score (mid-left)
    ];

    for (let i = 0; i < 32; i++) {
      let x, y, z;
      const isMetricNode = i < 8;

      if (isMetricNode) {
        [x, y, z] = metricPositions[i];
      } else {
        // Random background fill nodes
        x = (Math.random() - 0.5) * 11;
        y = (Math.random() - 0.5) * 12;
        z = (Math.random() - 0.5) * 5 - 2;
      }

      arr.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        x,
        y,
        z,
        // Master metric nodes are slightly larger by default
        baseSize: isMetricNode ? 0.22 : Math.random() * 0.12 + 0.06,
        currentSize: isMetricNode ? 0.22 : Math.random() * 0.12 + 0.06,
        color: isMetricNode ? new THREE.Color('#596235') : colorChoices[i % colorChoices.length],
        currentColor: isMetricNode ? new THREE.Color('#596235') : colorChoices[i % colorChoices.length],
        speedX: (Math.random() - 0.5) * 0.2 + 0.1,
        speedY: (Math.random() - 0.5) * 0.2 + 0.1,
        ampX: isMetricNode ? 0.15 : Math.random() * 0.35 + 0.15,
        ampY: isMetricNode ? 0.15 : Math.random() * 0.35 + 0.15,
        phase: Math.random() * Math.PI * 2,
        isMetricNode,
        metricIndex: isMetricNode ? i : -1,
      });
    }
    return arr;
  }, []);

  // Pre-allocate buffer for connecting lines
  const maxLines = 140;
  const [linePositions, lineColors] = useMemo(() => {
    const pos = new Float32Array(maxLines * 2 * 3);
    const cols = new Float32Array(maxLines * 2 * 3);
    return [pos, cols];
  }, []);

  // Create ambient background dust particle swarm
  const [dustPositions, dustColors] = useMemo(() => {
    const pos = new Float32Array(300 * 3);
    const cols = new Float32Array(300 * 3);
    const cCharcoal = new THREE.Color('#2F3020');
    const cOlive = new THREE.Color('#596235');

    for (let i = 0; i < 300; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 5;

      const color = Math.random() > 0.7 ? cOlive : cCharcoal;
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    return [pos, cols];
  }, []);

  // Generate 3 circular orbital boundary rings representing metabolic pathways
  const orbitGeometries = useMemo(() => {
    const geometries = [];
    const radii = [4.5, 6.0, 7.5];

    radii.forEach((r) => {
      const points = [];
      const steps = 80;
      for (let j = 0; j <= steps; j++) {
        const theta = (j / steps) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * r, 0, Math.sin(theta) * r));
      }
      geometries.push(new THREE.BufferGeometry().setFromPoints(points));
    });
    return geometries;
  }, []);

  // References to rendered sphere meshes to update sizes dynamically
  const sphereRefs = useRef([]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const mx = mouseRef.current[0] * 4.0;
    const my = mouseRef.current[1] * 3.0;

    // Specular light coordinates track cursor
    if (cursorLightRef.current) {
      cursorLightRef.current.position.x = THREE.MathUtils.lerp(cursorLightRef.current.position.x, mx, 0.1);
      cursorLightRef.current.position.y = THREE.MathUtils.lerp(cursorLightRef.current.position.y, my, 0.1);
    }

    // 1. Update node coordinates & reactiveness to active questions
    nodes.forEach((node, idx) => {
      const isActive = currentQuestionIndex === node.metricIndex;

      // React to user active step: nodes scale up and glow Coral Orange
      const targetSize = isActive 
        ? node.baseSize * 2.2 
        : node.isMetricNode && currentQuestionIndex >= 0 && currentQuestionIndex <= 7
          ? node.baseSize * 0.65 // shrink other inactive metric nodes to draw attention
          : node.baseSize;

      const cCoral = new THREE.Color('#D96846');
      const cOlive = new THREE.Color('#596235');
      const targetColor = isActive ? cCoral : node.isMetricNode ? cOlive : node.color;

      node.currentSize = THREE.MathUtils.lerp(node.currentSize, targetSize, 0.12);
      node.currentColor.lerp(targetColor, 0.12);

      // Apply size scale directly to sphere mesh instances
      if (sphereRefs.current[idx]) {
        sphereRefs.current[idx].scale.setScalar(node.currentSize);
        // Direct material color updates
        sphereRefs.current[idx].material.color.copy(node.currentColor);
        sphereRefs.current[idx].material.emissive.copy(node.currentColor);
        sphereRefs.current[idx].material.emissiveIntensity = isActive ? 1.8 + Math.sin(time * 5.0) * 0.6 : 0.0;
      }

      // Sinusoidal drifting logic
      const driftX = node.baseX + Math.sin(time * node.speedX + node.phase) * node.ampX;
      const driftY = node.baseY + Math.cos(time * node.speedY + node.phase) * node.ampY;
      const driftZ = node.baseZ + Math.sin(time * 0.15 + node.phase) * 0.3;

      // Mouse interactive push/pull (stronger on active nodes)
      const dx = mx - driftX;
      const dy = my - driftY;
      const dist = Math.hypot(dx, dy);

      if (dist < 4.5) {
        const pull = (1.0 - dist / 4.5) * (isActive ? 0.6 : 0.3);
        node.x = THREE.MathUtils.lerp(node.x, driftX + dx * pull, 0.08);
        node.y = THREE.MathUtils.lerp(node.y, driftY + dy * pull, 0.08);
      } else {
        node.x = THREE.MathUtils.lerp(node.x, driftX, 0.08);
        node.y = THREE.MathUtils.lerp(node.y, driftY, 0.08);
      }
      node.z = THREE.MathUtils.lerp(node.z, driftZ, 0.08);

      // Direct position updates to meshes
      if (sphereRefs.current[idx]) {
        sphereRefs.current[idx].position.set(node.x, node.y, node.z);
      }
    });

    // 2. Compute connections and update line segments
    let lineIdx = 0;
    const threshold = 3.8;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (lineIdx >= maxLines) break;

        const n1 = nodes[i];
        const n2 = nodes[j];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y, n1.z - n2.z);

        if (dist < threshold) {
          const idx = lineIdx * 6;
          linePositions[idx] = n1.x;
          linePositions[idx + 1] = n1.y;
          linePositions[idx + 2] = n1.z;
          linePositions[idx + 3] = n2.x;
          linePositions[idx + 4] = n2.y;
          linePositions[idx + 5] = n2.z;

          // Connective line is Olive Green, glows near active nodes
          const isActiveLine = (currentQuestionIndex === n1.metricIndex || currentQuestionIndex === n2.metricIndex);
          const cLine = isActiveLine ? new THREE.Color('#D96846') : new THREE.Color('#596235');

          lineColors[idx] = cLine.r;
          lineColors[idx + 1] = cLine.g;
          lineColors[idx + 2] = cLine.b;
          lineColors[idx + 3] = cLine.r;
          lineColors[idx + 4] = cLine.g;
          lineColors[idx + 5] = cLine.b;

          lineIdx++;
        }
      }
    }

    // Zero out remaining line slots
    for (let i = lineIdx; i < maxLines; i++) {
      const idx = i * 6;
      linePositions[idx] = 0;
      linePositions[idx + 1] = 0;
      linePositions[idx + 2] = 0;
      linePositions[idx + 3] = 0;
      linePositions[idx + 4] = 0;
      linePositions[idx + 5] = 0;
    }

    if (lineGeomRef.current) {
      lineGeomRef.current.attributes.position.needsUpdate = true;
      lineGeomRef.current.attributes.color.needsUpdate = true;
    }

    // 3. Slow rotations
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.04;
      meshRef.current.rotation.z = Math.sin(time * 0.01) * 0.03;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = -time * 0.01;
    }
    if (orbitGroupRef.current) {
      orbitGroupRef.current.children.forEach((child, idx) => {
        child.rotation.y = time * 0.02 * (idx + 1);
      });
    }
  });

  return (
    <group ref={meshRef}>
      {/* Node Spheres with specular Physical material */}
      {nodes.map((node, idx) => (
        <mesh 
          key={idx} 
          ref={(el) => (sphereRefs.current[idx] = el)}
        >
          <sphereGeometry args={[1.0, 20, 20]} />
          <meshPhysicalMaterial 
            roughness={0.15}
            metalness={0.8}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}

      {/* Connecting line segments */}
      <lineSegments>
        <bufferGeometry ref={lineGeomRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColors, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          vertexColors 
          transparent 
          opacity={0.3} 
          linewidth={1.5}
        />
      </lineSegments>

      {/* Background dust swarm */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[dustColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.3}
          sizeAttenuation={true}
        />
      </points>

      {/* 3 Slow-spinning Circular Orbit lines representing pathways */}
      <group ref={orbitGroupRef}>
        {orbitGeometries.map((geom, idx) => (
          <lineLoop 
            key={idx} 
            geometry={geom} 
            rotation={[Math.PI / 3 * idx, 0, Math.PI / 4]}
          >
            <lineBasicMaterial 
              color="#CDCBD6" 
              transparent 
              opacity={0.08} 
            />
          </lineLoop>
        ))}
      </group>

      {/* spec point light following cursor */}
      <pointLight 
        ref={cursorLightRef} 
        color="#D96846" 
        intensity={2.5} 
        distance={6} 
        decay={2} 
      />
    </group>
  );
};

// Smooth Camera Controller that pans to look at the currently active metric node
const CameraController = ({ mouseRef, currentQuestionIndex }) => {
  const { camera } = useThree();

  // Positions corresponding to the 8 metric nodes
  const metricCameraTargets = useMemo(() => [
    [-1.0, 1.0, -1.0],  // 0: Glucose target area
    [-0.3, 0.7, -0.5],  // 1: BMI target area
    [0.5, 0.9, -1.0],   // 2: Age target area
    [1.0, 0.2, -0.8],   // 3: Blood Pressure target area
    [0.7, -0.7, -1.0],  // 4: Insulin target area
    [0.0, -1.0, -0.5],  // 5: Skin Thickness target area
    [-0.7, -0.8, -1.0], // 6: Pregnancies target area
    [-1.2, 0.0, -0.8],  // 7: Pedigree target area
  ], []);

  useFrame(() => {
    // Center point light coordinates + mouse offset
    const mx = mouseRef.current[0] * 0.6;
    const my = mouseRef.current[1] * 0.45;

    let targetLookAt = new THREE.Vector3(0, 0, -2);
    let targetCamPos = new THREE.Vector3(mx, my, 7.5);

    // If a slider is currently selected, pan camera slightly towards its quadrant
    if (currentQuestionIndex >= 0 && currentQuestionIndex <= 7) {
      const [tx, ty, tz] = metricCameraTargets[currentQuestionIndex];
      targetLookAt.set(tx, ty, tz);
      // Pan camera slightly closer
      targetCamPos.set(tx + mx * 0.3, ty + my * 0.3, 5.8);
    }

    camera.position.lerp(targetCamPos, 0.05);
    
    // Smooth camera lookAt vector lerp
    const currentLookAt = new THREE.Vector3(0, 0, -5);
    camera.getWorldDirection(currentLookAt);
    currentLookAt.add(camera.position);

    const nextLookAt = new THREE.Vector3().lerpVectors(currentLookAt, targetLookAt, 0.05);
    camera.lookAt(nextLookAt);
  });
  return null;
};

export const DiagnosisScene3D = ({ currentQuestionIndex }) => {
  const mouseRef = useRef([0, 0]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = [
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      ];
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none bg-transparent">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={2.0} color="#ffffff" />
        <directionalLight position={[-5, -4, 2]} intensity={0.5} color="#CDCBD6" />
        <CameraController mouseRef={mouseRef} currentQuestionIndex={currentQuestionIndex} />
        <MetabolicLattice mouseRef={mouseRef} currentQuestionIndex={currentQuestionIndex} />
      </Canvas>
    </div>
  );
};

export default DiagnosisScene3D;
