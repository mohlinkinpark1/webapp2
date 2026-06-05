import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

// Importing fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Ghazaouet Loc - Locations de Vacances',
  description: 'Réservez des villas de luxe et studios d’exception à Ghazaouet. Notre plateforme et application Android vous facilitent la gestion et la réservation en temps réel.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased text-slate-800 bg-[#FAF8F5]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
