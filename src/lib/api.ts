import type {
  AuditLogEntry,
  IdeaCard,
  PinType,
  Role,
  Specialty,
  Stage,
  User,
  VotingSessionRecord,
  VotingState,
} from '../types';

const TOKEN_KEY = 'og1_innovation_board_token';

import { ApiErrorCode, ApiErrorDetails, ApiErrorCodeConst } from '../types';

export class ApiError extends Error {
  status: number;
  code?: ApiErrorCode;
  missingFields?: string[];
  validationErrors?: string[];

  constructor(
    message: string,
    status: number,
    extras?: { code?: ApiErrorCode; missingFields?: string[]; validationErrors?: string[] }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = extras?.code ?? ApiErrorCodeConst.VALIDATION_ERROR;
    this.missingFields = extras?.missingFields;
    this.validationErrors = extras?.validationErrors;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage restriction in private frames
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || `Erro HTTP ${res.status}`, res.status, {
      code: data.code,
      missingFields: data.missingFields,
      validationErrors: data.validationErrors,
    });
  }
  return data as T;
}

export interface DemoAccountSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialty: Specialty;
  cursorColor: string;
  federatedProvider: string | null;
}

export const api = {
  getDemoAccounts: () => request<{ accounts: DemoAccountSummary[] }>('/api/auth/demo-accounts'),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: { name: string; email: string; password: string; specialty: Specialty }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  federatedLogin: (payload: { email: string; name?: string; provider: string }) =>
    request<{ token: string; user: User; unifiedMessage?: string }>('/api/auth/federated', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<{ user: User }>('/api/auth/me'),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean; message: string }>('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getCards: () => request<{ cards: IdeaCard[] }>('/api/cards'),

  createCard: (payload: Partial<IdeaCard>) =>
    request<{ card: IdeaCard }>('/api/cards', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCard: (id: string, payload: Partial<IdeaCard>) =>
    request<{ card: IdeaCard }>(`/api/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  moveCard: (
    id: string,
    payload: { stage?: Stage; posX?: number; posY?: number; orderIndex?: number }
  ) =>
    request<{ card: IdeaCard }>(`/api/cards/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteCard: (id: string) =>
    request<{ ok: boolean; cardId: string }>(`/api/cards/${id}`, {
      method: 'DELETE',
    }),

  toggleCardPin: (id: string, pinType: PinType) =>
    request<{
      card: IdeaCard;
      operation: 'anexado' | 'substituido' | 'removido';
      voting?: VotingState;
    }>(`/api/cards/${id}/pins/toggle`, {
      method: 'POST',
      body: JSON.stringify({ pinType }),
    }),

  getVotingState: () => request<{ voting: VotingState }>('/api/voting'),

  getSessions: (params?: {
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: 'ALL' | 'OPEN' | 'CLOSED';
  }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params?.dateTo) query.set('dateTo', params.dateTo);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    const qs = query.toString();
    return request<{ sessions: VotingSessionRecord[] }>(
      `/api/sessions${qs ? `?${qs}` : ''}`
    );
  },

  openVoting: () =>
    request<{ voting: VotingState; cards: IdeaCard[]; message: string }>('/api/voting/open', {
      method: 'POST',
    }),

  closeVoting: () =>
    request<{ voting: VotingState; message: string }>('/api/voting/close', {
      method: 'POST',
    }),

  tallyVotes: () =>
    request<{ voting: VotingState; message: string }>('/api/voting/tally', {
      method: 'POST',
    }),

  moveElectedToEvaluation: () =>
    request<{ movedCards: IdeaCard[]; voting: VotingState; message: string }>(
      '/api/voting/move-elected',
      {
        method: 'POST',
      }
    ),

  getUsers: () => request<{ users: User[] }>('/api/users'),

  createUser: (payload: {
    name: string;
    email: string;
    role: Role;
    specialty: Specialty;
    cursorColor: string;
    initialPassword?: string;
  }) =>
    request<{ user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUser: (id: string, payload: Partial<User>) =>
    request<{ user: User }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  batchImportUsers: (content: string, format: 'json' | 'csv') =>
    request<{
      ok: boolean;
      createdCount: number;
      updatedCount: number;
      passwordsPreservedCount: number;
      message: string;
    }>('/api/users/batch-import', {
      method: 'POST',
      body: JSON.stringify({ content, format }),
    }),

  getAuditLogs: (params?: {
    action?: string;
    actorId?: string;
    entityType?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.action && params.action !== 'ALL') query.set('action', params.action);
    if (params?.actorId && params.actorId !== 'ALL') query.set('actorId', params.actorId);
    if (params?.entityType && params.entityType !== 'ALL') query.set('entityType', params.entityType);
    if (params?.search?.trim()) query.set('search', params.search.trim());
    const qs = query.toString();
    return request<{ logs: AuditLogEntry[]; totalCount: number }>(
      `/api/audit${qs ? `?${qs}` : ''}`
    );
  },
};
