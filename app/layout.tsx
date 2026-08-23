import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Montserrat } from 'next/font/google'; // Added this import
import './global.css';

const mogena = localFont({
  src: '../public/fonts/Mogena.ttf',
  variable: '--font-mogena',
  display: 'swap',
});

// Initialized Montserrat
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
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
      {/* Added montserrat.variable here */}
      <body className={`antialiased ${mogena.variable} ${montserrat.variable} bg-[#F7F5DC]`}>
        {children}
      </body>
    </html>
  );
}
