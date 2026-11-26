import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  KeyRound,
  LogOut,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { AuditTrailView } from './components/AuditTrailView';
import { BoardFunnelView } from './components/BoardFunnelView';
import { CardDrawer } from './components/CardDrawer';
import { MatrixCanvasView } from './components/MatrixCanvasView';
import { PasswordModal } from './components/PasswordModal';
import { SessionsView } from './components/SessionsView';
import { UsersAdminView } from './components/UsersAdminView';
import { useRealtimeBoard } from './hooks/useRealtimeBoard';
import { api, ApiError, getStoredToken, setStoredToken } from './lib/api';
import {
  DISCIPLINE_META,
  EFFORT_SIZES,
  getInitials,
  ROLE_LABELS,
  SPECIALTIES,
  validateBacklogGate,
  type EffortSize,
  type IdeaCard,
  type PinType,
  type Specialty,
  type Stage,
  type User,
  type VotingState,
} from './types';

type ActiveView = 'board' | 'matrix' | 'sessions' | 'audit' | 'users';

interface BannerAlert {
  type: 'error' | 'info' | 'success';
  title: string;
  details?: string[];
  actionCardId?: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const [activeView, setActiveView] = useState<ActiveView>('board');
  const [cards, setCards] = useState<IdeaCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [votingState, setVotingState] = useState<VotingState>({
    votingOpen: true,
    currentSessionId: null,
    currentSessionNumber: null,
    talliedAt: null,
    topIdeas: [],
    sessions: [],
    updatedAt: '',
    updatedBy: null,
  });
  const [votingBusy, setVotingBusy] = useState(false);

  // Filters on Board / Matrix
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<Specialty | 'ALL'>('ALL');
  const [effortFilter, setEffortFilter] = useState<EffortSize | 'ALL'>('ALL');

  // Active Card Drawer
  const [drawerState, setDrawerState] = useState<{
    open: boolean;
    card: IdeaCard | null;
    initialStage?: Stage;
    focusRefinement?: boolean;
  }>({ open: false, card: null });

  // User Menu & Password Modal
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Toast / Quality Gate Alert Banner
  const [banner, setBanner] = useState<BannerAlert | null>(null);

  const loadWorkspaceData = useCallback(async () => {
    try {
      const [cardsRes, usersRes, votingRes] = await Promise.all([
        api.getCards(),
        api.getUsers(),
        api.getVotingState(),
      ]);
      setCards(cardsRes.cards);
      setUsers(usersRes.users);
      setVotingState(votingRes.voting);
    } catch {
      // Handled gracefully
    }
  }, []);

  // Verify stored token on mount
  useEffect(() => {
    if (!token) {
      setBootstrapping(false);
      return;
    }
    api
      .me()
      .then(async ({ user }) => {
        setCurrentUser(user);
        await loadWorkspaceData();
      })
      .catch(() => {
        setStoredToken(null);
        setToken(null);
        setCurrentUser(null);
      })
      .finally(() => setBootstrapping(false));
  }, [token, loadWorkspaceData]);

  // Idempotent real-time WebSocket handlers
  const handleWsCardCreated = useCallback((card: IdeaCard) => {
    setCards((prev) => (prev.some((c) => c.id === card.id) ? prev : [...prev, card]));
  }, []);

  const handleWsCardUpdated = useCallback((card: IdeaCard) => {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      if (!exists) return [...prev, card];
      return prev.map((c) => (c.id === card.id ? card : c));
    });
  }, []);

  const handleWsCardDeleted = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  const handleWsUsersUpdated = useCallback(() => {
    api
      .getUsers()
      .then((res) => setUsers(res.users))
      .catch(() => {});
  }, []);

  const handleWsVotingUpdated = useCallback((voting: VotingState) => {
    setVotingState(voting);
  }, []);

  const handleWsCardsSync = useCallback((syncedCards: IdeaCard[]) => {
    setCards(syncedCards);
  }, []);

  const { connected, presence, remoteCursors, sendCursor } = useRealtimeBoard({
    token: currentUser ? token : null,
    activeView,
    onCardCreated: handleWsCardCreated,
    onCardUpdated: handleWsCardUpdated,
    onCardDeleted: handleWsCardDeleted,
    onCardsSync: handleWsCardsSync,
    onUsersUpdated: handleWsUsersUpdated,
    onVotingUpdated: handleWsVotingUpdated,
    onReconnected: loadWorkspaceData,
  });

  const handleAuthenticated = async (newToken: string, user: User, notice?: string) => {
    setStoredToken(newToken);
    setToken(newToken);
    setCurrentUser(user);
    setActiveView('board');
    if (notice) {
      setBanner({ type: 'success', title: notice });
    }
    await loadWorkspaceData();
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await api.logout();
    } catch {
      // Ignore logout network error
    }
    setStoredToken(null);
    setToken(null);
    setCurrentUser(null);
    setCards([]);
    setUsers([]);
    setBanner(null);
  };

  // Deduplicate presence by userId for clean avatar stack while tracking live sessions
  const uniqueOnlineUsers = useMemo(() => {
    const map = new Map<string, (typeof presence)[number]>();
    for (const p of presence) {
      map.set(p.userId, p);
    }
    return Array.from(map.values());
  }, [presence]);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (disciplineFilter !== 'ALL' && c.discipline !== disciplineFilter) return false;
      if (effortFilter !== 'ALL' && c.effort !== effortFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${c.title} ${c.proposedSolution} ${c.painOpportunity} ${c.authorName} ${c.technicalLead}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cards, disciplineFilter, effortFilter, searchQuery]);

  const userVoteCard = useMemo(() => {
    if (!currentUser) return null;
    const found = cards.find((c) =>
      (c.pins ?? []).some((p) => p.userId === currentUser.id && p.pinType === 'vote_plus')
    );
    return found ? { cardId: found.id, title: found.title } : null;
  }, [cards, currentUser]);

  const backlogCount = cards.filter((c) => c.stage === 'BACKLOG').length;
  const readyForBacklogCount = cards.filter(
    (c) => c.stage !== 'BACKLOG' && validateBacklogGate(c).valid
  ).length;

  const handleSaveCard = async (
    payload: Partial<IdeaCard>,
    existingId?: string,
    options?: { silent?: boolean }
  ) => {
    if (existingId) {
      const { card } = await api.updateCard(existingId, payload);
      handleWsCardUpdated(card);
      if (!options?.silent) {
        setBanner({ type: 'success', title: `Cartão "${card.title}" atualizado.` });
      }
    } else {
      const { card } = await api.createCard(payload);
      handleWsCardCreated(card);
      if (!options?.silent) {
        setBanner({ type: 'success', title: `Iniciativa "${card.title}" criada no painel.` });
      }
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    await api.deleteCard(cardId);
    handleWsCardDeleted(cardId);
    setBanner({ type: 'info', title: 'Cartão removido e registrado na trilha de auditoria.' });
  };

  const handleMoveCard = async (
    cardId: string,
    target: { stage: Stage; posX?: number; posY?: number }
  ) => {
    const previous = cards.find((c) => c.id === cardId);
    if (!previous) return;

    // Optimistic update for zero-latency responsiveness
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              stage: target.stage,
              posX: target.posX ?? c.posX,
              posY: target.posY ?? c.posY,
            }
          : c
      )
    );

    try {
      const { card } = await api.moveCard(cardId, target);
      handleWsCardUpdated(card);
      if (target.stage === 'BACKLOG' && previous.stage !== 'BACKLOG') {
        setBanner({
          type: 'success',
          title: `"${card.title}" validado pela trava de qualidade e promovido ao Backlog.`,
        });
      }
    } catch (err) {
      // RN-05.2: Rollback card immediately to previous position/stage on server rejection
      setCards((prev) => prev.map((c) => (c.id === cardId ? previous : c)));
      if (err instanceof ApiError) {
        setBanner({
          type: 'error',
          title: err.message,
          details: err.missingFields,
          actionCardId: err.code === 'QUALITY_GATE_BLOCKED' ? cardId : undefined,
        });
      } else {
        setBanner({ type: 'error', title: 'Falha ao mover cartão.' });
      }
    }
  };

  const handleTogglePin = async (cardId: string, pinType: PinType) => {
    if (!currentUser || currentUser.role === 'VIEWER') return;

    const previous = cards.find((c) => c.id === cardId);
    if (!previous) return;

    const existingPins = previous.pins ?? [];
    const existingUserPin = existingPins.find((p) => p.userId === currentUser.id);

    // Regra (a): Voto +1 somente pode ser aplicado, substituído ou removido com VOTAÇÃO ABERTA
    const involvesVotePlus =
      pinType === 'vote_plus' || existingUserPin?.pinType === 'vote_plus';
    if (involvesVotePlus && !votingState.votingOpen) {
      setBanner({
        type: 'error',
        title:
          'O pin "Voto +1" somente pode ser aplicado ou alterado quando o painel estiver com status "VOTAÇÃO ABERTA".',
      });
      return;
    }

    // Regra (b): Apenas 1 Voto +1 por usuário em todo o board por sessão aberta
    if (pinType === 'vote_plus' && userVoteCard && userVoteCard.cardId !== cardId) {
      const sessionSuffix = votingState.currentSessionNumber
        ? ` (Sessão #${votingState.currentSessionNumber})`
        : '';
      setBanner({
        type: 'error',
        title: `Você já usou seu "Voto +1" nesta votação${sessionSuffix} no card "${userVoteCard.title}". Remova ou substitua o pin naquele card para votar em outro.`,
      });
      return;
    }

    // Regra (c): Permitir remover (mesmo pin) ou trocar/substituir o pin no card
    const isRemovingSame = existingUserPin?.pinType === pinType;
    const optimisticPins = isRemovingSame
      ? existingPins.filter((p) => p.userId !== currentUser.id)
      : existingUserPin
      ? existingPins.map((p) =>
          p.userId === currentUser.id
            ? {
                ...p,
                pinType,
                votingSessionId:
                  pinType === 'vote_plus' ? votingState.currentSessionId : null,
                createdAt: new Date().toISOString(),
              }
            : p
        )
      : [
          ...existingPins,
          {
            cardId,
            userId: currentUser.id,
            userName: currentUser.name,
            pinType,
            votingSessionId:
              pinType === 'vote_plus' ? votingState.currentSessionId : null,
            createdAt: new Date().toISOString(),
          },
        ];

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, pins: optimisticPins } : c))
    );

    try {
      const res = await api.toggleCardPin(cardId, pinType);
      handleWsCardUpdated(res.card);
      if (res.voting) {
        setVotingState(res.voting);
      }
    } catch (err) {
      setCards((prev) => prev.map((c) => (c.id === cardId ? previous : c)));
      setBanner({
        type: 'error',
        title: err instanceof ApiError ? err.message : 'Falha ao atualizar pin do cartão.',
      });
    }
  };

  const handleOpenVoting = async () => {
    setVotingBusy(true);
    try {
      const res = await api.openVoting();
      setVotingState(res.voting);
      if (Array.isArray(res.cards)) {
        setCards(res.cards);
      }
      setBanner({ type: 'success', title: res.message });
    } catch (err) {
      setBanner({
        type: 'error',
        title: err instanceof ApiError ? err.message : 'Falha ao abrir votação.',
      });
    } finally {
      setVotingBusy(false);
    }
  };

  const handleCloseVoting = async () => {
    setVotingBusy(true);
    try {
      const res = await api.closeVoting();
      setVotingState(res.voting);
      setBanner({ type: 'info', title: res.message });
    } catch (err) {
      setBanner({
        type: 'error',
        title: err instanceof ApiError ? err.message : 'Falha ao fechar votação.',
      });
    } finally {
      setVotingBusy(false);
    }
  };

  const handleTallyVotes = async () => {
    setVotingBusy(true);
    try {
      const res = await api.tallyVotes();
      setVotingState(res.voting);
      setBanner({ type: 'success', title: res.message });
    } catch (err) {
      setBanner({
        type: 'error',
        title: err instanceof ApiError ? err.message : 'Falha ao apurar votos.',
      });
    } finally {
      setVotingBusy(false);
    }
  };

  const handleMoveElectedToEvaluation = async () => {
    setVotingBusy(true);
    try {
      const res = await api.moveElectedToEvaluation();
      setVotingState(res.voting);
      if (res.movedCards.length > 0) {
        const movedMap = new Map(res.movedCards.map((c) => [c.id, c]));
        setCards((prev) => prev.map((c) => movedMap.get(c.id) ?? c));
      }
      setBanner({
        type: res.movedCards.length > 0 ? 'success' : 'info',
        title: res.message,
      });
    } catch (err) {
      setBanner({
        type: 'error',
        title:
          err instanceof ApiError
            ? err.message
            : 'Falha ao mover ideias eleitas para Avaliação.',
      });
    } finally {
      setVotingBusy(false);
    }
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-[#544f4f]">Carregando espaço colaborativo...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const canViewAudit = currentUser.role === 'ADMIN' || currentUser.role === 'FACILITATOR';
  const canViewUsers = currentUser.role === 'ADMIN';
  const isViewer = currentUser.role === 'VIEWER';

  const navItems: Array<{ id: ActiveView; label: string; visible: boolean }> = [
    { id: 'board', label: 'Painel', visible: true },
    { id: 'matrix', label: 'Matriz', visible: true },
    { id: 'sessions', label: 'Sessões', visible: true },
    { id: 'audit', label: 'Auditoria', visible: canViewAudit },
    { id: 'users', label: 'Usuários', visible: canViewUsers },
  ];

  return (
    <div className="min-h-screen h-screen flex flex-col bg-white text-[#21201f] overflow-hidden">
      {/* TIER 1: GLOBAL HEADER (56px, pure white, 1px hairline border) */}
      <header className="h-14 bg-white border-b border-[#dbd6d1] px-6 lg:px-8 flex items-center justify-between gap-6 shrink-0 z-30">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => setActiveView('board')}
          className="font-editorial text-[20px] font-semibold tracking-tight text-black whitespace-nowrap shrink-0 cursor-pointer"
        >
          Innovation Board
        </button>

        {/* Zone 2: Clean Typography Nav Links */}
        <nav className="flex items-center gap-6 overflow-x-auto" aria-label="Navegação principal">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`relative h-14 px-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active ? 'text-[#0b41cd] font-semibold' : 'text-[#544f4f] hover:text-black'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#0b41cd]" />
                  )}
                </button>
              );
            })}
        </nav>

        {/* Zone 3: Live Presence + Account + Primary CTA */}
        <div className="flex items-center gap-3.5 shrink-0">
          {/* Real WebSocket Presence Avatars */}
          <div
            className="hidden sm:flex items-center gap-2 pr-3 border-r border-[#dbd6d1]"
            title={`${uniqueOnlineUsers.length} participante(s) conectado(s) em tempo real`}
          >
            <div className="flex -space-x-1.5">
              {uniqueOnlineUsers.slice(0, 5).map((p) => (
                <span
                  key={p.userId}
                  title={`${p.name} · ${ROLE_LABELS[p.role]}`}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white border-2 border-white shadow-2xs"
                  style={{ backgroundColor: p.cursorColor }}
                >
                  {getInitials(p.name)}
                </span>
              ))}
            </div>
            <span className="text-xs text-[#706b69] tabular-nums whitespace-nowrap">
              {connected ? `${uniqueOnlineUsers.length} online` : 'reconectando...'}
            </span>
          </div>

          {/* Account Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#f5f5f2] hover:bg-[#d7e0f7] border border-transparent hover:border-[#aec0ee] transition-colors cursor-pointer"
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
                style={{ backgroundColor: currentUser.cursorColor }}
              >
                {getInitials(currentUser.name)}
              </span>
              <span className="hidden md:block text-xs font-medium text-[#21201f] whitespace-nowrap max-w-[140px] truncate">
                {currentUser.name}
              </span>
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-[#dbd6d1] rounded-[6px] shadow-agile-float z-50 py-1.5">
                  <div className="px-3.5 py-2.5 border-b border-[#eae8e5] bg-[#fbfbfa]">
                    <div className="text-xs font-semibold text-black truncate">
                      {currentUser.name}
                    </div>
                    <div className="font-mono text-[11px] text-[#706b69] truncate">
                      {currentUser.email}
                    </div>
                    <div className="text-[11px] text-[#0b41cd] mt-1 font-medium">
                      {ROLE_LABELS[currentUser.role]} · {currentUser.specialty}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setPasswordModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#21201f] hover:bg-[#f5f5f2] flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#544f4f]" />
                    <span>Alterar senha</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#b8002c] hover:bg-[#ffd2d4] flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair / Trocar perfil</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Primary Action Button */}
          {!isViewer && (
            <button
              type="button"
              onClick={() =>
                setDrawerState({ open: true, card: null, initialStage: 'PITCH' })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0b41cd] hover:bg-[#052066] active:bg-[#5c80de] rounded-[6px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova ideia</span>
            </button>
          )}
        </div>
      </header>

      {/* TIER 2: MODULE SUB-HEADER (48px, Roche editorial gradient, contextual filters) */}
      {(activeView === 'board' || activeView === 'matrix') && (
        <div className="min-h-12 bg-agile-header border-b border-[#dbd6d1] px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Compact Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9d948e] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar iniciativas..."
                className="og1-input w-48 sm:w-56 pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
              />
            </div>

            {/* Interactive Discipline Filter Controls */}
            <div className="flex items-center gap-1 p-0.5 bg-white border border-[#dbd6d1] rounded-[6px] overflow-x-auto">
              <button
                type="button"
                onClick={() => setDisciplineFilter('ALL')}
                className={`px-2.5 py-1 text-xs rounded-[3px] whitespace-nowrap transition-colors cursor-pointer ${
                  disciplineFilter === 'ALL'
                    ? 'bg-[#0b41cd] text-white font-semibold'
                    : 'text-[#544f4f] hover:bg-[#f5f5f2] hover:text-black'
                }`}
              >
                Todas
              </button>
              {SPECIALTIES.map((sp) => {
                const active = disciplineFilter === sp;
                const meta = DISCIPLINE_META[sp];
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setDisciplineFilter(sp)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-[3px] whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#d7e0f7] text-[#052066] font-semibold'
                        : 'text-[#544f4f] hover:bg-[#f5f5f2] hover:text-black'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span>{meta.short}</span>
                  </button>
                );
              })}
            </div>

            {/* Effort Filter */}
            <select
              aria-label="Filtrar por esforço"
              value={effortFilter}
              onChange={(e) => setEffortFilter(e.target.value as EffortSize | 'ALL')}
              className="og1-input px-2.5 py-1.5 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
            >
              <option value="ALL">Esforço: Todos</option>
              {EFFORT_SIZES.map((sz) => (
                <option key={sz} value={sz}>
                  Esforço {sz}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Quiet Tabular Funnel Metrics / Viewer Read-Only Notice */}
          <div className="flex items-center gap-3 text-xs text-[#706b69] tabular-nums">
            {isViewer && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[50px] bg-[#fff7ce] border border-[#ffd60c] text-[#21201f] font-medium">
                <Eye className="w-3.5 h-3.5" />
                <span>Modo Observador (somente leitura)</span>
              </span>
            )}
            <span>
              <strong className="font-semibold text-black">{filteredCards.length}</strong> ideias
            </span>
            <span aria-hidden="true" className="text-[#c2bab5]">
              /
            </span>
            <span>
              <strong className="font-semibold text-[#00724a]">{readyForBacklogCount}</strong> prontas
              p/ backlog
            </span>
            <span aria-hidden="true" className="text-[#c2bab5]">
              /
            </span>
            <span>
              <strong className="font-semibold text-[#0b41cd]">{backlogCount}</strong> no backlog
            </span>
          </div>
        </div>
      )}

      {/* Quality Gate / Action Notification Banner */}
      {banner && (
        <div
          role={banner.type === 'error' ? 'alert' : 'status'}
          className={`px-6 lg:px-8 py-2.5 border-b text-xs flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            banner.type === 'error'
              ? 'bg-[#ffd2d4] border-[#ff1f26] text-[#b8002c]'
              : banner.type === 'success'
              ? 'bg-[#d2f3e3] border-[#00724a]/35 text-[#00724a]'
              : 'bg-[#d7e0f7] border-[#aec0ee] text-[#052066]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {banner.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span className="font-semibold">{banner.title}</span>
            {banner.details && banner.details.length > 0 && (
              <span className="text-[#21201f]">
                — Faltam: {banner.details.join(' · ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {banner.actionCardId && (
              <button
                type="button"
                onClick={() => {
                  const targetCard = cards.find((c) => c.id === banner.actionCardId);
                  if (targetCard) {
                    setDrawerState({
                      open: true,
                      card: targetCard,
                      focusRefinement: true,
                    });
                  }
                  setBanner(null);
                }}
                className="px-3 py-1 bg-[#ff1f26] hover:bg-[#b8002c] text-white font-semibold rounded-[6px] transition-colors cursor-pointer"
              >
                Preencher refinamento
              </button>
            )}
            <button
              type="button"
              onClick={() => setBanner(null)}
              aria-label="Fechar aviso"
              className="p-0.5 hover:opacity-75 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      {activeView === 'board' && (
        <BoardFunnelView
          cards={filteredCards}
          allCards={cards}
          currentUser={currentUser}
          remoteCursors={remoteCursors}
          votingState={votingState}
          votingBusy={votingBusy}
          onCursorMove={sendCursor}
          onCardClick={(card, focusRefinement) =>
            setDrawerState({ open: true, card, focusRefinement })
          }
          onQuickCreateCard={async (payload) => {
            await handleSaveCard(payload);
          }}
          onMoveCard={handleMoveCard}
          onTogglePin={handleTogglePin}
          onOpenMatrixView={() => setActiveView('matrix')}
          onOpenVoting={handleOpenVoting}
          onCloseVoting={handleCloseVoting}
          onTallyVotes={handleTallyVotes}
          onMoveElectedToEvaluation={handleMoveElectedToEvaluation}
          onExportNotice={(message) => setBanner({ type: 'success', title: message })}
        />
      )}

      {activeView === 'matrix' && (
        <MatrixCanvasView
          cards={filteredCards}
          currentUser={currentUser}
          remoteCursors={remoteCursors}
          onCursorMove={sendCursor}
          onCardClick={(card) => setDrawerState({ open: true, card })}
          onMoveCard={handleMoveCard}
        />
      )}

      {activeView === 'sessions' && (
        <SessionsView
          cards={cards}
          liveSessions={votingState.sessions}
          onOpenCard={(card) => setDrawerState({ open: true, card })}
        />
      )}

      {activeView === 'audit' && canViewAudit && (
        <AuditTrailView users={users} votingSessions={votingState.sessions} />
      )}

      {activeView === 'users' && canViewUsers && (
        <UsersAdminView
          users={users}
          currentUser={currentUser}
          onRefreshUsers={async () => {
            const res = await api.getUsers();
            setUsers(res.users);
          }}
        />
      )}

      {/* Structured 2-Section Idea Card Drawer */}
      {drawerState.open && (
        <CardDrawer
          card={
            drawerState.card
              ? cards.find((c) => c.id === drawerState.card?.id) ?? drawerState.card
              : null
          }
          initialStage={drawerState.initialStage}
          focusRefinement={drawerState.focusRefinement}
          currentUser={currentUser}
          collaborators={users}
          votingOpen={votingState.votingOpen}
          votingSessionNumber={votingState.currentSessionNumber}
          userVoteCard={userVoteCard}
          onClose={() => setDrawerState({ open: false, card: null })}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
          onTogglePin={handleTogglePin}
        />
      )}

      {/* User Self-Service Password Update Modal (RN-02.2) */}
      {passwordModalOpen && (
        <PasswordModal
          onClose={() => setPasswordModalOpen(false)}
          onSuccess={(message) => setBanner({ type: 'success', title: message })}
        />
      )}
    </div>
  );
}
