"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BookingSheetContextValue = {
  requestId: number;
  requestOpen: () => void;
};

const BookingSheetContext = createContext<BookingSheetContextValue | null>(null);

export function BookingSheetProvider({ children }: { children: ReactNode }) {
  const [requestId, setRequestId] = useState(0);

  const requestOpen = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  const value = useMemo(
    () => ({ requestId, requestOpen }),
    [requestId, requestOpen],
  );

  return (
    <BookingSheetContext.Provider value={value}>
      {children}
    </BookingSheetContext.Provider>
  );
}

export function useBookingSheet(): BookingSheetContextValue {
  const context = useContext(BookingSheetContext);

  if (!context) {
    throw new Error("useBookingSheet debe usarse dentro de BookingSheetProvider");
  }

  return context;
}
