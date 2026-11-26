import React, { useRef, useState } from 'react';
import { ArrowRight, GripHorizontal } from 'lucide-react';
import {
  DISCIPLINE_META,
  getMatrixQuadrant,
  type IdeaCard,
  type RemoteCursor,
  type Stage,
  type User,
} from '../types';
import { CardPinsBar } from './CardPinsBar';
import { RemoteCursorsOverlay } from './RemoteCursorsOverlay';

interface MatrixCanvasViewProps {
  cards: IdeaCard[];
  currentUser: User;
  remoteCursors: RemoteCursor[];
  onCursorMove: (x: number, y: number, view: string) => void;
  onCardClick: (card: IdeaCard) => void;
  onMoveCard: (
    cardId: string,
    target: { stage: Stage; posX: number; posY: number }
  ) => Promise<void>;
}

export function MatrixCanvasView({
  cards,
  currentUser,
  remoteCursors,
  onCursorMove,
  onCardClick,
  onMoveCard,
}: MatrixCanvasViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<{
    cardId: string;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);

  const isViewer = currentUser.role === 'VIEWER';

  const matrixCards = cards.filter((c) => c.stage === 'EVALUATION');
  const pitchCards = cards.filter((c) => c.stage === 'PITCH');

  const getCoords = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 50, y: 50 };
    const x = Math.max(6, Math.min(94, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(8, Math.min(92, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { x, y } = getCoords(e.clientX, e.clientY);
    onCursorMove(x, y, 'matrix');

    if (activeDrag) {
      setActiveDrag((prev) =>
        prev
          ? {
              ...prev,
              x,
              y,
              moved: prev.moved || Math.abs(prev.x - x) > 0.6 || Math.abs(prev.y - y) > 0.6,
            }
          : null
      );
    }
  };

  const handlePointerUp = async () => {
    if (!activeDrag) return;
    const finished = activeDrag;
    setActiveDrag(null);
    if (finished.moved) {
      await onMoveCard(finished.cardId, {
        stage: 'EVALUATION',
        posX: Math.round(finished.x),
        posY: Math.round(finished.y),
      });
    } else {
      const card = cards.find((c) => c.id === finished.cardId);
      if (card) onCardClick(card);
    }
  };

  const handleDropPitchCard = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isViewer) return;
    const cardId = e.dataTransfer.getData('text/plain');
    if (!cardId) return;
    const { x, y } = getCoords(e.clientX, e.clientY);
    await onMoveCard(cardId, {
      stage: 'EVALUATION',
      posX: Math.round(x),
      posY: Math.round(y),
    });
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 px-6 lg:px-8 py-6 bg-white overflow-y-auto">
      {/* Left Sidebar: Pitch Queue Ready to Evaluate */}
      <aside className="lg:col-span-3 bg-white border border-[#dbd6d1] rounded-[6px] flex flex-col overflow-hidden">
        <div className="px-4 py-3.5 bg-[#fbfbfa] border-b border-[#dbd6d1]">
          <h2 className="font-editorial text-[18px] font-semibold text-black">
            Fila de Pitch ({pitchCards.length})
          </h2>
          <p className="text-xs text-[#544f4f] mt-0.5">
            Arraste para a matriz para posicionar Esforço × Benefício.
          </p>
        </div>

        <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
          {pitchCards.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#706b69]">
              Todas as ideias de Pitch já avançaram no funil.
            </div>
          ) : (
            pitchCards.map((card) => {
              const meta = DISCIPLINE_META[card.discipline];
              return (
                <div
                  key={card.id}
                  draggable={!isViewer}
                  onDragStart={(e) => {
                    if (isViewer) return;
                    e.dataTransfer.setData('text/plain', card.id);
                  }}
                  onClick={() => onCardClick(card)}
                  className={`p-3 bg-[#fff7f5] border border-[#dbd6d1] rounded-[6px] hover:border-[#0b41cd] hover:bg-[#d7e0f7]/35 transition-colors ${
                    isViewer ? 'cursor-pointer' : 'cursor-grab'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] mb-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span style={{ color: meta.color }} className="font-semibold">
                      {meta.short}
                    </span>
                    <span className="text-[#9d948e]">·</span>
                    <span className="font-mono text-[#706b69]">Esforço {card.effort}</span>
                  </div>
                  <div className="text-xs font-semibold text-black leading-snug mb-2">
                    {card.title}
                  </div>
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveCard(card.id, { stage: 'EVALUATION', posX: 30, posY: 30 });
                      }}
                      className="text-[11px] font-medium text-[#0b41cd] hover:text-[#052066] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Posicionar na matriz</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main 2×2 Interactive Spatial Matrix */}
      <section className="lg:col-span-9 flex flex-col">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-xs text-[#544f4f]">
            <span className="font-semibold text-black">Eixo Vertical:</span> Benefício Esperado (Alto
            no topo) · <span className="font-semibold text-black">Eixo Horizontal:</span> Esforço de
            Implementação (Baixo à esquerda)
          </div>
          <span className="font-mono text-xs text-[#706b69] tabular-nums">
            {matrixCards.length} em avaliação
          </span>
        </div>

        <div
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onDragOver={(e) => {
            if (!isViewer) e.preventDefault();
          }}
          onDrop={handleDropPitchCard}
          className="relative flex-1 min-h-[540px] bg-white border border-[#dbd6d1] rounded-[6px] overflow-hidden select-none"
        >
          <RemoteCursorsOverlay cursors={remoteCursors} activeView="matrix" />

          {/* Subtle Quadrant Tints & Hairline Axes */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
            <div className="bg-[#d7e0f7]/35 border-r border-b border-dashed border-[#c2bab5] p-6">
              <div className="font-editorial text-[20px] font-normal text-[#0b41cd]">
                Ganhos Rápidos (Quick Wins)
              </div>
              <div className="text-xs text-[#544f4f]">Alto benefício · Baixo esforço</div>
            </div>
            <div className="bg-[#fff7f5]/75 border-b border-dashed border-[#c2bab5] p-6 text-right">
              <div className="font-editorial text-[20px] font-normal text-black">
                Projetos Estruturantes
              </div>
              <div className="text-xs text-[#544f4f]">Alto benefício · Alto esforço</div>
            </div>
            <div className="bg-white border-r border-dashed border-[#c2bab5] p-6 flex flex-col justify-end">
              <div className="font-editorial text-[20px] font-normal text-[#544f4f]">
                Melhorias Contínuas
              </div>
              <div className="text-xs text-[#706b69]">Benefício moderado · Baixo esforço</div>
            </div>
            <div className="bg-[#f5f5f2]/75 p-6 flex flex-col justify-end text-right">
              <div className="font-editorial text-[20px] font-normal text-[#706b69]">Icebox</div>
              <div className="text-xs text-[#706b69]">Benefício moderado · Alto esforço</div>
            </div>
          </div>

          {/* Interactive Draggable Matrix Cards */}
          {matrixCards.map((card) => {
            const isDragging = activeDrag?.cardId === card.id;
            const x = isDragging ? activeDrag.x : card.posX;
            const y = isDragging ? activeDrag.y : card.posY;
            const meta = DISCIPLINE_META[card.discipline];
            const quadrant = getMatrixQuadrant(x, y);

            return (
              <div
                key={card.id}
                onPointerDown={(e) => {
                  if (isViewer) {
                    onCardClick(card);
                    return;
                  }
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setActiveDrag({ cardId: card.id, x: card.posX, y: card.posY, moved: false });
                }}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-56 bg-white border rounded-[6px] p-3 transition-shadow ${
                  isDragging
                    ? 'z-30 border-[#0b41cd] shadow-agile-lift cursor-grabbing ring-2 ring-[#d7e0f7]'
                    : 'z-10 border-[#dbd6d1] shadow-agile-float hover:border-[#0b41cd] cursor-grab'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="font-semibold truncate" style={{ color: meta.color }}>
                      {meta.short}
                    </span>
                    <span className="text-[#9d948e]">·</span>
                    <span className="font-mono text-[#706b69]">{card.effort}</span>
                  </div>
                  {!isViewer && <GripHorizontal className="w-3.5 h-3.5 text-[#706b69] shrink-0" />}
                </div>
                <div className="font-editorial text-sm font-semibold text-black leading-snug line-clamp-2 mb-1.5">
                  {card.title}
                </div>
                <CardPinsBar
                  pins={card.pins ?? []}
                  currentUserId={currentUser.id}
                  readOnly
                  variant="matrix"
                />
                <div className="flex items-center justify-between text-[10px] text-[#544f4f] pt-1.5 mt-1.5 border-t border-[#eae8e5]">
                  <span className="truncate">{quadrant.label.split(' ')[0]}</span>
                  <span className="font-mono tabular-nums text-[#706b69]">
                    ({Math.round(x)}, {Math.round(100 - y)})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
