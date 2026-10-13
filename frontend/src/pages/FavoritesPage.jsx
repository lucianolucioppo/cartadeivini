import { WineBrowser } from "@/components/WineBrowser";

const FIXED = { preferito: true };

export default function FavoritesPage() {
  return (
    <WineBrowser
      testid="favorites-page"
      eyebrow="Selezione della casa"
      title="Preferiti"
      description="Le etichette consigliate dal ristorante, condivise con tutto il personale."
      fixed={FIXED}
      emptyTitle="Nessun preferito"
      emptyText="Tocca la stella su una scheda vino per aggiungerla alla selezione della casa."
    />
  );
}
