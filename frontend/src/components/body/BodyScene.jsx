import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Skin, Muscles, Skeleton } from "@/components/body/Anatomy";
import { EntryMesh } from "@/components/body/DataLayers";
import { DetailedModel } from "@/components/body/DetailedModel";
import { CustomModel } from "@/components/body/CustomModel";

export const VIEWS = {
  vorne: { pos: [0, 0.95, 3.1], target: [0, 0.88, 0], label: "Vorne" },
  hinten: { pos: [0, 0.95, -3.1], target: [0, 0.88, 0], label: "Hinten" },
  seite: { pos: [3.1, 0.95, 0], target: [0, 0.88, 0], label: "Seite" },
  kopf: { pos: [0.15, 1.63, 0.5], target: [0, 1.59, 0.03], label: "Kopf & Zähne" },
  becken: { pos: [0.4, 1.0, -1.0], target: [0, 0.93, 0], label: "Becken" },
};

const CameraRig = ({ view, tick }) => {
  const { camera, controls } = useThree();
  const anim = useRef(false);
  useEffect(() => { anim.current = true; }, [view, tick]);
  useEffect(() => { if (controls) { controls.target.set(...VIEWS.vorne.target); controls.update(); } }, [controls]);
  useFrame((_, dt) => {
    if (!anim.current || !controls) return;
    const v = VIEWS[view];
    const tp = new THREE.Vector3(...v.pos), tt = new THREE.Vector3(...v.target);
    const k = 1 - Math.exp(-Math.min(dt, 0.25) * 6);
    camera.position.lerp(tp, k);
    controls.target.lerp(tt, k);
    controls.update();
    if (camera.position.distanceTo(tp) < 0.01) anim.current = false;
  });
  return null;
};

export default function BodyScene({ entries, layers, skinOpacity, selected, related, onSelect, view, viewTick, missingTeeth, autoRotate, detailed, onInfo, custom }) {
  const visible = entries.filter((e) => layers[e.layer] && !(detailed && e.fdi && !e.fdi.endsWith("8")));
  return (
    <Canvas data-testid="body-3d-canvas" camera={{ position: [0, 0.95, 3.1], fov: 38, near: 0.01 }} dpr={[1, 2]} onPointerMissed={() => onSelect(null)}>
      <color attach="background" args={["#F4F2EC"]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[2, 3, 2]} intensity={1.1} />
      <directionalLight position={[-2, 2, -2]} intensity={0.5} color="#DDE6EE" />
      <Suspense fallback={null}>
        {!detailed && layers.skelett && <Skeleton />}
        {!detailed && layers.muskeln && <Muscles />}
        {detailed && <DetailedModel layers={layers} opacity={skinOpacity} selected={selected} related={related} missingTeeth={missingTeeth} onSelect={onSelect} onInfo={onInfo} />}
        {detailed && custom && <CustomModel buffer={custom.buffer} ras={custom.ras} />}
        {visible.map((e) => (
          <EntryMesh key={e.code} entry={e} selected={selected === e.code} highlighted={related.includes(e.code)}
            dimmed={!!selected && selected !== e.code && !related.includes(e.code)} onSelect={onSelect}
            missing={e.fdi && missingTeeth.includes(e.fdi)} thin={detailed} />
        ))}
        {!detailed && layers.haut && <Skin opacity={skinOpacity} />}
        <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={2} blur={2.4} far={1} />
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} raycast={() => null}>
        <circleGeometry args={[0.7, 48]} />
        <meshStandardMaterial color="#E3DCCD" />
      </mesh>
      <OrbitControls makeDefault minDistance={0.15} maxDistance={5} autoRotate={autoRotate} autoRotateSpeed={0.6} />
      <CameraRig view={view} tick={viewTick} />
    </Canvas>
  );
}
