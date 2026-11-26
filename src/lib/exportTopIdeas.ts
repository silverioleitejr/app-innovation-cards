import { jsPDF } from 'jspdf';
import {
  STAGES,
  type IdeaCard,
  type RankedIdea,
  type Stage,
  type VotingState,
} from '../types';

function getStageTitle(stage: Stage): string {
  return STAGES.find((s) => s.id === stage)?.title ?? stage;
}

function formatDateTimePtBr(iso: string | Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(typeof iso === 'string' ? new Date(iso) : iso);
  } catch {
    return typeof iso === 'string' ? iso : iso.toISOString();
  }
}

function getFileDateStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (/[",\r\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildEnrichedRows(topIdeas: RankedIdea[], allCards: IdeaCard[]) {
  const cardById = new Map(allCards.map((c) => [c.id, c]));
  return topIdeas.slice(0, 5).map((idea, index) => {
    const card = cardById.get(idea.cardId);
    const stage = card?.stage ?? idea.stage;
    return {
      rank: index + 1,
      title: card?.title ?? idea.title,
      discipline: card?.discipline ?? '—',
      stageLabel: getStageTitle(stage),
      effort: card?.effort ?? '—',
      implementationModel: card?.implementationModel ?? '—',
      positiveVotes: idea.positiveVotes,
      negativeVotes: idea.negativeVotes,
      score: idea.score,
      authorName: card?.authorName ?? '—',
      technicalLead: card?.technicalLead?.trim() || '—',
      proposedSolution: card?.proposedSolution?.trim() || '',
      expectedBenefit: card?.expectedBenefit?.trim() || '',
      painOpportunity: card?.painOpportunity?.trim() || '',
    };
  });
}

export function exportTopIdeasToCsv(
  topIdeas: RankedIdea[],
  allCards: IdeaCard[],
  votingState: VotingState
): void {
  const rows = buildEnrichedRows(topIdeas, allCards);
  const sessionTag = votingState.currentSessionNumber
    ? `Sessao #${votingState.currentSessionNumber}`
    : 'Sessao Atual';

  const headers = [
    'Sessao de Votacao',
    'Posicao',
    'Titulo',
    'Categoria',
    'Etapa',
    'Esforco',
    'Modelo de Implementacao',
    'Votos (+1)',
    'Autor',
    'Lider Tecnico',
    'Solucao Proposta',
    'Beneficio Esperado',
  ];

  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) =>
      [
        sessionTag,
        `#${r.rank}`,
        r.title,
        r.discipline,
        r.stageLabel,
        r.effort,
        r.implementationModel,
        r.score,
        r.authorName,
        r.technicalLead,
        r.proposedSolution,
        r.expectedBenefit,
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ];

  // UTF-8 BOM ensures accented Portuguese characters render properly in Microsoft Excel
  const csvContent = `\uFEFF${csvLines.join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `innovation-board-top5-ideias-${getFileDateStamp()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportTopIdeasToPdf(
  topIdeas: RankedIdea[],
  allCards: IdeaCard[],
  votingState: VotingState
): void {
  const rows = buildEnrichedRows(topIdeas, allCards);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;

  const exportedAt = formatDateTimePtBr(new Date());
  const sessionLabel = votingState.currentSessionNumber
    ? `Sessão #${votingState.currentSessionNumber}`
    : 'Sessão Atual';
  const tallySummary = votingState.talliedAt
    ? `Apuração oficial em ${formatDateTimePtBr(votingState.talliedAt)}`
    : 'Ranking ao vivo (prévia antes da apuração oficial)';
  const votingStatusLabel = votingState.votingOpen ? 'Votação Aberta' : 'Votação Fechada';

  // Top OG1 Blue accent stripe
  doc.setFillColor(11, 65, 205);
  doc.rect(0, 0, pageWidth, 3.5, 'F');

  // Header
  let y = 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Innovation Board', marginX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(84, 79, 79);
  doc.text(`Exportado em ${exportedAt}`, pageWidth - marginX, y, { align: 'right' });

  y += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 65, 205);
  doc.text(`Resultados da Sessão de Inovação — Tops 5 Ideias (${sessionLabel})`, marginX, y);

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(84, 79, 79);
  doc.text(`${votingStatusLabel}  ·  ${tallySummary}`, marginX, y);

  // Hairline rule
  y += 4;
  doc.setDrawColor(219, 214, 209);
  doc.setLineWidth(0.35);
  doc.line(marginX, y, pageWidth - marginX, y);

  // Executive KPI Summary Strip
  y += 6;
  const totalVotesTop5 = rows.reduce((sum, r) => sum + r.score, 0);

  doc.setFillColor(251, 249, 247);
  doc.setDrawColor(219, 214, 209);
  doc.roundedRect(marginX, y, contentWidth, 16, 2, 2, 'FD');

  const kpiColW = contentWidth / 3;
  const kpis = [
    { label: 'SESSÃO', value: sessionLabel },
    { label: 'IDEIAS NO TOP 5', value: String(rows.length) },
    { label: 'TOTAL VOTO +1 (TOP 5)', value: String(totalVotesTop5) },
  ];

  kpis.forEach((kpi, i) => {
    const cx = marginX + i * kpiColW + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 114, 110);
    doc.text(kpi.label, cx, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(i === 2 ? 11 : 0, i === 2 ? 65 : 0, i === 2 ? 205 : 0);
    doc.text(kpi.value, cx, y + 12.5);
  });

  y += 23;

  // Ranked Idea Cards
  rows.forEach((row) => {
    const summaryText =
      row.proposedSolution || row.expectedBenefit || row.painOpportunity || 'Sem descrição detalhada cadastrada.';
    const wrappedTitle = doc.splitTextToSize(row.title, contentWidth - 46) as string[];
    const wrappedDesc = doc.splitTextToSize(summaryText, contentWidth - 10) as string[];
    const descLines = wrappedDesc.slice(0, 3);

    const cardHeight = 15 + wrappedTitle.length * 4.8 + descLines.length * 4.2 + 5;

    if (y + cardHeight > pageHeight - 18) {
      doc.addPage();
      doc.setFillColor(11, 65, 205);
      doc.rect(0, 0, pageWidth, 2.5, 'F');
      y = 16;
    }

    // Card frame
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(219, 214, 209);
    doc.setLineWidth(0.35);
    doc.roundedRect(marginX, y, contentWidth, cardHeight, 2, 2, 'FD');

    // Rank badge
    doc.setFillColor(240, 244, 255);
    doc.setDrawColor(11, 65, 205);
    doc.roundedRect(marginX + 4, y + 4, 10, 6.5, 1.2, 1.2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(11, 65, 205);
    doc.text(`#${row.rank}`, marginX + 9, y + 8.4, { align: 'center' });

    // Score pill on top-right
    const scoreText = `${row.score} ${row.score === 1 ? 'Voto +1' : 'Votos +1'}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(11, 65, 205);
    doc.text(scoreText, pageWidth - marginX - 4, y + 8.2, { align: 'right' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(wrappedTitle, marginX + 17, y + 8.2);

    // Metadata line
    const metaY = y + 8.2 + wrappedTitle.length * 4.8 + 1;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(84, 79, 79);
    const metaParts = [
      row.discipline,
      row.stageLabel,
      `Esforço ${row.effort}`,
      `Autor: ${row.authorName}`,
    ];
    if (row.technicalLead !== '—') {
      metaParts.push(`Líder: ${row.technicalLead}`);
    }
    doc.text(metaParts.join('  ·  '), marginX + 5, metaY);

    // Concise Description
    const descY = metaY + 5.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(45, 42, 40);
    doc.text(descLines, marginX + 5, descY);

    y += cardHeight + 4.5;
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(236, 231, 229);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(157, 148, 142);
    doc.text('Innovation Board · Relatório Tops 5 Ideias', marginX, pageHeight - 7);
    doc.text(`Página ${p} de ${pageCount}`, pageWidth - marginX, pageHeight - 7, {
      align: 'right',
    });
  }

  doc.save(`innovation-board-top5-ideias-${getFileDateStamp()}.pdf`);
}
