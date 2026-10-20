import { LabelImage } from "@/components/LabelImage";
import { FavoriteButton } from "@/components/FavoriteButton";
import { TipoBadge } from "@/components/WineCard";
import { euro } from "@/lib/api";

const HEAD = "hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-oro-dark md:block";

export const WineList = ({ wines, onOpen }) => (
  <div className="border border-avorio-200 bg-white/60" data-testid="wine-list">
    <div className="hidden grid-cols-[56px_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_70px_90px_90px_40px] gap-4 border-b border-avorio-200 px-4 py-3 md:grid">
      <span />
      <span className={HEAD}>Vino</span>
      <span className={HEAD}>Regione</span>
      <span className={HEAD}>Denominazione</span>
      <span className={HEAD}>Annata</span>
      <span className={`${HEAD} text-right`}>Acquisto</span>
      <span className={`${HEAD} text-right`}>Carta</span>
      <span />
    </div>
    {wines.map((w) => (
      <div
        key={w.id}
        onClick={() => onOpen(w)}
        data-testid={`wine-row-${w.id}`}
        className="grid cursor-pointer grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 border-b border-avorio-200/70 px-4 py-3 transition-colors last:border-0 hover:bg-oro/10 md:grid-cols-[56px_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_70px_90px_90px_40px]"
      >
        <LabelImage path={w.foto_path} alt={w.nome} className="h-16 w-12 md:h-[72px] md:w-14" />
        <div className="min-w-0">
          <div className="truncate font-serif text-lg font-semibold leading-tight text-bordeaux-900">
            {w.esaurito && <span className="mr-2 bg-bordeaux-600 px-1.5 py-0.5 align-middle font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-avorio-50" data-testid={`wine-row-soldout-${w.id}`}>Esaurito</span>}
            {w.nome}
          </div>
          <div className="truncate text-xs text-ink-muted">{w.produttore}</div>
          <div className="mt-1 flex items-center gap-3 md:hidden">
            <TipoBadge tipo={w.tipologia} className="text-ink-muted" />
            <span className="text-xs text-ink-muted">{w.annata}</span>
          </div>
          <TipoBadge tipo={w.tipologia} className="mt-1 hidden text-ink-muted md:inline-flex" />
        </div>
        <div className="hidden truncate text-sm text-ink md:block">{w.regione || "—"}</div>
        <div className="hidden truncate text-sm text-ink md:block">{w.denominazione || "—"}</div>
        <div className="hidden font-display text-sm text-ink md:block">{w.annata || "s.a."}</div>
        <div className="hidden text-right text-sm text-ink-muted md:block">{euro(w.prezzo_acquisto)}</div>
        <div className="text-right font-display text-base text-bordeaux-800 md:text-sm" data-testid={`wine-row-price-${w.id}`}>
          {euro(w.prezzo_carta)}
        </div>
        <FavoriteButton wine={w} testid={`favorite-row-button-${w.id}`} className="hidden text-oro-dark md:inline-flex" />
      </div>
    ))}
  </div>
);
