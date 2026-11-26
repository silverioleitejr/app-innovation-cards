import React from 'react';
import { User, VotingState } from '../types';

interface BoardFooterProps {
  isAdmin: boolean;
  votingState: VotingState;
  votingBusy: boolean;
  onOpenVoting: () => void;
  onCloseVoting: () => void;
  onTallyVotes: () => void;
  onMoveElectedToEvaluation: () => void;
  displayedTopIdeas: any[];
  userVoteCard: any | null;
  onCardClick: (card: any) => void;
}

export function BoardFooter({
  isAdmin,
  votingState,
  votingBusy,
  onOpenVoting,
  onCloseVoting,
  onTallyVotes,
  onMoveElectedToEvaluation,
  displayedTopIdeas,
  userVoteCard,
  onCardClick,
}: BoardFooterProps) {
  const votingOpenClass = votingState.votingOpen
    ? 'border-[#0f766e]/30 bg-[#f0fdfa] text-[#0f766e]'
    : 'border-[#ff1f26]/30 bg-[#fff1f1] text-[#ff1f26]';

  const pinBadgeClass = votingState.votingOpen ? 'bg-[#0f766e]' : 'bg-[#ff1f26]';

  return (
    <footer
      aria-label="Comandos administrativos e ranking das Top 5 ideias"
      className="shrink-0 border-t border-[#dbd6d1] bg-[#fbf9f7] px-6 lg:px-8 py-3 z-20"
    >
      <div className="flex flex-col gap-2">
        {/* Row 1: Comandos Admin */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-black whitespace-nowrap">
              Comandos Admin
            </span>

            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[5px] border whitespace-nowrap ${votingOpenClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${pinBadgeClass}`}>
                <span className="sr-only">Status da votação</span>
              </span>
              <span>
                {votingState.votingOpen ? 'Votação Aberta' : 'Votação Fechada'}
                {votingState.currentSessionNumber ? ` · Sessão #${votingState.currentSessionNumber}` : ''}
              </span>
            </span>

            <div className="flex flex-wrap items-center gap-1.5 ml-1">
              <button
                type="button"
                disabled={!isAdmin || votingBusy || votingState.votingOpen}
                title={
                  !isAdmin
                    ? 'Disponível apenas para Administrador'
                    : votingState.votingOpen
                    ? 'A votação já está aberta'
                    : 'Iniciar nova sessão de votação e liberar o pin Voto +1 (1 por usuário)'
                }
                onClick={() => void onOpenVoting()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#dbd6d1] bg-white text-[#1c1b1a] hover:text-[#0f766e] hover:text-[#0f766e] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
              >
                Abrir Votação
              </button>

              <button
                type="button"
                disabled={!isAdmin || votingBusy || !votingState.votingOpen}
                title={
                  !isAdmin
                    ? 'Disponível apenas para Administrador'
                    : !votingState.votingOpen
                    ? 'A votação já está fechada'
                    : 'Encerrar a sessão atual e bloquear alterações no pin Voto +1'
                }
                onClick={() => void onCloseVoting()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#dbd6d1] bg-white text-[#1c1b1a] hover:text-[#ff1f26] hover:text-[#ff1f26] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
              >
                Fechar Votação
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Tops 5 Ideias */}
        <div className="pt-2 border-t border-[#ece7e5] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
            <span className="inline-flex items-center gap-1.5 font-semibold text-black whitespace-nowrap shrink-0">
              <svg width="3.5" height="3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 19l-4-4l4-4m5 10l-5-5l5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Tops 5 Ideias:</span>
            </span>

            {displayedTopIdeas.length === 0 ? (
              <span className="text-[#9d948e] whitespace-nowrap">
                Nenhuma ideia recebeu Voto +1 nesta sessão —abra a votação e anexe o pin Voto +1 nos cards.
              </span>
            ) : (
              <div className="flex items-center gap-1 min-w-0 whitespace-nowrap">
                {displayedTopIdeas.map((idea, idx) => {
                  return (
                    <React.Fragment key={idea.cardId}>
                      <button
                        type="button"
                        onClick={() => onCardClick(idea)}
                        title={`${idea.title} · ${idea.score} ${
                          idea.score === 1 ? 'Voto +1' : 'Votos +1'
                        }`}
                        className="inline-flex items-center gap-1 text-[#1c1b1a] hover:text-[#0b41cd] hover:underline transition-colors cursor-pointer"
                      >
                        <span className="font-mono text-[10px] text-[#0b41cd] font-medium">
                          #{idx + 1}
                        </span>
                        <span className="max-w-[200px] truncate">{idea.title}</span>
                        <span className="font-mono text-[10px] text-[#544f4f] tabular-nums">
                          ({idea.score})
                        </span>
                      </button>
                      {idx < displayedTopIdeas.length - 1 && (
                        <span aria-hidden="true" className="text-[#9d948e] mr-1">
                          ,
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-[10px] text-[#9d948e] whitespace-nowrap hidden sm:inline">
                {'Apurado às --:--'}
              </span>

              <div className="relative">
                <button
                  type="button"
                  disabled={displayedTopIdeas.length === 0}
                  aria-expanded={false}
                  aria-haspopup="menu"
                  title={
                    displayedTopIdeas.length === 0
                      ? 'Nenhuma ideia votada para exportar'
                      : 'Exportar Tops 5 Ideias em CSV ou PDF'
                  }
                  onClick={() => {}}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#dbd6d1] bg-white text-[#1c1b1a] hover:text-[#0b41cd] hover:text-[#0b41cd] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="sr-only">Exportar Top 5</span> Exportar Top 5
                </button>

                {displayedTopIdeas.length > 0 && (
                  <div
                    role="menu"
                    aria-label="Formato de exportação das Tops 5 Ideias"
                    className="absolute right-0 bottom-full mb-1.5 z-40 w-56 bg-white border border-[#dbd6d1] rounded-[6px] shadow-agile-float p-1.5 space-y-0.5"
                  >
                    <div className="px-2 py-1 text-[10px] font-medium text-[#9d948e]">
                      Exportar resultados da sessão
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {}}
                      className="w-full px-2.5 py-2 rounded-[4px] text-left hover:bg-[#f7f3f1] flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      <svg width="4" height="4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2H14zm4 6h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4v-4zm-6 4h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2v-4zm3-5a2 2 0 0 1 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1 0-4h2z" fill="currentColor" />
                      </svg>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#1c1b1a]">
                          Exportar CSV (.csv)
                        </div>
                        <div className="text-[10px] text-[#544f4f]">
                          Exportar PDF (.pdf)
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}