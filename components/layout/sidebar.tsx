'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth-context';
import {
  Users,
  Stethoscope,
  Calendar,
  Briefcase,
  Wallet,
  BarChart3,
  Home,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/doctors', label: 'Doctores', icon: Stethoscope },
  { href: '/appointments', label: 'Citas', icon: Calendar },
  { href: '/procedures', label: 'Procedimientos', icon: Briefcase },
  { href: '/treatments', label: 'Catálogo Tratamientos', icon: BarChart3 },
  { href: '/payments', label: 'Pagos', icon: Wallet },
];

function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthContext();

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      {/* Header con logo y nombre de la clínica */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-sidebar-foreground">Clínica Dental</h1>
        <p className="text-xl text-[#6DD69E] mt-1 font-semibold">Entre Ríos</p>
        {user && (
          <p className="text-xs text-sidebar-foreground/60 mt-3 truncate" title={user.email}>
            {user.email}
          </p>
        )}
      </div>

      {/* Navegación principal */}
      <nav className="mt-4 px-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer con botón de logout y copyright */}
      <div className="p-6 border-t border-sidebar-border space-y-4">
        {/* Botón de cerrar sesión */}
        <Button
          variant="outline"
          className="w-full justify-start text-sidebar-primary border-sidebar-primary hover:bg-sidebar-primary hover:text-sidebar-foreground transition-all duration-200 group"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
          Cerrar Sesión
        </Button>

        {/* Copyright 2026 */}
        <div className="text-xs text-sidebar-foreground/40 text-center pt-2">
          <p>© 2026 Clínica Dental Entre Ríos</p>
          <p className="text-[10px] mt-1">Todos los derechos reservados</p>
        </div>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
