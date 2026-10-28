"""Heart-rate variability (vagal tone) analysis with NeuroKit2 (github.com/neuropsychology/NeuroKit)."""
import io
import numpy as np
import pandas as pd
import neurokit2 as nk


def _first_numeric(text: str):
    df = pd.read_csv(io.StringIO(text), sep=None, engine="python")
    num = df.select_dtypes("number")
    if num.empty:
        df = pd.read_csv(io.StringIO(text), header=None, sep=None, engine="python")
        num = df.select_dtypes("number")
    if num.empty:
        raise ValueError("Keine Zahlenspalte gefunden")
    return num.iloc[:, -1 if num.shape[1] > 1 and "time" in str(num.columns[0]).lower() else 0].dropna().to_numpy(dtype=float)


def _metrics(peaks, sr):
    peaks = np.asarray(peaks)
    rr = np.diff(peaks) / sr * 1000
    if len(rr) < 20:
        raise ValueError("Zu wenige Herzschläge (mind. 20 nötig)")
    t = nk.hrv_time(peaks, sampling_rate=sr)
    out = {
        "beats": int(len(peaks)), "duration_s": round(float((peaks[-1] - peaks[0]) / sr), 1),
        "hr_mean": round(float(60000 / rr.mean()), 1),
        "rmssd": round(float(t["HRV_RMSSD"].iloc[0]), 1), "sdnn": round(float(t["HRV_SDNN"].iloc[0]), 1),
        "pnn50": round(float(t["HRV_pNN50"].iloc[0]), 1),
        "hf": None, "lf": None, "lfhf": None,
    }
    if out["duration_s"] >= 110:
        f = nk.hrv_frequency(peaks, sampling_rate=sr)
        for k, c in (("hf", "HRV_HF"), ("lf", "HRV_LF"), ("lfhf", "HRV_LFHF")):
            v = f[c].iloc[0]
            out[k] = None if pd.isna(v) else round(float(v), 4)
    times = (peaks[1:] - peaks[0]) / sr
    stride = max(1, len(rr) // 300)
    out["rr_series"] = [{"t": round(float(a), 1), "rr": round(float(b), 1)} for a, b in zip(times[::stride], rr[::stride])]
    return out


def analyze(text: str, kind: str, sampling_rate: int):
    data = _first_numeric(text)
    if kind == "rr":
        rr = data[(data > 250) & (data < 2500)]
        return _metrics(np.concatenate([[0], np.cumsum(rr)]).astype(int), 1000)
    if kind == "ecg":
        _, info = nk.ecg_process(data, sampling_rate=sampling_rate)
        return _metrics(info["ECG_R_Peaks"], sampling_rate)
    if kind == "ppg":
        _, info = nk.ppg_process(data, sampling_rate=sampling_rate)
        return _metrics(info["PPG_Peaks"], sampling_rate)
    raise ValueError("Unbekannter Typ")


def demo(heart_rate: int, variability: float):
    sr = 250
    ecg = nk.ecg_simulate(duration=150, sampling_rate=sr, heart_rate=heart_rate, heart_rate_std=variability, random_state=42)
    _, info = nk.ecg_process(ecg, sampling_rate=sr)
    res = _metrics(info["ECG_R_Peaks"], sr)
    res["ecg_preview"] = [round(float(x), 3) for x in ecg[: sr * 5: 2]]
    return res
