import { getDashboardData } from "@/lib/data/dashboard";
import { getTodayInVenueTimeZone, isValidLocalDate } from "@/lib/utils/date";
import { ScheduleBoard } from "@/components/schedule/schedule-board";

export const instant = false;

export default async function DashboardPage({
  searchParams,
}: PageProps<"/">) {
  const params = await searchParams;
  const today = getTodayInVenueTimeZone();
  const requestedDate = Array.isArray(params.date)
    ? params.date[0]
    : params.date;
  const date = isValidLocalDate(requestedDate) ? requestedDate : today;
  const data = await getDashboardData(date);

  return <ScheduleBoard {...data} date={date} today={today} />;
}
