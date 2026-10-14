import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerModal } from "@/components/layout/DisclaimerModal";
import { ThemeBootstrap } from "@/components/ui/ThemeBootstrap";

export const metadata: Metadata = {
  title: "CS2Stats — киберспортивная статистика CS2",
  description:
    "Расписание, результаты, рейтинги команд и статистика игроков Counter-Strike 2. Образовательный проект на базе открытых данных.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {/* Применяет сохранённую тему до первой отрисовки — без flash */}
        <ThemeBootstrap />
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6">{children}</main>
        <Footer />
        {/* Юридический дисклеймер при первом входе */}
        <DisclaimerModal />
      </body>
    </html>
  );
}
