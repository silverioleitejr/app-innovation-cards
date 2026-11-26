import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, ShieldCheck, Vote } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import {
  AUDIT_ACTION_LABELS,
  ROLE_LABELS,
  type AuditAction,
  type AuditLogEntry,
  type Role,
  type User,
  type VotingSessionRecord,
} from '../types';

interface AuditTrailViewProps {
  users: User[];
  votingSessions: VotingSessionRecord[];
}

const ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'Todas as ações' },
  ...(Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map((k) => ({
    value: k,
    label: AUDIT_ACTION_LABELS[k],
  })),
];

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export function AuditTrailView({ users, votingSessions }: AuditTrailViewProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionFilter, setActionFilter] = useState('ALL');
  const [actorFilter, setActorFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAuditLogs({
        action: actionFilter,
        actorId: actorFilter,
        entityType: entityFilter,
        search,
      });
      setLogs(res.logs);
      setTotalCount(res.totalCount);
      setSelectedId((prev) =>
        prev && res.logs.some((l) => l.id === prev) ? prev : res.logs[0]?.id ?? null
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar trilha de auditoria.');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, actorFilter, entityFilter, search]);

  useEffect(() => {
    const timer = window.setTimeout(loadLogs, 120);
    return () => window.clearTimeout(timer);
  }, [loadLogs]);

  const selectedLog = logs.find((l) => l.id === selectedId) ?? null;

  const diffKeys = selectedLog
    ? Array.from(
        new Set([
          ...Object.keys(selectedLog.beforeState ?? {}),
          ...Object.keys(selectedLog.afterState ?? {}),
        ])
      )
    : [];

  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 bg-white text-[#21201f]">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Editorial Heading + Immutability Notice */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#dbd6d1]">
          <div>
            <h1 className="font-editorial text-[30px] leading-[40px] font-extralight text-black tracking-tight">
              Trilha de Auditoria Imutável
            </h1>
            <p className="text-sm text-[#544f4f] mt-1">
              Registro append-only encadeado com hash criptográfico de todos os acessos, cargas e
              transições do funil (RN-06.1 · RN-06.2).
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="font-mono text-lg font-semibold text-black tabular-nums">
                {totalCount}
              </div>
              <div className="text-[11px] text-[#706b69]">eventos registrados</div>
            </div>
            <button
              type="button"
              onClick={loadLogs}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#21201f] bg-[#f5f5f2] border border-[#dbd6d1] hover:bg-[#d7e0f7] hover:border-[#aec0ee] hover:text-[#052066] rounded-[6px] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Voting Sessions Log Section (Regra d) */}
        <section
          aria-label="Registro de Sessões de Votação"
          className="bg-white border border-[#dbd6d1] rounded-[6px] overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-[#dbd6d1] bg-agile-header flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-[#0b41cd] shrink-0" />
              <div>
                <h2 className="font-editorial text-[18px] font-semibold text-black">
                  Registro de Sessões de Votação
                </h2>
                <p className="text-[11px] text-[#544f4f]">
                  Histórico persistido de cada rodada de votação (Voto +1), apuração Top 5 e
                  movimentação de eleitos.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#706b69] tabular-nums">
                {votingSessions.length}{' '}
                {votingSessions.length === 1 ? 'sessão registrada' : 'sessões registradas'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setEntityFilter((prev) => (prev === 'VOTING' ? 'ALL' : 'VOTING'))
                }
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-[6px] border transition-colors cursor-pointer ${
                  entityFilter === 'VOTING'
                    ? 'bg-[#0b41cd] border-[#0b41cd] hover:bg-[#052066] text-white'
                    : 'bg-[#f5f5f2] border-[#dbd6d1] text-[#21201f] hover:bg-[#d7e0f7] hover:border-[#aec0ee] hover:text-[#052066]'
                }`}
              >
                {entityFilter === 'VOTING'
                  ? 'Mostrando logs de Votação'
                  : 'Filtrar logs de Votação'}
              </button>
            </div>
          </div>

          {votingSessions.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-[#706b69]">
              Nenhuma sessão de votação registrada até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[240px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#eae8e5] bg-[#fbfbfa] text-[11px] font-semibold text-[#544f4f]">
                    <th className="py-2 px-4 whitespace-nowrap">Sessão</th>
                    <th className="py-2 px-3 whitespace-nowrap">Status</th>
                    <th className="py-2 px-3 whitespace-nowrap">Abertura</th>
                    <th className="py-2 px-3 whitespace-nowrap">Fechamento</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">Votos (+1)</th>
                    <th className="py-2 px-3">Top 5 / Eleitos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eae8e5] text-xs">
                  {votingSessions.map((session) => {
                    const isOpen = session.status === 'OPEN';
                    return (
                      <tr key={session.id} className="hover:bg-[#fbfbfa]">
                        <td className="py-2.5 px-4 font-mono font-semibold text-black whitespace-nowrap">
                          Sessão #{session.sessionNumber}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-[50px] border ${
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
                        </td>
                        <td className="py-2.5 px-3 text-[#544f4f] whitespace-nowrap">
                          <span className="text-black font-medium">{session.openedBy}</span>
                          <span className="text-[#9d948e] mx-1">·</span>
                          <span className="font-mono text-[11px] text-[#706b69] tabular-nums">
                            {formatDateTime(session.openedAt)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#544f4f] whitespace-nowrap">
                          {session.closedAt ? (
                            <>
                              <span className="text-black font-medium">
                                {session.closedBy ?? 'Administrador'}
                              </span>
                              <span className="text-[#9d948e] mx-1">·</span>
                              <span className="font-mono text-[11px] text-[#706b69] tabular-nums">
                                {formatDateTime(session.closedAt)}
                              </span>
                            </>
                          ) : (
                            <span className="text-[#00724a] font-medium">Em andamento</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-black tabular-nums whitespace-nowrap">
                          {session.totalVotes}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-[#544f4f] max-w-[360px]">
                          {session.topIdeas.length > 0 ? (
                            <div className="truncate" title={session.topIdeas.map((t, i) => `#${i + 1} ${t.title} (${t.score})`).join(', ')}>
                              {session.topIdeas
                                .slice(0, 5)
                                .map((t, i) => `#${i + 1} ${t.title} (${t.score})`)
                                .join(' · ')}
                            </div>
                          ) : (
                            <span className="text-[#706b69]">Sem apuração registrada</span>
                          )}
                          {session.movedCardTitles.length > 0 && (
                            <div
                              className="text-[10px] text-[#0b41cd] truncate mt-0.5"
                              title={`Movidos p/ Avaliação: ${session.movedCardTitles.join(', ')}`}
                            >
                              Movidos p/ Avaliação: {session.movedCardTitles.join(', ')}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-[#9d948e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cartão, usuário, e-mail ou valor..."
              className="og1-input w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="og1-input w-full px-3 py-2 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="og1-input w-full px-3 py-2 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
            >
              <option value="ALL">Todos os participantes</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({ROLE_LABELS[u.role]})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="og1-input w-full px-3 py-2 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
            >
              <option value="ALL">Todas entidades</option>
              <option value="CARD">Cartões</option>
              <option value="VOTING">Votação</option>
              <option value="USER">Usuários</option>
              <option value="AUTH">Autenticação</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[#ffd2d4] border border-[#ff1f26] rounded-[6px] text-xs text-[#b8002c] font-medium">
            {error}
          </div>
        )}

        {/* Split Table + Visual Before/After Diff Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* High-density Audit Log Table */}
          <div className="lg:col-span-7 bg-white border border-[#dbd6d1] rounded-[6px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#dbd6d1] bg-[#fbfbfa] text-[11px] font-semibold text-[#544f4f]">
                    <th className="py-2.5 px-4 whitespace-nowrap">Data / Hora</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Ação</th>
                    <th className="py-2.5 px-3">Objeto / Alvo</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Ator</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eae8e5] text-xs">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="py-3 px-4">
                          <div className="h-4 bg-[#eae8e5] rounded-[3px] animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-4 text-center text-[#706b69]">
                        Nenhum evento de auditoria corresponde aos filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    logs.map((entry) => {
                      const active = entry.id === selectedId;
                      return (
                        <tr
                          key={entry.id}
                          onClick={() => setSelectedId(entry.id)}
                          className={`cursor-pointer transition-colors ${
                            active ? 'bg-[#d7e0f7]/55' : 'hover:bg-[#fbfbfa]'
                          }`}
                        >
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#706b69] tabular-nums whitespace-nowrap">
                            {formatDateTime(entry.timestamp)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#0b41cd] whitespace-nowrap">
                            {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                          </td>
                          <td className="py-2.5 px-3 text-black max-w-[220px] truncate">
                            {entry.entityLabel}
                          </td>
                          <td className="py-2.5 px-3 text-[#544f4f] whitespace-nowrap">
                            {entry.actorName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#706b69] text-right tabular-nums whitespace-nowrap">
                            {entry.integrityHash.slice(0, 8)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Side-by-Side Before/After State Inspector */}
          <aside className="lg:col-span-5 bg-white border border-[#dbd6d1] rounded-[6px] overflow-hidden sticky top-20">
            <div className="px-5 py-3.5 border-b border-[#dbd6d1] bg-agile-header flex items-center justify-between">
              <h2 className="font-editorial text-[18px] font-semibold text-black">
                Inspeção de Estado (Antes × Depois)
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00724a]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Somente leitura</span>
              </span>
            </div>

            {!selectedLog ? (
              <div className="p-8 text-center text-xs text-[#706b69]">
                Selecione um evento na tabela ao lado para inspecionar os dados anteriores e
                posteriores.
              </div>
            ) : (
              <div className="p-5 space-y-5">
                {/* Event Summary */}
                <div className="space-y-1.5 text-xs pb-4 border-b border-[#eae8e5]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#0b41cd]">
                      {AUDIT_ACTION_LABELS[selectedLog.action]}
                    </span>
                    <span className="font-mono text-[11px] text-[#706b69] tabular-nums">
                      #{selectedLog.id} · {selectedLog.integrityHash}
                    </span>
                  </div>
                  <div className="font-editorial text-[18px] font-normal text-black">
                    {selectedLog.entityLabel}
                  </div>
                  <div className="text-[#544f4f]">
                    Executado por <span className="text-black font-semibold">{selectedLog.actorName}</span>{' '}
                    ({ROLE_LABELS[selectedLog.actorRole as Role] ?? selectedLog.actorRole}) em{' '}
                    <span className="font-mono tabular-nums text-[#706b69]">
                      {formatDateTime(selectedLog.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Diff Rows */}
                {diffKeys.length === 0 ? (
                  <p className="text-xs text-[#706b69]">
                    Evento sem alteração estrutural de atributos.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                    {diffKeys.map((key) => {
                      const beforeVal = selectedLog.beforeState?.[key];
                      const afterVal = selectedLog.afterState?.[key];
                      const changed =
                        JSON.stringify(beforeVal ?? null) !== JSON.stringify(afterVal ?? null);

                      return (
                        <div
                          key={key}
                          className="border border-[#dbd6d1] rounded-[6px] overflow-hidden"
                        >
                          <div className="px-3 py-1.5 bg-[#fbfbfa] border-b border-[#eae8e5] flex items-center justify-between">
                            <span className="font-mono text-[11px] font-semibold text-black">
                              {key}
                            </span>
                            {changed && (
                              <span className="text-[10px] text-[#0b41cd] font-semibold">
                                alterado
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-[#eae8e5] text-[11px]">
                            <div className="p-2.5 bg-[#fff7f5]">
                              <div className="text-[10px] text-[#706b69] mb-1">Estado anterior</div>
                              <pre className="whitespace-pre-wrap break-words font-mono text-[#544f4f] leading-relaxed">
                                {formatDiffValue(beforeVal)}
                              </pre>
                            </div>
                            <div className="p-2.5 bg-[#d2f3e3]/35">
                              <div className="text-[10px] text-[#00724a] mb-1">Estado posterior</div>
                              <pre className="whitespace-pre-wrap break-words font-mono text-[#21201f] leading-relaxed">
                                {formatDiffValue(afterVal)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
