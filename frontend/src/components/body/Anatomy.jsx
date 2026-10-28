import { useMemo } from "react";
import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);

export const Limb = ({ a, b, r, children }) => {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    return { pos: va.clone().add(vb).multiplyScalar(0.5), len: dir.length(), quat: new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()) };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} raycast={() => null}>
      <capsuleGeometry args={[r, Math.max(len - r * 2, 0.001), 6, 14]} />
      {children}
    </mesh>
  );
};

const Blob = ({ p, s, children }) => (
  <mesh position={p} scale={s} raycast={() => null}>
    <sphereGeometry args={[1, 24, 18]} />
    {children}
  </mesh>
);

const sides = (fn) => [-1, 1].map((sx) => fn(sx));

// Joints (patient right = -x)
const J = (sx) => ({
  sh: [0.18 * sx, 1.4, -0.01], el: [0.235 * sx, 1.11, -0.01], wr: [0.27 * sx, 0.885, 0.02], hd: [0.285 * sx, 0.76, 0.04],
  hip: [0.09 * sx, 0.91, 0], kn: [0.08 * sx, 0.45, 0.01], an: [0.075 * sx, 0.06, -0.01], toe: [0.09 * sx, 0.02, 0.12],
});

const Body = ({ inset = 0, mat }) => (
  <group>
    <Blob p={[0, 1.6, 0.005]} s={[0.075 - inset, 0.12 - inset, 0.105 - inset]}>{mat}</Blob>
    <Limb a={[0, 1.4, -0.02]} b={[0, 1.5, -0.02]} r={0.045 - inset}>{mat}</Limb>
    <Blob p={[0, 1.24, 0]} s={[0.17 - inset, 0.2 - inset, 0.1 - inset]}>{mat}</Blob>
    <Blob p={[0, 0.98, 0]} s={[0.15 - inset, 0.13 - inset, 0.095 - inset]}>{mat}</Blob>
    {sides((sx) => {
      const j = J(sx);
      return (
        <group key={sx}>
          <Blob p={j.sh} s={[0.055 - inset, 0.05 - inset, 0.055 - inset]}>{mat}</Blob>
          <Limb a={j.sh} b={j.el} r={0.042 - inset}>{mat}</Limb>
          <Limb a={j.el} b={j.wr} r={0.033 - inset}>{mat}</Limb>
          <Limb a={j.wr} b={j.hd} r={0.026 - inset}>{mat}</Limb>
          <Limb a={j.hip} b={j.kn} r={0.068 - inset}>{mat}</Limb>
          <Limb a={j.kn} b={j.an} r={0.048 - inset}>{mat}</Limb>
          <Limb a={[j.an[0], 0.03, -0.02]} b={j.toe} r={0.03 - inset}>{mat}</Limb>
        </group>
      );
    })}
  </group>
);

export const Skin = ({ opacity }) => (
  <Body mat={<meshPhysicalMaterial color="#E9CFB7" transparent opacity={opacity} roughness={0.6} depthWrite={false} side={THREE.DoubleSide} />} />
);

const MusMat = ({ o }) => <meshStandardMaterial color="#B5574A" transparent opacity={o} roughness={0.8} depthWrite={false} />;

export const Muscles = () => (
  <group>
    <Body inset={0.012} mat={<MusMat o={0.18} />} />
    {sides((sx) => (
      <group key={sx}>
        <Blob p={[0.08 * sx, 1.32, 0.07]} s={[0.075, 0.05, 0.03]}><MusMat o={0.45} /></Blob>
        <Blob p={[0.08 * sx, 0.9, -0.07]} s={[0.075, 0.08, 0.045]}><MusMat o={0.45} /></Blob>
        <Blob p={[0.11 * sx, 1.46, -0.03]} s={[0.07, 0.025, 0.04]}><MusMat o={0.5} /></Blob>
        <Blob p={[0.055 * sx, 1.525, 0.035]} s={[0.012, 0.03, 0.02]}><MusMat o={0.7} /></Blob>
        <Limb a={[0.04 * sx, 1.54, -0.02]} b={[0.02 * sx, 1.42, 0.05]} r={0.012}><MusMat o={0.55} /></Limb>
        <Limb a={[0.09 * sx, 0.85, 0.04]} b={[0.085 * sx, 0.52, 0.04]} r={0.045}><MusMat o={0.4} /></Limb>
        <Limb a={[0.08 * sx, 0.4, -0.04]} b={[0.077 * sx, 0.2, -0.03]} r={0.035}><MusMat o={0.45} /></Limb>
        <Limb a={[0.03 * sx, 1.15, -0.085]} b={[0.04 * sx, 0.98, -0.08]} r={0.025}><MusMat o={0.5} /></Limb>
      </group>
    ))}
  </group>
);

const Bone = () => <meshStandardMaterial color="#EDE6D6" roughness={0.55} />;

export const Skeleton = () => (
  <group>
    <Blob p={[0, 1.64, -0.01]} s={[0.068, 0.075, 0.09]}><Bone /></Blob>
    <mesh position={[0, 1.515, 0.035]} rotation={[Math.PI / 2 + 0.2, 0, 0]} raycast={() => null}>
      <torusGeometry args={[0.042, 0.009, 8, 24, Math.PI]} />
      <Bone />
    </mesh>
    {Array.from({ length: 24 }).map((_, i) => {
      const y = 1.53 - i * 0.024;
      const z = -0.06 - Math.sin((i / 23) * Math.PI) * 0.02;
      return <Blob key={i} p={[0, y, z]} s={[0.014, 0.009, 0.014]}><Bone /></Blob>;
    })}
    {Array.from({ length: 9 }).map((_, i) => (
      <mesh key={i} position={[0, 1.38 - i * 0.03, 0.0]} scale={[1, 0.62, 1]} rotation={[Math.PI / 2 + 0.25, 0, 0]} raycast={() => null}>
        <torusGeometry args={[0.13 - Math.abs(i - 4) * 0.008, 0.004, 6, 36]} />
        <Bone />
      </mesh>
    ))}
    <mesh position={[0, 0.94, -0.01]} rotation={[Math.PI / 2 - 0.3, 0, 0]} scale={[1.3, 1, 0.8]} raycast={() => null}>
      <torusGeometry args={[0.085, 0.02, 10, 32]} />
      <Bone />
    </mesh>
    {sides((sx) => {
      const j = J(sx);
      return (
        <group key={sx}>
          <Limb a={[0.03 * sx, 1.44, 0.04]} b={[0.17 * sx, 1.44, 0.0]} r={0.007}><Bone /></Limb>
          <Limb a={j.sh} b={j.el} r={0.013}><Bone /></Limb>
          <Limb a={j.el} b={j.wr} r={0.01}><Bone /></Limb>
          <Limb a={j.hip} b={j.kn} r={0.017}><Bone /></Limb>
          <Limb a={j.kn} b={j.an} r={0.014}><Bone /></Limb>
          <Limb a={[j.an[0], 0.03, -0.02]} b={j.toe} r={0.012}><Bone /></Limb>
        </group>
      );
    })}
  </group>
);
