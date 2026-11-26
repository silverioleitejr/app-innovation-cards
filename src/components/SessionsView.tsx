import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  RefreshCw,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useVoteValidation } from '../hooks/useCardPinsManagement';
import {
  ROLE_LABELS,
  type IdeaCard,
  type SessionCardRef,
  type VotingSessionRecord,
} from '../types';

interface SessionsViewProps {
  cards: IdeaCard[];
  liveSessions: VotingSessionRecord[];
  onOpenCard: (card: IdeaCard) => void;
}

type DatePreset = 'ALL' | 'TODAY' | 'LAST_7' | 'LAST_30';

function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatSessionDate(sessionDate: string, openedAt: string): string {
  const source = sessionDate || openedAt.slice(0, 10);
  const parts = source.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(openedAt));
  } catch {
    return source;
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return 'Em andamento';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDuration(minutes: number, isOpen: boolean): string {
  if (minutes < 1) {
    return isOpen ? '< 1 min' : '0 min';
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hrs}h (${minutes} min)` : `${hrs}h ${rem}m (${minutes} min)`;
}

function CardIdLinksList({
  items,
  cardById,
  onOpenCard,
  accentColor = '#0b41cd',
  showVotes = false,
}: {
  items: SessionCardRef[];
  cardById: Map<string, IdeaCard>;
  onOpenCard: (card: IdeaCard) => void;
  accentColor?: string;
  showVotes?: boolean;
}) {
  if (items.length === 0) {
    return <span className="text-[11px] text-[#9d948e]">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {items.map((item) => {
        const liveCard = cardById.get(item.id);
        const voteSuffix = showVotes && typeof item.votes === 'number' ? ` (${item.votes})` : '';
        if (liveCard) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCard(liveCard);
              }}
              title={`${item.title}${voteSuffix} — Clique para abrir o card`}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] border border-[#dbd6d1] bg-white hover:border-[#0b41cd] hover:bg-[#d7e0f7]/45 font-mono text-[10px] transition-colors cursor-pointer"
              style={{ color: accentColor }}
            >
              <span>{item.id}</span>
              {voteSuffix && <span className="text-[#706b69]">{voteSuffix}</span>}
              <ExternalLink className="w-2.5 h-2.5 opacity-65" />
            </button>
          );
        }
        return (
          <span
            key={item.id}
            title={`${item.title} (card removido do painel)`}
            className="inline-flex items-center px-1.5 py-0.5 rounded-[3px] border border-[#eae8e5] bg-[#f5f5f2] font-mono text-[10px] text-[#706b69]"
          >
            {item.id}
            {voteSuffix}
          </span>
        );
      })}
    </div>
  );
}

export function SessionsView({ cards, liveSessions, onOpenCard }: SessionsViewProps) {
  const [sessions, setSessions] = useState<VotingSessionRecord[]>(liveSessions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date & status filters
  const [selectedDate, setSelectedDate] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [activePreset, setActivePreset] = useState<DatePreset>('ALL');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSessions({
        date: selectedDate || undefined,
        dateFrom: selectedDate ? undefined : dateFrom || undefined,
        dateTo: selectedDate ? undefined : dateTo || undefined,
        status: statusFilter,
      });
      setSessions(res.sessions);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Erro ao carregar o histórico de sessões.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions, liveSessions]);

  const applyPreset = (preset: DatePreset) => {
    setActivePreset(preset);
    const today = new Date();
    const todayIso = toLocalIsoDate(today);
    if (preset === 'ALL') {
      setSelectedDate('');
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'TODAY') {
      setSelectedDate(todayIso);
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'LAST_7') {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      setSelectedDate('');
      setDateFrom(toLocalIsoDate(start));
      setDateTo(todayIso);
    } else if (preset === 'LAST_30') {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      setSelectedDate('');
      setDateFrom(toLocalIsoDate(start));
      setDateTo(todayIso);
    }
  };

  const hasActiveFilter = Boolean(selectedDate || dateFrom || dateTo || statusFilter !== 'ALL');

  const clearFilters = () => {
    setSelectedDate('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('ALL');
    setActivePreset('ALL');
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const summary = useMemo(() => {
    let totalNew = 0;
    let totalVoted = 0;
    let totalEvaluated = 0;
    let totalBacklog = 0;
    for (const s of sessions) {
      totalNew += s.newIdeas?.length ?? s.newCardIds.length;
      totalVoted += s.votedIdeas?.length ?? s.votedCardIds.length;
      totalEvaluated += s.evaluatedIdeas?.length ?? s.evaluatedCardIds.length;
      totalBacklog += s.backlogIdeas?.length ?? s.backlogCardIds.length;
    }
    return {
      count: sessions.length,
      totalNew,
      totalVoted,
      totalEvaluated,
      totalBacklog,
    };
  }, [sessions]);

  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 bg-white text-[#21201f]">
      <div className="max-w-[1520px] mx-auto space-y-6">
        {/* Editorial Heading + Summary KPIs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#dbd6d1]">
          <div>
            <h1 className="font-editorial text-[30px] leading-[40px] font-extralight text-black tracking-tight">
              Resultado das Sessões de Inovação
            </h1>
            <p className="text-sm text-[#544f4f] mt-1">
              Resumo consolidado das reuniões de inovação realizadas no painel: presença do time,
              duração, novas ideias, votação, avaliação técnica e promoções ao backlog.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 shrink-0">
            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="font-mono text-lg font-semibold text-black tabular-nums">
                  {summary.count}
                </div>
                <div className="text-[11px] text-[#706b69]">sessões</div>
              </div>
              <div className="h-7 w-px bg-[#eae8e5]" />
              <div>
                <div className="font-mono text-lg font-semibold text-[#0b41cd] tabular-nums">
                  {summary.totalNew}
                </div>
                <div className="text-[11px] text-[#706b69]">ideias novas</div>
              </div>
              <div>
                <div className="font-mono text-lg font-semibold text-[#7d0096] tabular-nums">
                  {summary.totalVoted}
                </div>
                <div className="text-[11px] text-[#706b69]">votadas</div>
              </div>
              <div>
                <div className="font-mono text-lg font-semibold text-[#b22b0d] tabular-nums">
                  {summary.totalEvaluated}
                </div>
                <div className="text-[11px] text-[#706b69]">avaliadas</div>
              </div>
              <div>
                <div className="font-mono text-lg font-semibold text-[#00724a] tabular-nums">
                  {summary.totalBacklog}
                </div>
                <div className="text-[11px] text-[#706b69]">no backlog</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadSessions()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#21201f] bg-[#f5f5f2] border border-[#dbd6d1] hover:bg-[#d7e0f7] hover:border-[#aec0ee] hover:text-[#052066] rounded-[6px] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <section
          aria-label="Filtro por data da sessão"
          className="bg-[#fbfbfa] border border-[#dbd6d1] rounded-[6px] px-4 py-3 flex flex-wrap items-end justify-between gap-3"
        >
          <div className="flex flex-wrap items-end gap-3">
            {/* Exact Session Date */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="session-date-exact"
                className="text-[11px] font-medium text-[#544f4f] flex items-center gap-1"
              >
                <Calendar className="w-3 h-3 text-[#0b41cd]" />
                <span>Data da sessão</span>
              </label>
              <input
                id="session-date-exact"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateFrom('');
                  setDateTo('');
                  setActivePreset(e.target.value ? 'ALL' : 'ALL');
                }}
                className="og1-input px-2.5 py-1.5 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
              />
            </div>

            <span className="text-xs text-[#706b69] pb-2 hidden sm:inline">ou período:</span>

            {/* Date From */}
            <div className="flex flex-col gap-1">
              <label htmlFor="session-date-from" className="text-[11px] font-medium text-[#544f4f]">
                De
              </label>
              <input
                id="session-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setSelectedDate('');
                  setActivePreset('ALL');
                }}
                className="og1-input px-2.5 py-1.5 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
              />
            </div>

            {/* Date To */}
            <div className="flex flex-col gap-1">
              <label htmlFor="session-date-to" className="text-[11px] font-medium text-[#544f4f]">
                Até
              </label>
              <input
                id="session-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setSelectedDate('');
                  setActivePreset('ALL');
                }}
                className="og1-input px-2.5 py-1.5 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label htmlFor="session-status-filter" className="text-[11px] font-medium text-[#544f4f]">
                Status
              </label>
              <select
                id="session-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'OPEN' | 'CLOSED')}
                className="og1-input px-2.5 py-1.5 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
              >
                <option value="ALL">Todas</option>
                <option value="OPEN">Aberta</option>
                <option value="CLOSED">Fechada</option>
              </select>
            </div>
          </div>

          {/* Quick Date Presets + Reset */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'Todas as datas' },
                { id: 'TODAY', label: 'Hoje' },
                { id: 'LAST_7', label: '7 dias' },
                { id: 'LAST_30', label: '30 dias' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-2.5 py-1.5 text-xs rounded-[6px] border transition-colors cursor-pointer ${
                  activePreset === preset.id &&
                  !(preset.id === 'ALL' && (selectedDate || dateFrom || dateTo))
                    ? 'bg-[#0b41cd] border-[#0b41cd] hover:bg-[#052066] text-white font-semibold'
                    : 'bg-[#f5f5f2] border-[#dbd6d1] text-[#21201f] hover:bg-[#d7e0f7] hover:border-[#aec0ee] hover:text-[#052066]'
                }`}
              >
                {preset.label}
              </button>
            ))}

            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#b8002c] hover:bg-[#ffd2d4] rounded-[6px] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="p-4 bg-[#ffd2d4] border border-[#ff1f26] rounded-[6px] text-xs text-[#b8002c] font-medium">
            {error}
          </div>
        )}

        {/* Sessions Results Table */}
        <section className="bg-white border border-[#dbd6d1] rounded-[6px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#dbd6d1] bg-[#fbfbfa] text-[11px] font-semibold text-[#544f4f]">
                  <th className="py-3 pl-3 pr-2 w-8" aria-label="Expandir detalhes" />
                  <th className="py-3 px-3 whitespace-nowrap">Data / Sessão</th>
                  <th className="py-3 px-3 min-w-[200px]">Participantes Presentes</th>
                  <th className="py-3 px-3 whitespace-nowrap">Início</th>
                  <th className="py-3 px-3 whitespace-nowrap">Término</th>
                  <th className="py-3 px-3 whitespace-nowrap">Duração</th>
                  <th className="py-3 px-3 min-w-[155px]">Ideias Novas (Qtde / IDs)</th>
                  <th className="py-3 px-3 min-w-[140px]">Ideias Votadas (Qtde / IDs)</th>
                  <th className="py-3 px-3 min-w-[155px]">Ideias Avaliadas (Qtde / IDs)</th>
                  <th className="py-3 px-3 min-w-[155px]">Promovidas Backlog (Qtde / IDs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae8e5] text-xs align-top">
                {loading && sessions.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={10} className="py-4 px-4">
                        <div className="h-5 bg-[#eae8e5] rounded-[3px] animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 px-4 text-center text-[#706b69]">
                      Nenhuma sessão encontrada para o filtro de data selecionado.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => {
                    const isOpen = session.status === 'OPEN';
                    const expanded = expandedIds.has(session.id);
                    const presentList = session.presentParticipants ?? [];
                    const absentList = session.absentParticipants ?? [];
                    const newIdeas = session.newIdeas ?? [];
                    const votedIdeas = session.votedIdeas ?? [];
                    const evaluatedIdeas = session.evaluatedIdeas ?? [];
                    const backlogIdeas = session.backlogIdeas ?? [];

                    return (
                      <React.Fragment key={session.id}>
                        <tr
                          onClick={() => toggleExpand(session.id)}
                          className={`cursor-pointer transition-colors ${
                            expanded ? 'bg-[#d7e0f7]/45' : 'hover:bg-[#fbfbfa]'
                          }`}
                        >
                          {/* Expand Toggle */}
                          <td className="py-3 pl-3 pr-2 text-[#544f4f]">
                            <button
                              type="button"
                              aria-label={
                                expanded
                                  ? `Recolher detalhes da Sessão #${session.sessionNumber}`
                                  : `Expandir detalhes da Sessão #${session.sessionNumber}`
                              }
                              className="p-0.5 rounded-[3px] hover:bg-[#eae8e5] cursor-pointer"
                            >
                              {expanded ? (
                                <ChevronDown className="w-4 h-4 text-[#0b41cd]" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Data / Sessão */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-mono text-xs font-semibold text-black tabular-nums">
                              {formatSessionDate(session.sessionDate, session.openedAt)}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-[#706b69]">
                                Sessão #{session.sessionNumber}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[50px] border ${
                                  isOpen
                                    ? 'border-[#00724a]/35 bg-[#d2f3e3] text-[#00724a]'
                                    : 'border-[#dbd6d1] bg-[#f5f5f2] text-[#544f4f]'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isOpen ? 'bg-[#00b458]' : 'bg-[#9d948e]'
                                  }`}
                                />
                                <span>{isOpen ? 'Aberta' : 'Fechada'}</span>
                              </span>
                            </div>
                          </td>

                          {/* Nome dos Participantes */}
                          <td className="py-3 px-3">
                            {presentList.length === 0 ? (
                              <span className="text-[#706b69]">Nenhum participante registrado</span>
                            ) : (
                              <div className="space-y-1">
                                <div className="text-[#21201f] leading-snug">
                                  {presentList.map((p) => p.name).join(', ')}
                                </div>
                                <div className="flex items-center gap-2.5 text-[10px] text-[#706b69] font-mono tabular-nums">
                                  <span className="inline-flex items-center gap-1 text-[#00724a] font-medium">
                                    <UserCheck className="w-3 h-3" />
                                    {session.presentUserIds.length} presente(s)
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[#706b69]">
                                    <UserX className="w-3 h-3" />
                                    {session.absentUserIds.length} ausente(s)
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Hora de Início */}
                          <td className="py-3 px-3 font-mono text-[11px] text-[#21201f] tabular-nums whitespace-nowrap">
                            {formatTime(session.openedAt)}
                          </td>

                          {/* Hora de Término */}
                          <td className="py-3 px-3 font-mono text-[11px] tabular-nums whitespace-nowrap">
                            {session.closedAt ? (
                              <span className="text-[#21201f]">{formatTime(session.closedAt)}</span>
                            ) : (
                              <span className="text-[#00724a] font-sans font-semibold">
                                Em andamento
                              </span>
                            )}
                          </td>

                          {/* Duração em minutos */}
                          <td className="py-3 px-3 font-mono text-[11px] text-[#706b69] tabular-nums whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#9d948e]" />
                              {formatDuration(session.durationMinutes, isOpen)}
                            </span>
                          </td>

                          {/* Novas Ideias (Qtde + Links por ID) */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <div className="font-mono text-xs font-semibold text-[#0b41cd] tabular-nums">
                                {newIdeas.length}{' '}
                                <span className="font-sans font-normal text-[10px] text-[#706b69]">
                                  {newIdeas.length === 1 ? 'nova ideia' : 'novas ideias'}
                                </span>
                              </div>
                              <CardIdLinksList
                                items={newIdeas}
                                cardById={cardById}
                                onOpenCard={onOpenCard}
                                accentColor="#0b41cd"
                              />
                            </div>
                          </td>

                          {/* Ideias Votadas (Qtde + Links por ID) */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <div className="font-mono text-xs font-semibold text-[#7d0096] tabular-nums">
                                {votedIdeas.length}{' '}
                                <span className="font-sans font-normal text-[10px] text-[#706b69]">
                                  {votedIdeas.length === 1 ? 'votada' : 'votadas'} ·{' '}
                                  {session.totalVotes} Voto +1
                                </span>
                              </div>
                              <CardIdLinksList
                                items={votedIdeas}
                                cardById={cardById}
                                onOpenCard={onOpenCard}
                                accentColor="#7d0096"
                                showVotes
                              />
                            </div>
                          </td>

                          {/* Ideias Avaliadas (Qtde + Links por ID) */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <div className="font-mono text-xs font-semibold text-[#b22b0d] tabular-nums">
                                {evaluatedIdeas.length}{' '}
                                <span className="font-sans font-normal text-[10px] text-[#706b69]">
                                  {evaluatedIdeas.length === 1 ? 'avaliada' : 'avaliadas'}
                                </span>
                              </div>
                              <CardIdLinksList
                                items={evaluatedIdeas}
                                cardById={cardById}
                                onOpenCard={onOpenCard}
                                accentColor="#b22b0d"
                              />
                            </div>
                          </td>

                          {/* Promovidas para Backlog (Qtde + Links por ID) */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <div className="font-mono text-xs font-semibold text-[#00724a] tabular-nums">
                                {backlogIdeas.length}{' '}
                                <span className="font-sans font-normal text-[10px] text-[#706b69]">
                                  {backlogIdeas.length === 1 ? 'promovida' : 'promovidas'}
                                </span>
                              </div>
                              <CardIdLinksList
                                items={backlogIdeas}
                                cardById={cardById}
                                onOpenCard={onOpenCard}
                                accentColor="#00724a"
                              />
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Detail Row — Snapshot captured on Abrir Votação */}
                        {expanded && (
                          <tr className="bg-[#fbfbfa]">
                            <td colSpan={10} className="px-6 py-4 border-t border-[#eae8e5]">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                                {/* Column 1: Session Metadata & Opening Card Counts */}
                                <div className="space-y-2.5">
                                  <div className="text-[11px] font-semibold text-black uppercase tracking-wider">
                                    Registro na Abertura da Sessão
                                  </div>
                                  <div className="bg-white border border-[#dbd6d1] rounded-[6px] p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[#544f4f]">ID da Sessão:</span>
                                      <span className="font-mono text-[11px] text-black">
                                        {session.id}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[#544f4f]">Admin Responsável:</span>
                                      <span className="text-black font-semibold text-right">
                                        {session.openedBy}
                                        {session.openedById && (
                                          <span className="block font-mono text-[10px] text-[#706b69] font-normal">
                                            {session.openedById}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="pt-2 border-t border-[#eae8e5]">
                                      <div className="text-[10px] text-[#706b69] mb-1.5">
                                        Snapshot de cards ao abrir votação:
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-[#fbfbfa] border border-[#eae8e5] rounded-[3px] py-1.5 px-1">
                                          <div className="font-mono text-sm font-semibold text-[#0b41cd] tabular-nums">
                                            {session.initialPitchCount}
                                          </div>
                                          <div className="text-[10px] text-[#706b69]">
                                            01. Ideia
                                          </div>
                                        </div>
                                        <div className="bg-[#fbfbfa] border border-[#eae8e5] rounded-[3px] py-1.5 px-1">
                                          <div className="font-mono text-sm font-semibold text-[#b22b0d] tabular-nums">
                                            {session.initialEvaluationCount}
                                          </div>
                                          <div className="text-[10px] text-[#706b69]">
                                            02. Avaliação
                                          </div>
                                        </div>
                                        <div className="bg-[#fbfbfa] border border-[#eae8e5] rounded-[3px] py-1.5 px-1">
                                          <div className="font-mono text-sm font-semibold text-[#00724a] tabular-nums">
                                            {session.initialBacklogCount}
                                          </div>
                                          <div className="text-[10px] text-[#706b69]">
                                            03. Backlog
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Column 2: Present Participants (with IDs) */}
                                <div className="space-y-2.5">
                                  <div className="text-[11px] font-semibold text-[#00724a] uppercase tracking-wider flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>
                                      Participantes Presentes ({session.presentUserIds.length})
                                    </span>
                                  </div>
                                  <div className="bg-white border border-[#dbd6d1] rounded-[6px] p-3 max-h-[180px] overflow-y-auto space-y-1.5">
                                    {presentList.length === 0 ? (
                                      <span className="text-[#706b69]">Nenhum presente.</span>
                                    ) : (
                                      presentList.map((p) => (
                                        <div
                                          key={p.id}
                                          className="flex items-center justify-between gap-2 text-[11px] py-0.5"
                                        >
                                          <span className="text-[#21201f] font-medium truncate">
                                            {p.name}{' '}
                                            <span className="text-[#706b69] font-normal">
                                              ({ROLE_LABELS[p.role] ?? p.role})
                                            </span>
                                          </span>
                                          <span className="font-mono text-[10px] text-[#706b69] shrink-0">
                                            {p.id}
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Column 3: Absent Participants (with IDs) */}
                                <div className="space-y-2.5">
                                  <div className="text-[11px] font-semibold text-[#544f4f] uppercase tracking-wider flex items-center gap-1.5">
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>
                                      Participantes Ausentes ({session.absentUserIds.length})
                                    </span>
                                  </div>
                                  <div className="bg-white border border-[#dbd6d1] rounded-[6px] p-3 max-h-[180px] overflow-y-auto space-y-1.5">
                                    {absentList.length === 0 ? (
                                      <span className="text-[#00724a] font-medium">
                                        100% dos usuários ativos estiveram presentes.
                                      </span>
                                    ) : (
                                      absentList.map((p) => (
                                        <div
                                          key={p.id}
                                          className="flex items-center justify-between gap-2 text-[11px] py-0.5"
                                        >
                                          <span className="text-[#544f4f] truncate">
                                            {p.name}{' '}
                                            <span className="text-[#706b69]">
                                              ({ROLE_LABELS[p.role] ?? p.role})
                                            </span>
                                          </span>
                                          <span className="font-mono text-[10px] text-[#706b69] shrink-0">
                                            {p.id}
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
