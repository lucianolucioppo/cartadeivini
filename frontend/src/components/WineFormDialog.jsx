import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PhotoField } from "@/components/PhotoField";
import { WineFormFields, WineFormSuggestions } from "@/components/WineFormFields";
import { GoldButton, GhostButton } from "@/components/ui-kit";
import { useFacets } from "@/lib/queries";
import { useWineForm } from "@/hooks/useWineForm";

export const WineFormDialog = ({ open, wine, onClose, onSaved }) => {
  const { form, set, saving, submit, isEdit } = useWineForm(open, wine, onSaved);
  const { data: facets = {} } = useFacets();

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
            <WineFormFields form={form} set={set} />
          </div>
          <WineFormSuggestions facets={facets} />
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
