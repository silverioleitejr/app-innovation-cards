import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
  GripVertical,
  Lock,
  Maximize2,
  Plus,
  Trophy,
  Unlock,
  X,
} from 'lucide-react';
import { exportTopIdeasToCsv, exportTopIdeasToPdf } from '../lib/exportTopIdeas';
import {
  computeTopVotedIdeas,
  DISCIPLINE_META,
  EFFORT_SIZES,
  SPECIALTIES,
  STAGES,
  validateBacklogGate,
  type EffortSize,
  type IdeaCard,
  type PinType,
  type RemoteCursor,
  type Specialty,
  type Stage,
  type User,
  type VotingState,
} from '../types';
import { useCardPin, useGroupedPins, useVoteValidation } from '../hooks/useCardPinsManagement';
import { CardPinsBar } from './CardPinsBar';
import { RemoteCursorsOverlay } from './RemoteCursorsOverlay';

interface BoardFunnelViewProps {
  cards: IdeaCard[];
  allCards: IdeaCard[];
  currentUser: User;
  remoteCursors: RemoteCursor[];
  votingState: VotingState;
  votingBusy: boolean;
  onCursorMove: (x: number, y: number, view: string) => void;
  onCardClick: (card: IdeaCard, focusRefinement?: boolean) => void;
  onQuickCreateCard: (payload: {
    title: string;
    proposedSolution: string;
    discipline: Specialty;
    effort: EffortSize;
    stage: Stage;
  }) => Promise<void>;
  onMoveCard: (
    cardId: string,
    target: { stage: Stage; posX?: number; posY?: number }
  ) => Promise<void>;
  onTogglePin: (cardId: string, pinType: PinType) => Promise<void>;
  onOpenMatrixView: () => void;
  onOpenVoting: () => Promise<void>;
  onCloseVoting: () => Promise<void>;
  onTallyVotes: () => Promise<void>;
  onMoveElectedToEvaluation: () => Promise<void>;
  onExportNotice?: (message: string) => void;
}

interface InlineDraft {
  stage: Stage;
  title: string;
  description: string;
  discipline: Specialty;
  effort: EffortSize;
  saving: boolean;
  error: string | null;
}

export function BoardFunnelView({
  cards,
  allCards,
  currentUser,
  remoteCursors,
  votingState,
  votingBusy,
  onCursorMove,
  onCardClick,
  onQuickCreateCard,
  onMoveCard,
  onTogglePin,
  onOpenMatrixView,
  onOpenVoting,
  onCloseVoting,
  onTallyVotes,
  onMoveElectedToEvaluation,
  onExportNotice,
}: BoardFunnelViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [inlineDraft, setInlineDraft] = useState<InlineDraft | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const isViewer = currentUser.role === 'VIEWER';
  const isAdmin = currentUser.role === 'ADMIN';

  const displayedTopIdeas = useMemo(() => {
    if (votingState.talliedAt && votingState.topIdeas.length > 0) {
      return votingState.topIdeas.slice(0, 5);
    }
    return computeTopVotedIdeas(allCards, 5);
  }, [votingState.talliedAt, votingState.topIdeas, allCards]);

  const userVoteCard = useMemo(() => {
    const found = allCards.find((c) =>
      (c.pins ?? []).some((p) => p.userId === currentUser.id && p.pinType === 'vote_plus')
    );
    return found ? { cardId: found.id, title: found.title } : null;
  }, [allCards, currentUser.id]);

  const { voteUsedOnOtherCard, voteLockedClosed, validationMessage } = useVoteValidation(
    currentUser.id,
    userVoteCard,
    votingState.votingOpen,
    votingState.currentSessionNumber
  );

  const formattedTalliedTime = useMemo(() => {
    if (!votingState.talliedAt) return null;
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(votingState.talliedAt));
    } catch {
      return null;
    }
  }, [votingState.talliedAt]);

  useEffect(() => {
    if (inlineDraft && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [inlineDraft?.stage]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [exportMenuOpen]);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (displayedTopIdeas.length === 0) return;
    setExportMenuOpen(false);
    if (format === 'csv') {
      exportTopIdeasToCsv(displayedTopIdeas, allCards, votingState);
      onExportNotice?.(
        `Tops ${displayedTopIdeas.length} Ideias exportadas em formato CSV (.csv).`
      );
    } else {
      exportTopIdeasToPdf(displayedTopIdeas, allCards, votingState);
      onExportNotice?.(
        `Relatório Tops ${displayedTopIdeas.length} Ideias exportado em formato PDF (.pdf).`
      );
    }
  };

  const openInlineDraft = (stage: Stage) => {
    if (isViewer || stage === 'BACKLOG') return;
    setInlineDraft((prev) => {
      if (prev) {
        return { ...prev, stage, error: null };
      }
      return {
        stage,
        title: '',
        description: '',
        discipline: currentUser.specialty,
        effort: 'M',
        saving: false,
        error: null,
      };
    });
    window.setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleCancelDraft = () => {
    setInlineDraft(null);
  };

  const handleSaveDraft = async () => {
    if (!inlineDraft || inlineDraft.saving) return;
    if (!inlineDraft.title.trim()) {
      setInlineDraft((prev) =>
        prev ? { ...prev, error: 'Digite um título para criar o card.' } : null
      );
      titleInputRef.current?.focus();
      return;
    }

    setInlineDraft((prev) => (prev ? { ...prev, saving: true, error: null } : null));
    try {
      await onQuickCreateCard({
        title: inlineDraft.title.trim(),
        proposedSolution: inlineDraft.description.trim(),
        discipline: inlineDraft.discipline,
        effort: inlineDraft.effort,
        stage: inlineDraft.stage,
      });
      setInlineDraft(null);
    } catch (err) {
      setInlineDraft((prev) =>
        prev
          ? {
              ...prev,
              saving: false,
              error: err instanceof Error ? err.message : 'Erro ao criar o card.',
            }
          : null
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onCursorMove(x, y, 'board');
  };

  const handleDragStart = (e: React.DragEvent, card: IdeaCard) => {
    if (isViewer) {
      e.preventDefault();
      return;
    }
    setDraggingId(card.id);
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleStageDragOver = (e: React.DragEvent, stage: Stage) => {
    if (isViewer) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleStageDrop = async (e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    if (isViewer) return;
    const cardId = e.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    setDragOverStage(null);
    if (!cardId) return;
    await onMoveCard(cardId, { stage });
  };

  const draggingCard = draggingId ? cards.find((c) => c.id === draggingId) : null;
  const draggingGate = draggingCard ? validateBacklogGate(draggingCard) : null;
  const canPromoteBacklog =
    currentUser.role === 'ADMIN' || currentUser.role === 'FACILITATOR';

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isViewer) {
            openInlineDraft('PITCH');
          }
        }}
        className="relative flex-1 overflow-x-auto overflow-y-auto px-6 lg:px-8 py-5 bg-white"
      >
        <RemoteCursorsOverlay cursors={remoteCursors} activeView="board" />

        <LayoutGroup id="funnel-board-cards">
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !isViewer) {
                openInlineDraft('PITCH');
              }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[960px] h-full items-start"
          >
          {STAGES.map((stage) => {
            const stageCards = cards.filter((c) => c.stage === stage.id);
            const isDropTarget = dragOverStage === stage.id;
            const canQuickCreateHere = !isViewer && stage.id !== 'BACKLOG';
            const hasInlineDraftHere = inlineDraft?.stage === stage.id;
            const isBacklogBlockedPreview =
              isDropTarget &&
              stage.id === 'BACKLOG' &&
              draggingCard &&
              draggingCard.stage !== 'BACKLOG' &&
              (!canPromoteBacklog || (draggingGate && !draggingGate.valid));

            return (
              <section
                key={stage.id}
                onDragOver={(e) => handleStageDragOver(e, stage.id)}
                onDragLeave={() => {
                  if (dragOverStage === stage.id) setDragOverStage(null);
                }}
                onDrop={(e) => handleStageDrop(e, stage.id)}
                className={`flex flex-col rounded-[6px] border transition-colors min-h-[520px] ${
                  isBacklogBlockedPreview
                    ? 'border-[#ff1f26] bg-[#ffd2d4]/60'
                    : isDropTarget
                    ? 'border-[#0b41cd] bg-[#d7e0f7]/45'
                    : 'border-[#dbd6d1] bg-[#f5f5f2]'
                }`}
              >
              {/* Column Editorial Header */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-3.5 bg-white border-b border-[#dbd6d1] rounded-t-[5px] flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#0b41cd] font-semibold tabular-nums">
                      {stage.index}
                    </span>
                    <h2 className="font-editorial text-[18px] leading-[24px] font-semibold text-black truncate">
                      {stage.title}
                    </h2>
                  </div>
                  <p className="text-xs text-[#544f4f] mt-0.5 truncate">{stage.subtitle}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-xs text-[#706b69] tabular-nums px-2 py-0.5 bg-[#f5f5f2] border border-[#dbd6d1] rounded-[50px]">
                    {stageCards.length}
                  </span>
                  {canQuickCreateHere && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInlineDraft(stage.id);
                      }}
                      title={`Criar card rápido em ${stage.title}`}
                      className="p-1 text-[#544f4f] hover:text-[#052066] hover:bg-[#d7e0f7] rounded-[6px] transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  {stage.id === 'EVALUATION' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMatrixView();
                      }}
                      title="Expandir Matriz Esforço × Benefício"
                      className="p-1 text-[#544f4f] hover:text-[#052066] hover:bg-[#d7e0f7] rounded-[6px] transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quality Gate Live Hint Banner when dragging into Backlog */}
              {stage.id === 'BACKLOG' && (
                <div
                  className={`px-4 py-2 border-b text-[11px] flex items-center gap-1.5 ${
                    isBacklogBlockedPreview
                      ? 'bg-[#ffd2d4] border-[#ff1f26] text-[#b8002c] font-semibold'
                      : 'bg-[#fbfbfa] border-[#dbd6d1] text-[#544f4f]'
                  }`}
                >
                  <Lock className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {isBacklogBlockedPreview
                      ? !canPromoteBacklog
                        ? 'Requer papel Facilitador ou Administrador'
                        : `Faltam: ${draggingGate?.missingFields.join(', ')}`
                      : 'Trava de qualidade: Arquitetura, Critérios MVP e Líder Técnico'}
                  </span>
                </div>
              )}


                {/* Column Cards Grid — 2 cards per row per column; clicking empty space spawns inline draft */}
                <div
                  onClick={(e) => {
                    if (e.target === e.currentTarget && canQuickCreateHere) {
                      openInlineDraft(stage.id);
                    }
                  }}
                  className={`p-3 flex-1 flex flex-col gap-2.5 ${
                    canQuickCreateHere ? 'cursor-pointer' : ''
                  }`}
                >
                  {stageCards.length === 0 && !hasInlineDraftHere ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canQuickCreateHere) openInlineDraft(stage.id);
                      }}
                      className={`h-28 bg-white/70 border border-dashed border-[#c2bab5] rounded-[6px] flex flex-col items-center justify-center text-center px-4 transition-colors ${
                        canQuickCreateHere
                          ? 'hover:border-[#0b41cd] hover:bg-[#d7e0f7]/35 cursor-pointer'
                          : ''
                      }`}
                    >
                      <p className="text-xs text-[#706b69]">
                        {isViewer
                          ? 'Nenhuma iniciativa nesta etapa.'
                          : stage.id === 'BACKLOG'
                          ? 'Arraste uma iniciativa refinada (3/3) para promover ao Backlog.'
                          : 'Clique aqui para digitar um novo card diretamente no board.'}
                      </p>
                    </div>
                  ) : (
                    <div
                      onClick={(e) => {
                        if (e.target === e.currentTarget && canQuickCreateHere) {
                          openInlineDraft(stage.id);
                        }
                      }}
                      className="grid grid-cols-2 gap-2 items-stretch"
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        {stageCards.map((card) => {
                          const meta = DISCIPLINE_META[card.discipline];
                          const gate = validateBacklogGate(card);
                          const isDragging = draggingId === card.id;

                          return (
                            <motion.div
                              key={card.id}
                              layout="position"
                              initial={{ opacity: 0, scale: 0.93, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -8 }}
                              transition={{
                                layout: { type: 'spring', stiffness: 420, damping: 32 },
                                opacity: { duration: 0.18, ease: 'easeOut' },
                                scale: { type: 'spring', stiffness: 460, damping: 30 },
                                y: { type: 'spring', stiffness: 460, damping: 30 },
                              }}
                              className="h-full"
                            >
                              <article
                                draggable={!isViewer}
                                onDragStart={(e) => handleDragStart(e, card)}
                                onDragEnd={handleDragEnd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCardClick(card);
                                }}
                                title={card.title}
                                className={`group h-full bg-white border border-[#dbd6d1] rounded-[6px] p-2.5 flex flex-col justify-between gap-2 min-h-[112px] transition-all duration-150 ${
                                  isViewer ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                                } ${
                                  isDragging
                                    ? 'opacity-45 scale-[0.98]'
                                    : 'hover:-translate-y-0.5 hover:border-[#aec0ee] hover:shadow-agile-lift'
                                }`}
                              >
                                {/* Compact Card Title + Drag Grip */}
                                <div className="flex items-start justify-between gap-1">
                                  <h3 className="font-editorial text-[14px] font-semibold leading-snug text-black line-clamp-2 min-w-0">
                                    {card.title}
                                  </h3>
                                  {!isViewer && (
                                    <GripVertical className="w-3 h-3 text-[#706b69] opacity-30 group-hover:opacity-100 shrink-0 mt-0.5 transition-opacity" />
                                  )}
                                </div>

                                {/* Category + Compact Pin Bar */}
                                <div className="space-y-1.5 mt-auto">
                                  <div className="flex items-center justify-between gap-1 text-[11px] min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ backgroundColor: meta.color }}
                                      />
                                      <span
                                        className="truncate font-medium"
                                        style={{ color: meta.color }}
                                      >
                                        {meta.short}
                                      </span>
                                    </div>

                                    {stage.id === 'EVALUATION' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCardClick(card, true);
                                        }}
                                        title={`Prontidão para Backlog: ${gate.completedCount}/3`}
                                        className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-medium tabular-nums shrink-0 cursor-pointer hover:underline ${
                                          gate.valid ? 'text-[#00724a]' : 'text-[#b22b0d]'
                                        }`}
                                      >
                                        {gate.valid ? (
                                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                                        ) : (
                                          <AlertCircle className="w-3 h-3 shrink-0" />
                                        )}
                                        <span>{gate.completedCount}/3</span>
                                      </button>
                                    )}

                                    {stage.id === 'BACKLOG' && (
                                      <CheckCircle2
                                        className="w-3 h-3 text-[#00724a] shrink-0"
                                        aria-label="Validado para Backlog"
                                      />
                                    )}
                                  </div>

                                  <div className="pt-1.5 border-t border-[#eae8e5]">
                                    <CardPinsBar
                                      cardId={card.id}
                                      pins={card.pins ?? []}
                                      currentUserId={currentUser.id}
                                      readOnly={isViewer}
                                      votingOpen={votingState.votingOpen}
                                      votingSessionNumber={votingState.currentSessionNumber}
                                      userVoteCard={userVoteCard}
                                      variant="compact"
                                      className="mb-0"
                                      onTogglePin={(pinType) => onTogglePin(card.id, pinType)}
                                    />
                                  </div>
                                </div>
                              </article>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Inline Editable Card generated directly on board click (spans full column width while editing) */}
                  <AnimatePresence initial={false}>
                    {hasInlineDraftHere && inlineDraft && (
                      <motion.div
                        key={`inline-draft-${stage.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -6 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            handleCancelDraft();
                          } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveDraft();
                          }
                        }}
                        className="bg-white border border-[#0b41cd] ring-2 ring-[#d7e0f7] rounded-[6px] p-3 shadow-agile-float space-y-2.5 cursor-default"
                      >
                    {/* Quick Discipline + Effort Kicker */}
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: DISCIPLINE_META[inlineDraft.discipline].color,
                          }}
                        />
                        <select
                          aria-label="Disciplina do novo card"
                          value={inlineDraft.discipline}
                          onChange={(e) =>
                            setInlineDraft((prev) =>
                              prev ? { ...prev, discipline: e.target.value as Specialty } : null
                            )
                          }
                          className="bg-transparent text-[11px] font-medium focus:outline-none cursor-pointer truncate max-w-[130px]"
                          style={{ color: DISCIPLINE_META[inlineDraft.discipline].color }}
                        >
                          {SPECIALTIES.map((sp) => (
                            <option key={sp} value={sp} className="text-[#21201f]">
                              {DISCIPLINE_META[sp].short}
                            </option>
                          ))}
                        </select>
                        <span className="text-[#9d948e]">·</span>
                        <select
                          aria-label="Esforço inicial do novo card"
                          value={inlineDraft.effort}
                          onChange={(e) =>
                            setInlineDraft((prev) =>
                              prev ? { ...prev, effort: e.target.value as EffortSize } : null
                            )
                          }
                          className="bg-transparent font-mono text-[11px] text-[#706b69] focus:outline-none cursor-pointer"
                        >
                          {EFFORT_SIZES.map((sz) => (
                            <option key={sz} value={sz}>
                              Esforço {sz}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleCancelDraft}
                        aria-label="Cancelar novo card"
                        className="p-0.5 text-[#706b69] hover:text-black rounded-[3px] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Direct Inline Title Input */}
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={inlineDraft.title}
                      onChange={(e) =>
                        setInlineDraft((prev) =>
                          prev ? { ...prev, title: e.target.value, error: null } : null
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
                          e.preventDefault();
                          descriptionInputRef.current?.focus();
                        }
                      }}
                      placeholder="Título do card..."
                      className="w-full font-editorial text-[15px] font-semibold text-black placeholder:text-[#9d948e] bg-transparent border-b border-[#eae8e5] focus:border-[#0b41cd] pb-1 focus:outline-none"
                    />

                    {/* Direct Inline Description Textarea */}
                    <textarea
                      ref={descriptionInputRef}
                      rows={3}
                      value={inlineDraft.description}
                      onChange={(e) =>
                        setInlineDraft((prev) =>
                          prev ? { ...prev, description: e.target.value } : null
                        )
                      }
                      placeholder="Digite a descrição da iniciativa..."
                      className="w-full text-xs text-[#21201f] placeholder:text-[#9d948e] leading-relaxed bg-[#fbfbfa] border border-[#dbd6d1] focus:border-[#0b41cd] rounded-[6px] p-2 resize-none focus:outline-none"
                    />

                    {inlineDraft.error && (
                      <p className="text-[11px] text-[#b8002c] font-medium">{inlineDraft.error}</p>
                    )}

                    {/* Inline Save / Cancel Controls */}
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#706b69]">Ctrl+Enter salva</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={inlineDraft.saving}
                          onClick={handleCancelDraft}
                          className="px-2.5 py-1 text-xs text-[#21201f] bg-[#f5f5f2] hover:bg-[#d7e0f7] rounded-[6px] transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={inlineDraft.saving}
                          onClick={handleSaveDraft}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-[#0b41cd] hover:bg-[#052066] active:bg-[#5c80de] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] rounded-[6px] transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{inlineDraft.saving ? 'Salvando...' : 'Criar card'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                  {/* Clickable Empty Canvas Footer Hint inside Column */}
                  {canQuickCreateHere && !hasInlineDraftHere && stageCards.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInlineDraft(stage.id);
                      }}
                      className="mt-auto w-full py-2 px-3 border border-dashed border-transparent hover:border-[#aec0ee] hover:bg-white rounded-[6px] text-xs text-[#706b69] hover:text-[#0b41cd] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Clique para digitar um novo card</span>
                    </button>
                  )}
                </div>
              </section>
            );
          })}
          </div>
        </LayoutGroup>
      </div>

      {/* FIXED FOOTER SECTION — Admin Voting Commands & Top 5 Ideas */}
      <footer
        aria-label="Comandos administrativos e ranking das Top 5 ideias"
        className="shrink-0 border-t border-[#dbd6d1] bg-[#fbfbfa] px-6 lg:px-8 py-3 z-20"
      >
        <div className="flex flex-col gap-2">
          {/* Row 1: Comandos Admin */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-black whitespace-nowrap">
                Comandos Admin
              </span>

              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-[50px] border whitespace-nowrap ${
                  votingState.votingOpen
                    ? 'border-[#00724a]/35 bg-[#d2f3e3] text-[#00724a]'
                    : 'border-[#ff1f26] bg-[#ffd2d4] text-[#b8002c]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    votingState.votingOpen ? 'bg-[#00b458]' : 'bg-[#ff1f26]'
                  }`}
                />
                <span>
                  {votingState.votingOpen ? 'Votação Aberta' : 'Votação Fechada'}
                  {votingState.currentSessionNumber
                    ? ` · Sessão #${votingState.currentSessionNumber}`
                    : ''}
                </span>
              </span>

              <div className="flex flex-wrap items-center gap-1.5 ml-1">
                <button
                  type="button"
                  disabled={!isAdmin || votingBusy || votingState.votingOpen}
                  title={
                    !isAdmin
                      ? 'Disponível apenas para Administrador'
                      : votingState.votingOpen
                      ? 'A votação já está aberta'
                      : 'Iniciar nova sessão de votação e liberar o pin Voto +1 (1 por usuário)'
                  }
                  onClick={() => void onOpenVoting()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#dbd6d1] bg-[#f5f5f2] text-[#21201f] hover:border-[#00724a] hover:bg-[#d2f3e3] hover:text-[#00724a] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Abrir Votação</span>
                </button>

                <button
                  type="button"
                  disabled={!isAdmin || votingBusy || !votingState.votingOpen}
                  title={
                    !isAdmin
                      ? 'Disponível apenas para Administrador'
                      : !votingState.votingOpen
                      ? 'A votação já está fechada'
                      : 'Encerrar a sessão atual e bloquear alterações no pin Voto +1'
                  }
                  onClick={() => void onCloseVoting()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#dbd6d1] bg-[#f5f5f2] text-[#21201f] hover:border-[#ff1f26] hover:bg-[#ffd2d4] hover:text-[#b8002c] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Fechar Votação</span>
                </button>

                <button
                  type="button"
                  disabled={!isAdmin || votingBusy}
                  title={
                    !isAdmin
                      ? 'Disponível apenas para Administrador'
                      : 'Consolidar e registrar a apuração das Top 5 ideias por Voto +1'
                  }
                  onClick={() => void onTallyVotes()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#dbd6d1] bg-[#f5f5f2] text-[#21201f] hover:border-[#aec0ee] hover:bg-[#d7e0f7] hover:text-[#052066] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Apurar Votos</span>
                </button>

                <button
                  type="button"
                  disabled={!isAdmin || votingBusy}
                  title={
                    !isAdmin
                      ? 'Disponível apenas para Administrador'
                      : 'Mover as ideias eleitas (Top 5) de Pitch & Ideia para Avaliação Técnica & Valor'
                  }
                  onClick={() => void onMoveElectedToEvaluation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[6px] bg-[#0b41cd] text-white hover:bg-[#052066] active:bg-[#5c80de] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Mover Ideias Top 5</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Avaliação Técnica</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              {!isViewer && userVoteCard ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = allCards.find((c) => c.id === userVoteCard.cardId);
                    if (target) onCardClick(target);
                  }}
                  title={`Clique para abrir o card onde seu Voto +1 está aplicado`}
                  className="inline-flex items-center gap-1 text-[#0b41cd] hover:underline font-semibold cursor-pointer max-w-[260px]"
                >
                  <span className="shrink-0">Seu Voto +1:</span>
                  <span className="truncate">&ldquo;{userVoteCard.title}&rdquo;</span>
                </button>
              ) : !isViewer && votingState.votingOpen ? (
                <span className="text-[#00724a] font-semibold whitespace-nowrap">
                  Voto +1 disponível nesta sessão
                </span>
              ) : null}

              {!isAdmin && (
                <span className="text-[#706b69] whitespace-nowrap">
                  Controles exclusivos do perfil Administrador
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Tops 5 Ideias */}
          <div className="pt-2 border-t border-[#eae8e5] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
              <span className="inline-flex items-center gap-1.5 font-semibold text-black whitespace-nowrap shrink-0">
                <Trophy className="w-3.5 h-3.5 text-[#0b41cd]" />
                <span>Tops 5 Ideias:</span>
              </span>

              {displayedTopIdeas.length === 0 ? (
                <span className="text-[#706b69] whitespace-nowrap">
                  Nenhuma ideia recebeu Voto +1 nesta sessão — abra a votação e anexe o pin Voto +1 nos cards.
                </span>
              ) : (
                <div className="flex items-center gap-1 min-w-0 whitespace-nowrap">
                  {displayedTopIdeas.map((idea, idx) => {
                    const matchedCard = allCards.find((c) => c.id === idea.cardId);
                    return (
                      <React.Fragment key={idea.cardId}>
                        <button
                          type="button"
                          onClick={() => {
                            if (matchedCard) onCardClick(matchedCard);
                          }}
                          title={`${idea.title} · ${idea.score} ${
                            idea.score === 1 ? 'Voto +1' : 'Votos +1'
                          }`}
                          className="inline-flex items-center gap-1 text-[#21201f] hover:text-[#0b41cd] hover:underline transition-colors cursor-pointer"
                        >
                          <span className="font-mono text-[10px] text-[#0b41cd] font-semibold">
                            #{idx + 1}
                          </span>
                          <span className="max-w-[200px] truncate">{idea.title}</span>
                          <span className="font-mono text-[10px] text-[#706b69] tabular-nums">
                            ({idea.score})
                          </span>
                        </button>
                        {idx < displayedTopIdeas.length - 1 && (
                          <span aria-hidden="true" className="text-[#9d948e] mr-1">
                            ,
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-[10px] text-[#706b69] whitespace-nowrap hidden sm:inline">
                {formattedTalliedTime
                  ? `Apurado às ${formattedTalliedTime}`
                  : 'Ranking ao vivo (Voto +1)'}
              </span>

              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  disabled={displayedTopIdeas.length === 0}
                  aria-expanded={exportMenuOpen}
                  aria-haspopup="menu"
                  title={
                    displayedTopIdeas.length === 0
                      ? 'Nenhuma ideia votada para exportar'
                      : 'Exportar Tops 5 Ideias em CSV ou PDF'
                  }
                  onClick={() => setExportMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#dbd6d1] bg-[#f5f5f2] text-[#21201f] hover:border-[#aec0ee] hover:bg-[#d7e0f7] hover:text-[#052066] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Top 5</span>
                  <ChevronUp
                    className={`w-3 h-3 transition-transform ${
                      exportMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {exportMenuOpen && displayedTopIdeas.length > 0 && (
                  <div
                    role="menu"
                    aria-label="Formato de exportação das Tops 5 Ideias"
                    className="absolute right-0 bottom-full mb-1.5 z-40 w-56 bg-white border border-[#dbd6d1] rounded-[6px] shadow-agile-float p-1.5 space-y-0.5"
                  >
                    <div className="px-2 py-1 text-[10px] font-medium text-[#706b69]">
                      Exportar resultados da sessão
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleExport('csv')}
                      className="w-full px-2.5 py-2 rounded-[3px] text-left hover:bg-[#f5f5f2] flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#00724a] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#21201f]">
                          Exportar CSV (.csv)
                        </div>
                        <div className="text-[10px] text-[#544f4f]">
                          Planilha compatível com Excel e Sheets
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleExport('pdf')}
                      className="w-full px-2.5 py-2 rounded-[3px] text-left hover:bg-[#f5f5f2] flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#0b41cd] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#21201f]">
                          Exportar PDF (.pdf)
                        </div>
                        <div className="text-[10px] text-[#544f4f]">
                          Relatório executivo pronto para apresentação
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
