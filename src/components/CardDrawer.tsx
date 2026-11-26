import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  DISCIPLINE_META,
  EFFORT_LABELS,
  EFFORT_SIZES,
  IMPLEMENTATION_MODELS,
  SPECIALTIES,
  STAGES,
  validateBacklogGate,
  type EffortSize,
  type IdeaCard,
  type ImplementationModel,
  type PinType,
  type Specialty,
  type Stage,
  type User,
} from '../types';
import { CardPinsBar } from './CardPinsBar';

interface CardDrawerProps {
  card: IdeaCard | null; // null when creating a new card
  initialStage?: Stage;
  focusRefinement?: boolean;
  currentUser: User;
  collaborators: User[];
  votingOpen?: boolean;
  votingSessionNumber?: number | null;
  userVoteCard?: { cardId: string; title: string } | null;
  onClose: () => void;
  onSave: (
    payload: Partial<IdeaCard>,
    existingId?: string,
    options?: { silent?: boolean }
  ) => Promise<void>;
  onDelete?: (cardId: string) => Promise<void>;
  onTogglePin?: (cardId: string, pinType: PinType) => Promise<void>;
}

type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'draft_saved' | 'blocked' | 'error';

const AUTOSAVE_DEBOUNCE_MS = 900;
const DRAFT_DEBOUNCE_MS = 500;

interface CardFormFields {
  title: string;
  discipline: Specialty;
  painOpportunity: string;
  proposedSolution: string;
  expectedBenefit: string;
  implementationModel: ImplementationModel;
  effort: EffortSize;
  stage: Stage;
  technicalArchitecture: string;
  prerequisitesDependencies: string;
  securityPrivacyRisks: string;
  mvpSuccessCriteria: string;
  technicalLead: string;
}

function getDraftStorageKey(userId: string, stage: Stage): string {
  return `og1_innovation_board_new_card_draft_${userId}_${stage}`;
}

function readStoredDraft(key: string): Partial<CardFormFields> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CardFormFields>;
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function formatSavedTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

export function CardDrawer({
  card,
  initialStage = 'PITCH',
  focusRefinement = false,
  currentUser,
  collaborators,
  votingOpen = true,
  votingSessionNumber = null,
  userVoteCard = null,
  onClose,
  onSave,
  onDelete,
  onTogglePin,
}: CardDrawerProps) {
  const isNew = !card;
  const canEdit =
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'FACILITATOR' ||
    (currentUser.role === 'MEMBER' && (isNew || card.authorId === currentUser.id));

  const canPromoteBacklog =
    currentUser.role === 'ADMIN' || currentUser.role === 'FACILITATOR';

  const draftKey = useMemo(
    () => getDraftStorageKey(currentUser.id, initialStage),
    [currentUser.id, initialStage]
  );

  const initialDraft = useMemo(() => {
    if (!isNew || !canEdit) return null;
    return readStoredDraft(draftKey);
  }, [isNew, canEdit, draftKey]);

  const [title, setTitle] = useState(card?.title ?? initialDraft?.title ?? '');
  const [discipline, setDiscipline] = useState<Specialty>(
    card?.discipline ?? initialDraft?.discipline ?? currentUser.specialty
  );
  const [painOpportunity, setPainOpportunity] = useState(
    card?.painOpportunity ?? initialDraft?.painOpportunity ?? ''
  );
  const [proposedSolution, setProposedSolution] = useState(
    card?.proposedSolution ?? initialDraft?.proposedSolution ?? ''
  );
  const [expectedBenefit, setExpectedBenefit] = useState(
    card?.expectedBenefit ?? initialDraft?.expectedBenefit ?? ''
  );
  const [implementationModel, setImplementationModel] = useState<ImplementationModel>(
    card?.implementationModel ?? initialDraft?.implementationModel ?? 'In-House'
  );
  const [effort, setEffort] = useState<EffortSize>(card?.effort ?? initialDraft?.effort ?? 'M');
  const [stage, setStage] = useState<Stage>(card?.stage ?? initialDraft?.stage ?? initialStage);

  const [technicalArchitecture, setTechnicalArchitecture] = useState(
    card?.technicalArchitecture ?? initialDraft?.technicalArchitecture ?? ''
  );
  const [prerequisitesDependencies, setPrerequisitesDependencies] = useState(
    card?.prerequisitesDependencies ?? initialDraft?.prerequisitesDependencies ?? ''
  );
  const [securityPrivacyRisks, setSecurityPrivacyRisks] = useState(
    card?.securityPrivacyRisks ?? initialDraft?.securityPrivacyRisks ?? ''
  );
  const [mvpSuccessCriteria, setMvpSuccessCriteria] = useState(
    card?.mvpSuccessCriteria ?? initialDraft?.mvpSuccessCriteria ?? ''
  );
  const [technicalLead, setTechnicalLead] = useState(
    card?.technicalLead ?? initialDraft?.technicalLead ?? ''
  );

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>(
    initialDraft ? 'draft_saved' : 'idle'
  );
  const [autoSaveNote, setAutoSaveNote] = useState<string>(
    initialDraft ? 'Rascunho recuperado localmente' : ''
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasDraftContent, setHasDraftContent] = useState<boolean>(Boolean(initialDraft));

  const refinementSectionRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const autoSavingInFlightRef = useRef(false);
  const pendingFollowUpRef = useRef(false);
  const isMountedRef = useRef(true);
  const deletingRef = useRef(false);

  const currentPayload = useMemo<CardFormFields>(
    () => ({
      title,
      discipline,
      painOpportunity,
      proposedSolution,
      expectedBenefit,
      implementationModel,
      effort,
      stage,
      technicalArchitecture,
      prerequisitesDependencies,
      securityPrivacyRisks,
      mvpSuccessCriteria,
      technicalLead,
    }),
    [
      title,
      discipline,
      painOpportunity,
      proposedSolution,
      expectedBenefit,
      implementationModel,
      effort,
      stage,
      technicalArchitecture,
      prerequisitesDependencies,
      securityPrivacyRisks,
      mvpSuccessCriteria,
      technicalLead,
    ]
  );

  const currentSnapshot = useMemo(() => JSON.stringify(currentPayload), [currentPayload]);
  const latestPayloadRef = useRef<CardFormFields>(currentPayload);
  const latestSnapshotRef = useRef<string>(currentSnapshot);
  latestPayloadRef.current = currentPayload;
  latestSnapshotRef.current = currentSnapshot;

  const lastSavedSnapshotRef = useRef<string>(
    JSON.stringify({
      title: card?.title ?? '',
      discipline: card?.discipline ?? currentUser.specialty,
      painOpportunity: card?.painOpportunity ?? '',
      proposedSolution: card?.proposedSolution ?? '',
      expectedBenefit: card?.expectedBenefit ?? '',
      implementationModel: card?.implementationModel ?? 'In-House',
      effort: card?.effort ?? 'M',
      stage: card?.stage ?? initialStage,
      technicalArchitecture: card?.technicalArchitecture ?? '',
      prerequisitesDependencies: card?.prerequisitesDependencies ?? '',
      securityPrivacyRisks: card?.securityPrivacyRisks ?? '',
      mvpSuccessCriteria: card?.mvpSuccessCriteria ?? '',
      technicalLead: card?.technicalLead ?? '',
    })
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (focusRefinement && refinementSectionRef.current) {
      refinementSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusRefinement]);

  const gate = validateBacklogGate({
    technicalArchitecture,
    mvpSuccessCriteria,
    technicalLead,
  });

  const validateForAutoSave = useCallback(
    (payload: CardFormFields): { ok: true } | { ok: false; reason: string } => {
      if (!payload.title.trim()) {
        return { ok: false, reason: 'Informe um título para salvar automaticamente' };
      }
      if (payload.stage === 'BACKLOG') {
        if (!canPromoteBacklog && card?.stage !== 'BACKLOG') {
          return {
            ok: false,
            reason: 'Somente Facilitador/Admin pode promover ao Backlog',
          };
        }
        const checkGate = validateBacklogGate(payload);
        if (!checkGate.valid) {
          return {
            ok: false,
            reason: `Preencha ${checkGate.completedCount}/3 obrigatórios p/ salvar no Backlog`,
          };
        }
      }
      return { ok: true };
    },
    [canPromoteBacklog, card?.stage]
  );

  const performAutoSave = useCallback(async () => {
    if (!card || !canEdit || deletingRef.current) return;
    const payloadToSave = latestPayloadRef.current;
    const snapshotToSave = latestSnapshotRef.current;

    if (snapshotToSave === lastSavedSnapshotRef.current) {
      return;
    }

    const validation = validateForAutoSave(payloadToSave);
    if (!validation.ok) {
      if (isMountedRef.current) {
        setAutoSaveStatus('blocked');
        setAutoSaveNote(validation.reason);
      }
      return;
    }

    if (autoSavingInFlightRef.current) {
      pendingFollowUpRef.current = true;
      return;
    }

    autoSavingInFlightRef.current = true;
    if (isMountedRef.current) {
      setAutoSaveStatus('saving');
      setAutoSaveNote('');
    }

    try {
      await onSave(payloadToSave, card.id, { silent: true });
      lastSavedSnapshotRef.current = snapshotToSave;
      if (isMountedRef.current) {
        setAutoSaveStatus('saved');
        setLastSavedAt(formatSavedTime(new Date()));
        setAutoSaveNote('');
        setError(null);
        setMissingFields([]);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const eObj = err as { message?: string; missingFields?: string[] };
        setAutoSaveStatus('error');
        setAutoSaveNote(eObj.message || 'Falha no salvamento automático');
        if (eObj.missingFields) setMissingFields(eObj.missingFields);
      }
    } finally {
      autoSavingInFlightRef.current = false;
      if (
        pendingFollowUpRef.current &&
        isMountedRef.current &&
        latestSnapshotRef.current !== lastSavedSnapshotRef.current
      ) {
        pendingFollowUpRef.current = false;
        debounceTimerRef.current = window.setTimeout(() => {
          void performAutoSave();
        }, AUTOSAVE_DEBOUNCE_MS);
      } else {
        pendingFollowUpRef.current = false;
      }
    }
  }, [card, canEdit, onSave, validateForAutoSave]);

  // Debounced autosave effect: server autosave for existing cards, localStorage draft for new cards
  useEffect(() => {
    if (!canEdit || deletingRef.current) return;

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (isNew) {
      const hasAnyText = Boolean(
        currentPayload.title.trim() ||
          currentPayload.painOpportunity.trim() ||
          currentPayload.proposedSolution.trim() ||
          currentPayload.expectedBenefit.trim() ||
          currentPayload.technicalArchitecture.trim() ||
          currentPayload.prerequisitesDependencies.trim() ||
          currentPayload.securityPrivacyRisks.trim() ||
          currentPayload.mvpSuccessCriteria.trim() ||
          currentPayload.technicalLead.trim()
      );
      setHasDraftContent(hasAnyText);

      if (!hasAnyText) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // Ignore storage error
        }
        setAutoSaveStatus('idle');
        setAutoSaveNote('');
        return;
      }

      setAutoSaveStatus('pending');
      debounceTimerRef.current = window.setTimeout(() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify(latestPayloadRef.current));
          if (isMountedRef.current) {
            setAutoSaveStatus('draft_saved');
            setLastSavedAt(formatSavedTime(new Date()));
            setAutoSaveNote('');
          }
        } catch {
          // Ignore quota/private frame restrictions
        }
      }, DRAFT_DEBOUNCE_MS);
      return;
    }

    // Existing card: debounce server persistence
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    setAutoSaveStatus('pending');
    setAutoSaveNote('');
    debounceTimerRef.current = window.setTimeout(() => {
      void performAutoSave();
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [canEdit, isNew, currentPayload, currentSnapshot, draftKey, performAutoSave]);

  const handleDiscardDraft = () => {
    if (!isNew) return;
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // Ignore storage error
    }
    setTitle('');
    setDiscipline(currentUser.specialty);
    setPainOpportunity('');
    setProposedSolution('');
    setExpectedBenefit('');
    setImplementationModel('In-House');
    setEffort('M');
    setStage(initialStage);
    setTechnicalArchitecture('');
    setPrerequisitesDependencies('');
    setSecurityPrivacyRisks('');
    setMvpSuccessCriteria('');
    setTechnicalLead('');
    setHasDraftContent(false);
    setAutoSaveStatus('idle');
    setAutoSaveNote('');
    setLastSavedAt(null);
  };

  const handleCloseDrawer = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    // Flush pending valid autosave for existing card so no edits are lost on immediate close
    if (
      !isNew &&
      card &&
      canEdit &&
      !deletingRef.current &&
      latestSnapshotRef.current !== lastSavedSnapshotRef.current
    ) {
      const validation = validateForAutoSave(latestPayloadRef.current);
      if (validation.ok) {
        void onSave(latestPayloadRef.current, card.id, { silent: true }).catch(() => {});
      }
    }
    onClose();
  }, [isNew, card, canEdit, validateForAutoSave, onSave, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setError(null);
    setMissingFields([]);

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!title.trim()) {
      setError('O título da iniciativa é obrigatório.');
      return;
    }

    if (stage === 'BACKLOG') {
      if (!canPromoteBacklog && card?.stage !== 'BACKLOG') {
        setError(
          'Apenas Facilitadores ou Administradores podem promover uma iniciativa ao Backlog.'
        );
        return;
      }
      if (!gate.valid) {
        setError(
          'Trava de qualidade do Backlog: preencha os campos obrigatórios destacados na Seção 2.'
        );
        setMissingFields(gate.missingFields);
        refinementSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // If existing card was already fully autosaved with zero pending diffs, close cleanly
    if (!isNew && currentSnapshot === lastSavedSnapshotRef.current && !autoSavingInFlightRef.current) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await onSave(currentPayload, card?.id);
      lastSavedSnapshotRef.current = currentSnapshot;
      if (isNew) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // Ignore storage error
        }
      }
      onClose();
    } catch (err: unknown) {
      const eObj = err as { message?: string; missingFields?: string[] };
      setError(eObj.message || 'Erro ao salvar cartão.');
      if (eObj.missingFields) setMissingFields(eObj.missingFields);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!card || !onDelete || !canEdit) return;
    deletingRef.current = true;
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setSaving(true);
    try {
      await onDelete(card.id);
      onClose();
    } catch (err: unknown) {
      deletingRef.current = false;
      setError((err as Error).message || 'Erro ao excluir cartão.');
    } finally {
      setSaving(false);
    }
  };

  const disciplineMeta = DISCIPLINE_META[discipline];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[1px]"
      onClick={handleCloseDrawer}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'Nova Iniciativa' : card.title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white text-[#21201f] h-full border-l border-[#dbd6d1] shadow-agile-lift flex flex-col"
      >
        {/* Drawer Header */}
        <header className="px-6 py-4 border-b border-[#dbd6d1] bg-agile-header flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#544f4f] mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: disciplineMeta.color }}
              />
              <span className="font-semibold" style={{ color: disciplineMeta.color }}>
                {discipline}
              </span>
              {!isNew && (
                <>
                  <span>·</span>
                  <span className="text-[#706b69]">Autor: {card.authorName}</span>
                </>
              )}
              {!canEdit && (
                <>
                  <span>·</span>
                  <span className="px-2 py-0.5 rounded-[50px] bg-[#fff7ce] border border-[#ffd60c] text-[#21201f] font-medium">
                    Somente leitura
                  </span>
                </>
              )}
            </div>
            <h2 className="font-editorial text-[20px] leading-[28px] font-normal text-black truncate">
              {isNew ? 'Registrar nova ideia de inovação' : card.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleCloseDrawer}
            aria-label="Fechar painel do cartão"
            className="p-1.5 text-[#544f4f] hover:text-black hover:bg-[#f5f5f2] rounded-[6px] border border-transparent hover:border-[#dbd6d1] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Scrollable Two-Section Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-[#ffd2d4] border border-[#ff1f26] rounded-[6px] text-xs text-[#b8002c] space-y-1"
            >
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {missingFields.length > 0 && (
                <ul className="list-disc pl-5 pt-1 space-y-0.5">
                  {missingFields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Pins Bar (available on existing cards for all non-viewer roles) */}
          {!isNew && (
            <div className="pb-5 border-b border-[#eae8e5]">
              <label className="block text-xs font-medium text-[#544f4f] mb-2">
                Pins da iniciativa
              </label>
              <CardPinsBar
                cardId={card.id}
                pins={card.pins ?? []}
                currentUserId={currentUser.id}
                readOnly={currentUser.role === 'VIEWER'}
                votingOpen={votingOpen}
                votingSessionNumber={votingSessionNumber}
                userVoteCard={userVoteCard}
                variant="full"
                onTogglePin={
                  onTogglePin ? (pinType) => onTogglePin(card.id, pinType) : undefined
                }
              />
            </div>
          )}

          {/* Stage Selector Bar */}
          <div>
            <label className="block text-xs font-medium text-[#544f4f] mb-2">
              Etapa atual no funil
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {STAGES.map((st) => {
                const active = stage === st.id;
                const lockedForMember =
                  st.id === 'BACKLOG' && !canPromoteBacklog && card?.stage !== 'BACKLOG';
                return (
                  <button
                    key={st.id}
                    type="button"
                    disabled={!canEdit || lockedForMember}
                    onClick={() => setStage(st.id)}
                    className={`px-2.5 py-2 text-left rounded-[6px] border text-xs transition-colors ${
                      active
                        ? 'border-[#0b41cd] bg-[#d7e0f7] text-[#052066] font-semibold'
                        : 'border-[#dbd6d1] bg-[#f5f5f2] text-[#21201f] hover:bg-[#d7e0f7]/55 hover:border-[#aec0ee]'
                    } disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] disabled:cursor-not-allowed cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px]">{st.index}</span>
                      {st.id === 'BACKLOG' && <Lock className="w-3 h-3" />}
                    </div>
                    <div className="truncate mt-0.5">{st.title.split(' ')[0]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 1 — PITCH DATA */}
          <div className="space-y-4">
            <div className="pb-2 border-b border-[#dbd6d1] flex items-baseline justify-between">
              <h3 className="font-editorial text-[18px] font-semibold text-black">
                1. Dados do Pitch
              </h3>
              <span className="text-xs text-[#706b69]">Etapas 1 e 2</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                Título da iniciativa *
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Copiloto SQL com Lineage Automático"
                className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                  Categoria / Disciplina
                </label>
                <select
                  disabled={!canEdit}
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value as Specialty)}
                  className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
                >
                  {SPECIALTIES.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                  Modelo de implementação
                </label>
                <select
                  disabled={!canEdit}
                  value={implementationModel}
                  onChange={(e) => setImplementationModel(e.target.value as ImplementationModel)}
                  className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
                >
                  {IMPLEMENTATION_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                  Esforço inicial
                </label>
                <select
                  disabled={!canEdit}
                  value={effort}
                  onChange={(e) => setEffort(e.target.value as EffortSize)}
                  className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
                >
                  {EFFORT_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {EFFORT_LABELS[sz]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                Dor ou oportunidade de negócio
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={painOpportunity}
                onChange={(e) => setPainOpportunity(e.target.value)}
                placeholder="Qual gargalo operacional, analítico ou estratégico esta proposta endereça?"
                className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                Solução proposta
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={proposedSolution}
                onChange={(e) => setProposedSolution(e.target.value)}
                placeholder="Descreva objetivamente a entrega proposta durante o pitch."
                className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                Benefício esperado
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={expectedBenefit}
                onChange={(e) => setExpectedBenefit(e.target.value)}
                placeholder="Ganho mensurável de eficiência, redução de custos, receita ou conformidade."
                className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
              />
            </div>
          </div>

          {/* SECTION 2 — TECHNICAL REFINEMENT & QUALITY GATE */}
          <div ref={refinementSectionRef} className="space-y-4 pt-2">
            <div className="pb-2 border-b border-[#dbd6d1] flex items-center justify-between gap-2">
              <div>
                <h3 className="font-editorial text-[18px] font-semibold text-black">
                  2. Refinamento Técnico &amp; Arquitetural
                </h3>
                <p className="text-xs text-[#544f4f]">
                  Campos sinalizados com trava são obrigatórios para promoção ao Backlog (RN-05.1).
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[50px] border text-xs font-semibold shrink-0 tabular-nums ${
                  gate.valid
                    ? 'bg-[#d2f3e3] border-[#00724a]/35 text-[#00724a]'
                    : 'bg-[#fff7ce] border-[#ffd60c] text-[#21201f]'
                }`}
              >
                {gate.valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00724a]" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-[#b22b0d]" />
                )}
                <span>{gate.completedCount}/3 obrigatórios</span>
              </span>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-medium text-[#544f4f] mb-1.5">
                <span>Arquitetura e solução técnica</span>
                <span className="text-[11px] text-[#0b41cd] font-semibold">
                  Obrigatório p/ Backlog
                </span>
              </label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={technicalArchitecture}
                onChange={(e) => setTechnicalArchitecture(e.target.value)}
                placeholder="Componentes, pipelines, integrações, camadas de dados e serviços previstos..."
                className={`og1-input w-full px-3 py-2 text-sm bg-white border rounded-[6px] text-[#21201f] placeholder:text-[#9d948e] ${
                  missingFields.includes('Arquitetura e Solução Técnica')
                    ? 'border-[#ff1f26] bg-[#ffd2d4]/25'
                    : 'border-[#dbd6d1]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                Pré-requisitos e dependências
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={prerequisitesDependencies}
                onChange={(e) => setPrerequisitesDependencies(e.target.value)}
                placeholder="Acessos, contratos de dados, aprovações de times externos ou licenças..."
                className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                Riscos de segurança e privacidade (LGPD / Governança)
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={securityPrivacyRisks}
                onChange={(e) => setSecurityPrivacyRisks(e.target.value)}
                placeholder="Dados pessoais (PII), controle de acesso (RLS/RBAC), mascaramento e mitigação..."
                className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-medium text-[#544f4f] mb-1.5">
                <span>Critérios de sucesso do MVP</span>
                <span className="text-[11px] text-[#0b41cd] font-semibold">
                  Obrigatório p/ Backlog
                </span>
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={mvpSuccessCriteria}
                onChange={(e) => setMvpSuccessCriteria(e.target.value)}
                placeholder="Definição clara de pronto e KPIs que validam o sucesso da entrega inicial..."
                className={`og1-input w-full px-3 py-2 text-sm bg-white border rounded-[6px] text-[#21201f] placeholder:text-[#9d948e] ${
                  missingFields.includes('Critérios de Sucesso do MVP')
                    ? 'border-[#ff1f26] bg-[#ffd2d4]/25'
                    : 'border-[#dbd6d1]'
                }`}
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-medium text-[#544f4f] mb-1.5">
                <span>Líder técnico responsável</span>
                <span className="text-[11px] text-[#0b41cd] font-semibold">
                  Obrigatório p/ Backlog
                </span>
              </label>
              <select
                disabled={!canEdit}
                value={technicalLead}
                onChange={(e) => setTechnicalLead(e.target.value)}
                className={`og1-input w-full px-3 py-2 text-sm bg-white border rounded-[6px] text-[#21201f] ${
                  missingFields.includes('Líder Técnico Responsável')
                    ? 'border-[#ff1f26] bg-[#ffd2d4]/25'
                    : 'border-[#dbd6d1]'
                }`}
              >
                <option value="">Selecionar responsável técnico...</option>
                {collaborators
                  .filter((u) => u.active && u.role !== 'VIEWER')
                  .map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} — {u.specialty}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-[#fbfbfa] border-t border-[#dbd6d1] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {!isNew && canEdit && onDelete && (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleDelete}
                      className="px-3 py-2 text-xs font-semibold text-white bg-[#ff1f26] hover:bg-[#b8002c] rounded-[6px] transition-colors cursor-pointer"
                    >
                      Confirmar exclusão
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-2 text-xs text-[#544f4f] hover:text-black cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs text-[#544f4f] hover:text-[#b8002c] hover:bg-[#ffd2d4]/60 rounded-[6px] transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )
              )}

              {isNew && canEdit && hasDraftContent && (
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#544f4f] hover:text-[#b8002c] hover:bg-[#ffd2d4]/60 rounded-[6px] transition-colors cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Descartar rascunho</span>
                </button>
              )}

              {/* Subtle Auto-Save Feedback */}
              {canEdit && autoSaveStatus !== 'idle' && (
                <span
                  aria-live="polite"
                  className={`inline-flex items-center gap-1.5 text-[11px] truncate ${
                    autoSaveStatus === 'error'
                      ? 'text-[#b8002c] font-medium'
                      : autoSaveStatus === 'blocked'
                      ? 'text-[#b22b0d] font-medium'
                      : autoSaveStatus === 'saved' || autoSaveStatus === 'draft_saved'
                      ? 'text-[#00724a] font-medium'
                      : 'text-[#706b69]'
                  }`}
                >
                  {autoSaveStatus === 'saving' && (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                      <span>Salvando automaticamente...</span>
                    </>
                  )}
                  {autoSaveStatus === 'pending' && (
                    <span>
                      {isNew ? 'Salvando rascunho...' : 'Alterações pendentes...'}
                    </span>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <>
                      <Check className="w-3 h-3 shrink-0" />
                      <span className="font-mono text-[10px] tabular-nums">
                        Salvo automaticamente{lastSavedAt ? ` às ${lastSavedAt}` : ''}
                      </span>
                    </>
                  )}
                  {autoSaveStatus === 'draft_saved' && (
                    <>
                      <Check className="w-3 h-3 shrink-0" />
                      <span className="font-mono text-[10px] tabular-nums">
                        {autoSaveNote ||
                          `Rascunho salvo localmente${lastSavedAt ? ` às ${lastSavedAt}` : ''}`}
                      </span>
                    </>
                  )}
                  {autoSaveStatus === 'blocked' && (
                    <>
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span className="truncate">{autoSaveNote}</span>
                    </>
                  )}
                  {autoSaveStatus === 'error' && (
                    <>
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span className="truncate">{autoSaveNote}</span>
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="px-4 py-2 text-sm font-medium text-[#21201f] bg-[#f5f5f2] border border-[#dbd6d1] hover:bg-[#d7e0f7] hover:border-[#aec0ee] rounded-[6px] transition-colors cursor-pointer"
              >
                {isNew && canEdit ? 'Cancelar' : 'Fechar'}
              </button>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#0b41cd] hover:bg-[#052066] active:bg-[#5c80de] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] rounded-[6px] transition-colors cursor-pointer"
                >
                  {saving ? 'Salvando...' : isNew ? 'Criar iniciativa' : 'Salvar e fechar'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
