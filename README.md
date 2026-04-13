# Pro Memoria

Webapp statica per gestire promemoria ricorrenti personali. È pensata per GitHub Pages: nessun backend, nessuna autenticazione, nessun database remoto.

## Analisi breve

L'app non è una todo list: ogni promemoria ha una ricorrenza e una sola occorrenza attiva. Se la scadenza passa senza completamento, il promemoria resta visibile come arretrato. Quando viene completato, la chiusura viene salvata nella cronologia e la prossima scadenza viene calcolata saltando al primo appuntamento futuro.

## Stack scelto

- React con TypeScript per componenti tipizzati e logica leggibile.
- Vite per sviluppo veloce e build statica.
- CSS plain in `src/styles.css` per evitare complessità extra.
- `localStorage` per persistenza lato client.

Ho scelto `localStorage` perché i dati sono piccoli, personali e interamente locali. IndexedDB sarebbe utile per grandi volumi, allegati o query complesse, ma qui aggiungerebbe complessità non necessaria.

## Modello dati

Il modello principale è in `src/types.ts`.

- `Reminder`: dati del promemoria, frequenza, priorità, `nextDueDate`, `lastCompletedAt`.
- `CompletionRecord`: cronologia delle occorrenze completate, con `dueDate`, `completedAt` e indicazione `wasOverdue`.
- `status`: non viene salvato, ma derivato confrontando `nextDueDate` con la data corrente.

## Regole di business

- Un promemoria ha una sola occorrenza attiva.
- Se `nextDueDate` è prima di oggi, lo stato è `arretrato`.
- Se `nextDueDate` è oggi, lo stato è `oggi`.
- Se `nextDueDate` è dopo oggi, lo stato è `in arrivo`.
- Completando un promemoria, viene creato un record di cronologia.
- La prossima scadenza viene calcolata aggiungendo la frequenza alla scadenza corrente finché non si arriva a una data futura.
- Non si accumulano decine di occorrenze mancate.

## Struttura progetto

```text
.
├── index.html
├── package.json
├── vite.config.ts
├── src
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── types.ts
│   └── lib
│       ├── date.ts
│       ├── recurrence.ts
│       └── storage.ts
└── README.md
```

## Avvio locale

Serve Node.js 20 o superiore.

```bash
npm install
npm run dev
```

Poi apri l'indirizzo mostrato da Vite, di solito `http://localhost:5173`.

## Build

```bash
npm run build
```

La build statica viene generata in `dist`.

## Deploy su GitHub Pages

La configurazione Vite usa `base: "./"` in `vite.config.ts`, così gli asset funzionano anche quando il sito è pubblicato sotto un path tipo `https://utente.github.io/repository/`.

Opzione semplice:

1. Crea un repository GitHub.
2. Installa le dipendenze con `npm install`.
3. Esegui `npm run build`.
4. Pubblica la cartella `dist` su GitHub Pages.

Opzione con GitHub Actions:

1. Imposta GitHub Pages su `GitHub Actions`.
2. Aggiungi una workflow che installa Node, esegue `npm ci`, `npm run build` e pubblica `dist`.

## Miglioramenti futuri

- Export/import JSON dei dati.
- Backup manuale su file.
- Notifiche browser opzionali.
- Tag multipli per promemoria.
- Tema scuro.
- Test unitari per la logica di ricorrenza.
