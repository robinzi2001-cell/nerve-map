"""Downloads selected BodyParts3D / Anatomography 4.3 meshes (CC BY-SA 2.1 JP, DBCLS) into RAW_DIR/<layer>/."""
import csv
import sys
import time
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import dl  # noqa: E402  (downloader from github.com/olivercase/body_parts_3d_api)

HERE = Path(__file__).parent
RAW = Path("/root/bp3d_raw")
NERVE_WORDS = ["nerve", "plexus", "ganglion", "spinal cord", "cauda equina"]


def load():
    rows = {x["fj_id"]: x for x in csv.DictReader(open(HERE / "MANIFEST.csv"))}
    txt = (HERE / "FMA2Obj.txt").read_text(errors="ignore").replace("\r", "\n")
    con = {}
    for line in txt.split("\n"):
        c = line.split("\t")
        if len(c) >= 3 and not line.startswith("#"):
            con[(c[0], c[1])] = set(c[2].split("+"))
    return rows, con


def layer_sets(rows, con):
    nerves = {k for k, x in rows.items() if any(w in x["name"].lower() for w in NERVE_WORDS)}
    return {
        "skin": {k for k, x in rows.items() if x["name"] == "Skin"},
        "teeth": {k for k, x in rows.items() if "tooth" in x["name"].lower()},
        "bones": con[("FMA5018", "is_a")] & rows.keys(),
        "muscles": con[("FMA5022", "is_a")] & rows.keys(),
        "nerves": nerves,
        "brain": (con[("FMA50801", "part_of")] & rows.keys()) - nerves,
    }


def main():
    rows, con = load()
    ck = RAW / "ck.txt"
    RAW.mkdir(parents=True, exist_ok=True)
    dl.get_session(ck)
    for layer, ids in layer_sets(rows, con).items():
        out = RAW / layer
        out.mkdir(exist_ok=True)
        todo = sorted(i for i in ids if not list(out.glob(f"{i}_*.obj")))
        for n in range(0, len(todo), 50):
            chunk = todo[n:n + 50]
            z = RAW / f"{layer}_{n}.zip"
            dl.download_zip(chunk, [rows[i]["bp_id"] for i in chunk], z, ck)
            with zipfile.ZipFile(z) as zf:
                for name in zf.namelist():
                    if name.endswith(".obj"):
                        (out / Path(name).name).write_bytes(zf.read(name))
            z.unlink()
            print(layer, n + len(chunk), "/", len(todo), flush=True)
            time.sleep(1)


if __name__ == "__main__":
    main()
