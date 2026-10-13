import { useRef, useState } from "react";
import { FileSpreadsheet, FileText, DatabaseBackup, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Page, PageHeader, Panel, GoldButton, GhostButton } from "@/components/ui-kit";
import { ImportPanel } from "@/components/ImportPanel";
import { api, downloadFile, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useInvalidateWines, useWines } from "@/lib/queries";

const useDownload = () => {
  const [busy, setBusy] = useState(null);
  const run = async (key, url, name) => {
    setBusy(key);
    try {
      await downloadFile(url, name);
      toast.success("Download avviato");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(null);
    }
  };
  return [busy, run];
};

const Restore = () => {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const invalidate = useInvalidateWines();
  const confirm = async () => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/backup/restore", fd);
      toast.success(`Ripristino completato: ${data.vini} vini, ${data.foto} foto`);
      invalidate();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
      setFile(null);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <>
      <GhostButton onClick={() => input.current?.click()} disabled={busy} data-testid="restore-backup-button">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Ripristina da file
      </GhostButton>
      <input ref={input} type="file" accept="application/json,.json" className="hidden" data-testid="restore-backup-input"
        onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <AlertDialog open={!!file} onOpenChange={(o) => !o && setFile(null)}>
        <AlertDialogContent className="bg-avorio-50" data-testid="restore-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl text-bordeaux-900">Ripristinare il backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Tutti i vini attuali saranno sostituiti dal contenuto di «{file?.name}». L'operazione non si può annullare: scarica prima un backup aggiornato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="restore-cancel-button">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirm} className="bg-bordeaux-700 hover:bg-bordeaux-600" data-testid="restore-confirm-button">Ripristina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default function BackupPage() {
  const { user } = useAuth();
  const { data: wines = [] } = useWines({});
  const [busy, run] = useDownload();
  const spin = (k, Icon) => (busy === k ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />);

  return (
    <Page>
      <PageHeader eyebrow="Strumenti" title="Importa, esporta e backup" testid="backup-page"
        description={`${wines.length} vini nel database. Importa la carta da Excel, esportala o salva una copia completa dei dati.`} />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ImportPanel />
        <Panel icon={FileSpreadsheet} title="Esporta la carta" testid="export-panel"
          text="Tutte le schede, con prezzi di acquisto e in carta, pronte per Excel o per qualsiasi foglio di calcolo.">
          <GoldButton onClick={() => run("xlsx", "/export/xlsx", "carta-dei-vini.xlsx")} disabled={!!busy} data-testid="export-excel-button">{spin("xlsx", FileSpreadsheet)} Excel (.xlsx)</GoldButton>
          <GhostButton onClick={() => run("csv", "/export/csv", "carta-dei-vini.csv")} disabled={!!busy} data-testid="export-csv-button">{spin("csv", FileText)} CSV</GhostButton>
        </Panel>
        <Panel icon={DatabaseBackup} title="Backup completo" testid="backup-panel"
          text={user?.role === "admin"
            ? "File JSON con tutti i vini e le foto delle etichette. Conservalo in un luogo sicuro: puoi usarlo per ripristinare la carta."
            : "File JSON con tutti i vini e le foto delle etichette. Il ripristino è riservato all'amministratore."}>
          <GoldButton onClick={() => run("backup", "/backup", "backup-carta-dei-vini.json")} disabled={!!busy} data-testid="download-backup-button">{spin("backup", DatabaseBackup)} Scarica backup</GoldButton>
          {user?.role === "admin" && <Restore />}
        </Panel>
      </div>
    </Page>
  );
}
