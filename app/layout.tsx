import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'WhereToScream',
  description: 'Find where every horror movie is streaming right now',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <header className="py-6 text-center">
          <h1 className="text-4xl font-bold">WhereToScream</h1>
          <p className="text-gray-400 mt-2">Find where every horror movie is streaming</p>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
