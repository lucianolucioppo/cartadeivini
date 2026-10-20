import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPinned } from "lucide-react";
import { Page, PageHeader, EmptyState } from "@/components/ui-kit";
import { useStats } from "@/lib/queries";
import { tipoColor } from "@/lib/constants";

const UNSET = "Non specificata";
const link = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && v !== UNSET && sp.set(k, v));
  return `/vini?${sp.toString()}`;
};

const TypesPanel = ({ tipologie, totale }) => (
  <section className="grain relative overflow-hidden bg-bordeaux-950 p-6 text-avorio-50 md:p-8" data-testid="types-panel">
    <div className="eyebrow !text-oro/80">Per tipologia</div>
    <div className="mt-1 font-serif text-3xl italic">{totale} etichette</div>
    <div className="mt-6 flex h-3 w-full overflow-hidden">
      {tipologie.map((t) => (
        <div key={t.nome} style={{ width: `${(t.count / totale) * 100}%`, background: tipoColor(t.nome) }} title={t.nome} />
      ))}
    </div>
    <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
      {tipologie.map((t, i) => (
        <Link key={t.nome} to={link({ tipologia: t.nome })} data-testid={`type-link-${i}`}
          className="flex items-center justify-between border-b border-oro/20 py-3 text-sm transition-colors hover:text-oro-light">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: tipoColor(t.nome) }} />{t.nome}</span>
          <span className="font-display text-oro">{t.count}</span>
        </Link>
      ))}
    </div>
  </section>
);

const RegionCard = ({ r, i }) => {
  const tipi = useMemo(() => Object.entries(r.tipologie).sort((a, b) => b[1] - a[1]), [r.tipologie]);
  return (
  <div className="animate-rise border border-avorio-200 bg-white/60 p-5 transition-colors hover:border-oro" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }} data-testid={`region-card-${i}`}>
    <Link to={link({ regione: r.nome })} className="flex items-baseline justify-between gap-3" data-testid={`region-link-${i}`}>
      <h3 className="font-serif text-2xl font-semibold text-bordeaux-900 hover:text-bordeaux-600">{r.nome}</h3>
      <span className="font-display text-2xl text-oro-dark">{r.count}</span>
    </Link>
    <div className="mt-4 flex flex-wrap gap-2">
      {tipi.map(([t, n]) => (
        <Link key={t} to={link({ regione: r.nome, tipologia: t })}
          className="inline-flex items-center gap-1.5 border border-oro/40 px-2.5 py-1 text-xs text-ink transition-colors hover:bg-oro/15">
          <span className="h-2 w-2 rounded-full" style={{ background: tipoColor(t) }} />{t}<span className="text-ink-muted">· {n}</span>
        </Link>
      ))}
    </div>
  </div>
  );
};

export default function RegionsPage() {
  const { data, isLoading } = useStats("regioni-tipologie");
  return (
    <Page>
      <PageHeader eyebrow="Territori" title="Regioni e tipologie" testid="regions-page"
        description="La carta letta per territorio e per stile. Ogni voce apre l'elenco filtrato." />
      <div className="mt-8 space-y-10">
        {isLoading && <div className="py-20 text-center font-serif text-xl italic text-ink-muted">Caricamento…</div>}
        {data && data.totale === 0 && <EmptyState icon={MapPinned} title="Nessun dato" text="Inserisci i vini per vedere la ripartizione." testid="regions-empty-state" />}
        {data && data.totale > 0 && (
          <>
            <TypesPanel tipologie={data.tipologie} totale={data.totale} />
            <section>
              <div className="eyebrow">Per regione</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.regioni.map((r, i) => <RegionCard key={r.nome} r={r} i={i} />)}
              </div>
            </section>
          </>
        )}
      </div>
    </Page>
  );
}
