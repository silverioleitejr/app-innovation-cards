import { PIN_META, PIN_TYPES, type CardPin, type PinType } from '../types';

/**
 * Hook para gerenciamento centralizado do pin do usuário em um cartão.
 * Segue as regras RN-07.1 a RN-07.4 do PRD.
 */
export function useCardPin(
  cardId: string,
  userId: string,
  pins: CardPin[],
  options?: {
    userVoteCard?: { cardId: string; title: string } | null;
    votingOpen?: boolean;
  }
): {
  pinType: PinType | null;
  mine: boolean;
  blockedByClosed: boolean;
  blockedByRuleB: boolean;
} {
  const userPin = pins.find((p) => p.userId === userId) ?? null;
  const userVoteCard = options?.userVoteCard ?? null;
  const voteLockedClosed = options?.votingOpen === false;

  const voteUsedOnOtherCard = Boolean(
    userVoteCard && cardId && userVoteCard.cardId !== cardId
  );
  const userHasClosedVoteHere = userPin?.pinType === 'vote_plus' && voteLockedClosed;

  return {
    pinType: userPin?.pinType ?? null,
    mine: userPin?.userId === userId,
    blockedByClosed: userHasClosedVoteHere,
    blockedByRuleB: voteUsedOnOtherCard,
  };
}

/**
 * Hook para agrupar pins por tipo e calcular metadados para renderização.
 */
export function useGroupedPins(pins: CardPin[], currentUserId: string) {
  return PIN_TYPES.map((type) => {
    const items = pins.filter((p) => p.pinType === type);
    const mine = items.some((p) => p.userId === currentUserId);
    const names = items.map((p) => p.userName);
    const isVotePlus = type === 'vote_plus';
    return {
      type,
      meta: PIN_META[type],
      count: items.length,
      mine,
      isVotePlus,
      blockedByClosed: false,
      blockedByRuleB: false,
      names,
    };
  });
}

/**
 * Hook para validar regras de voto (RN-07.1 a RN-07.4).
 */
export function useVoteValidation(
  _currentUserId: string,
  userVoteCard: { cardId: string; title: string } | null,
  votingOpen: boolean,
  _votingSessionNumber: number | null,
  currentCardId?: string
) {
  const voteUsedOnOtherCard = Boolean(
    userVoteCard &&
      userVoteCard.cardId &&
      (!currentCardId || userVoteCard.cardId !== currentCardId)
  );
  const voteLockedClosed = !votingOpen;
  const userHasClosedVoteHere = Boolean(
    currentCardId && userVoteCard?.cardId === currentCardId && voteLockedClosed
  );

  return {
    voteUsedOnOtherCard,
    voteLockedClosed,
    userHasClosedVoteHere,
    validationMessage: (() => {
      if (voteLockedClosed && userHasClosedVoteHere) {
        return 'Votação fechada: o pin Voto +1 está bloqueado.';
      }
      if (voteUsedOnOtherCard && userVoteCard) {
        return `Você já usou seu Voto +1 nesta sessão no card "${userVoteCard.title}". Você pode trocar reações livremente ou remover o Voto +1 daquele card para votar aqui.`;
      }
      return '';
    })(),
  };
}
