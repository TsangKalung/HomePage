import "./styles.css";
import { Bodoni_Moda, Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  style: ["normal", "italic"],
});

export const metadata = {
  title: "HBM / NVDA Bubble Gauge",
  description: "Live market-cap ratio for HBM suppliers versus NVIDIA.",
};

interface HbmNvdaRatioLayoutProps {
  children: React.ReactNode;
}

export default function HbmNvdaRatioLayout({ children }: HbmNvdaRatioLayoutProps) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${bodoni.variable}`}>{children}</body>
    </html>
  );
}
