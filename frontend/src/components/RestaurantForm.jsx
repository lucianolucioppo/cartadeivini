import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { GoldButton } from "@/components/ui-kit";
import { api, formatApiError } from "@/lib/api";
import { useSettings } from "@/lib/queries";

export const RestaurantForm = () => {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useSettings();
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);
  const loaded = !isLoading;

  useEffect(() => {
    if (loaded) setNome(settings?.nome_ristorante || "");
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps -- initialise once after load, don't overwrite typing

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put("/settings", { nome_ristorante: nome });
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Nome del ristorante salvato");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="eyebrow">Nome del ristorante</span>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
          <input className="field" maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} disabled={!loaded}
            placeholder="es. Trattoria da Mario" data-testid="restaurant-name-input" />
          <GoldButton type="submit" disabled={busy || !loaded} data-testid="save-restaurant-name-button">Salva</GoldButton>
        </div>
      </label>
      <p className="text-xs text-ink-muted">Compare nel menu, nella carta stampabile e nella carta digitale per i clienti.</p>
    </form>
  );
};
