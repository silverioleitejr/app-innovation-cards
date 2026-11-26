import React from 'react';
import { IdeaCard } from '../types';
import { DISCIPLINE_META } from '../types';
import { CardPinsBar } from './CardPinsBar';

interface BoardColumnProps {
  stage: typeof import('../types').STAGES[number];
  cards: IdeaCard[];
  currentUser: import('../types').User;
  isViewer: boolean;
  votingState: import('../types').VotingState;
  votingBusy: boolean;
  onCardClick: (card: IdeaCard, focusRefinement?: boolean) => void;
  onTogglePin: (cardId: string, pinType: import('../types').PinType) => Promise<void>;
  onOpenMatrixView: () => void;
  variant?: 'compact' | 'default';
}

export function BoardColumns({
  stage,
  cards,
  currentUser,
  isViewer,
  votingState,
  votingBusy,
  onCardClick,
  onTogglePin,
  onOpenMatrixView,
  variant = 'default',
}: BoardColumnProps) {
  const canQuickCreateHere = !isViewer && stage.id !== 'BACKLOG';
  const displayedTopIdeas = votingState.talliedAt && votingState.topIdeas.length > 0
    ? votingState.topIdeas.slice(0, 5)
    : [];

  return (
    <section
      onDragOver={(e) => {/* handleStageDragOver would be passed */}}
      onDragLeave={() => {/* setDragOverStage */}}
      onDrop={(e) => {/* handleStageDrop */}}
      className="flex flex-col rounded-[8px] border transition-colors min-h-[520px]"
    >
      {/* Column Editorial Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="px-4 py-3.5 bg-white border-b border-[#dbd6d1] rounded-t-[7px] flex items-start justify-between gap-2"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#0b41cd] font-medium tabular-nums">
              {stage.index}
            </span>
            <h2 className="font-editorial text-[16px] font-medium text-black truncate">
              {stage.title}
            </h2>
          </div>
          <p className="text-xs text-[#544f4f] mt-0.5 truncate">{stage.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-xs text-[#544f4f] tabular-nums px-1.5 py-0.5 bg-[#f7f3f1] border border-[#dbd6d1] rounded-full">
            {cards.length}
          </span>
          {canQuickCreateHere && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // openInlineDraft would be handled by parent
              }}
              title={`Criar card rápido em ${stage.title}`}
              className="p-1 text-[#544f4f] hover:text-[#0b41cd] hover:bg-[#f0f4ff] rounded-[6px] transition-colors cursor-pointer"
            >
              <svg
                width="4"
                height="4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 19l-4-4l4-4m5 10l-5-5l5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {stage.id === 'EVALUATION' && (
            <button
              type="button"
              onClick={() => onOpenMatrixView()}
              title="Expandir Matriz Esforço × Benefício"
              className="p-1 text-[#544f4f] hover:text-[#0b41cd] hover:bg-[#f0f4ff] rounded-[6px] transition-colors cursor-pointer"
            >
              <svg
                width="3.5"
                height="3.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="15" y2="21" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Quality Gate Live Hint Banner when dragging into Backlog */}
      {stage.id === 'BACKLOG' && (
        <div
          className={`px-4 py-2 border-b text-[11px] flex items-center gap-1.5`}
        >
          <svg
            width="3"
            height="3"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          </svg>
          <span className="truncate">
            {'Trava de qualidade: Arquitetura, Critérios MVP e Líder Técnico'}
          </span>
        </div>
      )}

      {/* Column Cards Grid */}
      <div
        className={`p-2.5 flex-1 flex flex-col gap-2.5`}
      >
        {cards.length === 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`h-28 border border-dashed border-[#dbd6d1] rounded-[6px] flex flex-col items-center justify-center text-center px-4 transition-colors cursor-pointer`}
          >
            <p className="text-xs text-[#9d948e]">
              {isViewer
                ? 'Nenhuma iniciativa nesta etapa.'
                : 'Arraste uma iniciativa refinada (3/3) para promover ao Backlog.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 items-stretch">
            {cards.map((card) => {
              const meta = DISCIPLINE_META[card.discipline];
              const gate = {
                valid: true,
                completedCount: 0,
                missingFields: [],
              };

              return (
                <div
                  key={card.id}
                  className="group h-full bg-white border border-[#dbd6d1] rounded-[6px] p-2.5 flex flex-col justify-between min-h-[112px] transition-all duration-150"
                >
                  {/* Compact Card Title + Drag Grip */}
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-editorial text-[13px] font-medium leading-snug text-black line-clamp-2 min-w-0">
                      {card.title}
                    </h3>
                  </div>

                  {/* Category + Compact Pin Bar */}
                  <div className="space-y-1.5 mt-auto">
                    <div className="flex items-center justify-between gap-1 text-[11px] min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="truncate font-medium">{card.discipline}</span>
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* Pin voting would be rendered by parent */}
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-[#f0ece9]">
                      <CardPinsBar
                        cardId={card.id}
                        pins={card.pins ?? []}
                        currentUserId={currentUser.id}
                        readOnly={isViewer}
                        votingOpen={votingState.votingOpen}
                        votingSessionNumber={votingState.currentSessionNumber}
                        userVoteCard={null}
                        variant="compact"
                        className="mb-0"
                        onTogglePin={(pinType) => onTogglePin(card.id, pinType)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}