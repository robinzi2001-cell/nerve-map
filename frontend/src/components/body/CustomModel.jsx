import { useMemo } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

const BRAIN_MIN = new THREE.Vector3(-0.07, 1.543, -0.096);
const BRAIN_MAX = new THREE.Vector3(0.071, 1.711, 0.084);
const RAS = new THREE.Matrix4().set(-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1);

export const CustomModel = ({ buffer, ras }) => {
  const geo = useMemo(() => {
    const g = new STLLoader().parse(buffer);
    if (ras) g.applyMatrix4(RAS);
    g.computeBoundingBox();
    const bb = g.boundingBox, size = bb.getSize(new THREE.Vector3()), target = BRAIN_MAX.clone().sub(BRAIN_MIN);
    const s = Math.min(target.x / size.x, target.y / size.y, target.z / size.z);
    g.translate(...bb.getCenter(new THREE.Vector3()).multiplyScalar(-1).toArray());
    g.scale(s, s, s);
    g.translate(...BRAIN_MIN.clone().add(BRAIN_MAX).multiplyScalar(0.5).toArray());
    g.computeVertexNormals();
    return g;
  }, [buffer, ras]);
  return (
    <mesh geometry={geo} raycast={() => null}>
      <meshStandardMaterial color="#C9A3D9" roughness={0.5} />
    </mesh>
  );
};
