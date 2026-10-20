import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Search, Star, Wine, X } from "lucide-react";
import { LabelImage } from "@/components/LabelImage";
import { PublicWineSheet } from "@/components/PublicWineSheet";
import { API, euro, formatApiError, publicFotoUrl } from "@/lib/api";
import { tipoColor, tipoOrder } from "@/lib/constants";

const FAV = "__consigliati";
const OTHER = "Altri vini";

const Chip = ({ active, onClick, children, testid }) => (
  <button onClick={onClick} data-testid={testid}
    className={`inline-flex shrink-0 items-center gap-1.5 border px-3.5 py-2 text-xs tracking-wide transition-colors ${active ? "border-oro bg-bordeaux-800 text-oro-light" : "border-oro/40 text-bordeaux-800 hover:bg-oro/10"}`}>
    {children}
  </button>
);

const Row = ({ w, onOpen }) => {
  const meta = useMemo(() => [w.denominazione || w.regione, w.annata].filter(Boolean).join(" · "), [w.denominazione, w.regione, w.annata]);
  return (
  <li>
    <button onClick={() => onOpen(w)} data-testid={`public-wine-${w.id}`}
      className="grid w-full grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 py-3.5 text-left transition-colors hover:bg-oro/10">
      {w.foto ? <LabelImage src={publicFotoUrl(w.id)} alt={w.nome} className="h-[72px] w-14" /> : <LabelImage alt={w.nome} className="h-[72px] w-14" />}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {w.preferito && <Star className="h-3.5 w-3.5 shrink-0 fill-oro-bright text-oro-bright" />}
          <span className="truncate font-serif text-lg font-semibold leading-tight text-bordeaux-900">{w.nome}</span>
        </div>
        <div className="truncate text-xs text-ink-muted">{w.produttore}</div>
        <div className="truncate text-xs text-ink-muted">{meta}</div>
      </div>
      <span className={`font-display text-base ${w.esaurito ? "text-xs uppercase tracking-[0.15em] text-bordeaux-600" : "text-bordeaux-800"}`} data-testid={`public-wine-price-${w.id}`}>
        {w.esaurito ? "Esaurito" : euro(w.prezzo_carta)}
      </span>
    </button>
  </li>
  );
};

const SEARCH_FIELDS = ["nome", "produttore", "denominazione", "regione", "vitigno"];

function matchesTipo(w, tipo) {
  if (!tipo) return true;
  if (tipo === FAV) return w.preferito;
  return (w.tipologia || OTHER) === tipo;
}

function matchesTerm(w, term) {
  return !term || SEARCH_FIELDS.some((f) => (w[f] || "").toLowerCase().includes(term));
}

function groupByTipologia(list) {
  const groups = {};
  list.forEach((w) => (groups[w.tipologia || OTHER] = groups[w.tipologia || OTHER] || []).push(w));
  return Object.entries(groups).sort((a, b) => tipoOrder(a[0]) - tipoOrder(b[0]) || a[0].localeCompare(b[0], "it"));
}

const useFiltered = (wines, q, tipo) =>
  useMemo(() => {
    const term = q.trim().toLowerCase();
    return groupByTipologia((wines || []).filter((w) => matchesTipo(w, tipo) && matchesTerm(w, term)));
  }, [wines, q, tipo]);

function usePublicCarta() {
  const [wines, setWines] = useState(null);
  const [error, setError] = useState("");
  const [nome, setNome] = useState("");
  useEffect(() => {
    axios.get(`${API}/public/carta`).then((r) => setWines(r.data)).catch((e) => setError(formatApiError(e)));
    axios.get(`${API}/public/info`).then((r) => {
      setNome(r.data.nome_ristorante);
      document.title = r.data.nome_ristorante ? `Carta dei Vini — ${r.data.nome_ristorante}` : "Carta dei Vini";
    }).catch(() => {});
  }, []);
  const tipi = useMemo(() => [...new Set((wines || []).map((w) => w.tipologia || OTHER))].sort((a, b) => tipoOrder(a) - tipoOrder(b)), [wines]);
  const counts = useMemo(() => {
    const c = { [FAV]: 0 };
    (wines || []).forEach((w) => {
      const t = w.tipologia || OTHER;
      c[t] = (c[t] || 0) + 1;
      if (w.preferito) c[FAV] += 1;
    });
    return c;
  }, [wines]);
  return { wines, error, tipi, counts, nome };
}

const Count = ({ n, testid }) => <span className="opacity-70" data-testid={testid}>({n})</span>;

const FilterBar = ({ q, setQ, tipo, setTipo, tipi, counts, total }) => (
  <div className="sticky top-0 z-10 -mx-5 space-y-3 border-b border-avorio-200 bg-avorio-50/95 px-5 py-4 backdrop-blur-xl">
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-oro-dark" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca vino, cantina, vitigno…" className="field h-12 pl-10 pr-10 text-base" data-testid="public-search-input" />
      {q && <button onClick={() => setQ("")} aria-label="Cancella" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"><X className="h-4 w-4" /></button>}
    </div>
    <div className="flex flex-wrap gap-2" data-testid="public-tipo-chips">
      <Chip active={!tipo} onClick={() => setTipo("")} testid="public-chip-all">Tutti <Count n={total} testid="public-chip-count-all" /></Chip>
      {counts[FAV] > 0 && <Chip active={tipo === FAV} onClick={() => setTipo(FAV)} testid="public-chip-consigliati"><Star className="h-3 w-3" /> Consigliati <Count n={counts[FAV]} testid="public-chip-count-consigliati" /></Chip>}
      {tipi.map((t) => (
        <Chip key={t} active={tipo === t} onClick={() => setTipo(t)} testid={`public-chip-${t}`}>
          <span className="h-2 w-2 rounded-full" style={{ background: tipoColor(t) }} />{t} <Count n={counts[t]} testid={`public-chip-count-${t}`} />
        </Chip>
      ))}
    </div>
  </div>
);

export default function PublicCartaPage() {
  const { wines, error, tipi, counts, nome } = usePublicCarta();
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [open, setOpen] = useState(null);
  const groups = useFiltered(wines, q, tipo);

  return (
    <div className="min-h-screen bg-avorio-50" data-testid="public-carta-page">
      <header className="grain relative overflow-hidden bg-bordeaux-950 px-6 pb-10 pt-12 text-center">
        <div className="font-display text-sm uppercase tracking-[0.3em] text-oro-light/90" data-testid="public-restaurant-name">{nome || "Selezione"}</div>
        <h1 className="mt-2 font-serif text-5xl font-semibold italic text-avorio-50 sm:text-6xl">Carta dei Vini</h1>
        <div className="gold-rule mx-auto mt-5 w-40 opacity-70" />
      </header>
      <div className="mx-auto max-w-3xl px-5 pb-16">
        {error && <p className="mt-16 text-center font-serif text-xl italic text-ink-muted" data-testid="public-carta-error">{error}</p>}
        {!error && !wines && <p className="mt-16 text-center font-serif text-xl italic text-ink-muted">Caricamento della carta…</p>}
        {wines && (
          <>
            <FilterBar q={q} setQ={setQ} tipo={tipo} setTipo={setTipo} tipi={tipi} counts={counts} total={(wines || []).length} />
            {groups.length === 0 && (
              <div className="mt-16 flex flex-col items-center text-center text-ink-muted" data-testid="public-empty">
                <Wine className="h-10 w-10 text-oro" strokeWidth={1} />
                <p className="mt-3 font-serif text-xl italic">Nessun vino trovato.</p>
              </div>
            )}
            {groups.map(([t, list]) => (
              <section key={t} className="mt-8">
                <h2 className="font-display text-base uppercase tracking-[0.3em] text-bordeaux-700">{t}</h2>
                <ul className="mt-2 divide-y divide-avorio-200 border-y border-avorio-200">{list.map((w) => <Row key={w.id} w={w} onOpen={setOpen} />)}</ul>
              </section>
            ))}
            <p className="mt-10 text-center text-xs text-ink-muted">Prezzi in euro, IVA inclusa. Chiedi al personale di sala per un consiglio.</p>
          </>
        )}
      </div>
      <PublicWineSheet wine={open} onClose={() => setOpen(null)} />
    </div>
  );
}
