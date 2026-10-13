import { Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "__all";

const FilterSelect = ({ label, value, onChange, options, testid }) => (
  <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
    <SelectTrigger
      data-testid={testid}
      className={`h-11 rounded-sm border-avorio-300 bg-white/70 text-sm focus:ring-oro/30 ${value ? "border-oro text-bordeaux-800" : "text-ink-muted"}`}
    >
      <SelectValue placeholder={label} />
    </SelectTrigger>
    <SelectContent className="max-h-72 max-w-[min(90vw,28rem)]">
      <SelectItem value={ALL}>{label}: tutte</SelectItem>
      {options.map((o) => (
        <SelectItem key={o} value={o}>{o}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const SORT_OPTIONS = [
  ["nome", "Nome A–Z"],
  ["produttore", "Produttore"],
  ["annata", "Annata (recente)"],
  ["prezzo", "Prezzo crescente"],
  ["prezzo_desc", "Prezzo decrescente"],
  ["recenti", "Ultimi inseriti"],
];

export const WineFilters = ({ q, setQ, filters, setFilter, facets = {}, hasActive, onReset }) => (
  <div className="space-y-3">
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-oro-dark" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cerca per nome del vino o produttore…"
        data-testid="search-wine-input"
        className="field h-12 pl-10 pr-10 text-base"
      />
      {q && (
        <button onClick={() => setQ("")} data-testid="search-clear-button" aria-label="Cancella ricerca"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-bordeaux-700">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <FilterSelect label="Regione" value={filters.regione} onChange={(v) => setFilter("regione", v)} options={facets.regione || []} testid="filter-regione-select" />
      <FilterSelect label="Tipologia" value={filters.tipologia} onChange={(v) => setFilter("tipologia", v)} options={facets.tipologia || []} testid="filter-tipologia-select" />
      <FilterSelect label="Denominazione" value={filters.denominazione} onChange={(v) => setFilter("denominazione", v)} options={facets.denominazione || []} testid="filter-denominazione-select" />
      <FilterSelect label="Annata" value={filters.annata} onChange={(v) => setFilter("annata", v)} options={facets.annata || []} testid="filter-annata-select" />
    </div>
    {hasActive && (
      <div className="flex flex-wrap items-center gap-2">
        {filters.produttore && (
          <span className="inline-flex items-center gap-2 border border-oro/50 bg-oro/10 px-3 py-1 text-xs text-bordeaux-800" data-testid="active-produttore-chip">
            Produttore: {filters.produttore}
            <button onClick={() => setFilter("produttore", "")} aria-label="Rimuovi filtro produttore" data-testid="remove-produttore-filter">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        <button onClick={onReset} data-testid="reset-filters-button" className="text-xs uppercase tracking-[0.18em] text-bordeaux-600 underline-offset-4 hover:underline">
          Azzera filtri
        </button>
      </div>
    )}
  </div>
);
