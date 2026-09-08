import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SAW Otopark Ek Kontenjan Formu | TALPA",
  description: "Sabiha Gökçen Havalimanı (SAW) Otopark Aboneliği Ek Kontenjan Başvuru ve Yönetim Portalı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="flex flex-col min-h-screen bg-[#f8f7f4] text-[#132949] antialiased">
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}