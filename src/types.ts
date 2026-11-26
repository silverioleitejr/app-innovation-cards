export type Role = 'ADMIN' | 'FACILITATOR' | 'MEMBER' | 'VIEWER';

export type Specialty =
  | 'Engenharia de Dados'
  | 'Analytics / BI'
  | 'IA / GenAI'
  | 'Governança / FinOps';

export type Stage = 'PITCH' | 'EVALUATION' | 'BACKLOG';

export type EffortSize = 'P' | 'M' | 'G' | 'XG';

export type ImplementationModel =
  | 'In-House'
  | 'Parceiro / Consultoria'
  | 'SaaS / Managed'
  | 'Híbrido';

export type PinType = 'vote_plus' | 'applause' | 'thumbs_up' | 'thumbs_down' | 'heart';

export interface CardPin {
  cardId: string;
  userId: string;
  userName: string;
  pinType: PinType;
  votingSessionId?: string | null;
  createdAt: string;
}

export type AuditAction =
  | 'AUTH_LOGIN'
  | 'AUTH_REGISTER'
  | 'AUTH_FEDERATED_LINK'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_BATCH_IMPORT'
  | 'CARD_CREATED'
  | 'CARD_UPDATED'
  | 'CARD_MOVED'
  | 'CARD_STAGE_CHANGED'
  | 'CARD_PIN_TOGGLED'
  | 'CARD_DELETED'
  | 'VOTING_OPENED'
  | 'VOTING_CLOSED'
  | 'VOTING_TALLIED'
  | 'VOTING_MOVED_TO_EVALUATION';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialty: Specialty;
  cursorColor: string;
  active: boolean;
  federatedProvider: string | null;
  passwordChangedByUser?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaCard {
  id: string;
  title: string;
  discipline: Specialty;
  painOpportunity: string;
  proposedSolution: string;
  expectedBenefit: string;
  implementationModel: ImplementationModel;
  effort: EffortSize;
  technicalArchitecture: string;
  prerequisitesDependencies: string;
  securityPrivacyRisks: string;
  mvpSuccessCriteria: string;
  technicalLead: string;
  stage: Stage;
  posX: number; // 0-100 horizontal position in Evaluation Matrix (Effort: low -> high)
  posY: number; // 0-100 vertical position in Evaluation Matrix (Benefit: high -> low)
  orderIndex: number;
  authorId: string;
  authorName: string;
  pins: CardPin[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  actorId: string | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: AuditAction;
  entityType: 'AUTH' | 'USER' | 'CARD' | 'VOTING';
  entityId: string;
  entityLabel: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  integrityHash: string;
}

export interface RankedIdea {
  cardId: string;
  title: string;
  stage: Stage;
  positiveVotes: number;
  negativeVotes: number;
  score: number;
}

export interface SessionCardRef {
  id: string;
  title: string;
  stage?: Stage;
  votes?: number;
}

export interface SessionParticipantRef {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialty: Specialty;
  cursorColor: string;
}

export interface VotingSessionRecord {
  id: string;
  sessionNumber: number;
  sessionDate: string; // YYYY-MM-DD
  status: 'OPEN' | 'CLOSED';
  openedById: string | null;
  openedBy: string;
  openedAt: string;
  closedBy: string | null;
  closedAt: string | null;
  durationMinutes: number;
  talliedAt: string | null;
  totalVotes: number;
  presentUserIds: string[];
  absentUserIds: string[];
  presentParticipants?: SessionParticipantRef[];
  absentParticipants?: SessionParticipantRef[];
  initialPitchCount: number;
  initialEvaluationCount: number;
  initialBacklogCount: number;
  newCardIds: string[];
  votedCardIds: string[];
  evaluatedCardIds: string[];
  backlogCardIds: string[];
  newIdeas?: SessionCardRef[];
  votedIdeas?: SessionCardRef[];
  evaluatedIdeas?: SessionCardRef[];
  backlogIdeas?: SessionCardRef[];
  topIdeas: RankedIdea[];
  movedCardTitles: string[];
}

export interface VotingState {
  votingOpen: boolean;
  currentSessionId: string | null;
  currentSessionNumber: number | null;
  talliedAt: string | null;
  topIdeas: RankedIdea[];
  sessions: VotingSessionRecord[];
  updatedAt: string;
  updatedBy: string | null;
}

export interface PresenceUser {
  clientId: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  specialty: Specialty;
  cursorColor: string;
  view: string;
}

export interface RemoteCursor {
  clientId: string;
  userId: string;
  name: string;
  cursorColor: string;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  view: string;
  updatedAt: number;
}

export const ROLES: Role[] = ['ADMIN', 'FACILITATOR', 'MEMBER', 'VIEWER'];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  FACILITATOR: 'Facilitador',
  MEMBER: 'Membro Colaborador',
  VIEWER: 'Observador',
};

export const SPECIALTIES: Specialty[] = [
  'Engenharia de Dados',
  'Analytics / BI',
  'IA / GenAI',
  'Governança / FinOps',
];

export const EFFORT_SIZES: EffortSize[] = ['P', 'M', 'G', 'XG'];

export const EFFORT_LABELS: Record<EffortSize, string> = {
  P: 'P · Baixo (1–2 sem)',
  M: 'M · Médio (3–4 sem)',
  G: 'G · Alto (1–2 meses)',
  XG: 'XG · Estruturante (3m+)',
};

export const IMPLEMENTATION_MODELS: ImplementationModel[] = [
  'In-House',
  'Parceiro / Consultoria',
  'SaaS / Managed',
  'Híbrido',
];

export const DISCIPLINE_META: Record<
  Specialty,
  { color: string; tint: string; short: string }
> = {
  'Engenharia de Dados': {
    color: '#0b41cd',
    tint: '#d7e0f7',
    short: 'Eng. Dados',
  },
  'Analytics / BI': {
    color: '#00724a',
    tint: '#d2f3e3',
    short: 'Analytics / BI',
  },
  'IA / GenAI': {
    color: '#7d0096',
    tint: '#f2d4ff',
    short: 'IA / GenAI',
  },
  'Governança / FinOps': {
    color: '#b22b0d',
    tint: '#fbe9dd',
    short: 'Gov. / FinOps',
  },
};

export const STAGES: {
  id: Stage;
  index: string;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'PITCH',
    index: '01',
    title: 'Pitch & Ideia',
    subtitle: 'Registro inicial de dores e propostas',
  },
  {
    id: 'EVALUATION',
    index: '02',
    title: 'Avaliação Técnica & Valor',
    subtitle: 'Matriz Esforço × Benefício e refinamento',
  },
  {
    id: 'BACKLOG',
    index: '03',
    title: 'Backlog & Priorização',
    subtitle: 'Iniciativas validadas para entrega',
  },
];

export const PIN_TYPES: PinType[] = [
  'vote_plus',
  'applause',
  'thumbs_up',
  'thumbs_down',
  'heart',
];

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'CONSTRAINT_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'QUALITY_GATE_BLOCKED'
  | 'VOTING_CLOSED'
  | 'VOTE_SESSION_LIMIT_REACHED';

export interface ApiErrorDetails {
  code: ApiErrorCode;
  missingFields?: string[];
  validationErrors?: string[];
}

export const enum ApiErrorCodeConst {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONSTRAINT_ERROR = 'CONSTRAINT_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  QUALITY_GATE_BLOCKED = 'QUALITY_GATE_BLOCKED',
  VOTING_CLOSED = 'VOTING_CLOSED',
  VOTE_SESSION_LIMIT_REACHED = 'VOTE_SESSION_LIMIT_REACHED',
}

export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  NETWORK_ERROR: 'Erro de rede. Tente novamente.',
  VALIDATION_ERROR: 'Erro de validação. Verifique os campos preenchidos.',
  CONSTRAINT_ERROR: 'Violação de constraint de banco de dados.',
  AUTHORIZATION_ERROR: 'Sessão expirada. Faça login novamente.',
  QUALITY_GATE_BLOCKED: 'Trava de qualidade bloqueada para promoção ao Backlog.',
  VOTING_CLOSED: 'A votação está fechada no momento.',
  VOTE_SESSION_LIMIT_REACHED: 'Limite de 1 Voto +1 por sessão atingido.',
};

export const PIN_META: Record<
  PinType,
  { label: string; shortLabel: string; accentColor: string }
> = {
  vote_plus: {
    label: 'Voto +1',
    shortLabel: '+1',
    accentColor: '#0b41cd',
  },
  applause: {
    label: 'Aplauso',
    shortLabel: 'Aplauso',
    accentColor: '#b22b0d',
  },
  thumbs_up: {
    label: 'Dedo positivo',
    shortLabel: 'Positivo',
    accentColor: '#00724a',
  },
  thumbs_down: {
    label: 'Dedo negativo',
    shortLabel: 'Negativo',
    accentColor: '#ff1f26',
  },
  heart: {
    label: 'Coração',
    shortLabel: 'Amei',
    accentColor: '#b8002c',
  },
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  AUTH_LOGIN: 'Login local',
  AUTH_REGISTER: 'Auto-registro',
  AUTH_FEDERATED_LINK: 'Vínculo federado SSO',
  USER_CREATED: 'Usuário cadastrado',
  USER_UPDATED: 'Usuário atualizado',
  USER_BATCH_IMPORT: 'Carga inicial em lote',
  CARD_CREATED: 'Cartão criado',
  CARD_UPDATED: 'Cartão editado',
  CARD_MOVED: 'Cartão reposicionado',
  CARD_STAGE_CHANGED: 'Mudança de etapa',
  CARD_PIN_TOGGLED: 'Pin no cartão',
  CARD_DELETED: 'Cartão excluído',
  VOTING_OPENED: 'Votação aberta',
  VOTING_CLOSED: 'Votação fechada',
  VOTING_TALLIED: 'Votos apurados',
  VOTING_MOVED_TO_EVALUATION: 'Eleitos movidos p/ Avaliação',
};

export function getMatrixQuadrant(posX: number, posY: number): {
  id: 'QUICK_WIN' | 'STRATEGIC' | 'CONTINUOUS' | 'ICEBOX';
  label: string;
  description: string;
} {
  const highBenefit = posY <= 50;
  const lowEffort = posX <= 50;
  if (highBenefit && lowEffort) {
    return {
      id: 'QUICK_WIN',
      label: 'Ganhos Rápidos (Quick Wins)',
      description: 'Alto benefício · Baixo esforço',
    };
  }
  if (highBenefit && !lowEffort) {
    return {
      id: 'STRATEGIC',
      label: 'Projetos Estruturantes',
      description: 'Alto benefício · Alto esforço',
    };
  }
  if (!highBenefit && lowEffort) {
    return {
      id: 'CONTINUOUS',
      label: 'Melhorias Contínuas',
      description: 'Benefício moderado · Baixo esforço',
    };
  }
  return {
    id: 'ICEBOX',
    label: 'Icebox',
    description: 'Benefício moderado · Alto esforço',
  };
}

export function validateBacklogGate(card: {
  technicalArchitecture?: string;
  mvpSuccessCriteria?: string;
  technicalLead?: string;
}): { valid: boolean; missingFields: string[]; completedCount: number } {
  const missingFields: string[] = [];
  if (!card.technicalArchitecture || !card.technicalArchitecture.trim()) {
    missingFields.push('Arquitetura e Solução Técnica');
  }
  if (!card.mvpSuccessCriteria || !card.mvpSuccessCriteria.trim()) {
    missingFields.push('Critérios de Sucesso do MVP');
  }
  if (!card.technicalLead || !card.technicalLead.trim()) {
    missingFields.push('Líder Técnico Responsável');
  }
  return {
    valid: missingFields.length === 0,
    missingFields,
    completedCount: 3 - missingFields.length,
  };
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function computeTopVotedIdeas(cards: IdeaCard[], limit = 5): RankedIdea[] {
  const ranked: Array<RankedIdea & { createdAt: string }> = [];

  for (const card of cards) {
    const pins = card.pins ?? [];
    const votePlusCount = pins.filter((p) => p.pinType === 'vote_plus').length;
    if (votePlusCount === 0) continue;

    ranked.push({
      cardId: card.id,
      title: card.title,
      stage: card.stage,
      positiveVotes: votePlusCount,
      negativeVotes: 0,
      score: votePlusCount,
      createdAt: card.createdAt,
    });
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aPitch = a.stage === 'PITCH' ? 0 : 1;
    const bPitch = b.stage === 'PITCH' ? 0 : 1;
    if (aPitch !== bPitch) return aPitch - bPitch;
    return a.createdAt.localeCompare(b.createdAt);
  });

  return ranked.slice(0, limit).map(({ createdAt: _createdAt, ...rest }) => rest);
}
