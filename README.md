# WhatBites 🎣

Hva biter? Pek kameraet mot vannet og agnboksen din — WhatBites viser hvilket agn du bør bruke akkurat nå.
*What bites? Point your camera at the water and your bait box — WhatBites shows which bait to use right now.*

**Åpne appen / Open the app:** https://khalm.github.io/What_Bites/

## Slik virker det / How it works
1. **Sted og vær** — henter posisjon, vær (temperatur, vind, skydekke, lufttrykk og trend, sol opp/ned) og fiskearter registrert innen ca. 30 km.
2. **Vis vannet** — appen sjekker fire ting og ber om nye bilder til alt er på plass:
   - ☁️ **Skydekke** — fra himmelen i oversiktsbildet, kryssjekket mot værvarselet
   - 💡 **Lys** — solhøyde (GPS + klokke), kameraets lysmåler (EXIF) og skydekket
   - 🌊 **Vanntype** — nærmeste vann på kartet (OpenStreetMap: innsjø, elv eller sjø + navn), kryssjekket mot bildet
   - 💧 **Sikt** — fra et nærbilde rett ned i vannet (unngår speilinger); mye regn siste døgn tas med
   Mangler noe, forteller appen hvordan du tar et bedre bilde. Du kan alltid rette selv.
3. **Vis agnboksen** — ta bilde av boksen; appen markerer det beste agnet i bildet og rangerer resten.
   Appen har eget kamera med 🔦-knapp for jevnt lys (ikke blits). I mørket slås lyset på automatisk.
   Mangler boksen noe som passer klart bedre, vises et lite tips «Til neste gang» med søk hos [Skittfiske](https://www.skittfiske.no), brukt på Finn.no og fiskebutikker i nærheten.

Norsk er standard, trykk **EN/NO** øverst for å bytte språk.

## Installer på telefonen / Install on your phone
- **iPhone (Safari):** Åpne lenken → Del-knappen → **Legg til på Hjem-skjerm**.
- **Android (Chrome):** Åpne lenken → ⋮-menyen → **Installer app** / **Legg til på startskjermen**.

## Helt gratis / Completely free
Ingen konto, ingen nøkkel, ingen kostnad. All bildeanalyse skjer **på telefonen**:
- Agnet i boksen finnes med en åpen AI-modell ([OWL-ViT](https://huggingface.co/Xenova/owlvit-base-patch32) via [Transformers.js](https://github.com/huggingface/transformers.js)).
  Første gang lastes modellen ned (ca. 155 MB, bruk gjerne Wi-Fi) — deretter ligger den lagret på telefonen.
- Lys og vannfarge leses fra bildet av fiskeplassen. Du kan trykke for å rette.
- Valget gjøres av en innebygd regelmotor (`engine.js`) som veier fiskeart, sikt, lys, temperatur, vind og lufttrykk.
- Feil agntype? Endre den i lista under bildet, så regnes valget ut på nytt.

*No account, no key, no cost. All photo analysis runs on the phone; the model (~155 MB) downloads once.*

## Fargevalg / Colour choice
Appen leser fargen på hvert agn (sølv, gull, kobber, hvit, rød, oransje, gul, chartreuse, grønn, blå, rosa, lilla, svart, naturfarge, selvlysende) og bruker vanlige fargeregler:
- **Klart vann + sol:** naturlige farger og sølv
- **Brunt/farget vann + gråvær:** gull, kobber, chartreuse, oransje
- **Gråvær:** også mørke farger (svart, lilla) — «mørk dag, mørkt agn» gir skarp silhuett mot himmelen. Sølv trenger sol for å blinke.
- Farge betyr mindre enn størrelse, form og gange — og fisken er mindre sky i gråvær, så fargen teller litt mindre da.
- **Grumsete vann:** sterke farger og kontrast — chartreuse, oransje, hvit, svart
- **Skumring:** chartreuse, gull, mørke silhuetter
- **Natt:** svart/lilla silhuett eller selvlysende
- **Dypt/kaldt:** rødt og oransje forsvinner først; chartreuse, grønn og blå synes lengre ned
- Noen arter har kjente favorittfarger (f.eks. rød/oransje for abbor).

Reglene står i `COLOR_FIT` og `FAV_COLORS` i `engine.js`. Kilder: [Academy Sports – lure colour chart](https://www.academy.com/expert-advice/lure-color-chart), [Minnesota DNR – Lure colors](https://dnr.state.mn.us/minnaqua/et/lure-colors.html).

## Uten nett / Offline
Appen virker også der det ikke er dekning:
- Selve appen og AI-modellen ligger lagret på telefonen (last ned modellen på Wi-Fi).
- **Med dekning** hentes alltid ferskt vær, fiskearter og kartdata — og det lagres automatisk.
- **Uten dekning** brukes lagret værvarsel (timen som gjelder nå, inntil 4 dager fram), fiskearter og vanntype fra nærmeste lagrede sted. GPS, solhøyde, bildeanalyse og agnvalg virker alltid.
- **Planlegg tur:** søk opp vannet hjemme, så lagres alt du trenger før du drar.
- Når dekningen kommer tilbake, oppdateres alt av seg selv.

## Datakilder / Data sources
- Vær: [Open-Meteo](https://open-meteo.com) (gratis, ingen nøkkel)
- Fiskearter: [GBIF](https://www.gbif.org) observasjonsdata
- Stedsnavn: [OpenStreetMap Nominatim](https://nominatim.org)
- Nærmeste vann: [OpenStreetMap Overpass API](https://overpass-api.de)

## Teknisk
Ren HTML/CSS/JavaScript uten byggesteg, hostet på GitHub Pages. Kan redigeres direkte i GitHub på mobilen.
- `index.html` — sider og layout
- `app.js` — skjermlogikk og oversettelser (`T`-objektet øverst)
- `engine.js` — regelmotoren: arter, agntyper og forhold
- `vision.js` — bildeanalyse på telefonen (agn, AI-hint, EXIF)
- `scene.js` — leser fiskeplassen og kryssjekker bilder, vær og kart
- `style.css` — utseende
- `sw.js`, `manifest.json` — installerbar app (PWA)
