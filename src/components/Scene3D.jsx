import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { gsap } from 'gsap';

// Custom Fluid displacement shader definition
const FluidShader = {
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uVelocity: { value: 0 },
    uScrollOpacity: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec2 uMouse;
    uniform float uTime;
    uniform float uVelocity;
    uniform float uScrollOpacity;
    varying vec2 vUv;

    float noise(vec2 p) {
      return sin(p.x * 8.0 + uTime * 0.6) * sin(p.y * 8.0 + uTime * 0.4) * 0.5 + 0.5;
    }

    void main() {
      vec2 uv = vUv;
      
      // Distance to mouse pointer coords
      float dist = distance(uv, uMouse);
      
      // Fluid displacement vector
      vec2 displacement = vec2(0.0);
      if (dist < 0.3) {
        float strength = (1.0 - dist / 0.3) * 0.05 * (uVelocity + 0.15);
        vec2 dir = normalize(uv - uMouse);
        displacement = dir * sin(dist * 35.0 - uTime * 4.0) * strength;
      }
      
      vec2 offsetUv = uv + displacement;
      
      // Layered smoke background noises
      float smoke = noise(offsetUv * 2.5 + vec2(uTime * 0.04, -uTime * 0.02)) * 0.4;
      smoke += noise(offsetUv * 6.0 - vec2(uTime * 0.06, uTime * 0.03)) * 0.15;
      
      // Void light background color: #F6F6F2
      vec3 voidColor = vec3(0.965, 0.965, 0.949);
      
      // Accent color: #BADFE7 (0.729, 0.875, 0.906)
      vec3 glowColor = vec3(0.729, 0.875, 0.906); 
      
      vec3 color = mix(voidColor, glowColor, smoke * 0.06 + (1.0 - dist) * 0.005 + (uVelocity * 0.006 * (1.0 - dist)));
      
      // Atmospheric soft vignette suitable for light theme
      float vignette = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y) * 16.0;
      color = mix(color, color * 0.92, 1.0 - clamp(pow(vignette, 0.22), 0.0, 1.0));

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

const FluidBackground = ({ mouseRef, scrollProgress }) => {
  const meshRef = useRef();
  const prevMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const velocity = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material;
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    
    // Map mouse NDC (-1 to 1) to UV (0 to 1)
    const mX = (mouseRef.current[0] + 1) / 2;
    const mY = (mouseRef.current[1] + 1) / 2;
    const targetMouse = new THREE.Vector2(mX, mY);
    
    const dist = targetMouse.distanceTo(prevMouse.current);
    velocity.current = THREE.MathUtils.lerp(velocity.current, dist * 8.0, 0.08);
    
    material.uniforms.uMouse.value.lerp(targetMouse, 0.08);
    material.uniforms.uVelocity.value = velocity.current;

    // Calculate scroll based opacity (0% opacity up to 10% scroll, fades in to full by 30% scroll)
    const scrollVal = scrollProgress ? scrollProgress.current : 0;
    const scrollOpacity = THREE.MathUtils.clamp((scrollVal - 0.1) / 0.2, 0.0, 1.0);
    material.uniforms.uScrollOpacity.value = scrollOpacity;
    
    prevMouse.current.copy(targetMouse);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5]} renderOrder={-1}>
      <planeGeometry args={[25, 25]} />
      <shaderMaterial
        args={[FluidShader]}
        depthWrite={false}
        depthTest={true}
      />
    </mesh>
  );
};

// GPU Accelerated Swirling Particle Swarm Clustered Near DNA Helix
const DNAHelixSwarm = ({ scrollProgress, mouseRef, helixRef }) => {
  const pointsRef = useRef();
  const count = 4000;

  const [positions, scales, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    const cols = new Float32Array(count * 3);
    
    const totalHeight = 18.0;
    const numRotations = 4.5;
    const radius = 1.35;
    
    const colorChoices = [
      new THREE.Color('#388087'), // Deep Teal (Heading color)
      new THREE.Color('#6FB3B8'), // Soft Teal
      new THREE.Color('#BADFE7'), // Powder Blue
    ];

    for (let i = 0; i < count; i++) {
      const isCore = Math.random() > 0.75;
      const t = Math.random();
      const y = -totalHeight / 2 + t * totalHeight;
      
      let x = 0;
      let z = 0;
      
      if (isCore) {
        // Distributed in the core between strands
        const angle = (y / totalHeight) * numRotations * Math.PI * 2 + Math.random() * Math.PI;
        const r = Math.random() * radius;
        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;
      } else {
        // Clustered near one of the two strands
        const isStrand1 = Math.random() > 0.5;
        const angle = (y / totalHeight) * numRotations * Math.PI * 2 + (isStrand1 ? 0 : Math.PI);
        
        // Random 3D offset around the strand coordinates
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = (Math.random() * 0.4) + 0.05; // Tight aura
        
        x = Math.cos(angle) * radius + r * Math.sin(phi) * Math.cos(theta);
        z = Math.sin(angle) * radius + r * Math.cos(phi);
      }

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      scl[i] = Math.random() * 0.7 + 0.3;

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return [pos, scl, cols];
  }, []);

  const shaderArgs = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        uScroll: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uMouse;
        uniform float uScroll;
        attribute float scale;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vColor = color;
          vec3 pos = position;
          
          // Subtle local chaotic vibration / wind effect
          pos.x += sin(uTime * 1.5 + pos.y) * 0.08;
          pos.z += cos(uTime * 1.2 + pos.y) * 0.08;
          
          // Gravitational attraction towards local mouse coordinates
          float dist = distance(pos, uMouse);
          if (dist < 2.0) {
            float force = (1.0 - dist / 2.0) * 0.35;
            pos = mix(pos, uMouse, force);
          }
          
          // Dissolve phase aligned with scroll
          if (uScroll > 0.85) {
            float tDisp = (uScroll - 0.85) / 0.15;
            vec3 dirOut = vec3(pos.x, 0.0, pos.z);
            if (length(dirOut) > 0.001) {
              dirOut = normalize(dirOut);
            }
            pos += dirOut * tDisp * 5.0;
          }
          
          // Calculate opacity (fully visible on load, dissolving only at the end)
          if (uScroll < 0.85) {
            vOpacity = 0.7;
          } else {
            vOpacity = mix(0.7, 0.0, (uScroll - 0.85) / 0.15);
          }
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
           // Size attenuation (increased multiplier for prominent glowing dots)
           gl_PointSize = scale * 55.0 * (1.0 / -mvPosition.z);
         }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          // Circular points
          vec2 temp = gl_PointCoord - vec2(0.5);
          float dist = dot(temp, temp);
          if (dist > 0.25) discard;
          
          // Soft glowing edges
          float alpha = 1.0 - (dist * 4.0);
          
          gl_FragColor = vec4(vColor, alpha * vOpacity * 0.9);
        }
      `
    };
  }, []);

  const tempV = new THREE.Vector3();
  useFrame((state) => {
    if (!pointsRef.current) return;
    const material = pointsRef.current.material;
    const p = scrollProgress.current;
    
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    material.uniforms.uScroll.value = p;
    
    if (helixRef.current) {
      tempV.set(mouseRef.current[0] * 3.5, mouseRef.current[1] * 2.5, -2.0);
      tempV.sub(helixRef.current.position);
      material.uniforms.uMouse.value.copy(tempV);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-scale"
          args={[scales, 1]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <shaderMaterial 
        args={[shaderArgs]}
        transparent={true}
        depthWrite={false}
      />
    </points>
  );
};

// High-fidelity procedural DNA Double Helix component constructed from continuous tubes and cylinders
const DNAHelix = ({ scrollProgress, mouseRef, loaderComplete }) => {
  const helixRef = useRef();

  // Helix dimensions
  const totalHeight = 32.0;
  const numRotations = 8.0;
  const radius = 1.35; // Perfectly sized to keep both strands and rungs visible on the right half

  // Generate curves and rungs data
  const { curve1, curve2, rungs, tubeGeom1, tubeGeom2 } = useMemo(() => {
    const points1 = [];
    const points2 = [];
    
    // Sample points along the helix height (increased to 300 steps for smoother curves)
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const y = -totalHeight / 2 + (i / steps) * totalHeight;
      const angle = (y / totalHeight) * numRotations * Math.PI * 2;

      points1.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
      points2.push(new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius));
    }

    const c1 = new THREE.CatmullRomCurve3(points1);
    const c2 = new THREE.CatmullRomCurve3(points2);

    // Build geometries once (increased radial segments to 24 for smoother tube edges)
    const tg1 = new THREE.TubeGeometry(c1, 300, 0.16, 24, false);
    const tg2 = new THREE.TubeGeometry(c2, 300, 0.16, 24, false);

    // Generate rungs at regular intervals (64 rungs along the height)
    const rList = [];
    const numRungs = 64;
    for (let i = 0; i < numRungs; i++) {
      const t = i / (numRungs - 1);
      const y = -totalHeight / 2 + t * totalHeight;
      const angle = (y / totalHeight) * numRotations * Math.PI * 2;

      const p1 = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const p2 = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);

      const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const direction = new THREE.Vector3().subVectors(p2, p1);
      const length = direction.length();
      const dirNormalized = direction.clone().normalize();

      // Align cylinder (default along Y-axis) to the direction vector
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dirNormalized
      );

      // Positions of two half segments
      const posHalf1 = new THREE.Vector3().lerpVectors(p1, p2, 0.25);
      const posHalf2 = new THREE.Vector3().lerpVectors(p1, p2, 0.75);

      rList.push({
        p1: [p1.x, p1.y, p1.z],
        p2: [p2.x, p2.y, p2.z],
        midpoint: [midpoint.x, midpoint.y, midpoint.z],
        posHalf1: [posHalf1.x, posHalf1.y, posHalf1.z],
        posHalf2: [posHalf2.x, posHalf2.y, posHalf2.z],
        quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
        halfLength: length / 2,
        type: i % 2
      });
    }

    return { curve1: c1, curve2: c2, rungs: rList, tubeGeom1: tg1, tubeGeom2: tg2 };
  }, []);

  // Strand material: Sleek Glossy White Ceramic
  const strandMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#F4F4F0',
    roughness: 0.1,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.0,
  }), []);

  // Connector joints material: Premium Warm Gold highlight
  const jointMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#D4B270',
    roughness: 0.15,
    metalness: 0.8,
    clearcoat: 0.8,
    envMapIntensity: 2.2,
  }), []);

  // Base pair type A: Brand Deep Teal (#388087) + Powder Blue (#BADFE7)
  const bpTealDeep = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#388087',
    roughness: 0.2,
    metalness: 0.1,
    clearcoat: 0.5,
    envMapIntensity: 1.5,
  }), []);

  const bpBluePowder = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#BADFE7',
    roughness: 0.2,
    metalness: 0.1,
    clearcoat: 0.5,
    envMapIntensity: 1.5,
  }), []);

  // Base pair type B: Brand Soft Teal (#6FB3B8) + Soft Terracotta/Coral (#E29578)
  const bpTealSoft = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#6FB3B8',
    roughness: 0.2,
    metalness: 0.1,
    clearcoat: 0.5,
    envMapIntensity: 1.5,
  }), []);

  const bpCoralSoft = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#E29578',
    roughness: 0.2,
    metalness: 0.1,
    clearcoat: 0.5,
    envMapIntensity: 1.5,
  }), []);

  // Center glowing bond material
  const bondCenterMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#BADFE7',
    emissiveIntensity: 1.5,
    roughness: 0.1,
  }), []);

  // Shared geometries with high segment count for smoother edges
  const jointGeom = useMemo(() => new THREE.SphereGeometry(0.18, 24, 24), []);
  const centerGeom = useMemo(() => new THREE.SphereGeometry(0.09, 16, 16), []);
  const rungGeom = useMemo(() => new THREE.CylinderGeometry(0.06, 0.06, 1.0, 24), []);

  const { viewport } = useThree();
  const currentRotX = useRef(0);
  const currentRotY = useRef(0);
  const currentRotZ = useRef(0);
  const accumulatedRotY = useRef(0);
  const spinRef = useRef();

  // Intro Animation Tracking
  const introProgress = useRef(0);
  useEffect(() => {
    if (loaderComplete) {
      gsap.to(introProgress, {
        current: 1.0,
        duration: 4.2,
        ease: 'power2.out',
      });
    }
  }, [loaderComplete]);

  useFrame((state) => {
    if (!helixRef.current) return;
    const p = scrollProgress.current;

    // Spinning rise offsets
    const introY = (1.0 - introProgress.current) * -16.0;
    // Slow down initial spin speed on arrival
    const introRotY = (1.0 - introProgress.current) * 1.5;

    // Responsive positioning layout coordinates
    const isMobile = viewport.width < 7.0;
    const desktopX = viewport.width * 0.22; // 22% of viewport width

    let targetX = 0;
    let targetY = -p * 4.5;
    let targetZ = -1.0;
    let targetRotX = 0;
    let targetRotZ = 0;
    let targetRotY = 0;

    // Always spin/rotate around the helix's Y axis (which points along Z when horizontal)
    accumulatedRotY.current += 0.003 + introRotY * 0.003;
    targetRotY = accumulatedRotY.current;

    if (isMobile) {
      targetX = 0.0;
      targetZ = -1.5;
      targetRotX = p * 0.35;
      targetRotZ = -p * 0.2;
    } else {
      // 4 Custom Scroll Phases:
      if (p < 0.25) {
        // Phase 1 (Hero -> Stats): Move helix to center, pull back, start rotating into horizontal tunnel view
        const t = p / 0.25;
        targetX = THREE.MathUtils.lerp(desktopX, 0.0, t);
        targetY = -p * 4.5;
        targetZ = THREE.MathUtils.lerp(-1.2, -2.5, t);
        targetRotX = THREE.MathUtils.lerp(0.0, Math.PI / 2, t);
        targetRotZ = 0;
      } else if (p < 0.50) {
        // Phase 2 (Stats -> Biomarkers): Stays horizontal and centered, continues spinning, zooms close to cover screen edges
        const t = (p - 0.25) / 0.25;
        targetX = 0.0;
        targetY = -0.25 * 4.5; // Stays stable in the center of stats section
        targetZ = THREE.MathUtils.lerp(-2.5, -0.4, t); // Zoom in closer to cover edges
        targetRotX = Math.PI / 2;
        targetRotZ = 0;
      } else if (p < 0.75) {
        // Phase 3 (Biomarkers -> Pinned Methodology): Rotates back to vertical and moves towards the left side
        const t = (p - 0.50) / 0.25;
        targetX = THREE.MathUtils.lerp(0.0, -desktopX * 1.15, t);
        targetY = -p * 4.5;
        targetZ = THREE.MathUtils.lerp(-0.4, -1.5, t);
        targetRotX = THREE.MathUtils.lerp(Math.PI / 2, 0.0, t);
        targetRotZ = 0;
      } else {
        // Phase 4 (Methodology -> CTA/Footer): Moves from left to center, zooms close and past camera to exit
        const t = (p - 0.75) / 0.25;
        targetX = THREE.MathUtils.lerp(-desktopX * 1.15, 0.0, t);
        targetY = -p * 4.5;
        targetZ = THREE.MathUtils.lerp(-1.5, 7.5, t); // Zoom close and past camera Z=7.0
        targetRotX = THREE.MathUtils.lerp(0.0, Math.PI / 3, t); // Tilt slightly as it flies past
        targetRotZ = 0;
      }
    }

    // Smooth position lerping with intro Y offset
    helixRef.current.position.x = THREE.MathUtils.lerp(helixRef.current.position.x, targetX, 0.05);
    helixRef.current.position.y = THREE.MathUtils.lerp(helixRef.current.position.y, targetY + introY, 0.05);
    helixRef.current.position.z = THREE.MathUtils.lerp(helixRef.current.position.z, targetZ, 0.05);

    // Smooth rotation lerping (including Y-spin angle)
    currentRotX.current = THREE.MathUtils.lerp(currentRotX.current, targetRotX, 0.05);
    currentRotY.current = THREE.MathUtils.lerp(currentRotY.current, targetRotY, 0.05);
    currentRotZ.current = THREE.MathUtils.lerp(currentRotZ.current, targetRotZ, 0.05);

    helixRef.current.rotation.x = currentRotX.current;
    helixRef.current.rotation.z = currentRotZ.current;
    if (spinRef.current) {
      spinRef.current.rotation.y = currentRotY.current;
    }
  });

  return (
    <group ref={helixRef}>
      <group ref={spinRef}>
        {/* Bold Backbone Tubes with Shadows enabled */}
        <mesh geometry={tubeGeom1} material={strandMat} castShadow receiveShadow />
        <mesh geometry={tubeGeom2} material={strandMat} castShadow receiveShadow />

        {/* Premium Connecting Rungs with Shadows enabled */}
        {rungs.map((r, idx) => {
          // Alternating base pair colors
          const mat1 = r.type === 0 ? bpTealDeep : bpTealSoft;
          const mat2 = r.type === 0 ? bpBluePowder : bpCoralSoft;

          return (
            <group key={`rung-group-${idx}`}>
              {/* Joint Sphere 1 */}
              <mesh position={r.p1} geometry={jointGeom} material={jointMat} castShadow receiveShadow />
              
              {/* Joint Sphere 2 */}
              <mesh position={r.p2} geometry={jointGeom} material={jointMat} castShadow receiveShadow />
              
              {/* Rung Half 1 */}
              <mesh 
                position={r.posHalf1} 
                quaternion={r.quaternion}
                scale={[1, r.halfLength, 1]}
                geometry={rungGeom}
                material={mat1}
                castShadow
                receiveShadow
              />

              {/* Rung Half 2 */}
              <mesh 
                position={r.posHalf2} 
                quaternion={r.quaternion}
                scale={[1, r.halfLength, 1]}
                geometry={rungGeom}
                material={mat2}
                castShadow
                receiveShadow
              />

              {/* Center glowing node */}
              <mesh position={r.midpoint} geometry={centerGeom} material={bondCenterMat} castShadow receiveShadow />
            </group>
          );
        })}
      </group>

      {/* Embedded Swarm to stay near and move with the helix */}
      <DNAHelixSwarm scrollProgress={scrollProgress} mouseRef={mouseRef} helixRef={helixRef} />
    </group>
  );
};

// Medical biological model component (Houses procedural DNA)
const MedicalAsset = ({ scrollProgress, mouseRef, loaderComplete }) => {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0;
  });

  return (
    <group ref={groupRef}>
      <DNAHelix scrollProgress={scrollProgress} mouseRef={mouseRef} loaderComplete={loaderComplete} />
    </group>
  );
};

// Lerp-driven camera scrubbing rig
const CameraRig = ({ scrollProgress, mouse }) => {
  const { camera } = useThree();
  useFrame(() => {
    const p = scrollProgress.current;
    
    // Steady horizontal positioning layout adjustments - disable wiggle when scrolled past hero
    const wiggleFactor = p > 0.05 ? 0.0 : 1.0;
    const targetX = mouse.current[0] * 0.15 * wiggleFactor;

    let targetY = 0.0;
    let targetZ = 7.0;

    // Camera Cinematic Shots coordinates
    if (p < 0.25) {
      // Phase 1 (Hero -> Stats): Camera pulls back (long shot) and moves to top of helix (high angle looking down)
      const t = p / 0.25;
      targetZ = THREE.MathUtils.lerp(7.0, 11.0, t);
      targetY = THREE.MathUtils.lerp(0.0, 5.5, t) + mouse.current[1] * 0.1 * wiggleFactor;
    } else if (p < 0.50) {
      // Phase 2: Camera returns to normal front view, aligned with helix height for horizontal tunnel
      const t = (p - 0.25) / 0.25;
      targetZ = THREE.MathUtils.lerp(11.0, 7.0, t);
      targetY = THREE.MathUtils.lerp(5.5, -0.25 * 4.5, t) + mouse.current[1] * 0.1 * wiggleFactor;
    } else {
      // Phase 3 & 4: Camera stays centered tracking the helix height
      targetZ = 7.0;
      targetY = -p * 4.5 + mouse.current[1] * 0.1 * wiggleFactor;
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06);
    
    // Look at scroll offset to frame the helix nicely (align camera target height with helix height)
    let lookAtY = -p * 4.5;
    if (p >= 0.25 && p < 0.50) {
      lookAtY = -0.25 * 4.5;
    }
    camera.lookAt(0, lookAtY, 0);
  });
  return null;
};

export const Scene3D = ({ loaderComplete }) => {
  const scrollRef = useRef(0);
  const mouseRef = useRef([0, 0]);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };
    const onMouse = (e) => {
      mouseRef.current = [(e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1];
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none bg-transparent">
      <Canvas 
        shadows
        camera={{ position: [0, 0, 7], fov: 55 }} 
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4
        }} 
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
      >
        {/* Soft gradient studio light setups with shadows enabled */}
        <ambientLight intensity={0.5} color="#ffffff" />
        <directionalLight 
          position={[8, 12, 8]} 
          intensity={2.8} 
          color="#ffffff" 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={25}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0005}
        />
        <directionalLight position={[-6, -4, 4]} intensity={0.6} color="#e8e8ff" />
        <hemisphereLight skyColor="#ffffff" groundColor="#cccccc" intensity={0.3} />
        
        {/* Environmental studio light reflections for realistic physical meshes */}
        <Environment preset="studio" />
        
        <CameraRig scrollProgress={scrollRef} mouse={mouseRef} />
        <MedicalAsset scrollProgress={scrollRef} mouseRef={mouseRef} loaderComplete={loaderComplete} />
        <FluidBackground mouseRef={mouseRef} scrollProgress={scrollRef} />
      </Canvas>
    </div>
  );
};

export default Scene3D;
