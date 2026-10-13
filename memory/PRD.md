# Carta dei Vini — PRD

## Original problem statement
Crea un'app chiamata Carta dei Vini, in italiano, per catalogare e consultare i vini di un ristorante. Non deve gestire giacenze, carichi o scarichi. Ogni scheda vino deve contenere nome, produttore o cantina, regione, denominazione, tipologia, vitigno, annata, formato, prezzo di acquisto, prezzo in carta, foto dell'etichetta e note descrittive. Mostra i vini in una galleria fotografica e in un elenco, con ricerca per nome e produttore e filtri per regione, tipologia, denominazione e annata. Permetti di inserire, modificare ed eliminare i vini. Prevedi le sezioni Tutti i vini, Produttori, Regioni e tipologie e Preferiti. Usa un database persistente, esportazione Excel/CSV e backup. Design elegante bordeaux, avorio e oro, ottimizzato per smartphone e computer. Crea un'app funzionante, non una semplice demo.

User choices: login email/password per il personale (nessuna registrazione libera); foto su object storage; backup JSON con foto + ripristino da file; preferiti condivisi; pagina "Carta" stampabile senza prezzi di acquisto.

## Architecture
- Backend FastAPI (`/app/backend/server.py`, `core.py`), MongoDB (collections: users, wines, files, login_attempts)
- Auth JWT in httpOnly cookies (access 15 min + refresh 7 gg), bcrypt, brute-force lockout, admin seeded from .env
- Foto: Emergent Object Storage (compressione JPEG 1600px via Pillow), servite da `/api/files/{path}` con auth
- Export CSV (;, BOM) e XLSX (openpyxl); backup JSON con foto base64; restore admin-only
- Frontend React + react-query + shadcn; fonts Cormorant Garamond / Plus Jakarta Sans / Cinzel

## User personas
- Amministratore/titolare: gestisce carta, utenti, backup
- Personale di sala/sommelier: consulta, inserisce, modifica vini

## Core requirements (static)
Schede vino complete, galleria + elenco, ricerca, 4 filtri, CRUD, sezioni Tutti i vini / Produttori / Regioni e tipologie / Preferiti, export Excel/CSV, backup, responsive.

## Implemented (2026-10-13)
- Login, gestione utenti (admin), cambio password
- CRUD vini con foto etichetta, preferiti condivisi, ordinamento
- Produttori (raggruppati A–Z), Regioni e tipologie (con link ai filtri)
- Carta per i clienti stampabile (no prezzi acquisto, solo preferiti/note opzionali)
- Export CSV/XLSX, backup/restore JSON
- Testing: backend 25/25, frontend flows OK (iteration_2)

## Implemented (2026-10-13, iterazione 2)
- Import da Excel/CSV (`/app/backend/importer.py`): riconoscimento automatico intestazioni (sinonimi italiani), anteprima con nuovi/già presenti/errori, modalità salta o aggiorna duplicati (nome+produttore+annata[+formato]), modello .xlsx scaricabile, round-trip con l'export
- Pulsante "Importa da Excel" nello stato vuoto di Tutti i vini; voce menu rinominata "Importa, esporta e backup"
- Testing: 16/16 test import + flussi UI OK (iteration_3)

## Implemented (2026-10-13, iterazione 3)
- Etichetta "Tipologia" rinominata "Affinamento" solo nel modulo vino (su richiesta)
- Nuovi campi testo `gradazione` e `temperatura_servizio`: modulo, dettaglio, export Excel/CSV, import (sinonimi; numeri convertiti in "13,5% vol" / "12 °C"), backup

## Implemented (2026-10-13, iterazione 4)
- Campo `tipologia` mostrato come "Affinamento" in filtro, dettaglio, export (intestazione), import (sinonimi affinamento/invecchiamento); rimossi suggerimenti Rosso/Bianco dal campo
- Carta per i clienti: gradazione e "servire a …" sotto ogni vino
- Invariati: nome sezione "Regioni e tipologie", pannello "Per tipologia"; la carta raggruppa ancora per il valore di questo campo

## Implemented (2026-10-13, iterazione 5)
- Campo Affinamento (`tipologia`): limite portato a 500 caratteri, textarea a tutta larghezza con contatore; badge su card/dettaglio troncati con tooltip

## Implemented (2026-10-13, iterazione 6)
- Tipologia e Affinamento di nuovo separati: nuovo campo `affinamento` (max 500, textarea con contatore), `tipologia` torna tipo di vino con suggerimenti (Rosso, Bianco…)
- Migrazione all'avvio: valori non standard di `tipologia` spostati in `affinamento`
- Export/import con colonne Tipologia e Affinamento separate; carta di nuovo divisa per tipologia
- Testing: 11/11 test backend + flussi UI OK (iteration_4)

## Implemented (2026-10-13, iterazione 7)
- Carta digitale pubblica `/carta-digitale` (senza login, sola lettura): ricerca, filtri per tipologia/consigliati, scheda vino con foto; mai prezzo di acquisto
- API pubbliche `/api/public/carta`, `/api/public/foto/{id}`; impostazione `carta_pubblica_attiva` (GET auth, PUT admin)
- Campo `visibile` per vino (switch nel modulo, badge "Nascosto ai clienti", colonna export/import)
- Pannello QR code nella pagina Carta per i clienti (scarica PNG, copia link, apri, attiva/disattiva)
- Testing: 15/15 backend + flussi UI OK (iteration_5)

## Implemented (2026-10-13, iterazione 8 — code quality)
- Refactor: restore() → _parse_backup/_backup_wine/_restore_photo; analyze_import → _read_import/_validate_row/_classify_row; importer.parse_file → _parse_sheet/_parse_row
- Frontend: WineFormDialog → useWineForm hook + WineFormFields/WineFormSuggestions; WineBrowser → BrowserToolbar/WineResults/useUrlFilters/useViewMode; PublicCartaPage → pure filter/group functions
- Tests read admin credentials from backend/.env, random staff passwords, lowercase staff emails
- Testing: 67/67 backend + UI regression OK (iteration_6)

## Backlog
- P1: TTL cleanup login_attempts; recupero password via email
- P2: logo/nome ristorante personalizzabile nella carta stampata; split server.py in routers

## Next tasks
- Feedback utente sul primo rilascio
