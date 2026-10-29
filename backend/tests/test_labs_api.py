# Labs API tests: NEURON nerve conduction sim + NeuroKit2 HRV analysis
import os
import io
import numpy as np
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
S = requests.Session()


def sim(cond, temp=33):
    return S.post(f"{BASE_URL}/api/sim/axon", json={"condition": cond, "temperature": temp}, timeout=90)


# --- NEURON simulation ---
class TestSim:
    def test_conditions(self):
        r = S.get(f"{BASE_URL}/api/sim/conditions")
        assert r.status_code == 200
        keys = [c["key"] for c in r.json()]
        assert keys == ["gesund", "neuropraxie", "remyelinisierung", "demyelinisierung", "regeneration_frueh", "regeneration_spaet"]
        assert all("label" in c and "desc" in c for c in r.json())

    def test_gesund(self):
        r = sim("gesund")
        assert r.status_code == 200
        d = r.json()
        for k in ["r0", "r1", "r2", "r3", "t"]:
            assert k in d["traces"]
        assert d["blocked"] is False
        print("gesund", d["velocity_total"], d["velocity_proximal"], d["velocity_distal"])
        assert 55 <= d["velocity_total"] <= 85

    def test_neuropraxie_block(self):
        d = sim("neuropraxie").json()
        print("neuropraxie", d["velocity_total"], d["blocked"])
        assert d["blocked"] is True

    def test_regeneration_frueh_slower_distal(self):
        g = sim("gesund").json()
        d = sim("regeneration_frueh").json()
        print("reg_frueh", d["velocity_proximal"], d["velocity_distal"], d["blocked"])
        assert d["velocity_distal"] is not None
        assert d["velocity_distal"] < g["velocity_distal"]

    @pytest.mark.parametrize("c", ["remyelinisierung", "demyelinisierung", "regeneration_spaet"])
    def test_other_conditions(self, c):
        d = sim(c).json()
        print(c, d["velocity_total"], d["velocity_proximal"], d["velocity_distal"], d["blocked"])
        assert d["blocked"] is False
        assert d["velocity_total"] is not None

    def test_cold_slower(self):
        warm = sim("gesund", 37).json()["velocity_total"]
        cold = sim("gesund", 24).json()["velocity_total"]
        print("warm", warm, "cold", cold)
        assert cold < warm

    def test_invalid_condition(self):
        assert sim("foo").status_code == 400

    @pytest.mark.parametrize("t", [19, 41])
    def test_temp_out_of_range(self, t):
        assert sim("gesund", t).status_code == 422


# --- NeuroKit2 HRV ---
class TestHRV:
    def test_demo(self):
        r = S.get(f"{BASE_URL}/api/hrv/demo", params={"heart_rate": 70, "variability": 3}, timeout=90)
        assert r.status_code == 200
        d = r.json()
        print({k: d[k] for k in ["hr_mean", "rmssd", "sdnn", "pnn50", "hf", "lfhf", "beats"]})
        assert 60 <= d["hr_mean"] <= 80
        assert d["hf"] is not None and len(d["ecg_preview"]) > 0 and len(d["rr_series"]) > 0

    def test_analyze_rr(self):
        rng = np.random.default_rng(1)
        rr = 850 + rng.normal(0, 40, 200)
        csv = "rr\n" + "\n".join(f"{x:.0f}" for x in rr)
        r = S.post(f"{BASE_URL}/api/hrv/analyze", files={"file": ("rr.csv", csv, "text/csv")}, data={"kind": "rr", "sampling_rate": 1000}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        print(d["hr_mean"], d["rmssd"], d["beats"], d["hf"])
        assert 65 <= d["hr_mean"] <= 75
        assert d["beats"] == 201

    def test_analyze_invalid(self):
        r = S.post(f"{BASE_URL}/api/hrv/analyze", files={"file": ("x.csv", "name\nfoo\nbar", "text/csv")}, data={"kind": "rr"})
        assert r.status_code == 400
        print(r.json())

    def test_analyze_too_few(self):
        r = S.post(f"{BASE_URL}/api/hrv/analyze", files={"file": ("x.csv", "rr\n800\n810\n820", "text/csv")}, data={"kind": "rr"})
        assert r.status_code == 400

    def test_analyze_bad_kind(self):
        csv = "rr\n" + "\n".join(["850"] * 50)
        r = S.post(f"{BASE_URL}/api/hrv/analyze", files={"file": ("x.csv", csv, "text/csv")}, data={"kind": "xyz"})
        assert r.status_code == 400

    def test_analyze_ecg(self):
        r = S.get(f"{BASE_URL}/api/hrv/demo", timeout=90)
        assert r.status_code == 200
