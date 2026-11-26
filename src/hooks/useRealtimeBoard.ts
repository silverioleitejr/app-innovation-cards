import { useCallback, useEffect, useRef, useState } from 'react';
import type { IdeaCard, PresenceUser, RemoteCursor, VotingState } from '../types';

interface UseRealtimeBoardOptions {
  token: string | null;
  activeView: string;
  onCardCreated: (card: IdeaCard) => void;
  onCardUpdated: (card: IdeaCard) => void;
  onCardDeleted: (cardId: string) => void;
  onCardsSync: (cards: IdeaCard[]) => void;
  onUsersUpdated: () => void;
  onVotingUpdated: (voting: VotingState) => void;
  onReconnected: () => void;
}

export function useRealtimeBoard({
  token,
  activeView,
  onCardCreated,
  onCardUpdated,
  onCardDeleted,
  onCardsSync,
  onUsersUpdated,
  onVotingUpdated,
  onReconnected,
}: UseRealtimeBoardOptions) {
  const [connected, setConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const lastCursorSentRef = useRef<number>(0);
  const hasConnectedOnceRef = useRef<boolean>(false);

  const callbacksRef = useRef({
    onCardCreated,
    onCardUpdated,
    onCardDeleted,
    onCardsSync,
    onUsersUpdated,
    onVotingUpdated,
    onReconnected,
  });
  callbacksRef.current = {
    onCardCreated,
    onCardUpdated,
    onCardDeleted,
    onCardsSync,
    onUsersUpdated,
    onVotingUpdated,
    onReconnected,
  };

  useEffect(() => {
    if (!token) {
      setConnected(false);
      setPresence([]);
      setRemoteCursors({});
      return;
    }

    let cancelled = false;
    let reconnectTimer: number | null = null;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        attempt = 0;
        setConnected(true);
        ws.send(JSON.stringify({ type: 'view:change', view: activeView }));
        if (hasConnectedOnceRef.current) {
          callbacksRef.current.onReconnected();
        }
        hasConnectedOnceRef.current = true;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            clientId?: string;
            presence?: PresenceUser[];
            cursor?: RemoteCursor;
            card?: IdeaCard;
            cards?: IdeaCard[];
            cardId?: string;
            voting?: VotingState;
          };

          switch (msg.type) {
            case 'ws:connected':
              if (msg.clientId) setClientId(msg.clientId);
              if (msg.presence) setPresence(msg.presence);
              break;
            case 'presence:sync':
              if (msg.presence) setPresence(msg.presence);
              break;
            case 'cursor:moved':
              if (msg.cursor) {
                const cursor = msg.cursor;
                setRemoteCursors((prev) => ({
                  ...prev,
                  [cursor.clientId]: cursor,
                }));
              }
              break;
            case 'cursor:left':
              if (msg.clientId) {
                const leftId = msg.clientId;
                setRemoteCursors((prev) => {
                  if (!(leftId in prev)) return prev;
                  const next = { ...prev };
                  delete next[leftId];
                  return next;
                });
              }
              break;
            case 'card:created':
              if (msg.card) callbacksRef.current.onCardCreated(msg.card);
              break;
            case 'card:updated':
            case 'card:moved':
              if (msg.card) callbacksRef.current.onCardUpdated(msg.card);
              break;
            case 'card:deleted':
              if (msg.cardId) callbacksRef.current.onCardDeleted(msg.cardId);
              break;
            case 'cards:sync':
              if (msg.cards) callbacksRef.current.onCardsSync(msg.cards);
              break;
            case 'users:updated':
              callbacksRef.current.onUsersUpdated();
              break;
            case 'voting:updated':
              if (msg.voting) callbacksRef.current.onVotingUpdated(msg.voting);
              break;
          }
        } catch {
          // Ignore invalid payloads
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        wsRef.current = null;
        attempt += 1;
        const delay = Math.min(8000, 800 * Math.pow(1.6, attempt));
        reconnectTimer = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    // Prune stale ephemeral cursors (inactive > 10s)
    const pruneInterval = window.setInterval(() => {
      const cutoff = Date.now() - 10_000;
      setRemoteCursors((prev) => {
        let changed = false;
        const next: Record<string, RemoteCursor> = {};
        for (const [key, value] of Object.entries(prev)) {
          if (value.updatedAt >= cutoff) {
            next[key] = value;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 4000);

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      window.clearInterval(pruneInterval);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'view:change', view: activeView }));
    }
  }, [activeView]);

  const sendCursor = useCallback((x: number, y: number, view: string) => {
    const now = performance.now();
    if (now - lastCursorSentRef.current < 40) return; // ~25fps throttle
    lastCursorSentRef.current = now;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cursor:move', x, y, view }));
    }
  }, []);

  return {
    connected,
    clientId,
    presence,
    remoteCursors: Object.values(remoteCursors),
    sendCursor,
  };
}
