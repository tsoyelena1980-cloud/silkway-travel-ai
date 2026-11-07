import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SilkWay Travel AI — Интеллектуальный планировщик туров по Узбекистану (UZS)',
  description:
    'Генерация маршрутов по Самарканду, Бухаре, Хиве и Ташкенту через Gemini 3.8 / 3.5 Flash-Lite с расчетом в сумах (UZS) и оплатой через Payme, Click и Uzum Pay.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#080b12] text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
