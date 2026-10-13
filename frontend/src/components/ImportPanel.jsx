import { useRef, useState } from "react";
import { FileUp, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, GoldButton, GhostButton } from "@/components/ui-kit";
import { ImportPreviewDialog } from "@/components/ImportPreviewDialog";
import { api, downloadFile, formatApiError } from "@/lib/api";
import { useInvalidateWines } from "@/lib/queries";

export const ImportPanel = () => {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const invalidate = useInvalidateWines();

  const pick = async (f) => {
    if (!f) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await api.post("/import/preview", fd);
      setFile(f);
      setPreview(data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const confirm = async (mode) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);
    const { data } = await api.post("/import", fd);
    toast.success(`Importazione completata: ${data.inseriti} nuovi, ${data.aggiornati} aggiornati, ${data.saltati} saltati, ${data.errori} con errori`);
    invalidate();
    setPreview(null);
    setFile(null);
  };

  const template = () => downloadFile("/import/template", "modello-carta-dei-vini.xlsx").catch((e) => toast.error(formatApiError(e)));

  return (
    <Panel icon={FileUp} title="Importa da Excel" testid="import-panel" className="lg:col-span-2"
      text="Carica la carta che usi oggi in formato .xlsx o .csv. Le colonne vengono riconosciute automaticamente (Nome, Produttore o Cantina, Regione, Denominazione, Tipologia, Affinamento, Vitigno, Annata, Formato, Gradazione alcolica, Temperatura di servizio, Prezzo di acquisto, Prezzo in carta, Note) e prima di confermare vedrai un'anteprima. Le foto delle etichette si aggiungono poi dalla scheda di ogni vino.">
      <GoldButton onClick={() => input.current?.click()} disabled={busy} data-testid="import-file-button">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Scegli file Excel o CSV
      </GoldButton>
      <GhostButton onClick={template} data-testid="import-template-button"><Download className="h-4 w-4" /> Scarica modello</GhostButton>
      <input ref={input} type="file" accept=".xlsx,.xlsm,.csv,.xls" className="hidden" data-testid="import-file-input"
        onChange={(e) => pick(e.target.files?.[0])} />
      <ImportPreviewDialog preview={preview} fileName={file?.name} onClose={() => { setPreview(null); setFile(null); }} onConfirm={confirm} />
    </Panel>
  );
};
