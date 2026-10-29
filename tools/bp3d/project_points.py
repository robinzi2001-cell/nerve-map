"""Projects anchor points of extra pressure points onto the BodyParts3D skin surface -> backend/data/extra_points_pos.json."""
import json
import sys
from pathlib import Path

import numpy as np
import trimesh

sys.path.insert(0, "/app/backend")
from extra_points import EXTRA_POINTS  # noqa: E402

skin = trimesh.load("/app/frontend/public/models/skin.glb", force="mesh")
out = {}
for p in EXTRA_POINTS:
    a, d = np.array(p["anchor"], float), np.array(p["direction"], float)
    if p["deep"] or not d.any():
        pos = a
    else:
        d /= np.linalg.norm(d)
        locs, _, _ = skin.ray.intersects_location([a - d * 0.03], [d])
        hit = locs[np.argmin(np.linalg.norm(locs - a, axis=1))] if len(locs) else None
        if hit is not None and np.linalg.norm(hit - a) < 0.07:
            pos = hit + d * 0.002
        else:
            pos = skin.nearest.on_surface([a])[0][0]
    right = [round(float(x), 4) for x in pos]
    out[p["code"]] = [right, [-right[0], right[1], right[2]]] if p["bilateral"] and abs(right[0]) > 0.003 else [[0.0, right[1], right[2]]]
    print(p["code"], out[p["code"]][0], round(float(np.linalg.norm(pos - a)), 3))
Path("/app/backend/data/extra_points_pos.json").write_text(json.dumps(out, indent=0))
