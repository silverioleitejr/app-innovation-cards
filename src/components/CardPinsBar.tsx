import React from 'react';
import { Heart, Plus, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { CardPin, PinType } from '../types';
import { useCardPin, useGroupedPins, useVoteValidation } from '../hooks/useCardPinsManagement';

export interface CardPinsBarProps {
  cardId?: string;
  pins: CardPin[];
  currentUserId: string;
  readOnly?: boolean;
  votingOpen?: boolean;
  votingSessionNumber?: number | null;
  userVoteCard?: { cardId: string; title: string } | null;
  variant?: 'compact' | 'full' | 'matrix';
  className?: string;
  onTogglePin?: (pinType: PinType) => void;
}

function renderPinIcon(type: PinType, className: string): React.ReactNode {
  switch (type) {
    case 'vote_plus':
      return <Plus className={className} />;
    case 'applause':
      return <Sparkles className={className} />;
    case 'thumbs_up':
      return <ThumbsUp className={className} />;
    case 'thumbs_down':
      return <ThumbsDown className={className} />;
    case 'heart':
      return <Heart className={className} />;
  }
}

export function CardPinsBar({
  cardId,
  pins,
  currentUserId,
  readOnly = false,
  votingOpen = true,
  votingSessionNumber = null,
  userVoteCard = null,
  variant = 'compact',
  className = '',
  onTogglePin,
}: CardPinsBarProps) {
  const resolvedCardId = cardId ?? pins[0]?.cardId ?? '';

  const { pinType: userPinType } = useCardPin(resolvedCardId, currentUserId, pins, {
    userVoteCard,
    votingOpen,
  });

  const grouped = useGroupedPins(pins, currentUserId);

  const { validationMessage, voteUsedOnOtherCard, voteLockedClosed } = useVoteValidation(
    currentUserId,
    userVoteCard,
    votingOpen,
    votingSessionNumber,
    resolvedCardId
  );

  const groupedWithBlocking = grouped.map((g) => {
    const isVotePlus = g.type === 'vote_plus';
    const blockedByClosed =
      (isVotePlus && voteLockedClosed) || (userPinType === 'vote_plus' && voteLockedClosed);
    const blockedByRuleB = isVotePlus && voteUsedOnOtherCard && !g.mine;
    return {
      ...g,
      blockedByClosed,
      blockedByRuleB,
    };
  });

  const visibleItems =
    variant === 'matrix'
      ? groupedWithBlocking.filter((g) => g.count > 0)
      : groupedWithBlocking;

  if (variant === 'matrix' && visibleItems.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {visibleItems.map((g) => {
        const isBlocked = g.blockedByClosed || g.blockedByRuleB;
        const tooltipParts = [
          `${g.meta.label}: ${g.count}`,
          g.names.length > 0 ? g.names.join(', ') : null,
          isBlocked && validationMessage ? validationMessage : null,
        ].filter(Boolean);

        return (
          <button
            key={g.type}
            type="button"
            disabled={readOnly}
            title={tooltipParts.join(' · ')}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly && onTogglePin) {
                onTogglePin(g.type);
              }
            }}
            className={`inline-flex items-center gap-1 rounded-[50px] border transition-colors ${
              variant === 'full' ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'
            } ${
              g.mine
                ? 'border-[#0b41cd] bg-[#d7e0f7] text-[#052066] font-semibold'
                : g.count > 0
                ? 'border-[#dbd6d1] bg-[#f5f5f2] text-[#21201f] hover:border-[#aec0ee] hover:bg-[#d7e0f7]/55'
                : 'border-transparent bg-transparent text-[#706b69] hover:border-[#dbd6d1] hover:bg-[#f5f5f2]'
            } ${
              readOnly
                ? 'cursor-default'
                : isBlocked && g.isVotePlus
                ? 'opacity-[0.62] cursor-pointer'
                : 'cursor-pointer'
            }`}
          >
            <span style={{ color: g.mine || g.count > 0 ? g.meta.accentColor : undefined }}>
              {renderPinIcon(g.type, variant === 'full' ? 'w-3.5 h-3.5 shrink-0' : 'w-2.5 h-2.5 shrink-0')}
            </span>
            {variant === 'full' && <span>{g.meta.shortLabel}</span>}
            {(g.count > 0 || variant === 'full') && (
              <span className="font-mono tabular-nums">{g.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
