# Contribuire / Contributing — JobRadar

## 🇮🇹 Italiano

Grazie per il tuo interesse nel contribuire a **JobRadar**! Il progetto è progettato per essere snello, verificabile e modulare: il **core** (`src/core/`) resta rigorosamente sotto le **1.500 righe** e privo di dipendenze runtime di terze parti.

1. Apri una issue per discutere modifiche funzionali, nuove transizioni di stato, promemoria o esportatori.
2. `npm run typecheck && npm test` devono passare (Node ≥ 22.18, zero dipendenze esterne a runtime).
3. Aggiungi test deterministici per ogni nuovo comando, validazione o esportatore.
4. Mantieni l'header SPDX identificativo (`// SPDX-License-Identifier: Apache-2.0`) in cima a ogni file sorgente.
5. Formula i messaggi di commit secondo [Conventional Commits](https://www.conventionalcommits.org/it/).
6. Firma ogni commit con il Developer Certificate of Origin: `git commit -s`.

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) per i dettagli sull'architettura, la state machine e la pipeline dei promemoria.

---

## 🇬🇧 English

Thank you for contributing to **JobRadar**! The project is engineered to remain lean, verifiable, and hackable: the **core** (`src/core/`) remains strictly under **1,500 lines of code** with zero third-party runtime dependencies.

1. Open an issue first to discuss architectural changes, new status transitions, reminder algorithms, or export sinks.
2. `npm run typecheck && npm test` must pass cleanly (Node ≥ 22.18, zero external runtime dependencies).
3. Include deterministic unit tests for any new validation check, calculation, or CLI command.
4. Keep the SPDX license header (`// SPDX-License-Identifier: Apache-2.0`) at the top of every source file.
5. Format commit messages in accordance with [Conventional Commits](https://www.conventionalcommits.org/).
6. Sign off every commit with the Developer Certificate of Origin: `git commit -s`.

Check [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for data schemas, state machine rules, and reminder heuristics.
