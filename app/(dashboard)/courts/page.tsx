import { connection } from "next/server";
import { getCourtsForSettings } from "@/lib/data/dashboard";
import { CourtsManager } from "@/components/courts/courts-manager";

export const instant = false;

export default async function CourtsPage() {
  await connection();
  const courts = await getCourtsForSettings();

  return <CourtsManager courts={courts} />;
}
