"""Builds web-ready GLB layers from raw BodyParts3D OBJ meshes (decimated, transformed to app frame: y up, z front, metres)."""
import re
import sys
from pathlib import Path

import numpy as np
import trimesh
import fast_simplification

RAW = Path("/root/bp3d_raw")
OUT = Path("/app/frontend/public/models")
KEEP = {"skin": 0.35, "teeth": 1.0, "bones": 0.3, "muscles": 0.13, "nerves": 0.35, "brain": 0.14}
TOOTH = [("central incisor", 1), ("lateral incisor", 2), ("canine", 3), ("first", 4, "premolar"), ("second", 5, "premolar"),
         ("first", 6, "molar"), ("second", 7, "molar")]


def fdi(name):
    n = name.lower()
    q = {("right", "upper"): 1, ("left", "upper"): 2, ("left", "lower"): 3, ("right", "lower"): 4}
    quad = next(v for (s, j), v in q.items() if s in n and j in n)
    pos = next(t[1] for t in TOOTH if t[0] in n and (len(t) == 2 or (t[2] in n and (t[2] != "molar" or "premolar" not in n))))
    return f"{quad}{pos}"


def transform(v):
    v = v / 1000.0
    return np.column_stack([v[:, 0], v[:, 2] + 0.078, -(v[:, 1] + 0.086)])


def build(layer):
    scene = trimesh.Scene()
    faces_total = 0
    for f in sorted((RAW / layer).glob("*.obj")):
        m = re.match(r"(FJ\d+M?)_[^_]+_[^_]+_(.+)\.obj", f.name)
        fj, name = m.group(1), m.group(2)
        mesh = trimesh.load(f, force="mesh", process=False)
        if len(mesh.faces) == 0:
            continue
        verts, faces = transform(np.asarray(mesh.vertices, dtype=np.float64)), np.asarray(mesh.faces)
        keep = KEEP[layer]
        if keep < 1.0 and len(faces) > 200:
            verts, faces = fast_simplification.simplify(verts.astype(np.float32), faces.astype(np.int32), target_reduction=1 - keep)
        node = f"{fj}|{name}" if layer != "teeth" else f"T{fdi(name)}|{name}"
        scene.add_geometry(trimesh.Trimesh(verts, faces, process=True), node_name=node, geom_name=node)
        faces_total += len(faces)
    OUT.mkdir(parents=True, exist_ok=True)
    scene.export(OUT / f"{layer}.glb")
    print(layer, len(scene.geometry), "meshes", faces_total, "faces", round((OUT / f"{layer}.glb").stat().st_size / 1e6, 1), "MB")


if __name__ == "__main__":
    for layer in sys.argv[1:] or KEEP:
        build(layer)
