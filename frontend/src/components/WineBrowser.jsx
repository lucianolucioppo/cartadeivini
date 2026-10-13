import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LayoutGrid, List, Plus, Wine, FileUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WineFilters, SORT_OPTIONS } from "@/components/WineFilters";
import { WineCard } from "@/components/WineCard";
import { WineList } from "@/components/WineList";
import { WineDetailDialog } from "@/components/WineDetailDialog";
import { WineFormDialog } from "@/components/WineFormDialog";
import { Page, PageHeader, EmptyState, GoldButton, GhostButton } from "@/components/ui-kit";
import { useWines, useFacets } from "@/lib/queries";

const KEYS = ["regione", "tipologia", "denominazione", "annata", "produttore"];

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const ViewToggle = ({ view, setView }) => (
  <div className="flex border border-oro/50">
    {[["grid", LayoutGrid, "Galleria"], ["list", List, "Elenco"]].map(([id, Icon, label]) => (
      <button key={id} onClick={() => setView(id)} data-testid={`view-mode-${id}-button`} aria-pressed={view === id}
        className={`inline-flex h-10 items-center gap-2 px-3.5 text-xs uppercase tracking-[0.15em] transition-colors ${view === id ? "bg-bordeaux-800 text-oro-light" : "text-bordeaux-800 hover:bg-oro/10"}`}>
        <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{label}</span>
      </button>
    ))}
  </div>
);

export const WineBrowser = ({ eyebrow, title, description, fixed = {}, emptyTitle, emptyText, testid }) => {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("nome");
  const [view, setViewState] = useState(() => localStorage.getItem("cdv-view") || "grid");
  const [detailId, setDetailId] = useState(null);
  const [editing, setEditing] = useState(null);
  const dq = useDebounced(q, 250);
  const filters = useMemo(() => Object.fromEntries(KEYS.map((k) => [k, sp.get(k) || ""])), [sp]);
  const { data: wines = [], isLoading } = useWines({ ...filters, q: dq.trim(), sort, ...fixed });
  const { data: facets } = useFacets();
  const detail = wines.find((w) => w.id === detailId) || null;
  const hasActive = KEYS.some((k) => filters[k]) || !!q;

  const setView = (v) => { setViewState(v); localStorage.setItem("cdv-view", v); };
  const setFilter = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v); else next.delete(k);
    setSp(next, { replace: true });
  };
  const reset = () => { setQ(""); setSp(new URLSearchParams(), { replace: true }); };

  return (
    <Page>
      <PageHeader eyebrow={eyebrow} title={title} description={description} testid={testid}
        actions={<GoldButton onClick={() => setEditing({})} data-testid="add-wine-button"><Plus className="h-4 w-4" /> Nuovo vino</GoldButton>} />
      <div className="mt-8">
        <WineFilters q={q} setQ={setQ} filters={filters} setFilter={setFilter} facets={facets} hasActive={hasActive} onReset={reset} />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-ink-muted" data-testid="wine-count">
          <span className="font-display text-base text-bordeaux-800">{wines.length}</span> {wines.length === 1 ? "vino" : "vini"}
        </div>
        <div className="flex items-center gap-3">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 w-[170px] rounded-sm border-oro/50 bg-transparent text-xs" data-testid="sort-select"><SelectValue /></SelectTrigger>
            <SelectContent>{SORT_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <ViewToggle view={view} setView={setView} />
        </div>
      </div>
      <div className="mt-5">
        {isLoading ? (
          <div className="py-24 text-center font-serif text-xl italic text-ink-muted">Caricamento della cantina…</div>
        ) : wines.length === 0 ? (
          <EmptyState icon={Wine} testid="wines-empty-state"
            title={hasActive ? "Nessun vino corrisponde alla ricerca" : emptyTitle}
            text={hasActive ? "Prova a modificare i filtri o la ricerca." : emptyText}
            action={hasActive || fixed.preferito ? null : (
              <div className="flex flex-wrap justify-center gap-3">
                <GoldButton onClick={() => setEditing({})} data-testid="empty-add-wine-button"><Plus className="h-4 w-4" /> Aggiungi il primo vino</GoldButton>
                <GhostButton onClick={() => navigate("/backup")} data-testid="empty-import-button"><FileUp className="h-4 w-4" /> Importa da Excel</GhostButton>
              </div>
            )} />
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" data-testid="wine-grid">
            {wines.map((w, i) => <WineCard key={w.id} wine={w} index={i} onOpen={(x) => setDetailId(x.id)} />)}
          </div>
        ) : (
          <WineList wines={wines} onOpen={(x) => setDetailId(x.id)} />
        )}
      </div>
      <WineDetailDialog wine={detail} onClose={() => setDetailId(null)} onEdit={(w) => { setDetailId(null); setEditing(w); }} />
      <WineFormDialog open={!!editing} wine={editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />
    </Page>
  );
};
