import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PhotoField } from "@/components/PhotoField";
import { Switch } from "@/components/ui/switch";
import { GoldButton, GhostButton } from "@/components/ui-kit";
import { api, formatApiError } from "@/lib/api";
import { useFacets, useInvalidateWines } from "@/lib/queries";
import { TIPOLOGIE, REGIONI, FORMATI, DENOMINAZIONI_BASE, merge } from "@/lib/constants";

const EMPTY = {
  nome: "", produttore: "", regione: "", denominazione: "", tipologia: "", affinamento: "", vitigno: "", annata: "",
  formato: "0,75 l", gradazione: "", temperatura_servizio: "", prezzo_acquisto: "", prezzo_carta: "", foto_path: null, note: "", preferito: false, visibile: true,
};

const toForm = (w) => ({
  ...EMPTY, ...w,
  prezzo_acquisto: w.prezzo_acquisto ?? "",
  prezzo_carta: w.prezzo_carta ?? "",
});

const parsePrice = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(/\s|€/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

const Field = ({ label, required, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="eyebrow">{label}{required && <span className="text-bordeaux-600"> *</span>}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);

const TextInput = ({ name, form, set, list, ...props }) => (
  <input value={form[name]} onChange={(e) => set(name, e.target.value)} list={list} data-testid={`wine-form-${name}-input`}
    className="field" autoComplete="off" {...props} />
);

const Options = ({ id, values }) => (
  <datalist id={id}>{values.map((v) => <option key={v} value={v} />)}</datalist>
);

export const WineFormDialog = ({ open, wine, onClose, onSaved }) => {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { data: facets = {} } = useFacets();
  const invalidate = useInvalidateWines();
  const isEdit = !!wine?.id;

  useEffect(() => {
    if (open) setForm(wine?.id ? toForm(wine) : EMPTY);
  }, [open, wine]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const prezzo_acquisto = parsePrice(form.prezzo_acquisto);
    const prezzo_carta = parsePrice(form.prezzo_carta);
    if (!form.nome.trim() || !form.produttore.trim()) return toast.error("Nome e produttore sono obbligatori");
    if (Number.isNaN(prezzo_acquisto) || Number.isNaN(prezzo_carta) || prezzo_acquisto < 0 || prezzo_carta < 0) {
      return toast.error("Inserisci prezzi validi (es. 24,50)");
    }
    setSaving(true);
    try {
      const body = { ...form, prezzo_acquisto, prezzo_carta };
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-4xl overflow-y-auto border-oro/40 bg-avorio-50 p-0" data-testid="wine-form-dialog">
        <form onSubmit={submit} className="p-6 md:p-9" noValidate>
          <div className="eyebrow">{isEdit ? "Modifica scheda" : "Nuova scheda"}</div>
          <DialogTitle className="mt-1 font-serif text-3xl font-semibold text-bordeaux-900 md:text-4xl">
            {isEdit ? wine.nome : "Aggiungi un vino"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-ink-muted">I campi con * sono obbligatori.</DialogDescription>
          <div className="gold-rule my-6" />
          <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="mx-auto w-full max-w-[220px]">
              <PhotoField value={form.foto_path} onChange={(v) => set("foto_path", v)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nome del vino" required className="sm:col-span-2"><TextInput name="nome" form={form} set={set} placeholder="es. Barolo Cannubi" /></Field>
              <Field label="Produttore o cantina" required className="sm:col-span-2"><TextInput name="produttore" form={form} set={set} list="dl-produttore" /></Field>
              <Field label="Regione"><TextInput name="regione" form={form} set={set} list="dl-regione" /></Field>
              <Field label="Denominazione"><TextInput name="denominazione" form={form} set={set} list="dl-denominazione" placeholder="es. Barolo DOCG" /></Field>
              <Field label="Tipologia"><TextInput name="tipologia" form={form} set={set} list="dl-tipologia" placeholder="es. Rosso" /></Field>
              <Field label="Vitigno"><TextInput name="vitigno" form={form} set={set} list="dl-vitigno" placeholder="es. Nebbiolo 100%" /></Field>
              <Field label="Affinamento" className="sm:col-span-2">
                <textarea value={form.affinamento} onChange={(e) => set("affinamento", e.target.value)} rows={3} maxLength={500} data-testid="wine-form-affinamento-input"
                  className="field h-auto py-2.5 leading-relaxed" placeholder="es. 18 mesi in barrique di rovere francese, poi 12 mesi in bottiglia" />
                <span className="mt-1 block text-right text-[11px] text-ink-muted" data-testid="affinamento-char-count">{form.affinamento.length}/500</span>
              </Field>
              <Field label="Annata"><TextInput name="annata" form={form} set={set} inputMode="numeric" placeholder="es. 2019 oppure s.a." /></Field>
              <Field label="Formato"><TextInput name="formato" form={form} set={set} list="dl-formato" /></Field>
              <Field label="Gradazione alcolica"><TextInput name="gradazione" form={form} set={set} placeholder="es. 13,5% vol" /></Field>
              <Field label="Temperatura di servizio"><TextInput name="temperatura_servizio" form={form} set={set} placeholder="es. 16–18 °C" /></Field>
              <Field label="Prezzo di acquisto (€)"><TextInput name="prezzo_acquisto" form={form} set={set} inputMode="decimal" placeholder="0,00" /></Field>
              <Field label="Prezzo in carta (€)"><TextInput name="prezzo_carta" form={form} set={set} inputMode="decimal" placeholder="0,00" /></Field>
              <div className="flex items-center justify-between gap-4 border border-avorio-300 bg-white/60 px-4 py-3 sm:col-span-2">
                <div>
                  <div className="eyebrow">Carta digitale</div>
                  <div className="text-sm text-ink">Visibile ai clienti nella carta digitale</div>
                </div>
                <Switch checked={form.visibile} onCheckedChange={(v) => set("visibile", v)} data-testid="wine-form-visibile-switch" />
              </div>
              <Field label="Note descrittive" className="sm:col-span-2">
                <textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={5} data-testid="wine-form-note-input"
                  className="field h-auto py-2.5 leading-relaxed" placeholder="Profumi, gusto, abbinamenti, temperatura di servizio…" />
              </Field>
            </div>
          </div>
          <Options id="dl-produttore" values={facets.produttore || []} />
          <Options id="dl-regione" values={merge(REGIONI, facets.regione || [])} />
          <Options id="dl-denominazione" values={merge(DENOMINAZIONI_BASE, facets.denominazione || [])} />
          <Options id="dl-tipologia" values={merge(TIPOLOGIE, facets.tipologia || [])} />
          <Options id="dl-vitigno" values={facets.vitigno || []} />
          <Options id="dl-formato" values={merge(FORMATI, facets.formato || [])} />
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-avorio-200 pt-6 sm:flex-row sm:justify-end">
            <GhostButton type="button" onClick={onClose} data-testid="wine-form-cancel-button">Annulla</GhostButton>
            <GoldButton type="submit" disabled={saving} data-testid="wine-form-submit-button">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {isEdit ? "Salva modifiche" : "Aggiungi alla carta"}
            </GoldButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
