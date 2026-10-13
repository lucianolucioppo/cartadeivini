import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GoldButton, GhostButton } from "@/components/ui-kit";
import { euro, formatApiError } from "@/lib/api";

const STATO = {
  nuovo: ["Nuovo", "bg-emerald-700/10 text-emerald-800"],
  presente: ["Già presente", "bg-oro/20 text-oro-dark"],
  errore: ["Errore", "bg-bordeaux-600/10 text-bordeaux-600"],
};

const Stat = ({ label, value, testid }) => (
  <div className="bg-bordeaux-950 p-4">
    <div className="eyebrow !text-oro/70">{label}</div>
    <div className="mt-1 font-display text-2xl text-oro-light" data-testid={testid}>{value}</div>
  </div>
);

const Chips = ({ label, items, muted }) =>
  items.length > 0 && (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow mr-1">{label}</span>
      {items.map((c) => (
        <span key={c} className={`border px-2 py-0.5 text-xs ${muted ? "border-avorio-300 text-ink-muted line-through" : "border-oro/50 text-ink"}`}>{c}</span>
      ))}
    </div>
  );

const Row = ({ r }) => (
  <li className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-3 py-2.5 text-sm" data-testid={`import-row-${r.riga}`}>
    <span className="font-display text-xs text-ink-muted">#{r.riga}</span>
    <div className="min-w-0">
      <div className="truncate font-medium text-ink">{r.nome || <em className="text-ink-muted">senza nome</em>} {r.annata && <span className="text-ink-muted">· {r.annata}</span>}</div>
      <div className="truncate text-xs text-ink-muted">{r.produttore || "—"} · {euro(r.prezzo_carta)}</div>
      {r.errori.length > 0 && <div className="mt-0.5 text-xs text-bordeaux-600">{r.errori.join(" · ")}</div>}
    </div>
    <span className={`whitespace-nowrap px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${STATO[r.stato][1]}`}>{STATO[r.stato][0]}</span>
  </li>
);

export const ImportPreviewDialog = ({ preview, fileName, onClose, onConfirm }) => {
  const [mode, setMode] = useState("skip");
  const [busy, setBusy] = useState(false);
  if (!preview) return null;
  const t = preview.totali;
  const count = t.nuovi + (mode === "update" ? t.presenti : 0);

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(mode);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-3xl overflow-y-auto border-oro/40 bg-avorio-50 p-6 md:p-9" data-testid="import-preview-dialog">
        <div className="eyebrow">Anteprima importazione</div>
        <DialogTitle className="font-serif text-3xl font-semibold text-bordeaux-900">{fileName}</DialogTitle>
        <DialogDescription className="text-sm text-ink-muted">Controlla le righe lette dal file prima di confermare.</DialogDescription>
        <div className="mt-4 grid grid-cols-3 gap-px bg-oro/30">
          <Stat label="Nuovi" value={t.nuovi} testid="import-count-nuovi" />
          <Stat label="Già presenti" value={t.presenti} testid="import-count-presenti" />
          <Stat label="Con errori" value={t.errori} testid="import-count-errori" />
        </div>
        <div className="mt-5 space-y-2">
          <Chips label="Colonne riconosciute" items={Object.values(preview.columns)} />
          <Chips label="Ignorate" items={preview.ignored} muted />
        </div>
        {t.presenti > 0 && (
          <RadioGroup value={mode} onValueChange={setMode} className="mt-5 space-y-2 border border-avorio-200 bg-white/60 p-4" data-testid="import-mode-radio">
            <div className="eyebrow">Vini già presenti in carta (stesso nome, produttore e annata)</div>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="skip" data-testid="import-mode-skip" /> Lasciali come sono</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="update" data-testid="import-mode-update" /> Aggiornali con i dati del file (foto e altri campi restano invariati)</label>
          </RadioGroup>
        )}
        <ul className="mt-5 max-h-[38vh] divide-y divide-avorio-200 overflow-y-auto border-y border-avorio-200" data-testid="import-rows-list">
          {preview.rows.map((r) => <Row key={r.riga} r={r} />)}
        </ul>
        {t.righe > preview.rows.length && <p className="mt-2 text-xs text-ink-muted">Mostrate le prime {preview.rows.length} righe su {t.righe}.</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <GhostButton onClick={onClose} disabled={busy} data-testid="import-cancel-button">Annulla</GhostButton>
          <GoldButton onClick={submit} disabled={busy || count === 0} data-testid="import-confirm-button">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {count === 0 ? "Niente da importare" : `Importa ${count} ${count === 1 ? "vino" : "vini"}`}
          </GoldButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
