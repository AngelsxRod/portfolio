import { Logo } from '@/components/logo';
import { logout } from '../../login/actions';

const navItems = [
  { label: 'Proyectos', active: true },
  { label: 'Educación', active: false },
  { label: 'Experiencia', active: false },
  { label: 'Mensajes', active: false },
];

export function AdminSidebar() {
  return (
    <aside className="w-full shrink-0 border-b border-border md:w-[260px] md:border-r md:border-b-0">
      {/* Desktop: vertical sidebar (unchanged) */}
      <div className="hidden md:flex md:h-full md:flex-col md:justify-between md:py-7">
        <div className="flex flex-col gap-10">
          <div className="px-7">
            <Logo suffix="admin" />
          </div>
          <nav className="flex flex-col">
            {navItems.map((item) =>
              item.active ? (
                <span
                  className="border-l-[3px] border-primary bg-muted px-7 py-3 text-sm font-semibold"
                  key={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <span className="px-[31px] py-3 text-sm text-muted-foreground" key={item.label}>
                  {item.label}
                </span>
              ),
            )}
          </nav>
        </div>
        <div className="flex flex-col gap-1 px-7">
          <div className="text-[13px] font-semibold">Angel Rodriguez</div>
          <form action={logout}>
            <button className="font-mono text-xs text-muted-foreground" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      {/* Mobile: compact top bar + horizontally scrollable nav */}
      <div className="flex flex-col md:hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <Logo suffix="admin" />
          <form action={logout}>
            <button className="font-mono text-xs text-muted-foreground" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-6 py-2">
          {navItems.map((item) =>
            item.active ? (
              <span
                className="shrink-0 rounded-full bg-primary px-4 py-1.5 font-mono text-xs font-bold text-primary-foreground"
                key={item.label}
              >
                {item.label}
              </span>
            ) : (
              <span
                className="shrink-0 px-4 py-1.5 font-mono text-xs text-muted-foreground"
                key={item.label}
              >
                {item.label}
              </span>
            ),
          )}
        </nav>
      </div>
    </aside>
  );
}
