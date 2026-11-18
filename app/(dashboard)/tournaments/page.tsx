import { connection } from "next/server";
import {
  getCourtsForSettings,
  getTournamentMatchesForPage,
  getTournamentsForPage,
} from "@/lib/data/dashboard";
import { TournamentsManager } from "@/components/tournaments/tournaments-manager";

export const instant = false;

export default async function TournamentsPage() {
  await connection();

  const [tournaments, matches, courts] = await Promise.all([
    getTournamentsForPage(),
    getTournamentMatchesForPage(),
    getCourtsForSettings(),
  ]);

  return (
    <TournamentsManager
      tournaments={tournaments}
      matches={matches}
      courts={courts}
    />
  );
}
