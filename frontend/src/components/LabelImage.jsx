import { useState } from "react";
import { Wine } from "lucide-react";
import { fileUrl } from "@/lib/api";

export const LabelImage = ({ path, src, alt, className = "", fit = "cover" }) => {
  const [failed, setFailed] = useState(false);
  const url = src || fileUrl(path);
  if (!url || failed) {
    return (
      <div className={`grain relative flex items-center justify-center bg-gradient-to-b from-bordeaux-800 to-bordeaux-950 ${className}`}>
        <Wine className="h-10 w-10 text-oro/50" strokeWidth={1} />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${fit === "contain" ? "object-contain" : "object-cover"} ${className}`}
    />
  );
};
