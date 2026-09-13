import Link from 'next/link';

export default function NotFound() {
  return (
    <main>
      <section>
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <Link href="/es">Volver al inicio</Link>
      </section>
    </main>
  );
}
