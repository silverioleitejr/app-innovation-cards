import React from 'react';
import { STAGES } from '../types';

interface BoardHeaderProps {
  stages: typeof STAGES;
  inlineDraft: {
    stage: string | null;
    error: string | null;
    saving: boolean;
  } | null;
  isViewer: boolean;
  canQuickCreateHere: boolean;
  stageId: string | null;
  openInlineDraft: (stage: string) => void;
  canPromoteBacklog: boolean;
  draggingGate?: {
    valid: boolean;
    missingFields: string[];
  } | null;
}

export function BoardHeader({
  stages,
  inlineDraft,
  isViewer,
  canQuickCreateHere,
  stageId,
  openInlineDraft,
  canPromoteBacklog,
  draggingGate,
}: BoardHeaderProps) {
  // Render each stage column
  const stageElements = stages.map((stage) => {
    const isDropTarget = stageId === stage.id;
    const canQuickCreateHereStage = canQuickCreateHere && stage.id !== 'BACKLOG';
    const hasInlineDraftHere = inlineDraft?.stage === stage.id;

    // Backlog blocked preview logic
    const isBacklogBlockedPreview =
      isDropTarget &&
      stage.id === 'BACKLOG' &&
      (!canPromoteBacklog || (draggingGate && !draggingGate.valid));

    return (
      <div
        key={stage.id}
        className="flex flex-col rounded-[8px] border transition-colors min-h-[520px]"
      >
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
            <p className="text-xs text-[#544f4f] mt-0.5 truncate">
              {stage.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-xs text-[#544f4f] tabular-nums px-1.5 py-0.5 bg-[#f7f3f1] border border-[#dbd6d1] rounded-full">
              0
            </span>
            {canQuickCreateHereStage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openInlineDraft(stage.id);
                }}
                title={`Criar card rápido em ${stage.title}`}
                className="p-1 text-[#544f4f] hover:text-[#0b41cd] hover:bg-[#f0f4ff] rounded-[6px] transition-colors cursor-pointer"
              >
                +
              </button>
            )}
            {stage.id === 'EVALUATION' && (
              <button
                type="button"
                onClick={() => openInlineDraft('EVALUATION')}
                title="Expandir Matriz"
                className="p-1 text-[#544f4f] hover:text-[#0b41cd] hover:bg-[#f0f4ff] rounded-[6px] transition-colors cursor-pointer"
              >
                □
              </button>
            )}
          </div>
        </div>

        {/* Quality Gate Banner for Backlog */}
        {stage.id === 'BACKLOG' && (
          <div
            className="px-4 py-2 border-b text-[11px] flex items-center gap-1.5"
          >
            <svg width="3" height="3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
            <span className="truncate">
              {'Trava de qualidade'}
            </span>
          </div>
        )}

        <div className="p-2.5 flex-1 flex flex-col gap-2.5">
          {/* Cards placeholder - rendered by parent component */}
        </div>
      </div>
    );
  });
}