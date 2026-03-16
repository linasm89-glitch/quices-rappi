/**
 * exportService.js
 * Generates Excel workbooks for session analytics using ExcelJS.
 */

const ExcelJS = require('exceljs');

// ─── Color Constants ──────────────────────────────────────────────────────────
const RAPPI_ORANGE    = 'FFFF441F';
const WHITE           = 'FFFFFFFF';
const LIGHT_GRAY      = 'FFF9FAFB';
const GOLD_BORDER     = 'FFFFD700';
const SILVER_BORDER   = 'FFC0C0C0';
const BRONZE_BORDER   = 'FFCD7F32';
const LIGHT_RED       = 'FFFEE2E2';
const LIGHT_GREEN     = 'FFDCFCE7';

/**
 * Builds an ARGB fill object for ExcelJS.
 * @param {string} argb
 */
function fill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

/**
 * Builds a border definition for the left side.
 * @param {string} argb
 */
function leftBorder(argb) {
  return {
    left: { style: 'thick', color: { argb } },
  };
}

/**
 * Applies bold white text on Rappi orange background to a row.
 * @param {ExcelJS.Row} row
 */
function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 };
    cell.fill = fill(RAPPI_ORANGE);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  row.height = 22;
}

/**
 * generateSessionExport(sessionData) → Buffer (xlsx)
 *
 * @param {object} sessionData
 * @param {object} sessionData.session     - { id, name, date }
 * @param {Array}  sessionData.leaderboard - [{ rank, name, email, totalScore, correctAnswers, totalQuestions, avgResponseTimeMs }]
 * @param {Array}  sessionData.questionStats - [{ questionIndex, title, correctOptionId, correctPct, avgTimeMs, optionCounts }]
 * @param {object} sessionData.summary    - { teamAvgScore, teamAvgCorrectPct, hardestQuestion, easiestQuestion }
 * @returns {Promise<Buffer>}
 */
async function generateSessionExport(sessionData) {
  const { session = {}, leaderboard = [], questionStats = [], summary = {} } = sessionData;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'The Training Hour';
  workbook.created = new Date();

  // ── Sheet 1: Participantes ─────────────────────────────────────────────────
  const sheet1 = workbook.addWorksheet('Participantes');

  // Column definitions
  sheet1.columns = [
    { header: 'Posición',           key: 'rank',        width: 12 },
    { header: 'Nombre',             key: 'name',        width: 30 },
    { header: 'Correo',             key: 'email',       width: 35 },
    { header: 'Puntaje Total',      key: 'score',       width: 15 },
    { header: 'Resp. Correctas',    key: 'correct',     width: 18 },
    { header: '% Acierto',          key: 'pct',         width: 15 },
    { header: 'Tiempo Promedio (s)', key: 'avgTime',    width: 20 },
  ];

  // Style header row
  styleHeaderRow(sheet1.getRow(1));

  // Freeze header
  sheet1.views = [{ state: 'frozen', ySplit: 1 }];

  // Add data rows
  leaderboard.forEach((p, idx) => {
    const totalQ = p.totalQuestions > 0 ? p.totalQuestions : 1;
    const correctPct = Math.round((p.correctAnswers / totalQ) * 100);
    const avgTimeSec = ((p.avgResponseTimeMs || 0) / 1000).toFixed(1) + 's';

    const row = sheet1.addRow({
      rank:    p.rank,
      name:    p.name,
      email:   p.email,
      score:   p.totalScore,
      correct: `${p.correctAnswers}/${p.totalQuestions}`,
      pct:     `${correctPct}%`,
      avgTime: avgTimeSec,
    });

    // Alternate row background
    const rowFill = idx % 2 === 0 ? WHITE : LIGHT_GRAY;
    row.eachCell((cell) => {
      cell.fill = fill(rowFill);
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Medal left borders for top 3
    if (p.rank === 1) row.getCell(1).border = leftBorder(GOLD_BORDER);
    if (p.rank === 2) row.getCell(1).border = leftBorder(SILVER_BORDER);
    if (p.rank === 3) row.getCell(1).border = leftBorder(BRONZE_BORDER);

    row.height = 18;
  });

  // ── Sheet 2: Preguntas ─────────────────────────────────────────────────────
  const sheet2 = workbook.addWorksheet('Preguntas');

  sheet2.columns = [
    { header: 'N°',           key: 'num',       width: 6  },
    { header: 'Pregunta',     key: 'title',     width: 45 },
    { header: 'Resp. Correcta', key: 'correct', width: 14 },
    { header: '% Acierto',    key: 'pct',       width: 12 },
    { header: 'Tiempo Prom. (s)', key: 'avgTime', width: 18 },
    { header: 'Opción A%',    key: 'optA',      width: 12 },
    { header: 'Opción B%',    key: 'optB',      width: 12 },
    { header: 'Opción C%',    key: 'optC',      width: 12 },
    { header: 'Opción D%',    key: 'optD',      width: 12 },
  ];

  styleHeaderRow(sheet2.getRow(1));
  sheet2.views = [{ state: 'frozen', ySplit: 1 }];

  const hardestIdx =
    summary.hardestQuestion != null ? summary.hardestQuestion.questionIndex : -1;
  const easiestIdx =
    summary.easiestQuestion != null ? summary.easiestQuestion.questionIndex : -1;

  questionStats.forEach((q, idx) => {
    const avgTimeSec = ((q.avgTimeMs || 0) / 1000).toFixed(1) + 's';

    const row = sheet2.addRow({
      num:     q.questionIndex + 1,
      title:   q.title,
      correct: (q.correctOptionId || '').toUpperCase(),
      pct:     `${q.correctPct}%`,
      avgTime: avgTimeSec,
      optA:    `${q.optionCounts?.a ?? 0}%`,
      optB:    `${q.optionCounts?.b ?? 0}%`,
      optC:    `${q.optionCounts?.c ?? 0}%`,
      optD:    `${q.optionCounts?.d ?? 0}%`,
    });

    // Highlight hardest/easiest
    let rowFill = idx % 2 === 0 ? WHITE : LIGHT_GRAY;
    if (q.questionIndex === hardestIdx && hardestIdx !== easiestIdx) {
      rowFill = LIGHT_RED;
    } else if (q.questionIndex === easiestIdx) {
      rowFill = LIGHT_GREEN;
    }

    row.eachCell((cell) => {
      cell.fill = fill(rowFill);
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Left-align question title
    row.getCell('title').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

    row.height = 18;
  });

  // ── Generate buffer ────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generateSessionExport };
