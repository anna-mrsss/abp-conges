export function toDate(s) {
  return new Date(s + "T00:00:00");
}
export function daysInclusive(a, b) {
  return Math.round((toDate(b) - toDate(a)) / 86400000) + 1;
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
