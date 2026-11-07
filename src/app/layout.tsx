import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['cyrillic', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SilkWay Travel — AI Luxury Journeys | Узбекистан. Путешествие вне времени',
  description:
    'Эксклюзивная платформа путешествий по Узбекистану с персональным AI-консьержем. Авторские маршруты по Самарканду, Бухаре, Хиве и Ташкенту, расчет в UZS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-[#101C2D] text-white font-sans antialiased selection:bg-[#C7A46A] selection:text-[#101C2D]">
        {children}
      </body>
    </html>
  );
}
