import axios from "axios";

export const api = axios.create({ baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`, withCredentials: true });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("np_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export function errText(e) {
  const d = e?.response?.data?.detail;
  if (!d) return e?.message || "Etwas ist schiefgelaufen.";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(" ");
  return String(d);
}

export const EVIDENCE = {
  gut: { label: "Gut belegt", color: "#3E8E4A" },
  maessig: { label: "Mäßig belegt", color: "#D9822B" },
  schwach: { label: "Schwach belegt", color: "#C8483B" },
  traditionell: { label: "Traditionell", color: "#7A5A47" },
};

export const LAYERS = [
  { key: "haut", label: "Haut", hint: "Körperhülle", data: false },
  { key: "muskeln", label: "Muskeln", hint: "Myofasziale Ebene", data: false },
  { key: "skelett", label: "Skelett", hint: "Knochen & Wirbelsäule", data: false },
  { key: "nerven", label: "Nervensystem", hint: "Periphere & Hirnnerven", data: true },
  { key: "gehirn", label: "Gehirn", hint: "89 Strukturen, nur Detailliert", data: false, detailedOnly: true },
  { key: "druckpunkte", label: "Druckpunkte", hint: "TCM, Marma, Triggerpunkte", data: true },
  { key: "meridiane", label: "Meridiane", hint: "TCM-Leitbahnen", data: true },
  { key: "zaehne", label: "Zähne", hint: "FDI 11–48", data: true },
  { key: "ketten", label: "Ketten", hint: "Zahn ↔ Becken, Faszien", data: true },
];

export const tradColor = (t = "") =>
  t.includes("TCM") ? "#8E5BA8" : t.includes("Ayurveda") ? "#795548" : t.includes("Reflex") ? "#A0724F" : t.includes("Manuelle") ? "#839E8C" : "#2A3B47";
