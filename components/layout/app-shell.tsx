"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Goal, Menu, Plus } from "lucide-react";
import {
  BookingSheetProvider,
  useBookingSheet,
} from "@/components/layout/booking-sheet-context";
import { MobileNavDialog } from "@/components/layout/mobile-nav-dialog";
import { Sidebar } from "@/components/layout/sidebar";
import { IconButton } from "@/components/ui/icon-button";

type AppShellProps = {
  venueName: string;
  venueAddress?: string;
  venuePhone?: string;
  children: ReactNode;
};

const SIDEBAR_KEY = "appointment-manager:sidebar-collapsed";
const SIDEBAR_COLLAPSED_EVENT = "appointment-manager:sidebar-collapsed-change";

function subscribeToSidebar(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, callback);
  };
}

function getSidebarSnapshot() {
  return window.localStorage.getItem(SIDEBAR_KEY) === "true";
}

function getSidebarServerSnapshot() {
  return false;
}

export function AppShell(props: AppShellProps) {
  return (
    <BookingSheetProvider>
      <Shell {...props} />
    </BookingSheetProvider>
  );
}

function Shell({
  venueName,
  venueAddress,
  venuePhone,
  children,
}: AppShellProps) {
  const collapsed = useSyncExternalStore(
    subscribeToSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const { requestOpen } = useBookingSheet();

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    document.documentElement.classList.add("overflow-hidden");

    return () => {
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    const next = !getSidebarSnapshot();
    window.localStorage.setItem(SIDEBAR_KEY, String(next));
    window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT));
  };

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        venueName={venueName}
        venueAddress={venueAddress}
        venuePhone={venuePhone}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-header px-4 lg:hidden">
          <IconButton
            aria-label="Abrir navegación"
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden="true" className="size-5" />
          </IconButton>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-sm border border-lime/25 bg-lime/10 text-lime">
              <Goal aria-hidden="true" className="size-4" />
            </div>
            <p className="truncate text-sm font-semibold tracking-tight">
              {venueName}
            </p>
          </div>

          <IconButton
            aria-label="Nueva reserva"
            tone="lime"
            onClick={requestOpen}
          >
            <Plus aria-hidden="true" className="size-5" />
          </IconButton>
        </header>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>

      <MobileNavDialog
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        venueName={venueName}
        venueAddress={venueAddress}
        venuePhone={venuePhone}
      />
    </div>
  );
}
