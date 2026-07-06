export function toDate(s) {
  return new Date(s + "T00:00:00");
}
export function daysInclusive(a, b) {
  return Math.round((toDate(b) - toDate(a)) / 86400000) + 1;
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
// Calcule la date de Pâques pour une année donnée (algorithme de Meeus/Jones/Butcher),
// nécessaire pour situer les jours fériés mobiles (Pâques, Ascension, Pentecôte).
function easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
// Liste des jours fériés légaux français pour une année donnée (dates au format ISO).
export function frenchHolidays(year) {
  const easter = easterDate(year);
  return [
    new Date(year, 0, 1),
    addDays(easter, 1),
    new Date(year, 4, 1),
    new Date(year, 4, 8),
    addDays(easter, 39),
    addDays(easter, 50),
    new Date(year, 6, 14),
    new Date(year, 7, 15),
    new Date(year, 10, 1),
    new Date(year, 10, 11),
    new Date(year, 11, 25),
  ].map(toISO);
}
export function isWeekend(dateStr) {
  const dow = toDate(dateStr).getDay();
  return dow === 0 || dow === 6;
}
// Nombre de jours ouvrés (hors week-ends et jours fériés français) entre deux dates, bornes incluses.
export function workingDaysInclusive(startStr, endStr) {
  const start = toDate(startStr);
  const end = toDate(endStr);
  const years = new Set();
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) years.add(y);
  const holidays = new Set();
  years.forEach((y) => frenchHolidays(y).forEach((d) => holidays.add(d)));

  let count = 0;
  let cur = new Date(start);
  while (cur <= end) {
    const iso = toISO(cur);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6 && !holidays.has(iso)) count++;
    cur = addDays(cur, 1);
  }
  return count;
}

export function overlaps(aS, aE, bS, bE) {
  return toDate(aS) <= toDate(bE) && toDate(bS) <= toDate(aE);
}
export function fmt(s) {
  if (!s) return "";
  return toDate(s).toLocaleDateString("fr-FR");
}
export const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
export const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
