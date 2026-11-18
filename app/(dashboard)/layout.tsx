import { connection } from "next/server";
import { AppShell } from "@/components/layout/app-shell";
import { getShellVenue } from "@/lib/data/dashboard";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  await connection();
  const venue = await getShellVenue();

  return (
    <AppShell
      venueName={venue.name}
      venueAddress={venue.address}
      venuePhone={venue.phone}
    >
      {children}
    </AppShell>
  );
}
