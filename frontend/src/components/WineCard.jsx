import { LabelImage } from "@/components/LabelImage";
import { FavoriteButton } from "@/components/FavoriteButton";
import { euro } from "@/lib/api";
import { tipoColor } from "@/lib/constants";

export const TipoBadge = ({ tipo, className = "" }) =>
  tipo ? (
    <span title={tipo} className={`inline-flex min-w-0 max-w-full items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${className}`}>
      <span className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white/40" style={{ background: tipoColor(tipo) }} />
      <span className="truncate">{tipo}</span>
    </span>
  ) : null;

export const WineCard = ({ wine, onOpen, index = 0 }) => (
  <article
    onClick={() => onOpen(wine)}
    data-testid={`wine-card-${wine.id}`}
    style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    className="group animate-rise cursor-pointer overflow-hidden border border-avorio-200 bg-white/60 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-oro hover:shadow-[0_18px_40px_-20px_rgba(59,11,20,0.45)]"
  >
    <div className="relative aspect-[4/5] overflow-hidden bg-bordeaux-950">
      <LabelImage path={wine.foto_path} alt={wine.nome} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bordeaux-950/85 to-transparent" />
      <TipoBadge tipo={wine.tipologia} className="absolute left-3 top-3 max-w-[calc(100%-4.5rem)] bg-bordeaux-950/70 px-2.5 py-1 text-avorio-50 backdrop-blur-md" />
      <FavoriteButton wine={wine} className="absolute right-2 top-2 bg-bordeaux-950/60 text-avorio-50 backdrop-blur-md" />
      {wine.visibile === false && (
        <span className="absolute left-3 top-11 bg-avorio-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-bordeaux-700" data-testid={`wine-hidden-badge-${wine.id}`}>
          Nascosto ai clienti
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
        <span className="font-display text-xs tracking-widest text-oro-light/90">{wine.annata || "s.a."}</span>
        <span className="font-display text-lg text-oro-light" data-testid={`wine-card-price-${wine.id}`}>{euro(wine.prezzo_carta)}</span>
      </div>
    </div>
    <div className="space-y-1.5 p-4">
      <div className="eyebrow truncate">{wine.produttore}</div>
      <h3 className="line-clamp-2 font-serif text-xl font-semibold leading-tight text-bordeaux-900 md:text-2xl">{wine.nome}</h3>
      <p className="truncate text-xs text-ink-muted">
        {[wine.denominazione, wine.regione].filter(Boolean).join(" · ") || "—"}
      </p>
    </div>
  </article>
);
