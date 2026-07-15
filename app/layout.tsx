import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import shell from './shell.module.css';

export const metadata: Metadata = { title: 'AccionaFleet' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es">
    <body className={shell.shell}>
      <header className={shell.header}>
        <div className={shell.headerInner}>
          <Link className={shell.brand} href="/">AccionaFleet</Link>
          <nav className={shell.nav} aria-label="Navegación principal">
            <Link href="/flota-viva">Flota Viva</Link>
          </nav>
        </div>
      </header>
      <div className={shell.main}>{children}</div>
    </body>
  </html>;
}
