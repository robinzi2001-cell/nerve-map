import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { api, errText, EVIDENCE, LAYERS } from "@/lib/api";

const EMPTY = { code: "", name: "", latin: "", layer: "druckpunkte", tradition: "TCM", color: "#D96C50", description: "", symptoms: [], conditions: [],
  technique: "", contraindications: "", evidence: "schwach", pubmed_query: "", related: [], positions: [[-0.1, 1.2, 0.1]], paths: null, claims: [], studies: [] };

const DEFAULTS = {
  nerven: { tradition: "Schulmedizin", color: "#2F6FB0", evidence: "maessig" },
  druckpunkte: { tradition: "TCM", color: "#D96C50", evidence: "schwach" },
  meridiane: { tradition: "TCM", color: "#8E5BA8", evidence: "traditionell" },
  zaehne: { tradition: "Schulmedizin", color: "#F5F1E6", evidence: "gut" },
  ketten: { tradition: "Manuelle Therapie", color: "#839E8C", evidence: "schwach" },
};

const F = ({ label, children }) => (<label className="block space-y-1"><span className="label-caps">{label}</span>{children}</label>);

export const EntryEditor = ({ open, onClose, entry, onSaved }) => {
  const isNew = !entry;
  const [f, setF] = useState(EMPTY);
  const [geo, setGeo] = useState({ positions: "", paths: "", claims: "" });

  useEffect(() => {
    const e = entry || EMPTY;
    setF(e);
    setGeo({ positions: JSON.stringify(e.positions), paths: JSON.stringify(e.paths), claims: JSON.stringify(e.claims, null, 1) });
  }, [entry, open]);

  const set = (k) => (ev) => setF({ ...f, [k]: ev?.target ? ev.target.value : ev });
  const list = (k) => (ev) => setF({ ...f, [k]: ev.target.value.split(",").map((s) => s.trim()).filter(Boolean) });

  const save = async () => {
    let body;
    try {
      body = { ...f, positions: JSON.parse(geo.positions || "null"), paths: JSON.parse(geo.paths || "null"), claims: JSON.parse(geo.claims || "[]") };
    } catch {
      return toast.error("Koordinaten oder Aussagen sind kein gültiges JSON");
    }
    try {
      const { data } = isNew ? await api.post("/entries", body) : await api.put(`/entries/${entry.code}`, body);
      toast.success("Gespeichert");
      onSaved(data);
      onClose();
    } catch (e) {
      toast.error(errText(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" data-testid="entry-editor-dialog">
        <DialogHeader><DialogTitle className="font-display">{isNew ? "Neuer Eintrag" : `Bearbeiten: ${entry.name}`}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <F label="Code (eindeutig)"><Input data-testid="editor-code" value={f.code} onChange={set("code")} /></F>
          <F label="Name"><Input data-testid="editor-name" value={f.name} onChange={set("name")} /></F>
          <F label="Latein / Kürzel"><Input data-testid="editor-latin" value={f.latin} onChange={set("latin")} /></F>
          <F label="Tradition / Methode"><Input data-testid="editor-tradition" value={f.tradition} onChange={set("tradition")} /></F>
          <F label="Ebene">
            <Select value={f.layer} onValueChange={(v) => setF({ ...f, layer: v, ...(isNew ? DEFAULTS[v] : {}) })}>
              <SelectTrigger data-testid="editor-layer"><SelectValue /></SelectTrigger>
              <SelectContent>{LAYERS.filter((l) => l.data).map((l) => <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Evidenz">
            <Select value={f.evidence} onValueChange={set("evidence")}>
              <SelectTrigger data-testid="editor-evidence"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(EVIDENCE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Farbe"><Input data-testid="editor-color" type="color" value={f.color} onChange={set("color")} className="h-10 p-1" /></F>
          <F label="PubMed-Suchbegriff"><Input data-testid="editor-pubmed-query" value={f.pubmed_query} onChange={set("pubmed_query")} /></F>
        </div>
        <F label="Beschreibung"><Textarea data-testid="editor-description" rows={3} value={f.description} onChange={set("description")} /></F>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <F label="Symptome (Komma-getrennt)"><Input data-testid="editor-symptoms" value={f.symptoms.join(", ")} onChange={list("symptoms")} /></F>
          <F label="Beschwerden (Komma-getrennt)"><Input data-testid="editor-conditions" value={f.conditions.join(", ")} onChange={list("conditions")} /></F>
          <F label="Technik für Therapeuten"><Textarea data-testid="editor-technique" rows={2} value={f.technique} onChange={set("technique")} /></F>
          <F label="Kontraindikationen"><Textarea data-testid="editor-contra" rows={2} value={f.contraindications} onChange={set("contraindications")} /></F>
          <F label="Verknüpfte Codes (Komma-getrennt)"><Input data-testid="editor-related" value={f.related.join(", ")} onChange={list("related")} /></F>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <F label="Punkte [[x,y,z],…]"><Textarea data-testid="editor-positions" rows={3} className="font-mono text-xs" value={geo.positions} onChange={(e) => setGeo({ ...geo, positions: e.target.value })} /></F>
          <F label="Bahnen [[[x,y,z],…],…]"><Textarea data-testid="editor-paths" rows={3} className="font-mono text-xs" value={geo.paths} onChange={(e) => setGeo({ ...geo, paths: e.target.value })} /></F>
        </div>
        <p className="text-[11px] text-[#9BA8B2]">Koordinaten: x rechts des Patienten negativ · y Höhe 0 (Fuß) bis 1.75 (Scheitel) · z vorne positiv.</p>
        <F label="Aussagen mit Evidenz (JSON)"><Textarea data-testid="editor-claims" rows={4} className="font-mono text-xs" value={geo.claims} onChange={(e) => setGeo({ ...geo, claims: e.target.value })} /></F>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} data-testid="editor-cancel">Abbrechen</Button>
          <Button onClick={save} data-testid="editor-save" className="rounded-full bg-[#D96C50] hover:bg-[#C45A40]">Speichern</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
