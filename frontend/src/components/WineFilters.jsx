import { Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { GoldButton, GhostButton } from "@/components/ui-kit";

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

const LABELS = {
  produttore: "Produttore", regione: "Regione", tipologia: "Tipologia",
  denominazione: "Denominazione", annata: "Annata", fornitore: "Fornitore",
};

const Chip = ({ label, onRemove, testid }) => (
  <span className="inline-flex items-center gap-2 border border-oro/50 bg-oro/10 px-3 py-1 text-xs text-bordeaux-800" data-testid={testid}>
    {label}
    <button onClick={onRemove} aria-label={`Rimuovi ${label}`} data-testid={`${testid}-remove`}><X className="h-3 w-3" /></button>
  </span>
);

export const ActiveFilters = ({ q, setQ, filters, setFilter, onReset }) => {
  const active = Object.keys(LABELS).filter((k) => filters[k]);
  if (!q && active.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="active-filters">
      {q && <Chip label={`«${q}»`} onRemove={() => setQ("")} testid="active-search-chip" />}
      {active.map((k) => (
        <Chip key={k} label={`${LABELS[k]}: ${filters[k]}`} onRemove={() => setFilter(k, "")} testid={`active-${k}-chip`} />
      ))}
      <button onClick={onReset} data-testid="reset-filters-button" className="text-xs uppercase tracking-[0.18em] text-bordeaux-600 underline-offset-4 hover:underline">
        Azzera filtri
      </button>
    </div>
  );
};

const FILTER_KEYS = ["produttore", "regione", "tipologia", "denominazione", "annata", "fornitore"];

export const FilterPanel = ({ open, setOpen, q, setQ, filters, setFilter, facets = {}, onReset, count }) => (
  <Sheet open={open} onOpenChange={setOpen}>
    <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto border-oro/40 bg-avorio-50 p-0 sm:max-w-md" data-testid="filter-panel">
      <div className="flex-1 p-6 pt-8">
        <div className="eyebrow">Ricerca</div>
        <SheetTitle className="mt-1 font-serif text-3xl font-semibold text-bordeaux-900">Cerca e filtra</SheetTitle>
        <SheetDescription className="mt-1 text-sm text-ink-muted">I risultati si aggiornano mentre scegli.</SheetDescription>
        <div className="gold-rule my-6" />
        <SearchField q={q} setQ={setQ} />
        <div className="mt-5 space-y-4">
          {FILTER_KEYS.map((k) => (
            <label key={k} className="block">
              <span className="eyebrow">{LABELS[k]}</span>
              <div className="mt-1.5">
                <FilterSelect label={LABELS[k]} value={filters[k]} onChange={(v) => setFilter(k, v)} options={facets[k] || []} testid={`filter-${k}-select`} />
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="sticky bottom-0 flex gap-3 border-t border-avorio-200 bg-avorio-50 p-4">
        <GhostButton onClick={onReset} className="flex-1" data-testid="filter-panel-reset-button">Azzera</GhostButton>
        <GoldButton onClick={() => setOpen(false)} className="flex-[2]" data-testid="filter-panel-apply-button">
          Mostra {count} {count === 1 ? "vino" : "vini"}
        </GoldButton>
      </div>
    </SheetContent>
  </Sheet>
);

const SearchField = ({ q, setQ }) => (
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
);
