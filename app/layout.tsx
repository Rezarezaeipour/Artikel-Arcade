import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Artikel Arcade — Your German space odyssey', description: 'A retro space adventure for mastering der, die, and das.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
