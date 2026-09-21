"use strict";

const BASE_URL =
  "https://aplicacions.gestioeducativa.gencat.cat/ords/pls/soloas/pk_for_mod_ins.p_for_detall_activitat";

const STORAGE_KEY = "config";
const DETECCIO_KEY = "activitat_detectada";
const CTA = "INSCRIPCIÓ";

const elCodi = document.getElementById("codigo");
const elTitol = document.getElementById("titol");
const elCurs = document.getElementById("curs");
const elDetectNote = document.getElementById("detect-note");
const elErrorCodi = document.getElementById("codigo-error");
const elErrorGlobal = document.getElementById("error-global");
const elResultat = document.getElementById("result");
const elResum = document.getElementById("result-summary");
const elUrl = document.getElementById("result-url");
const elPreview = document.getElementById("preview");
const elEmailBtn = document.getElementById("email-button");
const elEmailCodi = document.getElementById("email-code");
const elEmailTitol = document.getElementById("email-titol");
const btnGenera = document.getElementById("generate");
const btnObre = document.getElementById("open");
const btnCopiaBtn = document.getElementById("copy-btn");
const btnCopiaLink = document.getElementById("copy-link");

function cursActual() {
  const ara = new Date();
  const any = ara.getFullYear();
  const mes = ara.getMonth() + 1;
  const inici = mes >= 9 ? any : any - 1;
  return inici;
}

function formatCurs(inici) {
  const fi = inici + 1;
  return `${inici}-${fi}`;
}

function opcionsCurs() {
  elCurs.innerHTML = "";
  const actual = cursActual();
  const opcions = [
    { valor: actual - 1, etiqueta: "Curs anterior" },
    { valor: actual, etiqueta: "Curs actual" },
    { valor: actual + 1, etiqueta: "Curs següent" },
  ];
  for (const opcio of opcions) {
    const opt = document.createElement("option");
    opt.value = formatCurs(opcio.valor);
    opt.textContent = `${formatCurs(opcio.valor)} (${opcio.etiqueta})`;
    if (opcio.valor === actual) {
      opt.selected = true;
    }
    elCurs.appendChild(opt);
  }
}

function netejaCodi(valor) {
  return valor.replace(/\s+/g, "").toUpperCase();
}

function codiEsValid(codi) {
  return /^[A-Z0-9]{4,30}$/.test(codi);
}

function construirUrl(codi, curs) {
  return (
    `${BASE_URL}?p_codi=${encodeURIComponent(codi)}` +
    `&p_curs=${encodeURIComponent(curs)}` +
    "&p_es_inscr=S"
  );
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function netejaTitol(valor) {
  return valor.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function construirSnippetHtml({ url, codi, titol }) {
  const href = escapeHtml(url);
  const celdes = [];
  if (codi) {
    celdes.push(
      '    <td align="center" style="font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#5b6b7b; padding-right:8px;">' +
        escapeHtml(codi) +
        "</td>"
    );
  }
  if (titol) {
    celdes.push(
      '    <td align="center" style="font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:bold; color:#1f2d3d; padding-right:12px;">' +
        escapeHtml(titol) +
        "</td>"
    );
  }
  celdes.push(
    '    <td align="center" bgcolor="#00b44e" style="background-color:#00b44e; border-radius:8px;">',
    '      <a href="' +
      href +
      '" target="_blank" style="display:inline-block; padding:6px 14px; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:6px; white-space:nowrap;">' +
      CTA +
      "</a>",
    "    </td>"
  );
  const llinies = [
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">',
    "  <tr>",
    ...celdes,
    "  </tr>",
    "</table>",
  ];
  return llinies.join("\n");
}

function desaConfig(codi, curs, titol) {
  chrome.storage.local.set({ [STORAGE_KEY]: { codi, curs, titol } });
}

async function carregaConfig() {
  const dades = await chrome.storage.local.get(STORAGE_KEY);
  const config = dades[STORAGE_KEY];
  if (!config) {
    return;
  }
  if (config.codi) {
    elCodi.value = config.codi;
  }
  if (config.titol) {
    elTitol.value = config.titol;
  }
  if (config.curs) {
    const opcio = Array.from(elCurs.options).find(
      (opt) => opt.value === config.curs
    );
    if (opcio) {
      elCurs.value = config.curs;
    }
  }
}

function extrauDadesPagina() {
  function textNete(t) {
    return t.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  const params = new URL(location.href).searchParams;
  const codiIn = document.querySelector('input[name="p_codi"]');
  const cursIn = document.querySelector('input[name="p_curs"]');
  const codi = textNete((codiIn && codiIn.value) || params.get("p_codi") || "");
  const curs = textNete((cursIn && cursIn.value) || params.get("p_curs") || "");
  let titol = "";
  if (codi) {
    for (const td of document.querySelectorAll("td")) {
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
  }
  return { codi, curs, titol };
}

async function carregaDadesEnDirecte() {
  if (
    !chrome.tabs ||
    !chrome.tabs.query ||
    !chrome.scripting ||
    !chrome.scripting.executeScript
  ) {
    return null;
  }
  try {
    const pestanyes = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const pestanya = pestanyes && pestanyes[0];
    if (!pestanya || pestanya.id === undefined || pestanya.id === null) {
      return null;
    }
    const url = pestanya.url || "";
    if (url && !url.includes("gestioeducativa.gencat.cat")) {
      return null;
    }
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: pestanya.id },
      func: extrauDadesPagina,
    });
    const dades = res && res.result;
    if (!dades || !dades.codi) {
      return null;
    }
    chrome.storage.local.set({ [DETECCIO_KEY]: dades });
    return dades;
  } catch {
    return null;
  }
}

function mostraDeteccio(codi, titol) {
  if (codi) {
    setNota(`✓ ${codi}${titol ? " · " + titol : ""}`, "ok");
  } else {
    amagaNota();
  }
}

function setNota(text, estat) {
  if (!elDetectNote) {
    return;
  }
  elDetectNote.textContent = text;
  elDetectNote.classList.remove("nota-ok", "nota-warn", "nota-busy");
  if (estat) {
    elDetectNote.classList.add("nota-" + estat);
  }
  elDetectNote.hidden = false;
}

function amagaNota() {
  if (elDetectNote) {
    elDetectNote.hidden = true;
  }
}

function decodificaHtml(buf) {
  const utf8 = new TextDecoder("utf-8").decode(buf);
  const latin1 = new TextDecoder("iso-8859-1").decode(buf);
  return utf8.includes("\uFFFD") ? latin1 : utf8;
}

async function cercaTitol(codi, curs) {
  const resp = await fetch(construirUrl(codi, curs), {
    credentials: "include",
  });
  if (!resp.ok) {
    throw new Error("HTTP " + resp.status);
  }
  const buf = await resp.arrayBuffer();
  const html = decodificaHtml(buf);
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const td of doc.querySelectorAll("td")) {
    const b = td.querySelector("b");
    if (!b) {
      continue;
    }
    const fila = td.parentElement;
    if (!fila) {
      continue;
    }
    const previa = fila.children[0];
    if (previa && netejaTitol(previa.textContent) === codi) {
      return netejaTitol(td.textContent);
    }
  }
  return "";
}

async function carregaDeteccio() {
  let detectada = await carregaDadesEnDirecte();
  if (!detectada || !detectada.codi) {
    const dades = await chrome.storage.local.get(DETECCIO_KEY);
    detectada = dades[DETECCIO_KEY];
  }
  if (!detectada || !detectada.codi) {
    return;
  }
  if (detectada.codi !== netejaCodi(elCodi.value)) {
    elCodi.value = detectada.codi;
  }
  if (!elTitol.value && detectada.titol) {
    elTitol.value = detectada.titol;
  }
  if (detectada.curs) {
    const opcio = Array.from(elCurs.options).find(
      (opt) => opt.value === detectada.curs
    );
    if (opcio) {
      elCurs.value = detectada.curs;
    }
  }
  mostraDeteccio(detectada.codi, detectada.titol);
}

function mostraError(missatge) {
  elErrorGlobal.textContent = missatge;
  elErrorGlobal.hidden = false;
}

function amagaError() {
  elErrorGlobal.hidden = true;
}

async function generaResultat() {
  let codi = netejaCodi(elCodi.value);
  const curs = elCurs.value;

  elCodi.classList.remove("is-invalid");
  elErrorCodi.textContent = "";

  if (!codi) {
    elCodi.classList.add("is-invalid");
    elErrorCodi.textContent = "Introdueix el codi de l'activitat.";
    elCodi.focus();
    return;
  }
  if (!codiEsValid(codi)) {
    elCodi.classList.add("is-invalid");
    elErrorCodi.textContent =
      "El codi no té un format vàlid (només lletres i números).";
    elCodi.focus();
    return;
  }

  let titol = netejaTitol(elTitol.value);
  if (!titol) {
    try {
      const t = await cercaTitol(codi, curs);
      if (t) {
        titol = t;
        elTitol.value = titol;
        setNota(`${codi} · ${titol}`, "ok");
      }
    } catch {
      // continua amb els camins alternatius
    }
  }
  if (!titol) {
    const detectada = await carregaDadesEnDirecte();
    if (detectada && detectada.codi === codi && detectada.titol) {
      titol = netejaTitol(detectada.titol);
      elTitol.value = titol;
    }
  }
  ultimCodiCercat = codi;

  mostraResultat(codi, curs, titol);
}

function mostraResultat(codi, curs, titol) {
  const url = construirUrl(codi, curs);
  desaConfig(codi, curs, titol);
  amagaError();

  elResum.textContent = `${codi} · curs ${curs}`;
  elUrl.href = url;
  elUrl.textContent = url;

  elEmailBtn.href = url;
  elEmailCodi.textContent = codi;
  elEmailTitol.textContent = titol;
  elEmailTitol.hidden = !titol;
  mostraDeteccio(titol ? codi : "", titol);

  const snippet = construirSnippetHtml({ url, codi, titol });
  btnCopiaBtn.dataset.snippet = snippet;
  btnCopiaBtn.dataset.url = url;
  btnCopiaBtn.dataset.codi = codi;
  btnCopiaBtn.dataset.titol = titol;
  elPreview.hidden = false;
  btnObre.dataset.url = url;
  elResultat.hidden = false;
}

btnGenera.addEventListener("click", () => {
  generaResultat();
});

btnObre.addEventListener("click", () => {
  const url = btnObre.dataset.url;
  if (!url) {
    return;
  }
  chrome.tabs.create({ url });
  window.close();
});

async function copiaPortapapers(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    feedbackCopiat(btn);
  } catch {
    mostraError("No s'ha pogut copiar.");
  }
}

function feedbackCopiat(btn) {
  const etiqueta = btn.querySelector(".btn-label");
  const original = etiqueta.textContent;
  etiqueta.textContent = "Copiat!";
  setTimeout(() => {
    etiqueta.textContent = original;
  }, 1500);
}

function copiaAmbHtml(html, textPla, btn) {
  const ambFragment =
    "<!--StartFragment-->" + html + "<!--EndFragment-->";

  const ferServirClipboardItem = () => {
    const clipboardItem = new ClipboardItem({
      "text/html": new Blob([ambFragment], { type: "text/html" }),
      "text/plain": new Blob([textPla], { type: "text/plain" }),
    });
    return navigator.clipboard.write([clipboardItem]);
  };

  let promesa;
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
    try {
      promesa = ferServirClipboardItem();
    } catch {
      promesa = null;
    }
  }

  if (!promesa) {
    promesa = new Promise((resolve, reject) => {
      const div = document.createElement("div");
      div.setAttribute("contenteditable", "true");
      div.style.position = "fixed";
      div.style.left = "-9999px";
      div.innerHTML = ambFragment;
      document.body.appendChild(div);

      const seleccio = window.getSelection();
      const rang = document.createRange();
      rang.selectNodeContents(div);
      seleccio.removeAllRanges();
      seleccio.addRange(rang);

      const fet = document.execCommand("copy");
      seleccio.removeAllRanges();
      div.remove();
      if (fet) {
        resolve();
      } else {
        reject(new Error("execCommand"));
      }
    });
  }

  promesa
    .then(() => feedbackCopiat(btn))
    .catch(() => mostraError("No s'ha pogut copiar el botó."));
}

btnCopiaBtn.addEventListener("click", () => {
  const snippet = btnCopiaBtn.dataset.snippet;
  const url = btnCopiaBtn.dataset.url;
  const codi = btnCopiaBtn.dataset.codi || "";
  const titol = btnCopiaBtn.dataset.titol || "";
  if (!snippet || !url) {
    return;
  }
  const textPla =
    [codi, titol, CTA].filter(Boolean).join(" · ") + "\n" + url;
  copiaAmbHtml(snippet, textPla, btnCopiaBtn);
});

btnCopiaLink.addEventListener("click", () => {
  const url = btnObre.dataset.url;
  if (!url) {
    return;
  }
  copiaPortapapers(url, btnCopiaLink);
});

elCodi.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    ev.preventDefault();
    generaResultat();
  }
});

let cercaTimer = null;
let ultimCodiCercat = "";

async function cercaTitolAutomatica(codi) {
  setNota(`${codi} — cercant títol…`, "busy");
  try {
    const titol = await cercaTitol(codi, elCurs.value);
    ultimCodiCercat = codi;
    if (titol) {
      elTitol.value = titol;
      setNota(`${codi} · ${titol}`, "ok");
    } else {
      setNota(`${codi} — no s'ha trobat cap títol`, "warn");
    }
  } catch {
    setNota(`${codi} — no s'ha pogut cercar (revisa la connexió)`, "warn");
  }
}

elCodi.addEventListener("input", () => {
  clearTimeout(cercaTimer);
  elCodi.classList.remove("is-invalid");
  elErrorCodi.textContent = "";
  const codi = netejaCodi(elCodi.value);
  if (codiEsValid(codi) && codi !== ultimCodiCercat) {
    cercaTimer = setTimeout(() => cercaTitolAutomatica(codi), 900);
  }
});

elTitol.addEventListener("input", () => {
  amagaNota();
});

opcionsCurs();
carregaConfig();
carregaDeteccio();