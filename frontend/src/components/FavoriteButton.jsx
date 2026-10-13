import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useInvalidateWines } from "@/lib/queries";

export const FavoriteButton = ({ wine, className = "", testid }) => {
  const [fav, setFav] = useState(wine.preferito);
  const invalidate = useInvalidateWines();

  useEffect(() => {
    setFav(wine.preferito);
  }, [wine.preferito]);

  const toggle = async (e) => {
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    try {
      await api.patch(`/wines/${wine.id}/preferito`, { preferito: next });
      toast.success(next ? "Aggiunto ai preferiti" : "Rimosso dai preferiti");
      invalidate();
    } catch (err) {
      setFav(!next);
      toast.error(formatApiError(err));
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={fav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
      aria-pressed={fav}
      data-testid={testid || `favorite-button-${wine.id}`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 ${className}`}
    >
      <Star className={`h-[18px] w-[18px] ${fav ? "fill-oro-bright text-oro-bright" : "text-current"}`} strokeWidth={1.5} />
    </button>
  );
};
