import { WineBrowser } from "@/components/WineBrowser";

export default function WinesPage() {
  return (
    <WineBrowser
      testid="wines-page"
      eyebrow="La cantina"
      title="Tutti i vini"
      description="Consulta, cerca e aggiorna le schede dei vini in carta."
      emptyTitle="La carta è ancora vuota"
      emptyText="Inserisci la prima etichetta: nome, produttore, prezzi, foto e note di degustazione."
    />
  );
}
