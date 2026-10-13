export const TIPOLOGIE = [
  "Rosso",
  "Bianco",
  "Rosato",
  "Spumante",
  "Champagne",
  "Orange",
  "Dolce / Passito",
  "Fortificato",
];

export const TIPOLOGIA_COLORS = {
  Rosso: "#7A1C2C",
  Bianco: "#E3CF8A",
  Rosato: "#E39AA2",
  Spumante: "#D9C98F",
  Champagne: "#C5A059",
  Orange: "#D9822B",
  "Dolce / Passito": "#B8742A",
  Fortificato: "#5A2414",
};

export const REGIONI = [
  "Abruzzo", "Alto Adige", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
  "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte",
  "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino", "Umbria", "Valle d'Aosta", "Veneto",
  "Francia", "Spagna", "Germania", "Austria", "Portogallo",
];

export const FORMATI = ["0,375 l", "0,5 l", "0,75 l", "1,5 l (Magnum)", "3 l (Jeroboam)", "6 l (Mathusalem)"];

export const DENOMINAZIONI_BASE = ["DOCG", "DOC", "IGT", "Vino da Tavola", "AOC", "DO"];

export const tipoColor = (t) => TIPOLOGIA_COLORS[t] || "#C5A059";

export const merge = (...lists) =>
  [...new Set(lists.flat().filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
