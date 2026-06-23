import { useRef, useEffect } from 'react';

const VERTEX_SHADER = `
attribute vec2 aVertexPosition;
void main() {
  gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_res;
uniform float u_waveSpeed;
uniform float u_lineCount;
uniform float u_amplitude;
uniform float u_rotation;
uniform float u_colorDepth;
uniform vec2 u_mouse;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289v2(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

mat2 rot2(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 p = (fragCoord - u_res * 0.5) / min(u_res.x, u_res.y);
  p = rot2(u_rotation) * p;
  float t = u_time * u_waveSpeed;
  float warpAmp = 0.08;
  float warpFreq = 3.5;
  vec2 mouseWarp = vec2(0.0);
  if (u_mouse.x > 0.0) {
    vec2 mNorm = (u_mouse - u_res * 0.5) / min(u_res.x, u_res.y);
    mouseWarp += (p - mNorm) * 0.15;
  }
  float warpX = snoise(vec2(p.y * warpFreq + t * 0.4, p.x * 2.0)) * warpAmp;
  warpX += snoise(vec2(p.y * warpFreq * 1.7 + t * 0.6, p.x * 2.5 + 7.3)) * warpAmp * 0.5;
  float warpY = snoise(vec2(p.x * warpFreq + t * 0.35 + 5.0, p.y * 2.0 + 3.0)) * warpAmp;
  warpY += snoise(vec2(p.x * warpFreq * 1.5 + t * 0.5, p.y * 2.3 + 9.1)) * warpAmp * 0.5;
  vec2 wp = vec2(warpX, warpY) + mouseWarp;
  float warpedX = p.x + wp.x + wp.y * 0.5;
  float numLines = u_lineCount;
  float amp = u_amplitude;
  float phase = sin(warpedX * 1.0 + p.y * 2.5 + t * 1.2) * 0.55
              + sin(warpedX * 1.5 + p.y * 3.0 - t * 0.9 + 1.7) * 0.30
              + sin(warpedX * 2.3 + p.y * 4.0 + t * 1.5 + 4.1) * 0.15
              + sin(warpedX * 3.7 + p.y * 5.5 - t * 2.1 + 2.9) * 0.08;
  float waveY = phase * amp;
  float coord = (p.y - waveY) * numLines;
  float line = pow(abs(fract(coord) - 0.5) * 2.0, 4.0);
  float fill = 1.0 - smoothstep(-0.5, 0.5, coord);
  vec3 fillC = vec3(0.05, 0.9, 1.0);
  vec3 lineC = vec3(0.3, 0.0, 1.0);
  vec3 bgC = vec3(0.0, 0.0, 0.0);
  vec3 col = mix(bgC, fillC, fill * 0.9) + lineC * line * 0.9;
  float depth = (phase + 1.0) * 0.5;
  float shimmer = sin(t * 1.5 + warpedX * 12.0 + p.y * 7.0) * 0.5 + 0.5;
  col += vec3(1.0, 0.0, 0.4) * shimmer * depth * 0.1;
  float vig = 1.0 - smoothstep(0.25, 0.85, length(p * vec2(0.8, 1.0)));
  col *= 0.5 + vig * 0.5;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function TopographicNeuralField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    function compileShader(src: string, type: number) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(VERTEX_SHADER, gl.VERTEX_SHADER);
    const fs = compileShader(FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'aVertexPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_res');
    const uWaveSpeed = gl.getUniformLocation(program, 'u_waveSpeed');
    const uLineCount = gl.getUniformLocation(program, 'u_lineCount');
    const uAmplitude = gl.getUniformLocation(program, 'u_amplitude');
    const uRotation = gl.getUniformLocation(program, 'u_rotation');
    const uColorDepth = gl.getUniformLocation(program, 'u_colorDepth');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    gl.uniform1f(uWaveSpeed, 0.5);
    gl.uniform1f(uLineCount, 7.0);
    gl.uniform1f(uAmplitude, 0.5);
    gl.uniform1f(uRotation, -0.25);
    gl.uniform1f(uColorDepth, 0.8);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
    }

    resize();
    window.addEventListener('resize', resize);

    function onMouseMove(e: MouseEvent) {
      const dpr = Math.min(window.devicePixelRatio, 2);
      mouseRef.current.x = e.clientX * dpr;
      mouseRef.current.y = (canvas!.clientHeight - e.clientY) * dpr;
    }
    function onMouseLeave() {
      mouseRef.current.x = 0;
      mouseRef.current.y = 0;
    }
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const startTime = performance.now();
    function render() {
      const elapsed = (performance.now() - startTime) * 0.001;
      gl!.uniform1f(uTime, elapsed);
      gl!.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}
