import { useMemo } from "react";
import { Star } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LabelImage } from "@/components/LabelImage";
import { euro, publicFotoUrl } from "@/lib/api";

const Info = ({ label, value }) =>
  value ? (
    <div className="border-b border-avorio-200 py-2.5">
      <div className="eyebrow">{label}</div>
      <div className="mt-0.5 text-sm text-ink">{value}</div>
    </div>
  ) : null;

export const PublicWineSheet = ({ wine, onClose }) => {
  const subtitle = useMemo(
    () => (wine ? [wine.tipologia, wine.annata || "s.a.", wine.formato].filter(Boolean).join(" · ") : ""),
    [wine]
  );
  return (
  <Sheet open={!!wine} onOpenChange={(o) => !o && onClose()}>
    <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto border-oro/40 bg-avorio-50 p-0 sm:mx-auto sm:max-w-2xl" data-testid="public-wine-sheet">
      {wine && (
        <>
          {wine.foto && <LabelImage src={publicFotoUrl(wine.id)} alt={wine.nome} fit="contain" className="h-72 w-full bg-bordeaux-950" />}
          <div className="p-6 pb-10">
            {wine.preferito && (
              <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-oro-dark">
                <Star className="h-3 w-3 fill-oro-bright text-oro-bright" /> Consigliato dalla casa
              </div>
            )}
            <div className="eyebrow">{wine.produttore}</div>
            <SheetTitle className="mt-1 font-serif text-3xl font-semibold leading-tight text-bordeaux-900" data-testid="public-wine-name">{wine.nome}</SheetTitle>
            <SheetDescription className="mt-1 text-sm text-ink-muted">
              {subtitle}
            </SheetDescription>
            <div className={`mt-4 inline-block bg-bordeaux-950 px-4 py-2 font-display text-xl text-oro-light ${wine.esaurito ? "line-through opacity-50" : ""}`} data-testid="public-wine-price">{euro(wine.prezzo_carta)}</div>
            {wine.esaurito && <span className="ml-3 align-middle text-xs font-semibold uppercase tracking-[0.15em] text-bordeaux-600" data-testid="public-wine-soldout">Al momento esaurito</span>}
            <div className="mt-4 grid grid-cols-2 gap-x-6">
              <Info label="Regione" value={wine.regione} />
              <Info label="Denominazione" value={wine.denominazione} />
              <Info label="Vitigno" value={wine.vitigno} />
              <Info label="Gradazione" value={wine.gradazione} />
              <Info label="Servire a" value={wine.temperatura_servizio} />
            </div>
            {wine.affinamento && <div className="mt-2"><Info label="Affinamento" value={wine.affinamento} /></div>}
            {wine.note && <p className="mt-5 whitespace-pre-line font-serif text-lg italic leading-relaxed text-ink">{wine.note}</p>}
            {wine.abbinamenti && (
              <div className="mt-5 border-l-2 border-oro pl-4" data-testid="public-wine-abbinamenti">
                <div className="eyebrow">Abbinamenti consigliati</div>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">{wine.abbinamenti}</p>
              </div>
            )}
          </div>
        </>
      )}
    </SheetContent>
  </Sheet>
  );
};
