import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Angel Rodriguez — Portfolio',
  description: 'Portafolio profesional de Angel Rodriguez.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      suppressHydrationWarning
      className={cn('font-sans', spaceGrotesk.variable, spaceMono.variable)}
      lang="es"
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
