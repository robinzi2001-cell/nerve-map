import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

const Tube = ({ path, radius, color, active, dim, onPick, onHover }) => {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(path.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, Math.max(24, path.length * 14), radius, 8, false);
  }, [path, radius]);
  return (
    <mesh geometry={geo} onClick={onPick} onPointerOver={onHover(true)} onPointerOut={onHover(false)}>
      <meshStandardMaterial color={color} emissive={active ? color : "#000"} emissiveIntensity={active ? 0.9 : 0} transparent opacity={dim ? 0.25 : 1} roughness={0.4} />
    </mesh>
  );
};

const Pulse = ({ p, color }) => {
  const ref = useRef();
  useFrame(({ clock }) => {
    const s = 1 + ((clock.elapsedTime * 1.4) % 1) * 2.2;
    if (ref.current) {
      ref.current.scale.setScalar(s);
      ref.current.material.opacity = 0.6 * (1 - ((clock.elapsedTime * 1.4) % 1));
    }
  });
  return (
    <mesh ref={ref} position={p} raycast={() => null}>
      <sphereGeometry args={[0.012, 16, 12]} />
      <meshBasicMaterial color={color} transparent depthWrite={false} />
    </mesh>
  );
};

const useHover = (code, setHover) => (on) => (e) => {
  e.stopPropagation();
  setHover(on ? code : null);
  document.body.style.cursor = on ? "pointer" : "auto";
};

export const EntryMesh = ({ entry, selected, highlighted, dimmed, onSelect, missing }) => {
  const [hover, setHover] = useState(null);
  const onHover = useHover(entry.code, setHover);
  const active = selected || highlighted || hover === entry.code;
  const pick = (e) => { e.stopPropagation(); onSelect(entry.code); };
  const isTooth = entry.layer === "zaehne";
  const radius = entry.layer === "nerven" ? 0.0042 : entry.layer === "ketten" ? 0.0035 : 0.0026;
  const color = isTooth && missing ? "#C8483B" : entry.color;

  return (
    <group>
      {(entry.paths || []).map((p, i) => (
        <Tube key={i} path={p} radius={active ? radius * 1.6 : radius} color={color} active={active} dim={dimmed} onPick={pick} onHover={onHover} />
      ))}
      {(entry.positions || []).map((p, i) => (
        <group key={i}>
          <mesh position={p} onClick={pick} onPointerOver={onHover(true)} onPointerOut={onHover(false)}>
            {isTooth ? <boxGeometry args={[0.0062, 0.011, 0.0068]} /> : <sphereGeometry args={[active ? 0.011 : 0.008, 16, 12]} />}
            <meshStandardMaterial color={color} emissive={active ? color : "#000"} emissiveIntensity={active ? 0.6 : 0}
              transparent opacity={isTooth && missing ? 0.35 : dimmed ? 0.3 : 1} roughness={0.35} />
          </mesh>
          {selected && <Pulse p={p} color={color === "#F5F1E6" ? "#D96C50" : color} />}
        </group>
      ))}
      {(hover === entry.code || selected) && (entry.positions?.[0] || entry.paths?.[0]?.[Math.floor(entry.paths[0].length / 2)]) && (
        <Html position={entry.positions?.[0] || entry.paths[0][Math.floor(entry.paths[0].length / 2)]} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-md bg-[#1A2025] px-2 py-1 text-[11px] font-medium text-white shadow-lg -translate-y-6">{entry.name}</div>
        </Html>
      )}
    </group>
  );
};
