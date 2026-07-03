import "./globals.css";

export const metadata = {
  title: "ABP Menuiseries — Gestion des congés",
  description: "Application interne de gestion des demandes de congés",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
