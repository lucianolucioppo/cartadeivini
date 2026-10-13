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

const BrowserToolbar = ({ count, sort, setSort, view, setView }) => (
  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
    <div className="text-sm text-ink-muted" data-testid="wine-count">
      <span className="font-display text-base text-bordeaux-800">{count}</span> {count === 1 ? "vino" : "vini"}
    </div>
    <div className="flex items-center gap-3">
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger className="h-10 w-[170px] rounded-sm border-oro/50 bg-transparent text-xs" data-testid="sort-select"><SelectValue /></SelectTrigger>
        <SelectContent>{SORT_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
      <ViewToggle view={view} setView={setView} />
    </div>
  </div>
);

const EmptyActions = ({ onAdd }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <GoldButton onClick={onAdd} data-testid="empty-add-wine-button"><Plus className="h-4 w-4" /> Aggiungi il primo vino</GoldButton>
      <GhostButton onClick={() => navigate("/backup")} data-testid="empty-import-button"><FileUp className="h-4 w-4" /> Importa da Excel</GhostButton>
    </div>
  );
};

const WineResults = ({ isLoading, wines, view, hasActive, showActions, emptyTitle, emptyText, onAdd, onOpen }) => {
  if (isLoading) return <div className="py-24 text-center font-serif text-xl italic text-ink-muted">Caricamento della cantina…</div>;
  if (wines.length === 0) {
    return (
      <EmptyState icon={Wine} testid="wines-empty-state"
        title={hasActive ? "Nessun vino corrisponde alla ricerca" : emptyTitle}
        text={hasActive ? "Prova a modificare i filtri o la ricerca." : emptyText}
        action={hasActive || !showActions ? null : <EmptyActions onAdd={onAdd} />} />
    );
  }
  if (view === "list") return <WineList wines={wines} onOpen={onOpen} />;
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" data-testid="wine-grid">
      {wines.map((w, i) => <WineCard key={w.id} wine={w} index={i} onOpen={onOpen} />)}
    </div>
  );
};

function useUrlFilters() {
  const [sp, setSp] = useSearchParams();
  const filters = useMemo(() => Object.fromEntries(KEYS.map((k) => [k, sp.get(k) || ""])), [sp]);
  const setFilter = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v); else next.delete(k);
    setSp(next, { replace: true });
  };
  const clear = () => setSp(new URLSearchParams(), { replace: true });
  return { filters, setFilter, clear };
}

function useViewMode() {
  const [view, setViewState] = useState(() => localStorage.getItem("cdv-view") || "grid");
  const setView = (v) => { setViewState(v); localStorage.setItem("cdv-view", v); };
  return [view, setView];
}

export const WineBrowser = ({ eyebrow, title, description, fixed = {}, emptyTitle, emptyText, testid }) => {
  const { filters, setFilter, clear } = useUrlFilters();
  const [view, setView] = useViewMode();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("nome");
  const [detailId, setDetailId] = useState(null);
  const [editing, setEditing] = useState(null);
  const dq = useDebounced(q, 250);
  const { data: wines = [], isLoading } = useWines({ ...filters, q: dq.trim(), sort, ...fixed });
  const { data: facets } = useFacets();
  const detail = wines.find((w) => w.id === detailId) || null;
  const hasActive = KEYS.some((k) => filters[k]) || !!q;
  const reset = () => { setQ(""); clear(); };

  return (
    <Page>
      <PageHeader eyebrow={eyebrow} title={title} description={description} testid={testid}
        actions={<GoldButton onClick={() => setEditing({})} data-testid="add-wine-button"><Plus className="h-4 w-4" /> Nuovo vino</GoldButton>} />
      <div className="mt-8">
        <WineFilters q={q} setQ={setQ} filters={filters} setFilter={setFilter} facets={facets} hasActive={hasActive} onReset={reset} />
      </div>
      <BrowserToolbar count={wines.length} sort={sort} setSort={setSort} view={view} setView={setView} />
      <div className="mt-5">
        <WineResults isLoading={isLoading} wines={wines} view={view} hasActive={hasActive} showActions={!fixed.preferito}
          emptyTitle={emptyTitle} emptyText={emptyText} onAdd={() => setEditing({})} onOpen={(x) => setDetailId(x.id)} />
      </div>
      <WineDetailDialog wine={detail} onClose={() => setDetailId(null)} onEdit={(w) => { setDetailId(null); setEditing(w); }} />
      <WineFormDialog open={!!editing} wine={editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />
    </Page>
  );
};
