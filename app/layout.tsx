import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// 1. Load the custom font
const clattering = localFont({
  src: '../public/fonts/Clattering.ttf', // Change to 'Calttering.ttf' if you didn't rename the file
  variable: '--font-clattering',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pantreasy - Smart Stock & Recipe Hub',
  description: 'Track pantry inventory and discover recipes with what you have in stock.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 2. Add the font variable and background color to the body */}
      <body className={`antialiased ${clattering.variable} bg-[#f3f0e8]`}>
        {children}
      </body>
    </html>
  );
}
