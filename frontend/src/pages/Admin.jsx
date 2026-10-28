import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api, errText, LAYERS } from "@/lib/api";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { EntryEditor } from "@/components/EntryEditor";
import { DropInPanel } from "@/components/DropInPanel";

const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try { await login(email, pw); } catch (ex) { setErr(errText(ex)); } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-cover bg-center lg:block" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1530213786676-41ad9f7736f6?auto=format&fit=crop&w=1400&q=80)" }} />
      <div className="flex items-center px-8 lg:px-20">
        <form onSubmit={submit} className="fade-up w-full max-w-sm space-y-5" data-testid="login-form">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-[#5C6B75] hover:text-[#1A2025]" data-testid="back-to-atlas-link"><ArrowLeft className="h-3.5 w-3.5" /> Zum Atlas</Link>
          <div>
            <span className="label-caps">NervenPfad · Admin</span>
            <h1 className="font-display text-4xl font-light tracking-tight">Datenbank pflegen</h1>
          </div>
          <Input data-testid="login-email-input" type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input data-testid="login-password-input" type="password" placeholder="Passwort" value={pw} onChange={(e) => setPw(e.target.value)} required />
          {err && <p className="text-sm text-[#C8483B]" data-testid="login-error">{err}</p>}
          <Button data-testid="login-submit-button" disabled={busy} className="w-full rounded-full bg-[#2A3B47] hover:bg-[#1A2025]">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Anmelden</Button>
        </form>
      </div>
    </div>
  );
};

const EntryTable = ({ entries, onEdit, onDelete }) => (
  <div className="overflow-hidden rounded-xl border border-[#E5E5E0] bg-white" data-testid="admin-entry-table">
    {entries.map((e) => (
      <div key={e.code} data-testid={`admin-row-${e.code}`} className="flex items-center gap-3 border-b border-[#F0F0ED] px-4 py-2.5 last:border-0 hover:bg-[#FCFCFA]">
        <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: e.color }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{e.name}</div>
          <div className="font-mono text-[10px] text-[#9BA8B2]">{e.code} · {LAYERS.find((l) => l.key === e.layer)?.label} · {e.studies.length} Studien</div>
        </div>
        <EvidenceBadge level={e.evidence} testid={`admin-evidence-${e.code}`} />
        <button data-testid={`admin-edit-${e.code}`} onClick={() => onEdit(e)} className="rounded-md p-1.5 text-[#5C6B75] hover:bg-[#F0F0ED]"><Pencil className="h-4 w-4" /></button>
        <button data-testid={`admin-delete-${e.code}`} onClick={() => onDelete(e)} className="rounded-md p-1.5 text-[#5C6B75] hover:bg-[#C8483B]/10 hover:text-[#C8483B]"><Trash2 className="h-4 w-4" /></button>
      </div>
    ))}
  </div>
);

export default function Admin() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [q, setQ] = useState("");
  const [layer, setLayer] = useState("");
  const [editing, setEditing] = useState(undefined);

  const load = () => api.get("/entries").then((r) => setEntries(r.data)).catch((e) => toast.error(errText(e)));
  useEffect(() => { if (user) load(); }, [user]);

  if (user === null) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#9BA8B2]" /></div>;
  if (!user) return <LoginForm />;

  const del = async (e) => {
    if (!window.confirm(`„${e.name}“ wirklich löschen?`)) return;
    try { await api.delete(`/entries/${e.code}`); toast.success("Gelöscht"); load(); } catch (ex) { toast.error(errText(ex)); }
  };
  const shown = entries.filter((e) => (!layer || e.layer === layer) && (!q || `${e.name} ${e.code}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="min-h-screen bg-[#FCFCFA] px-6 py-8 lg:px-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-[#5C6B75] hover:text-[#1A2025]" data-testid="admin-back-link"><ArrowLeft className="h-3.5 w-3.5" /> Zum Atlas</Link>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tight">Datenbank</h1>
          <p className="text-sm text-[#5C6B75]">Angemeldet als <span data-testid="admin-user-email">{user.email}</span></p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="admin-new-entry-btn" onClick={() => setEditing(null)} className="rounded-full bg-[#D96C50] hover:bg-[#C45A40]"><Plus className="mr-1 h-4 w-4" /> Neuer Eintrag</Button>
          <Button data-testid="logout-btn" variant="outline" className="rounded-full" onClick={logout}><LogOut className="mr-1 h-4 w-4" /> Abmelden</Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex flex-wrap gap-2">
            <Input data-testid="admin-search-input" placeholder="Suchen…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs bg-white" />
            {[{ key: "", label: "Alle" }, ...LAYERS.filter((l) => l.data)].map((l) => (
              <button key={l.key} data-testid={`admin-filter-${l.key || "alle"}`} onClick={() => setLayer(l.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${layer === l.key ? "border-[#2A3B47] bg-[#2A3B47] text-white" : "border-[#E5E5E0] bg-white"}`}>{l.label}</button>
            ))}
          </div>
          <EntryTable entries={shown} onEdit={setEditing} onDelete={del} />
        </div>
        <div className="lg:col-span-4"><DropInPanel onImported={load} /></div>
      </div>
      <EntryEditor open={editing !== undefined} entry={editing} onClose={() => setEditing(undefined)} onSaved={load} />
    </div>
  );
}
