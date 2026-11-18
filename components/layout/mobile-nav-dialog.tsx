"use client";

import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";

type MobileNavDialogProps = {
  open: boolean;
  onClose: () => void;
  venueName: string;
  venueAddress?: string;
  venuePhone?: string;
};

export function MobileNavDialog({
  open,
  onClose,
  venueName,
  venueAddress,
  venuePhone,
}: MobileNavDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Navegación principal"
      className="fixed inset-y-0 left-0 right-auto m-0 h-dvh w-64 max-w-full overflow-hidden border-r border-line bg-rail p-0 text-ink shadow-sheet animate-fade-in motion-reduce:animate-none"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Sidebar
        variant="mobile"
        venueName={venueName}
        venueAddress={venueAddress}
        venuePhone={venuePhone}
        onNavigate={onClose}
      />
    </dialog>
  );
}
