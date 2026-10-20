import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LabelImage } from "@/components/LabelImage";
import { FavoriteButton } from "@/components/FavoriteButton";
import { TipoBadge } from "@/components/WineCard";
import { GoldButton, GhostButton } from "@/components/ui-kit";
import { api, euro, formatApiError } from "@/lib/api";
import { useInvalidateWines } from "@/lib/queries";

const Meta = ({ label, value, testid }) => (
  <div className="border-b border-avorio-200 py-2.5">
    <div className="eyebrow">{label}</div>
    <div className="mt-0.5 text-sm text-ink" data-testid={testid}>{value || "—"}</div>
  </div>
);

const Prices = ({ wine }) => {
  const ricarico = wine.prezzo_acquisto && wine.prezzo_carta ? (wine.prezzo_carta / wine.prezzo_acquisto).toFixed(2).replace(".", ",") : null;
  return (
    <div className="grid grid-cols-3 gap-px bg-oro/30">
      <div className="bg-bordeaux-950 p-4">
        <div className="eyebrow !text-oro/70">In carta</div>
        <div className="mt-1 font-display text-xl text-oro-light" data-testid="detail-prezzo-carta">{euro(wine.prezzo_carta)}</div>
      </div>
      <div className="bg-bordeaux-950 p-4">
        <div className="eyebrow !text-oro/70">Acquisto</div>
        <div className="mt-1 font-display text-xl text-avorio-200" data-testid="detail-prezzo-acquisto">{euro(wine.prezzo_acquisto)}</div>
      </div>
      <div className="bg-bordeaux-950 p-4">
        <div className="eyebrow !text-oro/70">Ricarico</div>
        <div className="mt-1 font-display text-xl text-avorio-200" data-testid="detail-ricarico">{ricarico ? `×${ricarico}` : "—"}</div>
      </div>
    </div>
  );
};

const DeleteConfirm = ({ wine, open, setOpen, onDeleted }) => {
  const invalidate = useInvalidateWines();
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await api.delete(`/wines/${wine.id}`);
      toast.success(`«${wine.nome}» eliminato`);
      invalidate();
      onDeleted();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent data-testid="delete-confirm-dialog" className="bg-avorio-50">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-2xl text-bordeaux-900">Eliminare questo vino?</AlertDialogTitle>
          <AlertDialogDescription>«{wine.nome}» di {wine.produttore} sarà rimosso definitivamente dalla carta.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="cancel-delete-button">Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={busy} data-testid="confirm-delete-button" className="bg-bordeaux-700 hover:bg-bordeaux-600">
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const WineDetailDialog = ({ wine, onClose, onEdit }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!wine) return null;
  return (
    <Dialog open={!!wine} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-5xl gap-0 overflow-y-auto border-oro/40 bg-avorio-50 p-0" data-testid="wine-detail-dialog">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div className="relative bg-bordeaux-950 md:min-h-[560px]">
            <LabelImage path={wine.foto_path} alt={wine.nome} fit="contain" className="h-72 w-full md:absolute md:inset-0 md:h-full" />
          </div>
          <div className="p-6 md:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow" data-testid="detail-produttore">{wine.produttore}</div>
                <DialogTitle className="mt-2 font-serif text-3xl font-semibold leading-tight text-bordeaux-900 md:text-4xl" data-testid="detail-nome">
                  {wine.nome}
                </DialogTitle>
                <DialogDescription className="mt-2 flex items-center gap-3 text-ink-muted">
                  <TipoBadge tipo={wine.tipologia} className="max-w-[16rem]" />
                  <span className="font-display text-sm">{wine.annata || "s.a."}</span>
                </DialogDescription>
              </div>
              <FavoriteButton wine={wine} testid="detail-favorite-button" className="mr-6 border border-oro/50 text-oro-dark" />
            </div>
            <div className="mt-6"><Prices wine={wine} /></div>
            <div className="mt-4 grid grid-cols-2 gap-x-6">
              <Meta label="Regione" value={wine.regione} testid="detail-regione" />
              <Meta label="Denominazione" value={wine.denominazione} testid="detail-denominazione" />
              <Meta label="Affinamento" value={wine.affinamento} testid="detail-affinamento" />
              <Meta label="Vitigno" value={wine.vitigno} testid="detail-vitigno" />
              <Meta label="Formato" value={wine.formato} testid="detail-formato" />
              <Meta label="Fornitore" value={wine.fornitore} testid="detail-fornitore" />
              <Meta label="Gradazione alcolica" value={wine.gradazione} testid="detail-gradazione" />
              <Meta label="Temperatura di servizio" value={wine.temperatura_servizio} testid="detail-temperatura" />
            </div>
            <div className="mt-6">
              <div className="eyebrow">Note descrittive</div>
              <p className="mt-2 whitespace-pre-line font-serif text-lg italic leading-relaxed text-ink" data-testid="detail-note">
                {wine.note || "Nessuna nota."}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <GoldButton onClick={() => onEdit(wine)} data-testid="wine-edit-button"><Pencil className="h-4 w-4" /> Modifica</GoldButton>
              <GhostButton onClick={() => setConfirmOpen(true)} data-testid="wine-delete-button"><Trash2 className="h-4 w-4" /> Elimina</GhostButton>
            </div>
          </div>
        </div>
        <DeleteConfirm wine={wine} open={confirmOpen} setOpen={setConfirmOpen} onDeleted={() => { setConfirmOpen(false); onClose(); }} />
      </DialogContent>
    </Dialog>
  );
};
