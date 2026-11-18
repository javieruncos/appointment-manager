import type { MatchView } from "@/types/view";
import {
  formatTimeRange,
  getMatchStatusLabel,
  normalizeRange,
} from "@/lib/utils/schedule-ui";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

type MatchBlockProps = {
  match: MatchView;
  heightClass: string;
  isLive: boolean;
  isDimmed: boolean;
};

function getPhaseLabel(match: MatchView): string {
  const labels: Record<MatchView["phase"], string> = {
    LEAGUE: "Liga",
    GROUP: match.groupName ?? "Grupo",
    ROUND_OF_16: "Octavos",
    QUARTER_FINAL: "Cuartos",
    SEMI_FINAL: "Semifinal",
    THIRD_PLACE: "Tercer puesto",
    FINAL: "Final",
  };

  return labels[match.phase];
}

export function MatchBlock({
  match,
  heightClass,
  isLive,
  isDimmed,
}: MatchBlockProps) {
  if (!match.startTime || !match.endTime) {
    return null;
  }

  const range = normalizeRange(match.startTime, match.endTime);
  const hasScore =
    match.homeScore !== null &&
    match.homeScore !== undefined &&
    match.awayScore !== null &&
    match.awayScore !== undefined;

  return (
    <article
      aria-label={`${match.homeTeamName} contra ${match.awayTeamName}, ${formatTimeRange(range.start, range.end)}`}
      className={cn(
        "flex w-full flex-col justify-between gap-1 overflow-hidden border-y border-r border-l-4 border-line px-3 py-1.5",
        isLive
          ? "border-l-lime bg-lime/5 shadow-lime"
          : "border-l-cyan bg-surface-2",
        heightClass,
        isDimmed && "opacity-35",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-tight text-ink">
            {match.homeTeamName} <span className="text-ink-faint">vs</span>{" "}
            {match.awayTeamName}
          </p>
          <p className="truncate text-caption text-ink-muted">
            {getPhaseLabel(match)} · Partido {match.matchNumber}
          </p>
        </div>
        <Badge tone={isLive ? "lime" : "cyan"} className="shrink-0">
          {getMatchStatusLabel(match.status)}
        </Badge>
      </div>

      <div className="flex min-w-0 items-end justify-between gap-2">
        <p className="truncate font-mono text-caption text-ink-muted">
          {formatTimeRange(range.start, range.end)}
        </p>
        <p className="shrink-0 font-mono text-caption font-medium text-ink">
          {hasScore ? `${match.homeScore} - ${match.awayScore}` : "Torneo"}
        </p>
      </div>
    </article>
  );
}
