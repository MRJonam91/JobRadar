name: Segnalazione bug / Bug report
description: Segnala un malfunzionamento in JobRadar / Report a malfunction
labels: ["bug"]
body:
  - type: textarea
    id: problem
    attributes:
      label: "Descrizione del problema / Problem description"
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: "Passi per riprodurre / Reproduction steps"
      placeholder: "1. jobradar add ...\n2. jobradar status ..."
    validations:
      required: true
  - type: textarea
    id: environment
    attributes:
      label: "Ambiente / Environment"
      placeholder: "Node.js v24.x, OS: Windows / macOS / Linux"
    validations:
      required: true
