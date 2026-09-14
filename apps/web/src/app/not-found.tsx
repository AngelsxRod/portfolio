import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center p-6 sm:p-12 lg:p-16">
      <section className="w-full max-w-3xl text-center">
        <Badge className="tracking-widest uppercase" variant="outline">
          404
        </Badge>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">Page not found</h1>
        <Button className="mt-8" render={<Link href="/es" />}>
          Volver al inicio
        </Button>
      </section>
    </main>
  );
}
