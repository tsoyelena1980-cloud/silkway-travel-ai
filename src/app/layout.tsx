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
      <body className="min-h-screen bg-[#faf7f2] text-slate-900 antialiased selection:bg-[#d4af37] selection:text-[#0b132b]">
        {children}
      </body>
    </html>
  );
}
