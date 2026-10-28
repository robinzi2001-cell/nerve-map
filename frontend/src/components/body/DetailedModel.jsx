import { Suspense, useEffect, useMemo, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";

const URL = (n) => `/models/${n}.glb`;

const NERVE_MAP = [
  [/median nerve/i, "n-medianus"], [/ulnar nerve/i, "n-ulnaris"], [/radial nerve/i, "n-radialis"],
  [/superior alveolar|maxillary nerve|infra-orbital|palatine nerve|nasopalatine|zygomatic nerve/i, "n-trigeminus-v2"],
  [/mandibular nerve|inferior alveolar|mental nerve|buccal nerve|masseteric|lingual nerve|pterygoid nerve|auriculotemporal/i, "n-trigeminus-v3"],
  [/facial nerve/i, "n-facialis"], [/spinal cord|cauda equina/i, "medulla-spinalis"], [/phrenic/i, "n-phrenicus"],
  [/vagus/i, "n-vagus"], [/greater occipital/i, "n-occipitalis-major"],
];
export const nerveCode = (name) => NERVE_MAP.find(([rx]) => rx.test(name))?.[1] || null;

const STYLE = {
  skin: { color: "#E9CFB7", transparent: true, depthWrite: false, roughness: 0.6, side: THREE.DoubleSide },
  bones: { color: "#EDE6D6", roughness: 0.55 },
  muscles: { color: "#B5574A", transparent: true, opacity: 0.55, roughness: 0.7, depthWrite: false },
  nerves: { color: "#E8C547", roughness: 0.4 },
  brain: { color: "#E3B5A4", roughness: 0.6 },
  teeth: { color: "#FBF7EC", roughness: 0.3 },
};
const INTERACTIVE = ["nerves", "brain", "teeth"];

const useLayerScene = (name, opacity) => {
  const { scene } = useGLTF(URL(name));
  const meshes = useMemo(() => {
    const out = [];
    const shared = new THREE.MeshStandardMaterial(STYLE[name]);
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      if (!o.isMesh || /venous/i.test(o.name)) return;
      if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
      const mat = INTERACTIVE.includes(name) ? new THREE.MeshStandardMaterial(STYLE[name]) : shared;
      out.push({ name: o.name, geometry: o.geometry, matrix: o.matrixWorld.clone(), mat });
    });
    return out;
  }, [scene, name]);
  useEffect(() => {
    if (name === "skin") meshes.forEach((m) => { m.mat.opacity = opacity; m.mat.needsUpdate = true; });
  }, [meshes, opacity, name]);
  return meshes;
};

const Layer = ({ name, opacity, selected, related, missingTeeth, onSelect, onInfo }) => {
  const meshes = useLayerScene(name, opacity);
  const [hover, setHover] = useState(null);
  const codeOf = (n) => (name === "teeth" ? `zahn-${n.slice(1, 3)}` : name === "nerves" ? nerveCode(n) : null);

  useEffect(() => {
    if (!INTERACTIVE.includes(name)) return;
    meshes.forEach((m) => {
      const code = codeOf(m.name);
      const fdi = name === "teeth" ? m.name.slice(1, 3) : null;
      const active = (code && (code === selected || related.includes(code))) || hover?.name === m.name;
      const missing = fdi && missingTeeth.includes(fdi);
      m.mat.color.set(missing ? "#C8483B" : STYLE[name].color);
      m.mat.transparent = !!missing;
      m.mat.opacity = missing ? 0.3 : 1;
      m.mat.emissive.set(active ? (name === "teeth" ? "#D96C50" : "#F2A900") : "#000000");
      m.mat.emissiveIntensity = active ? 0.7 : 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meshes, selected, related, hover, missingTeeth]);

  const interactive = INTERACTIVE.includes(name);
  const label = (n) => n.split("|")[1] || n;
  return (
    <group>
      {meshes.map((m) => (
        <mesh key={m.name} geometry={m.geometry} material={m.mat} matrixAutoUpdate={false} matrix={m.matrix} renderOrder={name === "skin" ? 10 : name === "muscles" ? 5 : 0}
          raycast={interactive ? undefined : () => null}
          onPointerOver={interactive ? (e) => { e.stopPropagation(); setHover({ name: m.name, point: e.point.toArray() }); document.body.style.cursor = "pointer"; } : undefined}
          onPointerOut={interactive ? () => { setHover(null); document.body.style.cursor = "auto"; } : undefined}
          onClick={interactive ? (e) => {
            e.stopPropagation();
            const code = codeOf(m.name);
            if (code) onSelect(code);
            else onInfo({ name: label(m.name), layer: name });
          } : undefined} />
      ))}
      {hover && (
        <Html position={hover.point} style={{ pointerEvents: "none" }}>
          <div className="-translate-y-7 whitespace-nowrap rounded-md bg-[#1A2025] px-2 py-1 text-[11px] text-white shadow-lg">
            {label(hover.name)}{codeOf(hover.name) ? " · Klick für Details" : ""}
          </div>
        </Html>
      )}
    </group>
  );
};

const LAYER_FOR = { haut: "skin", skelett: "bones", muskeln: "muscles", nerven: "nerves", gehirn: "brain", zaehne: "teeth" };

export const DetailedModel = ({ layers, ...rest }) => (
  <group>
    {Object.entries(LAYER_FOR).filter(([k]) => layers[k]).map(([k, n]) => (
      <Suspense key={n} fallback={null}><Layer name={n} {...rest} /></Suspense>
    ))}
  </group>
);
