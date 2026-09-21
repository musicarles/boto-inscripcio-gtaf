"use strict";

const CLAU = "activitat_detectada";

function textNete(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectar() {
  const params = new URL(location.href).searchParams;
  const codiInput = document.querySelector('input[name="p_codi"]');
  const cursInput = document.querySelector('input[name="p_curs"]');

  const codi = textNete(
    (codiInput && codiInput.value) || params.get("p_codi") || ""
  );
  const curs = textNete(
    (cursInput && cursInput.value) || params.get("p_curs") || ""
  );

  if (!codi) {
    return;
  }

  let titol = "";
  const tds = document.querySelectorAll("td");
  for (const td of tds) {
    const b = td.querySelector("b");
    if (!b) {
      continue;
    }
    const fila = td.parentElement;
    if (!fila) {
      continue;
    }
    const previa = fila.children[0];
    if (previa && textNete(previa.textContent) === codi) {
      titol = textNete(td.textContent);
      break;
    }
  }

  chrome.storage.local.set({ [CLAU]: { codi, curs, titol } });
}

detectar();