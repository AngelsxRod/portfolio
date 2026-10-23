/** Marca todo el panel (también el acceso) para aplicar su paleta propia. */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-shell">{children}</div>;
}
