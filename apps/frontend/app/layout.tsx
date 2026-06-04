import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Drift Deck - Futuristic Telegram-Powered Cloud OS',
  description: 'The ultimate zero-knowledge cloud storage and productivity workspace powered by Telegram.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      {/* Defaults to theme-neon-cyberpunk. The client application will dynamically toggle themes on this element */}
      <body className="theme-neon-cyberpunk antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
