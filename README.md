# Botó inscripció GTAF

Extensió de Chrome que genera un **botó d'inscripció en HTML** (llest per enganxar en un correu electrònic) per a les activitats de formació de la **GTAF** (Gestió d'activitats de formació).

URL d'origen de les activitats:

```
https://aplicacions.gestioeducativa.gencat.cat/ords/pls/soloas/pk_for_mod_ins.p_for_detall_activitat?p_codi=CODI&p_curs=CURS&p_es_inscr=S
```

## Funcionalitats

- 🔍 **Detecció automàtica**: si tens oberta una pàgina d'activitat, el popup en llegeix el codi, el curs i el títol.
- ⌨️ **Cerca per codi**: escriu el codi d'activitat (format tipus `A130011A13`) i l'extensió cerca el títol automàticament.
- 📆 **Selector de curs**: anterior, actual i següent (calculat automàticament segons la data).
- 📧 **Copia el botó**: copia al portapapers un snippet HTML (codi · títol · botó `INSCRIPCIÓ`) compatible amb Gmail, Outlook i Apple Mail.
- 🔗 **Copia l'enllaç**: copia la URL crua.
- 💾 La configuració es recorda entre sessions (`chrome.storage.local`).

## Instal·lació (modo desenvolupament)

1. Descarrega o clona aquest repositori.
2. Desa la carpeta a un lloc permanent. Un cop instal·lada l'extensió, la carpeta no es pot esborrar.
3. Obre `chrome://extensions` a Chrome.
4. Activa el **mode desenvolupador** (cantonada superior dreta).
5. Cliqueu **"Carrega desempaquetada"** i selecciona la carpeta del projecte.
6. Fixa l'extensió a la barra d'eines i obre el popup.

## Ús ràpid

1. **Amb la pàgina d'activitat oberta**: obre el popup i els camps s'omplen sols (codi, títol, curs).
2. **Sense pàgina oberta**: escriu el codi (p. ex. `A130011A13`), tria el curs i espera que aparegui el títol.
3. Prem **"Genera botó"**.
4. **"Copia el botó"** → enganxa (Ctrl+V) al cos d'un correu electrònic.
5. **"Copia l'enllaç"** → enganxa la URL allà on vulguis.
6. El botó **"Inscripció"** obre la pàgina d'inscripció en una pestanya nova.

## Estructura

```
├── manifest.json          # Manifest V3
├── content/
│   └── content.js         # Content script (detecció a la pàgina d'activitat)
├── popup/
│   ├── popup.html         # Marc del popup
│   ├── popup.css          # Disseny
│   └── popup.js           # Lògica
└── icons/                 # Icones (16/32/48/128)
```

## Notes

- El botó del correu és un snippet HTML amb estils **inline** (els clients de correu ignoren `<style>` i classes).
- El color del botó és un verd sòlid (`#00b44e`), no un gradient, per compatibilitat amb Gmail/Outlook.
- Has d'escriure els correus en mode de redacció normal (no "text pla") perquè el botó es renderitzi.

## Llicència

MIT. Consulta el fitxer [LICENSE](LICENSE).
