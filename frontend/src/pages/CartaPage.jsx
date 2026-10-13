import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Page, PageHeader, GoldButton } from "@/components/ui-kit";
import { DigitalCartaPanel } from "@/components/DigitalCartaPanel";
import { useWines } from "@/lib/queries";
import { TIPOLOGIE } from "@/lib/constants";

const price = (v) => (v == null ? "" : new Intl.NumberFormat("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v));

const order = (t) => {
  const i = TIPOLOGIE.indexOf(t);
  return i === -1 ? 99 : i;
};

function groupWines(wines) {
  const byType = {};
  wines.forEach((w) => {
    const t = w.tipologia || "Altri vini";
    const r = w.regione || "Altre provenienze";
    byType[t] = byType[t] || {};
    (byType[t][r] = byType[t][r] || []).push(w);
  });
  return Object.entries(byType)
    .sort((a, b) => order(a[0]) - order(b[0]) || a[0].localeCompare(b[0], "it"))
    .map(([t, regions]) => [t, Object.entries(regions).sort((a, b) => a[0].localeCompare(b[0], "it"))]);
}

const Toggle = ({ id, label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-sm text-ink" htmlFor={id}>
    <Switch id={id} checked={checked} onCheckedChange={onChange} data-testid={`${id}-switch`} />
    {label}
  </label>
);

const CartaItem = ({ w, showNotes }) => (
  <li className="break-inside-avoid py-2.5" data-testid={`carta-item-${w.id}`}>
    <div className="flex items-baseline gap-2">
      <span className="font-serif text-lg font-semibold text-bordeaux-900">{w.nome}</span>
      {w.annata && <span className="font-display text-xs text-ink-muted">{w.annata}</span>}
      <span className="mx-1 flex-1 translate-y-[-3px] border-b border-dotted border-oro/60" />
      <span className="font-display text-base text-bordeaux-800">{price(w.prezzo_carta)}</span>
    </div>
    <div className="text-xs text-ink-muted">
      {[w.produttore, w.denominazione, w.vitigno, w.formato, w.gradazione,
        w.temperatura_servizio && `servire a ${w.temperatura_servizio}`].filter(Boolean).join(" · ")}
    </div>
    {showNotes && w.note && <p className="mt-1 font-serif text-sm italic text-ink-muted">{w.note}</p>}
  </li>
);

export default function CartaPage() {
  const [onlyFav, setOnlyFav] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const { data: wines = [] } = useWines({ sort: "produttore", ...(onlyFav ? { preferito: true } : {}) });
  const groups = useMemo(() => groupWines(wines), [wines]);

  return (
    <Page className="print:max-w-none print:p-0">
      <div className="print:hidden">
        <PageHeader eyebrow="Per gli ospiti" title="Carta per i clienti" testid="carta-page"
          description="Carta digitale con QR code per i tavoli e versione da stampare. Mai i prezzi di acquisto."
          actions={<GoldButton onClick={() => window.print()} data-testid="print-carta-button"><Printer className="h-4 w-4" /> Stampa</GoldButton>} />
        <DigitalCartaPanel />
        <div className="eyebrow mt-10">Carta stampabile</div>
        <div className="mt-3 flex flex-wrap gap-6">
          <Toggle id="carta-only-favorites" label="Solo preferiti" checked={onlyFav} onChange={setOnlyFav} />
          <Toggle id="carta-show-notes" label="Mostra note descrittive" checked={showNotes} onChange={setShowNotes} />
        </div>
      </div>
      <article className="mx-auto mt-8 max-w-3xl border border-oro/50 bg-[#FBF8F1] px-6 py-12 shadow-[0_30px_60px_-40px_rgba(59,11,20,0.5)] sm:px-14 print:mt-0 print:max-w-none print:border-0 print:shadow-none" data-testid="carta-sheet">
        <div className="text-center">
          <div className="eyebrow">Selezione</div>
          <h2 className="mt-2 font-serif text-5xl font-semibold italic text-bordeaux-900">Carta dei Vini</h2>
          <div className="gold-rule mx-auto mt-5 w-40" />
        </div>
        {groups.length === 0 && <p className="mt-12 text-center font-serif italic text-ink-muted">Nessun vino da mostrare.</p>}
        {groups.map(([tipo, regions]) => (
          <section key={tipo} className="mt-12">
            <h3 className="text-center font-display text-lg uppercase tracking-[0.3em] text-bordeaux-700">{tipo}</h3>
            {regions.map(([reg, list]) => (
              <div key={reg} className="mt-6">
                <div className="eyebrow break-after-avoid">{reg}</div>
                <ul className="mt-1">{list.map((w) => <CartaItem key={w.id} w={w} showNotes={showNotes} />)}</ul>
              </div>
            ))}
          </section>
        ))}
      </article>
    </Page>
  );
}
