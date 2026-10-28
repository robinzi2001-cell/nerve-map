import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderInput, Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, errText } from "@/lib/api";

export const DropInPanel = ({ onImported }) => {
  const [info, setInfo] = useState({ pending: [], imported: [], folder: "" });
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();

  const load = () => api.get("/dropin/files").then((r) => setInfo(r.data)).catch((e) => toast.error(errText(e)));
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try { await api.post("/dropin/upload", fd); } catch (err) { toast.error(errText(err)); }
    }
    e.target.value = "";
    load();
  };

  const runImport = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/dropin/import");
      setReport(data.report);
      toast.success(`${data.report.length} Datei(en) verarbeitet`);
      load();
      onImported();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#E5E5E0] bg-white p-5" data-testid="dropin-panel">
      <div className="flex items-center gap-2"><FolderInput className="h-4 w-4 text-[#D96C50]" /><span className="label-caps">Drop-in-Ordner für Studien</span></div>
      <p className="text-xs leading-relaxed text-[#5C6B75]">Lege <b>.json</b> oder <b>.csv</b> Dateien direkt in <code className="rounded bg-[#F0F0ED] px-1 font-mono text-[11px]" data-testid="dropin-folder-path">{info.folder}</code> ab (Vorlage: README.md im Ordner) oder lade sie hier hoch.</p>
      <div className="flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept=".json,.csv" multiple hidden onChange={upload} data-testid="dropin-file-input" />
        <Button variant="outline" className="rounded-full" onClick={() => fileRef.current.click()} data-testid="dropin-upload-btn"><Upload className="mr-1.5 h-4 w-4" /> Datei ablegen</Button>
        <Button className="rounded-full bg-[#2A3B47] hover:bg-[#1A2025]" onClick={runImport} disabled={busy || !info.pending.length} data-testid="dropin-import-btn">
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FolderInput className="mr-1.5 h-4 w-4" />} Ordner importieren ({info.pending.length})
        </Button>
      </div>
      <div className="space-y-1" data-testid="dropin-pending-list">
        {info.pending.map((f) => <div key={f} className="flex items-center gap-2 text-xs"><FileText className="h-3.5 w-3.5 text-[#9BA8B2]" />{f}</div>)}
      </div>
      {report && (
        <div className="space-y-2 rounded-lg bg-[#F0F0ED] p-3 text-xs" data-testid="dropin-report">
          {report.map((r) => (
            <div key={r.file}>
              <b>{r.file}</b>: {r.studies_added} Studien, {r.entries_upserted} Einträge
              {r.errors.map((er, i) => <div key={i} className="text-[#C8483B]">• {er}</div>)}
            </div>
          ))}
        </div>
      )}
      {info.imported.length > 0 && <p className="text-[11px] text-[#9BA8B2]">Bereits importiert: {info.imported.length} Datei(en) in /importiert</p>}
    </div>
  );
};
