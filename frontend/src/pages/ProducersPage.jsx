import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, Warehouse, ArrowUpRight } from "lucide-react";
import { Page, PageHeader, EmptyState } from "@/components/ui-kit";
import { LabelImage } from "@/components/LabelImage";
import { useStats } from "@/lib/queries";

const ProducerCard = ({ p, i }) => (
  <Link
    to={`/vini?produttore=${encodeURIComponent(p.produttore)}`}
    data-testid={`producer-card-${i}`}
    style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
    className="group flex animate-rise gap-4 border border-avorio-200 bg-white/60 p-4 transition-[border-color,box-shadow] duration-300 hover:border-oro hover:shadow-[0_14px_30px_-18px_rgba(59,11,20,0.45)]"
  >
    <LabelImage path={p.foto_path} alt={p.produttore} className="h-24 w-20 shrink-0" />
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-xl font-semibold leading-tight text-bordeaux-900 md:text-2xl">{p.produttore}</h3>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-oro transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <p className="mt-1 truncate text-xs text-ink-muted">{p.regioni.join(", ") || "Regione non indicata"}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="bg-bordeaux-800 px-2 py-0.5 font-display text-xs text-oro-light" data-testid={`producer-count-${i}`}>
          {p.count} {p.count === 1 ? "vino" : "vini"}
        </span>
        {p.preferiti > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-oro-dark"><Star className="h-3 w-3 fill-oro-bright text-oro-bright" /> {p.preferiti}</span>
        )}
        {p.tipologie.slice(0, 3).map((t) => (
          <span key={t} className="border border-oro/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-ink-muted">{t}</span>
        ))}
      </div>
    </div>
  </Link>
);

export default function ProducersPage() {
  const { data = [], isLoading } = useStats("produttori");
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const list = data.filter((p) => p.produttore.toLowerCase().includes(q.trim().toLowerCase()));
    const out = {};
    list.forEach((p) => {
      const letter = p.produttore[0]?.toUpperCase() || "#";
      (out[letter] = out[letter] || []).push(p);
    });
    return Object.entries(out);
  }, [data, q]);
  let idx = 0;

  return (
    <Page>
      <PageHeader eyebrow="Cantine" title="Produttori" testid="producers-page"
        description={`${data.length} produttori in carta. Seleziona una cantina per vederne i vini.`} />
      <div className="relative mt-8 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-oro-dark" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca un produttore…" className="field pl-10" data-testid="producer-search-input" />
      </div>
      <div className="mt-8 space-y-10">
        {isLoading && <div className="py-20 text-center font-serif text-xl italic text-ink-muted">Caricamento…</div>}
        {!isLoading && groups.length === 0 && (
          <EmptyState icon={Warehouse} title="Nessun produttore" text="I produttori compaiono qui appena inserisci i vini." testid="producers-empty-state" />
        )}
        {groups.map(([letter, list]) => (
          <section key={letter}>
            <div className="flex items-center gap-4">
              <span className="font-display text-3xl text-oro">{letter}</span>
              <div className="gold-rule flex-1 opacity-50" />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((p) => <ProducerCard key={p.produttore} p={p} i={idx++} />)}
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}
