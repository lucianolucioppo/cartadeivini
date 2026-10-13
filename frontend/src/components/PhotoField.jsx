import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { LabelImage } from "@/components/LabelImage";
import { api, formatApiError } from "@/lib/api";

export const PhotoField = ({ value, onChange }) => {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd);
      onChange(data.path);
      toast.success("Foto caricata");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden border border-oro/40 bg-bordeaux-950" data-testid="photo-field">
      <LabelImage key={value || "none"} path={value} alt="Etichetta" fit="contain" className="h-full w-full" />
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-bordeaux-950/70">
          <Loader2 className="h-7 w-7 animate-spin text-oro" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-bordeaux-950 to-transparent p-3 pt-10">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} data-testid="photo-upload-button"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm bg-oro px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-bordeaux-950 transition-colors hover:bg-oro-light">
          <Camera className="h-4 w-4" /> {value ? "Cambia foto" : "Foto etichetta"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} data-testid="photo-remove-button" aria-label="Rimuovi foto"
            className="inline-flex items-center justify-center rounded-sm border border-oro/60 px-3 text-oro-light hover:bg-oro/20">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" data-testid="photo-file-input"
        onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
};
