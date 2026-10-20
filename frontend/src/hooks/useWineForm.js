import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useInvalidateWines } from "@/lib/queries";

export const EMPTY_WINE = {
  nome: "", produttore: "", regione: "", denominazione: "", tipologia: "", affinamento: "", vitigno: "", annata: "",
  formato: "0,75 l", gradazione: "", temperatura_servizio: "", prezzo_acquisto: "", fornitore: "", prezzo_carta: "", foto_path: null,
  note: "", preferito: false, visibile: true, esaurito: false,
};

const toForm = (w) => ({ ...EMPTY_WINE, ...w, prezzo_acquisto: w.prezzo_acquisto ?? "", prezzo_carta: w.prezzo_carta ?? "" });

const parsePrice = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(/\s|€/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

const isBadPrice = (p) => Number.isNaN(p) || p < 0;

export function validateWine(form) {
  const prezzo_acquisto = parsePrice(form.prezzo_acquisto);
  const prezzo_carta = parsePrice(form.prezzo_carta);
  if (!form.nome.trim() || !form.produttore.trim()) return { error: "Nome e produttore sono obbligatori" };
  if (isBadPrice(prezzo_acquisto) || isBadPrice(prezzo_carta)) return { error: "Inserisci prezzi validi (es. 24,50)" };
  return { body: { ...form, prezzo_acquisto, prezzo_carta } };
}

export function useWineForm(open, wine, onSaved) {
  const [form, setForm] = useState(EMPTY_WINE);
  const [saving, setSaving] = useState(false);
  const invalidate = useInvalidateWines();
  const isEdit = !!wine?.id;

  useEffect(() => {
    if (open) setForm(wine?.id ? toForm(wine) : EMPTY_WINE);
  }, [open, wine]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const { error, body } = validateWine(form);
    if (error) return toast.error(error);
    setSaving(true);
    try {
      const { data } = isEdit ? await api.put(`/wines/${wine.id}`, body) : await api.post("/wines", body);
      toast.success(isEdit ? "Scheda aggiornata" : "Vino aggiunto alla carta");
      invalidate();
      onSaved?.(data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return { form, set, saving, submit, isEdit };
}
