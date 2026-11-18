import type {
  TournamentFormat,
  TournamentMatchPhase,
  TournamentMatchStatus,
  TournamentStatus,
} from "@/types/domain";
import type { MatchView, TournamentView } from "@/types/view";
import { formatDateShort, isValidLocalDate } from "@/lib/utils/date";
import { formatTimeRange, normalizeRange } from "@/lib/utils/schedule-ui";

export type TournamentBadgeTone =
  | "neutral"
  | "lime"
  | "emerald"
  | "cyan"
  | "amber"
  | "coral";

export const TOURNAMENT_PHASE_ORDER: readonly TournamentMatchPhase[] = [
  "LEAGUE",
  "GROUP",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
];

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  LEAGUE: "Liga",
  SINGLE_ELIMINATION: "Eliminación directa",
  GROUPS_THEN_KNOCKOUT: "Grupos + eliminación",
};

const STATUS_LABELS: Record<TournamentStatus, string> = {
  DRAFT: "Borrador",
  REGISTRATION_OPEN: "Inscripción abierta",
  REGISTRATION_CLOSED: "Inscripción cerrada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
};

const PHASE_LABELS: Record<TournamentMatchPhase, string> = {
  LEAGUE: "Liga",
  GROUP: "Grupo",
  ROUND_OF_16: "Octavos",
  QUARTER_FINAL: "Cuartos",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};

export type TournamentMatchGroup = {
  key: string;
  phase: TournamentMatchPhase;
  phaseLabel: string;
  groupName?: string;
  round: number;
  matches: MatchView[];
};

function formatDateLabel(value: string): string {
  return isValidLocalDate(value) ? formatDateShort(value) : value;
}

export function formatTournamentDateRange(
  tournament: TournamentView,
): string {
  const start = formatDateLabel(tournament.startDate);
  const end = formatDateLabel(tournament.endDate);

  return start === end ? start : `${start} – ${end}`;
}

export function formatMatchSchedule(match: MatchView): string {
  if (!match.date) {
    return "Sin programar";
  }

  const date = formatDateLabel(match.date);

  if (!match.startTime || !match.endTime) {
    return `${date} · Sin horario`;
  }

  const range = normalizeRange(match.startTime, match.endTime);

  return `${date} · ${formatTimeRange(range.start, range.end)}`;
}

export function getTournamentFormatLabel(format: TournamentFormat): string {
  return FORMAT_LABELS[format];
}

export function getTournamentStatusLabel(status: TournamentStatus): string {
  return STATUS_LABELS[status];
}

export function getTournamentPhaseLabel(
  phase: TournamentMatchPhase,
  groupName?: string,
): string {
  if (phase !== "GROUP") {
    return PHASE_LABELS[phase];
  }

  const name = groupName?.trim();

  if (!name) {
    return PHASE_LABELS.GROUP;
  }

  return name.toLowerCase().startsWith("grupo ") ? name : `Grupo ${name}`;
}

export function getTournamentStatusTone(
  status: TournamentStatus,
): TournamentBadgeTone {
  switch (status) {
    case "REGISTRATION_OPEN":
      return "lime";
    case "REGISTRATION_CLOSED":
      return "cyan";
    case "IN_PROGRESS":
      return "lime";
    case "COMPLETED":
      return "emerald";
    case "CANCELLED":
      return "coral";
    default:
      return "neutral";
  }
}

export function getMatchStatusTone(
  status: TournamentMatchStatus,
): TournamentBadgeTone {
  switch (status) {
    case "SCHEDULED":
      return "cyan";
    case "PLAYING":
      return "lime";
    case "FINISHED":
      return "emerald";
    case "PENDING_SCHEDULE":
    case "POSTPONED":
      return "amber";
    case "CANCELLED":
      return "coral";
    default:
      return "neutral";
  }
}

function compareMatches(first: MatchView, second: MatchView): number {
  const dateDelta = (first.date ?? "9999-12-31").localeCompare(
    second.date ?? "9999-12-31",
  );

  if (dateDelta !== 0) {
    return dateDelta;
  }

  const timeDelta = (first.startTime ?? "99:99").localeCompare(
    second.startTime ?? "99:99",
  );

  if (timeDelta !== 0) {
    return timeDelta;
  }

  return first.matchNumber - second.matchNumber;
}

export function groupMatchesByPhase(
  matches: MatchView[],
): TournamentMatchGroup[] {
  const groups = new Map<string, TournamentMatchGroup>();

  for (const match of matches) {
    const groupName = match.groupName?.trim() || undefined;
    const key = `${match.phase}-${groupName ?? ""}-${match.round}`;
    const existing = groups.get(key);

    if (existing) {
      existing.matches.push(match);
      continue;
    }

    groups.set(key, {
      key,
      phase: match.phase,
      phaseLabel: getTournamentPhaseLabel(match.phase, groupName),
      groupName,
      round: match.round,
      matches: [match],
    });
  }

  return Array.from(groups.values())
    .sort((first, second) => {
      const phaseDelta =
        TOURNAMENT_PHASE_ORDER.indexOf(first.phase) -
        TOURNAMENT_PHASE_ORDER.indexOf(second.phase);

      if (phaseDelta !== 0) {
        return phaseDelta;
      }

      const groupDelta = (first.groupName ?? "").localeCompare(
        second.groupName ?? "",
        "es",
      );

      if (groupDelta !== 0) {
        return groupDelta;
      }

      return first.round - second.round;
    })
    .map((group) => ({
      ...group,
      matches: [...group.matches].sort(compareMatches),
    }));
}
