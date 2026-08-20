import type { Metadata } from 'next';
import './globals.css';

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
