/**
 * Kysely unified Database Schema for Innovation Board.
 * Shared across SQLite (APP_ENV=DEV) and PostgreSQL (APP_ENV=PRD) dialects.
 */
import type { Generated } from 'kysely';

export interface UsersTable {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  passwordChangedByUser: number;
  role: 'ADMIN' | 'FACILITATOR' | 'MEMBER' | 'VIEWER';
  specialty: string;
  cursorColor: string;
  active: number;
  federatedProvider: string | null;
  federatedSub: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionsTable {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface CardsTable {
  id: string;
  title: string;
  discipline: string;
  painOpportunity: string;
  proposedSolution: string;
  expectedBenefit: string;
  implementationModel: string;
  effort: string;
  technicalArchitecture: string;
  prerequisitesDependencies: string;
  securityPrivacyRisks: string;
  mvpSuccessCriteria: string;
  technicalLead: string;
  stage: 'PITCH' | 'EVALUATION' | 'REFINEMENT' | 'BACKLOG';
  posX: number;
  posY: number;
  orderIndex: number;
  authorId: string;
  authorName: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardPinsTable {
  cardId: string;
  userId: string;
  userName: string;
  pinType: 'vote_plus' | 'applause' | 'thumbs_up' | 'thumbs_down' | 'heart';
  votingSessionId: string | null;
  createdAt: string;
}

export interface BoardVotingStateTable {
  id: string;
  votingOpen: number;
  currentSessionId: string | null;
  talliedAt: string | null;
  topIdeasJson: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface VotingSessionsTable {
  id: string;
  sessionNumber: number;
  sessionDate: string | null;
  status: 'OPEN' | 'CLOSED';
  openedById: string | null;
  openedBy: string;
  openedAt: string;
  closedBy: string | null;
  closedAt: string | null;
  talliedAt: string | null;
  totalVotes: number;
  presentUserIdsJson: string;
  absentUserIdsJson: string;
  initialPitchCount: number;
  initialEvaluationCount: number;
  initialBacklogCount: number;
  newCardIdsJson: string;
  votedCardIdsJson: string;
  evaluatedCardIdsJson: string;
  backlogCardIdsJson: string;
  topIdeasJson: string;
  movedCardTitlesJson: string;
}

export interface AuditLogsTable {
  id: Generated<number>;
  timestamp: string;
  actorId: string | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  beforeState: string | null;
  afterState: string | null;
  integrityHash: string;
}

export interface DatabaseSchema {
  users: UsersTable;
  sessions: SessionsTable;
  cards: CardsTable;
  card_pins: CardPinsTable;
  board_voting_state: BoardVotingStateTable;
  voting_sessions: VotingSessionsTable;
  audit_logs: AuditLogsTable;
}
