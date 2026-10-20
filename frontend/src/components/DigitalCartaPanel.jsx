import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { GoldButton, GhostButton } from "@/components/ui-kit";
import { api, formatApiError, PUBLIC_CARTA_PATH } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/lib/queries";

const QR_COLORS = { fgColor: "#3B0B14", bgColor: "#FFFFFF" };

export const DigitalCartaPanel = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const bigQr = useRef(null);
  const url = `${window.location.origin}${PUBLIC_CARTA_PATH}`;
  const { data: settings } = useSettings();
  const active = settings?.carta_pubblica_attiva ?? true;

  const toggle = async (v) => {
    try {
      await api.put("/settings", { carta_pubblica_attiva: v });
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success(v ? "Carta digitale attivata" : "Carta digitale disattivata");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiato");
    } catch {
      toast.error("Copia non riuscita: seleziona il link manualmente");
    }
  };

  const downloadQr = () => {
    const canvas = bigQr.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qr-carta-dei-vini.png";
    a.click();
  };

  return (
    <section className="mt-8 grid gap-6 border border-oro/50 bg-white/60 p-6 md:grid-cols-[auto_minmax(0,1fr)] md:p-8" data-testid="digital-carta-panel">
      <div className="mx-auto border border-avorio-200 bg-white p-3" data-testid="qr-code">
        <QRCodeCanvas value={url} size={168} level="M" {...QR_COLORS} />
      </div>
      <div ref={bigQr} className="hidden"><QRCodeCanvas value={url} size={1024} level="M" marginSize={4} {...QR_COLORS} /></div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <QrCode className="h-5 w-5 text-oro" strokeWidth={1.4} />
          <h2 className="font-serif text-2xl font-semibold text-bordeaux-900 md:text-3xl">Carta digitale</h2>
          <span data-testid="digital-carta-status"
            className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${active ? "bg-emerald-700/10 text-emerald-800" : "bg-bordeaux-600/10 text-bordeaux-600"}`}>
            {active ? "Attiva" : "Disattivata"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Stampa il QR code e mettilo sui tavoli: i clienti consultano la carta dal proprio telefono, con foto e prezzi in carta, senza accesso.
          Per nascondere un vino disattiva «Visibile nella carta digitale» nella sua scheda.
        </p>
        <div className="mt-4 truncate border border-avorio-300 bg-avorio-50 px-3 py-2 font-mono text-xs text-ink" data-testid="digital-carta-url">{url}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <GoldButton onClick={downloadQr} data-testid="download-qr-button"><Download className="h-4 w-4" /> Scarica QR code</GoldButton>
          <GhostButton onClick={copy} data-testid="copy-link-button"><Copy className="h-4 w-4" /> Copia link</GhostButton>
          <GhostButton onClick={() => window.open(url, "_blank", "noopener")} data-testid="open-public-carta-button"><ExternalLink className="h-4 w-4" /> Apri</GhostButton>
        </div>
        {user?.role === "admin" && (
          <label className="mt-5 flex items-center gap-3 text-sm text-ink">
            <Switch checked={active} onCheckedChange={toggle} data-testid="digital-carta-toggle" />
            Carta digitale accessibile al pubblico
          </label>
        )}
      </div>
    </section>
  );
};
