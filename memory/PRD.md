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

## Backlog
- P1: TTL cleanup login_attempts; recupero password via email
- P2: logo/nome ristorante personalizzabile nella carta stampata; split server.py in routers

## Next tasks
- Feedback utente sul primo rilascio
