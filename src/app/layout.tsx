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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-silk-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
