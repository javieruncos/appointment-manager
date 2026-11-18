"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Plus,
  Trophy,
} from "lucide-react";
import type { TournamentMatchPhase } from "@/types/domain";
import type { CourtView, MatchView, TournamentView } from "@/types/view";
import { formatCurrency } from "@/lib/utils/currency";
import { getMatchStatusLabel } from "@/lib/utils/schedule-ui";
import {
  TOURNAMENT_PHASE_ORDER,
  formatMatchSchedule,
  formatTournamentDateRange,
  getMatchStatusTone,
  getTournamentFormatLabel,
  getTournamentPhaseLabel,
  getTournamentStatusLabel,
  getTournamentStatusTone,
  groupMatchesByPhase,
} from "@/lib/utils/tournament-ui";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { MatchScoreSheet } from "@/components/tournaments/match-score-sheet";
import { TournamentFormSheet } from "@/components/tournaments/tournament-form-sheet";

type TournamentsManagerProps = {
  tournaments: TournamentView[];
  matches: MatchView[];
  courts: CourtView[];
};

type PhaseFilter = TournamentMatchPhase | "ALL";

type SheetState =
  | { mode: "create" }
  | { mode: "score"; match: MatchView }
  | null;

function getMatchScore(match: MatchView): string {
  const hasScore =
    match.homeScore !== null &&
    match.homeScore !== undefined &&
    match.awayScore !== null &&
    match.awayScore !== undefined;

  return hasScore ? `${match.homeScore} – ${match.awayScore}` : "—";
}

function getMatchAccentClass(status: MatchView["status"]): string {
  switch (status) {
    case "PLAYING":
      return "border-l-lime";
    case "SCHEDULED":
      return "border-l-cyan";
    case "FINISHED":
      return "border-l-emerald";
    case "CANCELLED":
      return "border-l-coral";
    default:
      return "border-l-amber";
  }
}

function getCourtName(
  courtId: string | null | undefined,
  courtNames: Map<string, string>,
): string {
  if (!courtId) {
    return "Sin cancha";
  }

  return courtNames.get(courtId) ?? "Cancha no disponible";
}

function SummaryCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-surface-1 px-4 py-3">
      <p className="text-caption font-medium uppercase tracking-widest text-ink-faint">
        {label}
      </p>
      <div className="mt-1 text-sm text-ink">{children}</div>
    </div>
  );
}

function MatchRow({
  match,
  courtName,
  onSelect,
}: {
  match: MatchView;
  courtName: string;
  onSelect: (match: MatchView) => void;
}) {
  return (
    <li className="border-b border-line/60 last:border-b-0">
      <button
        type="button"
        onClick={() => onSelect(match)}
        aria-label={`Cargar resultado de ${match.homeTeamName} contra ${match.awayTeamName}`}
        className={cn(
          "group flex w-full flex-col gap-3 border-l-2 px-4 py-3 text-left transition-colors hover:bg-surface-2 motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between",
          getMatchAccentClass(match.status),
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 break-words text-sm font-semibold tracking-tight text-ink">
              {match.homeTeamName}
            </span>
            <span className="text-caption uppercase tracking-widest text-ink-faint">
              vs
            </span>
            <span className="min-w-0 break-words text-sm font-semibold tracking-tight text-ink">
              {match.awayTeamName}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays
                aria-hidden="true"
                className="size-3.5 shrink-0 text-ink-faint"
              />
              {formatMatchSchedule(match)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin
                aria-hidden="true"
                className="size-3.5 shrink-0 text-ink-faint"
              />
              {courtName}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="font-mono text-lg font-semibold tracking-tight tabular-nums text-ink">
              {getMatchScore(match)}
            </p>
            <Badge tone={getMatchStatusTone(match.status)} className="mt-1">
              {getMatchStatusLabel(match.status)}
            </Badge>
          </div>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-ink-faint transition-colors group-hover:text-cyan motion-reduce:transition-none"
          />
        </div>
      </button>
    </li>
  );
}

export function TournamentsManager({
  tournaments,
  matches,
  courts,
}: TournamentsManagerProps) {
  const router = useRouter();
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    string | null
  >(tournaments[0]?.id ?? null);
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("ALL");
  const [sheetState, setSheetState] = useState<SheetState>(null);

  const openCreate = useCallback(() => {
    setSheetState({ mode: "create" });
  }, []);

  const openScore = useCallback((match: MatchView) => {
    setSheetState({ mode: "score", match });
  }, []);

  const closeSheet = useCallback(() => {
    setSheetState(null);
  }, []);

  const handleSaved = useCallback(() => {
    setSheetState(null);
    router.refresh();
  }, [router]);

  const activeTournament =
    tournaments.find((tournament) => tournament.id === selectedTournamentId) ??
    tournaments[0] ??
    null;

  const courtNames = new Map(courts.map((court) => [court.id, court.name]));
  const tournamentMatches = activeTournament
    ? matches.filter((match) => match.tournamentId === activeTournament.id)
    : [];
  const presentPhases = new Set(
    tournamentMatches.map((match) => match.phase),
  );
  const phaseOptions = TOURNAMENT_PHASE_ORDER.filter((phase) =>
    presentPhases.has(phase),
  );
  const filteredMatches =
    phaseFilter === "ALL"
      ? tournamentMatches
      : tournamentMatches.filter((match) => match.phase === phaseFilter);
  const groups = groupMatchesByPhase(filteredMatches);
  const selectedMatch =
    sheetState?.mode === "score" ? sheetState.match : null;

  const pageHeader = (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-caption font-medium uppercase tracking-widest text-ink-faint">
          Competición
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
          Torneos
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Seguí el fixture, el estado de cada partido y cargá los resultados
          desde un solo lugar.
        </p>
      </div>

      <Button onClick={openCreate}>
        <Plus aria-hidden="true" className="size-4" />
        Nuevo torneo
      </Button>
    </div>
  );

  if (!activeTournament) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
          {pageHeader}

          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-1/40 px-6 py-16 text-center">
            <div className="mb-4 flex size-11 items-center justify-center rounded-sm border border-line bg-surface-2 text-ink-muted">
              <Trophy aria-hidden="true" className="size-5" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-ink">
              Sin torneos creados
            </h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
              Creá el primer torneo para definir su formato, fechas y canchas.
              Después vas a poder cargar los resultados de cada partido.
            </p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus aria-hidden="true" className="size-4" />
              Crear torneo
            </Button>
          </div>

          {sheetState?.mode === "create" ? (
            <TournamentFormSheet
              courts={courts}
              onClose={closeSheet}
              onSaved={handleSaved}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        {pageHeader}

        <div className="mt-6 flex flex-col gap-3 rounded-md border border-line bg-surface-1 p-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="tournament-select"
              className="text-caption font-medium uppercase tracking-widest text-ink-muted"
            >
              Torneo
            </label>
            <Select
              id="tournament-select"
              value={activeTournament.id}
              onChange={(event) => {
                setSelectedTournamentId(event.target.value);
                setPhaseFilter("ALL");
              }}
              className="mt-1.5"
            >
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name} · {tournament.category}
                </option>
              ))}
            </Select>
          </div>

          {phaseOptions.length > 0 ? (
            <div className="w-full sm:w-56">
              <label
                htmlFor="phase-filter"
                className="text-caption font-medium uppercase tracking-widest text-ink-muted"
              >
                Fase
              </label>
              <Select
                id="phase-filter"
                value={phaseFilter}
                onChange={(event) =>
                  setPhaseFilter(event.target.value as PhaseFilter)
                }
                className="mt-1.5"
              >
                <option value="ALL">Todas las fases</option>
                {phaseOptions.map((phase) => (
                  <option key={phase} value={phase}>
                    {getTournamentPhaseLabel(phase)}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </div>

        <div className="mt-4 overflow-hidden rounded-md border border-line bg-surface-1">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-tight text-ink">
                {activeTournament.name}
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                {activeTournament.category} ·{" "}
                {getTournamentFormatLabel(activeTournament.format)}
              </p>
            </div>
            <Badge tone={getTournamentStatusTone(activeTournament.status)}>
              {getTournamentStatusLabel(activeTournament.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            <SummaryCell label="Fechas">
              <span className="font-mono text-xs">
                {formatTournamentDateRange(activeTournament)}
              </span>
            </SummaryCell>
            <SummaryCell label="Equipos">
              <span className="font-mono text-xs">
                Máx. {activeTournament.maxTeams}
              </span>
            </SummaryCell>
            <SummaryCell label="Inscripción">
              <span className="font-mono text-xs">
                {formatCurrency(activeTournament.entryFee)}
              </span>
            </SummaryCell>
            <SummaryCell label="Canchas">
              <span className="font-mono text-xs">
                {activeTournament.courtIds.length}
              </span>
            </SummaryCell>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-caption font-medium uppercase tracking-widest text-ink-faint">
              Fixture
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-ink">
              Partidos
            </h2>
          </div>
          <p className="font-mono text-caption text-ink-faint">
            {phaseFilter === "ALL"
              ? `${tournamentMatches.length} partidos`
              : `${filteredMatches.length} de ${tournamentMatches.length}`}
          </p>
        </div>

        {tournamentMatches.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-md border border-dashed border-line bg-surface-1/40 px-6 py-12 text-center">
            <div className="mb-4 flex size-10 items-center justify-center rounded-sm border border-line bg-surface-2 text-ink-muted">
              <Trophy aria-hidden="true" className="size-4" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-ink">
              Sin partidos cargados
            </h3>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
              Este torneo todavía no tiene partidos. Cuando se programen, van a
              aparecer acá agrupados por fase y ronda.
            </p>
          </div>
        ) : groups.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed border-line bg-surface-1 px-4 py-6 text-center text-xs text-ink-muted">
            No hay partidos en la fase seleccionada.
          </p>
        ) : (
          <div className="mt-3 space-y-5">
            {groups.map((group) => (
              <section
                key={group.key}
                aria-labelledby={`match-group-${group.key}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    id={`match-group-${group.key}`}
                    className="text-sm font-semibold tracking-tight text-ink"
                  >
                    {group.phaseLabel}
                  </h3>
                  <span className="font-mono text-caption text-ink-faint">
                    Ronda {group.round}
                  </span>
                </div>

                <ul className="mt-2 overflow-hidden rounded-md border border-line bg-surface-1">
                  {group.matches.map((match) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      courtName={getCourtName(match.courtId, courtNames)}
                      onSelect={openScore}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {sheetState?.mode === "create" ? (
          <TournamentFormSheet
            courts={courts}
            onClose={closeSheet}
            onSaved={handleSaved}
          />
        ) : null}

        {selectedMatch ? (
          <MatchScoreSheet
            key={selectedMatch.id}
            match={selectedMatch}
            tournamentName={activeTournament.name}
            courtName={getCourtName(selectedMatch.courtId, courtNames)}
            onClose={closeSheet}
            onSaved={handleSaved}
          />
        ) : null}
      </div>
    </div>
  );
}
