// =====================================================
//  MISSÕES DO JOÃO — servidor (Google Apps Script) v12
//  A TELA do app agora fica no GitHub:
//    https://thiagogaldinozicao-source.github.io/missoes-do-joao/
//  Este código é só a "ponte" entre o app e a planilha.
//  Tudo fica salvo nesta planilha:
//   • aba "Historico" → tudo que aconteceu (pontos, pedidos, bike)
//   • aba "Missoes"   → lista de missões (pode editar direto aqui!)
//   • aba "Premios"   → lista de prêmios (pode editar direto aqui!)
// =====================================================

// 👇 SENHA DO PAI
const SENHA_PAI = '1221';

// 💰 QUANTO VALE O PONTO
const REAIS_POR_1000 = 10;        // 1.000 pontos = R$ 10 em prêmio
const BIKE_META = 3000;           // preço da bike (R$)
const BIKE_PONTOS = 1000;         // ele troca de 1.000 em 1.000 pontos...
const BIKE_REAIS = 20;            // ...e vira R$ 20 na bike (o pai dobra)

// 🔥 COMBO DO DIA: fez 3 missões no mesmo dia, ganha bônus
const COMBO_MIN = 3;
const COMBO_PTS = 100;

// 🎁 BAÚ DO DIA: ele abre o app e ganha pontos surpresa (1 vez por dia)
const BAU = [[10, 30], [20, 30], [30, 20], [50, 15], [100, 5]]; // [pontos, chance %]
const BAU_LENDARIO = 150;  // no 7º dia seguido de login o baú é lendário

// 🧢 TETO DO DIA: máximo de pontos de missões DIÁRIAS por dia (0 = sem teto).
// O que passar do teto não vira ponto, só XP (metas da semana, baú e combo não contam no teto).
const TETO_DIA = 500;

// 📧 Te avisa por e-mail (no seu Gmail) quando o João pedir algo
const AVISAR_EMAIL = true;

// 🎟️ PASSE DE TEMPORADA: 1 temporada por mês, 30 níveis (igual battle pass)
const PASSE_XP_NIVEL = 150;   // XP pra subir cada nível do passe (30 níveis = 4.500 XP no mês)
const PASSE_NIVEIS = 30;
// Níveis que dão pontos de verdade (ele resgata no app). Máximo ~R$ 8,50 por mês.
const PASSE_BONUS = { 5: 50, 10: 100, 15: 100, 20: 150, 25: 150, 30: 300 };
const TEMPORADA_1 = '2026-10'; // mês da Temporada 1

// ⚡ DESAFIO RELÂMPAGO: todo dia 1 missão diária sorteada vale o dobro
const RELAMPAGO_MULT = 2;

// 🔥 OFERTA DA SEMANA: 1 prêmio com desconto, troca toda segunda-feira
const OFERTA_DESCONTO = 30;               // % de desconto
const OFERTA_MIN = 800, OFERTA_MAX = 8000; // só prêmios nessa faixa de pontos entram na oferta

// 📬 RESUMO SEMANAL: te manda um e-mail todo domingo às 20h
const RESUMO_DOMINGO = true;

// 🏆 CONQUISTAS: cada uma dá pontos UMA VEZ SÓ (o app confere sozinho se ele cumpriu).
// Todas juntas somam 5.350 pts (≈ R$ 53 no total, espalhado em meses). Pode mudar os pontos aqui.
// [id, emoji, nome, meta, pontos]
const CONQUISTAS = [
  ['m1',       '🎯', 'Primeira missão',         1,    50],
  ['fogo3',    '🔥', '3 dias seguidos',         3,   100],
  ['fogo7',    '🔥', 'Semana de fogo',          7,   250],
  ['fogo30',   '☄️', 'Mês lendário',           30,  1000],
  ['nv5',      '⭐', 'Nível 5',                 5,   150],
  ['nv10',     '👑', 'Nível 10',               10,   500],
  ['duo20',    '🦉', 'Poliglota',              20,   200],
  ['tela10',   '📱', 'Dono do tempo',          10,   200],
  ['vo15',     '👵', 'Neto de ouro',           15,   250],
  ['faxina20', '🧽', 'Faxina braba',           20,   250],
  ['nota1',    '💯', 'Cabeção',                 1,   150],
  ['premio1',  '🎁', 'Primeiro prêmio',         1,    50],
  ['bike1',    '🚲', 'Primeira grana na bike',  1,    50],
  ['bike500',  '🏅', 'R$ 500 na bike',        500,   200],
  ['bike1000', '🥇', 'R$ 1.000 na bike',     1000,   300],
  ['bikemeia', '🛞', 'Meia bike',               0,   500], // meta = metade de BIKE_META
  ['m100',     '🏆', '100 missões',           100,   500],
  ['passe10',  '🎟️', 'Passe nível 10',         10,   150],
  ['passe30',  '🏆', 'Passe completo',         30,   500]
];

// 🌐 Endereço do app (GitHub Pages)
const SITE_URL = 'https://thiagogaldinozicao-source.github.io/missoes-do-joao/';

// 🎮 Ícone do app (aparece na aba do navegador)
const FAVICON = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3ae.png';

const TZ = 'America/Sao_Paulo';
const ABA = 'Historico';
const ABA_M = 'Missoes';
const ABA_P = 'Premios';
const CAB = ['Data', 'Tipo', 'Descrição', 'Pontos', 'Bike (R$)', 'Status', 'ID', 'Chave', 'Quem', 'Obs'];

// Listas iniciais (só usadas na 1ª vez; depois vale o que estiver na planilha)
const MISSOES_PADRAO = [
  ['Frequência', 'Emoji', 'Missão', 'Pontos', 'Como provar', 'Ativa'],
  ['Diária', '📚', 'Fez a lição / estudou', 100, 'Foto da lição feita', 'SIM'],
  ['Diária', '📓', 'Mostrou o caderno com a matéria do dia', 60, 'Foto do caderno', 'SIM'],
  ['Diária', '🦉', 'Fez o Duolingo', 30, 'Print do Duolingo', 'SIM'],
  ['Diária', '📱', 'Tempo de tela abaixo de 5h hoje', 100, 'Print de Ajustes → Tempo de Uso', 'SIM'],
  ['Diária', '⏰', 'Largou o jogo no horário combinado', 80, 'A vó confirma', 'SIM'],
  ['Diária', '🧼', 'Lavou o banheiro', 120, 'Foto do banheiro limpo', 'SIM'],
  ['Diária', '🍽️', 'Lavou a louça', 60, 'Foto da pia limpa', 'SIM'],
  ['Diária', '🧹', 'Varreu / arrumou a casa', 60, 'Foto ou a vó confirma', 'SIM'],
  ['Diária', '🛏️', 'Arrumou o quarto', 40, 'Foto do quarto', 'SIM'],
  ['Diária', '👵', 'Ajudou a vó Nelma', 80, 'A vó confirma', 'SIM'],
  ['Diária', '🌳', 'Ajudou na roça', 80, 'Foto ou a vó confirma', 'SIM'],
  ['Diária', '⚽', 'Fez algo fora de casa (bola, bike, pescar...)', 80, 'Foto', 'SIM'],
  ['Diária', '⭐', 'Fez algo sem ninguém pedir', 100, 'Foto ou a vó confirma', 'SIM'],
  ['Diária', '💯', 'Nota boa numa prova', 300, 'Foto da prova corrigida', 'SIM'],
  ['Semanal', '🔥', 'Ofensiva do Duolingo a semana toda', 150, 'Print da ofensiva', 'SIM'],
  ['Semanal', '📉', 'Semana com menos tela que a anterior', 300, 'Print do Tempo de Uso semanal', 'SIM'],
  ['Semanal', '📖', 'Estudou todo dia de segunda a sexta', 250, 'Fotos da semana', 'SIM'],
  ['Semanal', '🤐', 'Semana inteira sem palavrão', 250, 'A vó confirma', 'SIM'],
  ['Semanal', '🤝', 'Semana ajudando a vó sem reclamar', 250, 'A vó confirma', 'SIM']
];
// Novidades da v7: entram sozinhas na planilha (só se ainda não existirem)
const NOVAS_MISSOES = [
  ['Diária', '🚿', 'Acordou e se arrumou sem ninguém chamar', 40, 'A vó confirma', 'SIM'],
  ['Diária', '💪', 'Fez 15 min de exercício (flexão, abdominal, correr)', 60, 'Vídeo curtinho', 'SIM'],
  ['Diária', '📖', 'Leu 10 páginas de um livro', 60, 'Foto da página', 'SIM'],
  ['Diária', '🐔', 'Cuidou dos bichos', 50, 'Foto', 'SIM'],
  ['Diária', '🍳', 'Fez um lanche ou comida pra vó', 80, 'Foto', 'SIM'],
  ['Semanal', '⭐', 'Fez missão (fora o Duolingo) em 5 dias da semana', 300, 'O pai confere no histórico', 'SIM']
];
const NOVOS_PREMIOS = [
  ['🎮', '1 hora de Warzone com o pai', 400, 'O pai joga junto', 'SIM'],
  ['📱', 'Troca de celular (upgrade na Zicão Store)', 40000, 'Pro próximo modelo', 'SIM']
];

const PREMIOS_PADRAO = [
  ['Emoji', 'Prêmio', 'Pontos', 'Detalhe', 'Ativo'],
  ['🍽️', 'Escolher o que vai ter de janta', 150, 'Sem custo', 'SIM'],
  ['🎫', 'Vale folga de 1 tarefa', 250, 'Tipo 1 louça', 'SIM'],
  ['🍫', 'Lanche ou doce favorito', 1000, 'Até R$ 10', 'SIM'],
  ['💥', 'Gemas no Brawl Stars', 2000, 'Até R$ 20', 'SIM'],
  ['🚗', 'Rolê / passeio com o pai', 3000, 'Ele escolhe o rolê', 'SIM'],
  ['🎟️', '800 V-Bucks ou Passe de Batalha', 3200, 'R$ 31,99', 'SIM'],
  ['🍕', 'Pizza', 5000, 'Até R$ 50', 'SIM'],
  ['🏝️', '2.400 V-Bucks', 7500, 'R$ 78,99', 'SIM'],
  ['🎧', 'Fone ou acessório da loja', 8000, 'Da Zicão Store', 'SIM']
];

// ---------------------------------------------------------------
// Funções que o app pode chamar pela internet
const API = {
  getEstado: getEstado, checarSenha: checarSenha,
  pedirMissao: pedirMissao, pedirPremio: pedirPremio, pedirBike: pedirBike, abrirBau: abrirBau,
  marcarMissao: marcarMissao, resgatarPremio: resgatarPremio, trocarBike: trocarBike,
  guardarBike: guardarBike, ajustarPontos: ajustarPontos, decidir: decidir,
  desfazerUltimo: desfazerUltimo, zerar: zerar, resgatarPasse: resgatarPasse,
  resgatarConquista: resgatarConquista
};

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function executar_(fn, args) {
  try {
    if (!API.hasOwnProperty(fn)) throw new Error('Função desconhecida');
    return responder_({ ok: true, data: API[fn].apply(null, args || []) });
  } catch (err) {
    return responder_({ ok: false, error: String(err && err.message || err) });
  }
}

// O app (GitHub) chama por aqui
function doPost(e) {
  let pedido = {};
  try { pedido = JSON.parse(e.postData.contents); } catch (err) { return responder_({ ok: false, error: 'Pedido inválido' }); }
  return executar_(pedido.fn, pedido.args);
}

// Link antigo: se alguém abrir, manda pro app novo
function doGet(e) {
  if (e && e.parameter && e.parameter.fn) {
    let args = [];
    try { args = JSON.parse(e.parameter.args || '[]'); } catch (err) {}
    return executar_(e.parameter.fn, args);
  }
  const html = '<div style="font-family:system-ui;background:#17131f;color:#f1ecdf;min-height:100vh;display:flex;' +
    'flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px">' +
    '<div style="font-size:64px">🎮</div><h1 style="margin:10px 0">O app mudou de casa!</h1>' +
    '<p style="color:#a69bc4;font-size:18px">Agora ele abre igual app de verdade.</p>' +
    '<a href="' + SITE_URL + '" target="_top" style="margin-top:20px;background:#f5c542;color:#221a06;' +
    'font-weight:800;font-size:20px;padding:16px 28px;border-radius:14px;text-decoration:none">Abrir o app novo 👉</a></div>';
  return HtmlService.createHtmlOutput(html)
    .setTitle('Missões do João')
    .setFaviconUrl(FAVICON)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function aba_() {
  let sh = ss_().getSheetByName(ABA);
  if (!sh) {
    sh = ss_().insertSheet(ABA);
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150);
    sh.setColumnWidth(3, 320);
  }
  const atual = sh.getRange(1, 1, 1, CAB.length).getValues()[0];
  if (atual.join('|') !== CAB.join('|')) {
    sh.getRange(1, 1, 1, CAB.length).setValues([CAB]).setFontWeight('bold');
  }
  return sh;
}

function abaLista_(nome, padrao) {
  let sh = ss_().getSheetByName(nome);
  if (!sh) {
    sh = ss_().insertSheet(nome);
    sh.getRange(1, 1, padrao.length, padrao[0].length).setValues(padrao);
    sh.getRange(1, 1, 1, padrao[0].length).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidth(3, 320);
    sh.setColumnWidth(5, 240);
  }
  return sh;
}

function sim_(v) { return String(v).trim().toUpperCase() !== 'NÃO' && String(v).trim().toUpperCase() !== 'NAO'; }

function adicionarFaltando_(sh, linhas, colNome) {
  const nomes = sh.getDataRange().getValues().map(function (r) { return String(r[colNome]).trim(); });
  linhas.forEach(function (l) {
    if (nomes.indexOf(String(l[colNome]).trim()) < 0) sh.appendRow(l);
  });
}

function config_() {
  const shM = abaLista_(ABA_M, MISSOES_PADRAO), shP = abaLista_(ABA_P, PREMIOS_PADRAO);
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('novidades_v7') !== '1') {
    adicionarFaltando_(shM, NOVAS_MISSOES, 2);
    adicionarFaltando_(shP, NOVOS_PREMIOS, 1);
    props.setProperty('novidades_v7', '1');
  }
  const m = shM.getDataRange().getValues().slice(1);
  const p = shP.getDataRange().getValues().slice(1);
  const missoes = m.filter(function (r) { return r[2] && sim_(r[5]); }).map(function (r) {
    return {
      chave: 'm:' + String(r[2]).trim(),
      semanal: String(r[0]).toLowerCase().indexOf('seman') === 0,
      emoji: String(r[1]), nome: String(r[2]).trim(),
      pts: Math.abs(Number(r[3]) || 0), prova: String(r[4] || '')
    };
  });
  const premios = p.filter(function (r) { return r[1] && sim_(r[4]); }).map(function (r) {
    return {
      chave: 'p:' + String(r[1]).trim(),
      emoji: String(r[0]), nome: String(r[1]).trim(),
      pts: Math.abs(Number(r[2]) || 0), detalhe: String(r[3] || '')
    };
  });
  return { missoes: missoes, premios: premios };
}

// ---------- datas ----------
function dia_(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }
function semana_(d) {
  const n = Number(Utilities.formatDate(d, TZ, 'u')); // 1 = segunda ... 7 = domingo
  const seg = new Date(d.getTime() - (n - 1) * 86400000);
  return dia_(seg);
}
function diaAnterior_(s) {
  const p = s.split('-');
  const d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) - 86400000);
  return d.toISOString().slice(0, 10);
}

// ---------- leitura ----------
function lerHist_() {
  const sh = aba_();
  const n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, CAB.length).getValues().map(function (r, i) {
    const data = r[0] instanceof Date ? r[0] : new Date(r[0]);
    return {
      linha: i + 2, data: data, tipo: String(r[1]), desc: String(r[2]),
      pts: Number(r[3]) || 0, bike: Number(r[4]) || 0,
      status: String(r[5] || 'Aprovado'), id: String(r[6] || ''),
      chave: String(r[7] || ''), quem: String(r[8] || ''), obs: String(r[9] || '')
    };
  }).filter(function (h) { return !isNaN(h.data); });
}

// ---------- sorteios do dia / da semana (sempre o mesmo resultado pra mesma data) ----------
function hash_(s) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000003;
  return h;
}
function mes_(d) { return dia_(d).slice(0, 7); }
function proxSegunda_(semana) {
  const p = semana.split('-');
  return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + 7, 3, 0, 0)); // 00:00 em Brasília
}
function fimDoMes_(mes) {
  const p = mes.split('-');
  return new Date(Date.UTC(+p[0], +p[1], 1, 3, 0, 0)); // dia 1 do mês seguinte, 00:00 em Brasília
}
function numTemporada_(mes) {
  const a = TEMPORADA_1.split('-'), b = mes.split('-');
  return Math.max(1, (+b[0] - +a[0]) * 12 + (+b[1] - +a[1]) + 1);
}
function relampago_(cfg, dia) {
  const lista = cfg.missoes.filter(function (m) { return !m.semanal && m.pts < 300; });
  if (!lista.length) return '';
  return lista[hash_('raio' + dia) % lista.length].chave;
}
function oferta_(cfg, semana) {
  const lista = cfg.premios.filter(function (p) { return p.pts >= OFERTA_MIN && p.pts <= OFERTA_MAX; });
  if (!lista.length || !OFERTA_DESCONTO) return null;
  const p = lista[hash_('oferta' + semana) % lista.length];
  return { chave: p.chave, desconto: OFERTA_DESCONTO, preco: Math.round(p.pts * (100 - OFERTA_DESCONTO) / 1000) * 10,
           ate: proxSegunda_(semana).toISOString() };
}
function ptsMissao_(m, e) {
  return (!m.semanal && e.relampago === m.chave) ? m.pts * RELAMPAGO_MULT : m.pts;
}
function precoPremio_(p, e) {
  return (e.oferta && e.oferta.chave === p.chave) ? e.oferta.preco : p.pts;
}

function getEstado() {
  const cfg = config_();
  const hist = lerHist_();
  const hoje = dia_(new Date()), semana = semana_(new Date());
  let pontos = 0, xp = 0, bike = 0, reservado = 0;
  const feitoHoje = {}, feitoSemana = {}, dias = {}, porChave = {};
  let premios = 0, trocasBike = 0, missoes = 0;
  const pendentes = [];
  let comboFeitas = 0, comboFeito = false, bauHoje = 0;
  const diasBau = {}, ptsDia = {};
  let semPts = 0, semMissoes = 0, ultimo = '';
  const mesAtual = mes_(new Date()), xpDia = {}, xpMes = {}, passeResg = [], conqResg = {};

  hist.forEach(function (h) {
    const aprovado = h.status === 'Aprovado';
    const pendente = h.status === 'Pendente';
    const ehMissao = h.tipo === 'Missão' || h.tipo === 'Meta';
    if (h.quem !== 'App') ultimo = h.desc;
    if (aprovado) {
      // teto do dia: só missões diárias; o que passar vira só XP
      let ganho = h.pts;
      if (h.tipo === 'Missão' && TETO_DIA > 0 && h.pts > 0) {
        const dd = dia_(h.data), usado = ptsDia[dd] || 0;
        ganho = Math.max(0, Math.min(h.pts, TETO_DIA - usado));
        ptsDia[dd] = usado + h.pts;
      }
      pontos += ganho; bike += h.bike;
      if (h.pts > 0) {
        xp += h.pts;
        const dx = dia_(h.data);
        xpDia[dx] = (xpDia[dx] || 0) + h.pts;
        xpMes[dx.slice(0, 7)] = (xpMes[dx.slice(0, 7)] || 0) + h.pts;
      }
      if (h.chave.indexOf('passe:' + mesAtual + ':') === 0) passeResg.push(Number(h.chave.split(':')[2]));
      if (h.chave.indexOf('conq:') === 0) conqResg[h.chave.slice(5)] = true;
      if (semana_(h.data) === semana) {
        if (ganho > 0) semPts += ganho;
        if (ehMissao) semMissoes++;
      }
      if (ehMissao) {
        missoes++;
        dias[dia_(h.data)] = true;
        porChave[h.chave] = (porChave[h.chave] || 0) + 1;
      }
      if (h.tipo === 'Prêmio') premios++;
      if (dia_(h.data) === hoje) {
        if (h.tipo === 'Missão') comboFeitas++;
        if (h.chave === 'combo') comboFeito = true;
        if (h.chave === 'bau') bauHoje = h.pts || 1;
      }
      if (h.tipo === 'Bike' && h.pts < 0) trocasBike++;
    }
    if (aprovado && h.chave === 'bau') diasBau[dia_(h.data)] = true;
    if (pendente) {
      if (h.pts < 0) reservado += -h.pts;
      pendentes.push({ id: h.id, tipo: h.tipo, desc: h.desc, pts: h.pts, bike: h.bike, chave: h.chave, quando: h.data.toISOString() });
    }
    if ((aprovado || pendente) && ehMissao && h.chave) {
      const st = pendente ? 'pendente' : 'feito';
      if (h.tipo === 'Missão' && dia_(h.data) === hoje) feitoHoje[h.chave] = st;
      if (h.tipo === 'Meta' && semana_(h.data) === semana) feitoSemana[h.chave] = st;
    }
  });

  // ofensiva: dias seguidos com pelo menos 1 missão aprovada
  let ofensiva = 0, d = dias[hoje] ? hoje : diaAnterior_(hoje);
  while (dias[d]) { ofensiva++; d = diaAnterior_(d); }
  // login diário: dias seguidos abrindo o baú
  let login = 0, dl = diasBau[hoje] ? hoje : diaAnterior_(hoje);
  while (diasBau[dl]) { login++; dl = diaAnterior_(dl); }

  let maior = 0, seq = 0, ant = null;
  Object.keys(dias).sort().forEach(function (k) {
    seq = (ant && diaAnterior_(k) === ant) ? seq + 1 : 1;
    if (seq > maior) maior = seq;
    ant = k;
  });

  // gráfico: XP dos últimos 35 dias
  const diasPts = {};
  let dg = hoje;
  for (let i = 0; i < 35; i++) { if (xpDia[dg]) diasPts[dg] = xpDia[dg]; dg = diaAnterior_(dg); }

  // passe de temporada
  const nivelDe = function (x) { return Math.min(PASSE_NIVEIS, Math.floor((x || 0) / PASSE_XP_NIVEL)); };
  let maxNivel = 0;
  Object.keys(xpMes).forEach(function (k) { maxNivel = Math.max(maxNivel, nivelDe(xpMes[k])); });
  const passe = {
    mes: mesAtual, temporada: numTemporada_(mesAtual), xp: xpMes[mesAtual] || 0, nivel: nivelDe(xpMes[mesAtual]),
    maxNivel: maxNivel, xpNivel: PASSE_XP_NIVEL, niveis: PASSE_NIVEIS, bonus: PASSE_BONUS,
    resgatados: passeResg, fim: fimDoMes_(mesAtual).toISOString()
  };

  // conquistas: o servidor confere tudo (o celular não tem como fingir)
  const conta = function (pedaco) {
    let t = 0;
    Object.keys(porChave).forEach(function (k) { if (k.toLowerCase().indexOf(pedaco) >= 0) t += porChave[k]; });
    return t;
  };
  let nivelXp = 1; while (xp >= 125 * nivelXp * (nivelXp + 1)) nivelXp++;
  const valor = {
    m1: missoes, fogo3: maior, fogo7: maior, fogo30: maior, nv5: nivelXp, nv10: nivelXp,
    duo20: conta('duolingo'), tela10: conta('tela'), vo15: conta('vó'),
    faxina20: conta('louça') + conta('banheiro') + conta('casa') + conta('quarto'),
    nota1: conta('nota boa'), premio1: premios, bike1: bike > 0 ? 1 : 0,
    bike500: Math.floor(bike), bike1000: Math.floor(bike), bikemeia: Math.floor(bike),
    m100: missoes, passe10: maxNivel, passe30: maxNivel
  };
  const conquistas = CONQUISTAS.map(function (c) {
    const meta = c[0] === 'bikemeia' ? BIKE_META / 2 : c[3], v = valor[c[0]] || 0;
    return { id: c[0], i: c[1], n: c[2], m: meta, v: v, pts: c[4], ok: v >= meta, pego: !!conqResg[c[0]],
             dinheiro: c[0].indexOf('bike') === 0 && c[0] !== 'bike1' };
  });

  const ultimos = hist.slice(-12).reverse().map(function (h) {
    return { t: h.desc, v: h.pts, b: h.bike, s: h.status, tipo: h.tipo, o: h.obs };
  });

  return {
    pontos: pontos, disponivel: pontos - reservado, xp: xp, bike: bike,
    hist: ultimos, ultimo: ultimo, pendentes: pendentes, feitoHoje: feitoHoje, feitoSemana: feitoSemana,
    ofensiva: ofensiva, maiorOfensiva: maior,
    combo: { feitas: comboFeitas, feito: comboFeito, min: COMBO_MIN, pts: COMBO_PTS },
    teto: { usado: ptsDia[hoje] || 0, max: TETO_DIA },
    semana: { pts: semPts, missoes: semMissoes },
    bauHoje: bauHoje, login: login,
    diasPts: diasPts, passe: passe, versao: 12, conquistas: conquistas,
    relampago: relampago_(cfg, hoje), oferta: oferta_(cfg, semana),
    stats: { missoes: missoes, premios: premios, trocasBike: trocasBike, porChave: porChave },
    cfg: cfg,
    regras: { reaisPor1000: REAIS_POR_1000, bikeMeta: BIKE_META, bikePontos: BIKE_PONTOS, bikeReais: BIKE_REAIS }
  };
}

// ---------- senha ----------
function checarSenha(senha) { return String(senha) === SENHA_PAI; }
function exigirSenha_(senha) { if (!checarSenha(senha)) throw new Error('Senha do pai errada'); }

function comLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function novaLinha_(tipo, desc, pts, bike, status, chave, quem, data, obs) {
  const id = Utilities.getUuid().slice(0, 8);
  aba_().appendRow([data || new Date(), tipo, desc, pts, bike || '', status, id, chave || '', quem, obs || '']);
  return id;
}

function acharMissao_(chave) {
  const m = config_().missoes.filter(function (x) { return x.chave === chave; })[0];
  if (!m) throw new Error('Missão não encontrada. Atualiza o app.');
  return m;
}
function acharPremio_(chave) {
  const p = config_().premios.filter(function (x) { return x.chave === chave; })[0];
  if (!p) throw new Error('Prêmio não encontrado. Atualiza o app.');
  return p;
}
function jaFeita_(e, m) {
  return m.semanal ? e.feitoSemana[m.chave] : e.feitoHoje[m.chave];
}

// Dá o bônus do combo quando o dia chega em 3 missões aprovadas.
// Conta pelo dia em que o João FEZ (data do pedido), não pelo dia em que o pai aprovou.
function combo_(dataRef) {
  dataRef = dataRef || new Date();
  const dia = dia_(dataRef);
  let feitas = 0, jaTem = false;
  lerHist_().forEach(function (h) {
    if (h.status !== 'Aprovado' || dia_(h.data) !== dia) return;
    if (h.tipo === 'Missão') feitas++;
    if (h.chave === 'combo') jaTem = true;
  });
  if (!jaTem && feitas >= COMBO_MIN) {
    novaLinha_('Bônus', '🔥 Combo do dia (' + COMBO_MIN + ' missões)', COMBO_PTS, '', 'Aprovado', 'combo', 'App', dataRef);
  }
}

// 🎁 João abre o baú do dia
function abrirBau() {
  return comLock_(function () {
    const e = getEstado();
    if (e.bauHoje) throw new Error('O baú de hoje já foi aberto. Volta amanhã!');
    const diaSeguido = e.login + 1;
    let pts = BAU[0][0], nome = '🎁 Baú do dia';
    if (diaSeguido % 7 === 0) { pts = BAU_LENDARIO; nome = '🌟 Baú lendário (7 dias seguidos)'; }
    else {
      let sorte = Math.random() * 100;
      for (let i = 0; i < BAU.length; i++) { sorte -= BAU[i][1]; if (sorte <= 0) { pts = BAU[i][0]; break; } }
    }
    novaLinha_('Bônus', nome, pts, '', 'Aprovado', 'bau', 'João');
    return getEstado();
  });
}

function avisarPai_(texto) {
  if (!AVISAR_EMAIL) return;
  try {
    const url = SITE_URL;
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: '📥 João: ' + texto,
      htmlBody: '<p style="font-size:16px"><b>' + texto + '</b></p>' +
        '<p>Pedido feito às ' + Utilities.formatDate(new Date(), TZ, 'HH:mm') + '. Confere a prova no zap e aprova no app.</p>' +
        (url ? '<p><a href="' + url + '" style="font-size:16px">👉 Abrir o app das Missões</a></p>' : '')
    });
  } catch (err) { /* se o e-mail falhar, o pedido continua salvo */ }
}

// ---------- JOÃO: pede ----------
function pedirMissao(chave) {
  return comLock_(function () {
    const m = acharMissao_(chave), e = getEstado();
    if (e.pendentes.length >= 30) throw new Error('Muitos pedidos esperando o pai');
    if (jaFeita_(e, m)) throw new Error(m.semanal ? 'Essa já foi essa semana' : 'Essa já foi hoje');
    const pts = ptsMissao_(m, e), raio = pts !== m.pts ? '⚡ ' : '';
    novaLinha_(m.semanal ? 'Meta' : 'Missão', raio + m.emoji + ' ' + m.nome, pts, '', 'Pendente', m.chave, 'João');
    avisarPai_('fez ' + raio + m.emoji + ' ' + m.nome + ' (+' + pts + ')');
    return getEstado();
  });
}

function pedirPremio(chave) {
  return comLock_(function () {
    const p = acharPremio_(chave), e = getEstado();
    if (e.pendentes.length >= 30) throw new Error('Muitos pedidos esperando o pai');
    const preco = precoPremio_(p, e), of = preco !== p.pts ? ' (oferta -' + OFERTA_DESCONTO + '%)' : '';
    if (e.disponivel < preco) throw new Error('Pontos insuficientes');
    novaLinha_('Prêmio', p.emoji + ' ' + p.nome + of, -preco, '', 'Pendente', p.chave, 'João');
    avisarPai_('quer o prêmio ' + p.emoji + ' ' + p.nome + of + ' (' + preco + ' pontos)');
    return getEstado();
  });
}

function pedirBike() {
  return comLock_(function () {
    const e = getEstado();
    if (e.disponivel < BIKE_PONTOS) throw new Error('Pontos insuficientes');
    novaLinha_('Bike', '🚲 Guardou ' + BIKE_PONTOS + ' pontos na bike', -BIKE_PONTOS, BIKE_REAIS, 'Pendente', 'bike', 'João');
    avisarPai_('quer guardar ' + BIKE_PONTOS + ' pontos na bike 🚲');
    return getEstado();
  });
}

// 🎟️ João resgata os pontos de um nível do passe
function resgatarPasse(nivel) {
  return comLock_(function () {
    const e = getEstado(), n = Number(nivel), bonus = PASSE_BONUS[n];
    if (!bonus) throw new Error('Esse nível não tem pontos pra resgatar');
    if (e.passe.nivel < n) throw new Error('Ainda não chegou no nível ' + n + ' do passe');
    if (e.passe.resgatados.indexOf(n) >= 0) throw new Error('Esse já foi resgatado nessa temporada');
    novaLinha_('Bônus', '🎟️ Passe nível ' + n + ' (Temporada ' + e.passe.temporada + ')', bonus, '', 'Aprovado',
      'passe:' + e.passe.mes + ':' + n, 'João');
    return getEstado();
  });
}

// 🏆 João pega a recompensa de uma conquista (uma vez só)
function resgatarConquista(id) {
  return comLock_(function () {
    const e = getEstado(), c = e.conquistas.filter(function (x) { return x.id === id; })[0];
    if (!c) throw new Error('Conquista não encontrada. Atualiza o app.');
    if (!c.ok) throw new Error('Ainda não desbloqueou essa conquista');
    if (c.pego) throw new Error('Você já pegou essa recompensa');
    novaLinha_('Bônus', '🏆 Conquista: ' + c.n, c.pts, '', 'Aprovado', 'conq:' + c.id, 'João');
    return getEstado();
  });
}

// 📬 E-mail de domingo com o resumo da semana
function resumoSemanal() {
  const e = getEstado(), semana = semana_(new Date());
  const feitas = {}, recusas = [];
  let premiosTxt = [];
  lerHist_().forEach(function (h) {
    if (semana_(h.data) !== semana) return;
    if (h.status === 'Aprovado' && (h.tipo === 'Missão' || h.tipo === 'Meta')) feitas[h.desc] = (feitas[h.desc] || 0) + 1;
    if (h.status === 'Aprovado' && h.tipo === 'Prêmio') premiosTxt.push(h.desc);
    if (h.status === 'Recusado') recusas.push(h.desc);
  });
  const lista = Object.keys(feitas).sort(function (a, b) { return feitas[b] - feitas[a]; })
    .map(function (k) { return '<li>' + k + (feitas[k] > 1 ? ' <b>×' + feitas[k] + '</b>' : '') + '</li>'; }).join('');
  const br = function (v) { return 'R$ ' + Number(v).toLocaleString('pt-BR'); };
  const html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">' +
    '<h2 style="margin:0 0 8px">🎮 Semana do João</h2>' +
    '<p>📅 <b>' + e.semana.pts + ' pontos</b> na semana · <b>' + e.semana.missoes + ' missões</b> aprovadas</p>' +
    '<p>🔥 Ofensiva: <b>' + e.ofensiva + ' dias</b> · 🎟️ Passe: <b>nível ' + e.passe.nivel + '/' + PASSE_NIVEIS + '</b></p>' +
    '<p>💰 Saldo: <b>' + e.pontos + ' pontos</b> · 🚲 Bike: <b>' + br(e.bike) + ' de ' + br(BIKE_META) + '</b></p>' +
    (lista ? '<p><b>O que ele fez:</b></p><ul>' + lista + '</ul>' : '<p>😴 Nenhuma missão aprovada essa semana.</p>') +
    (premiosTxt.length ? '<p><b>Prêmios resgatados:</b> ' + premiosTxt.join(', ') + '</p>' : '') +
    (recusas.length ? '<p><b>Recusados:</b> ' + recusas.join(', ') + '</p>' : '') +
    (e.pendentes.length ? '<p>⏳ <b>' + e.pendentes.length + ' pedido(s) esperando você aprovar.</b></p>' : '') +
    '<p><a href="' + SITE_URL + '">👉 Abrir o app das Missões</a></p></div>';
  MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), subject: '📬 Resumo da semana do João', htmlBody: html });
}

// ---------- PAI: faz direto ----------
function marcarMissao(senha, chave) {
  exigirSenha_(senha);
  return comLock_(function () {
    const m = acharMissao_(chave), e = getEstado();
    const st = jaFeita_(e, m);
    if (st === 'feito') throw new Error(m.semanal ? 'Já marcada essa semana' : 'Já marcada hoje');
    if (st === 'pendente') {
      const pend = lerHist_().filter(function (h) { return h.status === 'Pendente' && h.chave === m.chave; }).pop();
      if (pend) { aba_().getRange(pend.linha, 6).setValue('Aprovado'); combo_(pend.data); return getEstado(); }
    }
    const pts = ptsMissao_(m, e);
    novaLinha_(m.semanal ? 'Meta' : 'Missão', (pts !== m.pts ? '⚡ ' : '') + m.emoji + ' ' + m.nome, pts, '', 'Aprovado', m.chave, 'Pai');
    combo_();
    return getEstado();
  });
}

function resgatarPremio(senha, chave) {
  exigirSenha_(senha);
  return comLock_(function () {
    const p = acharPremio_(chave), e = getEstado();
    const preco = precoPremio_(p, e), of = preco !== p.pts ? ' (oferta -' + OFERTA_DESCONTO + '%)' : '';
    if (e.disponivel < preco) throw new Error('Pontos insuficientes');
    novaLinha_('Prêmio', p.emoji + ' ' + p.nome + of, -preco, '', 'Aprovado', p.chave, 'Pai');
    return getEstado();
  });
}

function trocarBike(senha) {
  exigirSenha_(senha);
  return comLock_(function () {
    if (getEstado().disponivel < BIKE_PONTOS) throw new Error('Pontos insuficientes');
    novaLinha_('Bike', '🚲 Guardou ' + BIKE_PONTOS + ' pontos na bike', -BIKE_PONTOS, BIKE_REAIS, 'Aprovado', 'bike', 'Pai');
    return getEstado();
  });
}

function guardarBike(senha, valor, origem) {
  exigirSenha_(senha);
  valor = Number(String(valor).replace(',', '.')) || 0;
  if (!valor) throw new Error('Valor inválido');
  return comLock_(function () {
    const txt = (valor > 0 ? '💰 ' : '↩ ') + (String(origem || '').trim() || 'Dinheiro pra bike');
    novaLinha_('Bike', txt, 0, valor, 'Aprovado', 'bike-dinheiro', 'Pai');
    return getEstado();
  });
}

function ajustarPontos(senha, pontos, motivo) {
  exigirSenha_(senha);
  pontos = Math.round(Number(pontos) || 0);
  if (!pontos) throw new Error('Valor inválido');
  return comLock_(function () {
    novaLinha_('Ajuste', (pontos > 0 ? '🎁 ' : '↩ ') + (String(motivo || '').trim() || 'Ajuste do pai'), pontos, '', 'Aprovado', 'ajuste', 'Pai');
    return getEstado();
  });
}

// ---------- PAI: aprova / recusa pedidos ----------
function decidir(senha, id, aprovar, motivo) {
  exigirSenha_(senha);
  return comLock_(function () {
    const h = lerHist_().filter(function (x) { return x.id === id && x.status === 'Pendente'; })[0];
    if (!h) return getEstado();
    if (aprovar && h.pts < 0) {
      const e = getEstado();
      if (e.pontos < -h.pts) throw new Error('Ele não tem pontos suficientes pra isso');
    }
    aba_().getRange(h.linha, 6).setValue(aprovar ? 'Aprovado' : 'Recusado');
    if (!aprovar && motivo) aba_().getRange(h.linha, 10).setValue(String(motivo).trim());
    if (aprovar && h.tipo === 'Missão') combo_(h.data);
    return getEstado();
  });
}

// Apaga o último lançamento feito por gente (pula os automáticos, tipo o combo).
// Se era uma missão e o combo daquele dia deixou de valer, apaga o combo junto.
function desfazerUltimo(senha) {
  exigirSenha_(senha);
  return comLock_(function () {
    const sh = aba_();
    const hist = lerHist_();
    let alvo = null;
    for (let i = hist.length - 1; i >= 0; i--) { if (hist[i].quem !== 'App') { alvo = hist[i]; break; } }
    if (!alvo) return getEstado();
    sh.deleteRow(alvo.linha);
    if (alvo.tipo === 'Missão' && alvo.status === 'Aprovado') {
      const dia = dia_(alvo.data);
      let feitas = 0, combo = null;
      lerHist_().forEach(function (h) {
        if (h.status !== 'Aprovado' || dia_(h.data) !== dia) return;
        if (h.tipo === 'Missão') feitas++;
        if (h.chave === 'combo') combo = h;
      });
      if (combo && feitas < COMBO_MIN) sh.deleteRow(combo.linha);
    }
    return getEstado();
  });
}

function zerar(senha) {
  exigirSenha_(senha);
  return comLock_(function () {
    const sh = aba_();
    const n = sh.getLastRow() - 1;
    if (n > 0) sh.deleteRows(2, n);
    return getEstado();
  });
}

// Rode 1x pelo editor: cria as abas e autoriza
function configurar() {
  aba_(); config_();
  if (AVISAR_EMAIL || RESUMO_DOMINGO) MailApp.getRemainingDailyQuota(); // pede a permissão de e-mail
  // agenda o resumo de domingo (apaga o antigo antes, pra não duplicar)
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'resumoSemanal') ScriptApp.deleteTrigger(t);
  });
  if (RESUMO_DOMINGO) {
    ScriptApp.newTrigger('resumoSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(20).inTimezone(TZ).create();
  }
  Logger.log('Tudo certo! Abas Historico, Missoes e Premios prontas.');
}
