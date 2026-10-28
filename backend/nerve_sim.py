"""Myelinated axon conduction simulation with NEURON (github.com/neuronsimulator/nrn)."""
import threading
import numpy as np
from neuron import h

h.load_file("stdrun.hoc")
_lock = threading.Lock()

# fiber_um, internode_um, myelin_cm, myelin_g, segment ranges are relative positions along axon (0..1)
CONDITIONS = {
    "gesund": {"label": "Gesunder Nerv", "desc": "Dick myelinisierte A-alpha/beta-Faser, Saltatorische Erregungsleitung.", "evidence": "gut"},
    "neuropraxie": {"label": "Neuropraxie (Druckschaden)", "desc": "Fokale Demyelinisierung über 3 Internodien, Axon intakt. Typisch: Parkbanklähmung, Karpaltunnel. Heilt durch Remyelinisierung in Wochen.", "evidence": "gut"},
    "remyelinisierung": {"label": "Remyelinisierung (~6 Wochen)", "desc": "Nach Neuropraxie bildet die Schwann-Zelle neues, noch dünnes Myelin – die Leitung kommt zurück, lokal verlangsamt.", "evidence": "gut"},
    "demyelinisierung": {"label": "Diffuse Demyelinisierung", "desc": "Dünneres Myelin entlang des ganzen Nervs (z. B. CIDP, diabetische Neuropathie leicht).", "evidence": "gut"},
    "regeneration_frueh": {"label": "Regeneration früh (~3 Monate)", "desc": "Nach Axonotmesis: distal neu ausgesprosste, dünne Axone mit kurzen Internodien und dünnem Myelin.", "evidence": "gut"},
    "regeneration_spaet": {"label": "Regeneration spät (~1 Jahr)", "desc": "Axone fast normal dick, Internodien bleiben dauerhaft kürzer – Leitgeschwindigkeit erholt sich meist nicht ganz.", "evidence": "gut"},
}


def _segments(cond, n):
    """Per-internode (fiber_um, internode_um, cm, g_pas)."""
    healthy = (12.0, 1200.0, 0.002, 2e-7)
    out = []
    for i in range(n):
        rel = i / (n - 1)
        if cond == "neuropraxie" and n // 2 - 1 <= i <= n // 2 + 1:
            out.append((12.0, 1200.0, 0.9, 8e-4))
        elif cond == "remyelinisierung" and n // 2 - 1 <= i <= n // 2 + 1:
            out.append((12.0, 1200.0, 0.012, 2e-6))
        elif cond == "demyelinisierung":
            out.append((12.0, 1200.0, 0.007, 8e-7))
        elif cond == "regeneration_frueh" and rel > 0.5:
            out.append((4.0, 300.0, 0.04, 5e-6))
        elif cond == "regeneration_spaet" and rel > 0.5:
            out.append((10.0, 800.0, 0.003, 3e-7))
        else:
            out.append(healthy)
    return out


def simulate(cond: str, temperature: float = 33.0, n_internodes: int = 30):
    if cond not in CONDITIONS:
        raise ValueError("unknown condition")
    with _lock:
        segs = _segments(cond, n_internodes)
        nodes, inter = [], []
        for i, (fib, L, cm, g) in enumerate(segs + [segs[-1]]):
            nd = h.Section(name=f"node{i}")
            nd.L, nd.diam, nd.nseg, nd.Ra, nd.cm = 1.5, fib * 0.6, 1, 70, 1
            nd.insert("hh")
            for s in nd:
                s.hh.gnabar, s.hh.gkbar, s.hh.gl, s.hh.el = 3.0, 0.9, 0.0075, -54.3
            if nodes:
                nd.connect(inter[-1](1))
            nodes.append(nd)
            if i < len(segs):
                it = h.Section(name=f"inter{i}")
                it.L, it.diam, it.nseg, it.Ra, it.cm = L, fib * 0.6, 9, 70, cm
                it.insert("pas")
                for s in it:
                    s.pas.g, s.pas.e = g, -65
                it.connect(nd(1))
                inter.append(it)
        pos_mm = [0.0]
        for (_, L, _, _) in segs:
            pos_mm.append(pos_mm[-1] + (L + 1.5) / 1000)

        stim = h.IClamp(nodes[0](0.5))
        stim.delay, stim.dur, stim.amp = 0.2, 0.1, 3
        t = h.Vector().record(h._ref_t)
        vs = [h.Vector().record(nd(0.5)._ref_v) for nd in nodes]
        h.celsius = temperature
        h.dt = 0.005
        h.finitialize(-65)
        h.continuerun(8)

        tt = np.array(t)
        arrivals = []
        for v in vs:
            a = np.array(v)
            idx = np.where((a[1:] >= 0) & (a[:-1] < 0))[0]
            arrivals.append(round(float(tt[idx[0] + 1]), 4) if len(idx) else None)
        rec = [2, len(nodes) // 2 - 3, len(nodes) // 2 + 3, len(nodes) - 3]
        step = 10
        traces = {"t": [round(x, 3) for x in tt[::step].tolist()]}
        for k, r in enumerate(rec):
            traces[f"r{k}"] = [round(x, 2) for x in np.array(vs[r])[::step].tolist()]

        def vel(a, b):
            if arrivals[a] is None or arrivals[b] is None or arrivals[b] <= arrivals[a]:
                return None
            return round((pos_mm[b] - pos_mm[a]) / (arrivals[b] - arrivals[a]), 1)

        n = len(nodes)
        result = {
            "condition": cond, **CONDITIONS[cond], "temperature": temperature,
            "nodes": [{"i": i, "pos_mm": round(pos_mm[i], 2), "arrival_ms": arrivals[i]} for i in range(n)],
            "recorded_nodes": [{"key": f"r{k}", "pos_mm": round(pos_mm[r], 1)} for k, r in enumerate(rec)],
            "traces": traces,
            "velocity_proximal": vel(2, n // 2 - 3),
            "velocity_distal": vel(n // 2 + 3, n - 3),
            "velocity_total": vel(2, n - 3),
            "blocked": arrivals[-3] is None,
            "length_mm": round(pos_mm[-1], 1),
        }
        del stim, nodes, inter, vs
        return result
