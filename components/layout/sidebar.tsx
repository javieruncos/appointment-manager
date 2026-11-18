"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Goal,
  LayoutGrid,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Plus,
  Settings2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useBookingSheet } from "@/components/layout/booking-sheet-context";
import { cn } from "@/lib/utils/cn";

type SidebarProps = {
  venueName: string;
  venueAddress?: string;
  venuePhone?: string;
  collapsed?: boolean;
  variant?: "desktop" | "mobile";
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
};

const NAV_ITEMS = [
  {
    href: "/",
    label: "Grilla de Turnos",
    icon: LayoutGrid,
  },
  {
    href: "/courts",
    label: "Canchas y Tarifas",
    icon: Settings2,
  },
];

export function Sidebar({
  venueName,
  venueAddress,
  venuePhone,
  collapsed = false,
  variant = "desktop",
  onToggleCollapse,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const { requestOpen } = useBookingSheet();
  const isMobile = variant === "mobile";
  const isCollapsed = collapsed && !isMobile;

  const handleNewBooking = () => {
    requestOpen();
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-line bg-rail",
        isMobile
          ? "w-64"
          : cn(
              "sticky top-0 hidden shrink-0 transition-[width] duration-200 motion-reduce:transition-none lg:flex",
              isCollapsed ? "w-16" : "w-60",
            ),
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-lime/25 bg-lime/10 text-lime">
          <Goal aria-hidden="true" className="size-5" />
        </div>

        {!isCollapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-ink">
              {venueName}
            </p>
            <p className="text-caption uppercase tracking-widest text-ink-faint">
              Panel operativo
            </p>
          </div>
        ) : null}

        {isMobile ? (
          <IconButton
            aria-label="Cerrar navegación"
            onClick={onNavigate}
            className="ml-auto"
          >
            <X aria-hidden="true" className="size-4" />
          </IconButton>
        ) : null}
      </div>

      <div className={cn("px-3 py-4", isCollapsed && "px-2")}>
        <Button
          size={isCollapsed ? "icon" : "lg"}
          className="w-full"
          onClick={handleNewBooking}
          aria-label="Nueva reserva"
        >
          <Plus aria-hidden="true" className="size-4" />
          {!isCollapsed ? "Nueva Reserva" : null}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Principal">
        {!isCollapsed ? (
          <p className="px-2 pb-2 text-caption font-medium uppercase tracking-widest text-ink-faint">
            Operación
          </p>
        ) : null}

        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-sm border-l-2 text-sm font-medium transition-colors motion-reduce:transition-none",
                    isCollapsed ? "justify-center px-0" : "px-3",
                    isActive
                      ? "border-lime bg-surface-2 text-ink"
                      : "border-transparent text-ink-muted hover:bg-surface-1 hover:text-ink",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-lime" : "text-ink-faint",
                    )}
                  />
                  {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-line">
        {!isCollapsed ? (
          <div className="space-y-2 px-4 py-4 text-xs text-ink-muted">
            {venueAddress ? (
              <p className="flex items-start gap-2">
                <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <span className="min-w-0 break-words">{venueAddress}</span>
              </p>
            ) : null}
            {venuePhone ? (
              <p className="flex items-center gap-2">
                <Phone aria-hidden="true" className="size-3.5 shrink-0" />
                <span>{venuePhone}</span>
              </p>
            ) : null}
            {!venueAddress && !venuePhone ? (
              <p className="text-ink-faint">Sin datos de contacto configurados.</p>
            ) : null}
          </div>
        ) : null}

        {!isMobile && onToggleCollapse ? (
          <div className={cn("border-t border-line p-2", !isCollapsed && "px-3 py-2")}>
            <IconButton
              aria-label={isCollapsed ? "Expandir navegación" : "Colapsar navegación"}
              onClick={onToggleCollapse}
              className="w-full"
            >
              {isCollapsed ? (
                <PanelLeftOpen aria-hidden="true" className="size-4" />
              ) : (
                <PanelLeftClose aria-hidden="true" className="size-4" />
              )}
            </IconButton>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
