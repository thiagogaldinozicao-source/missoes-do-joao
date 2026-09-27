// =====================================================
//  MISSÕES DO JOÃO — servidor (Google Apps Script) v9
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

// 📧 Te avisa por e-mail (no seu Gmail) quando o João pedir algo
const AVISAR_EMAIL = true;

// 🌐 Endereço do app (GitHub Pages)
const SITE_URL = 'https://thiagogaldinozicao-source.github.io/missoes-do-joao/';

// 🎮 Ícone do app (aparece na aba do navegador)
const FAVICON = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3ae.png';

const TZ = 'America/Sao_Paulo';
const ABA = 'Historico';
const ABA_M = 'Missoes';
const ABA_P = 'Premios';
const CAB = ['Data', 'Tipo', 'Descrição', 'Pontos', 'Bike (R$)', 'Status', 'ID', 'Chave', 'Quem'];

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
  desfazerUltimo: desfazerUltimo, zerar: zerar
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
      chave: String(r[7] || ''), quem: String(r[8] || '')
    };
  }).filter(function (h) { return !isNaN(h.data); });
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
  const diasBau = {};

  hist.forEach(function (h) {
    const aprovado = h.status === 'Aprovado';
    const pendente = h.status === 'Pendente';
    const ehMissao = h.tipo === 'Missão' || h.tipo === 'Meta';
    if (aprovado) {
      pontos += h.pts; bike += h.bike;
      if (h.pts > 0) xp += h.pts;
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

  const ultimos = hist.slice(-12).reverse().map(function (h) {
    return { t: h.desc, v: h.pts, b: h.bike, s: h.status, tipo: h.tipo };
  });

  return {
    pontos: pontos, disponivel: pontos - reservado, xp: xp, bike: bike,
    hist: ultimos, pendentes: pendentes, feitoHoje: feitoHoje, feitoSemana: feitoSemana,
    ofensiva: ofensiva, maiorOfensiva: maior,
    combo: { feitas: comboFeitas, feito: comboFeito, min: COMBO_MIN, pts: COMBO_PTS },
    bauHoje: bauHoje, login: login,
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

function novaLinha_(tipo, desc, pts, bike, status, chave, quem) {
  const id = Utilities.getUuid().slice(0, 8);
  aba_().appendRow([new Date(), tipo, desc, pts, bike || '', status, id, chave || '', quem]);
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

// Dá o bônus do combo quando chega em 3 missões aprovadas no dia
function combo_() {
  const e = getEstado();
  if (!e.combo.feito && e.combo.feitas >= COMBO_MIN) {
    novaLinha_('Bônus', '🔥 Combo do dia (' + COMBO_MIN + ' missões)', COMBO_PTS, '', 'Aprovado', 'combo', 'App');
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
    novaLinha_(m.semanal ? 'Meta' : 'Missão', m.emoji + ' ' + m.nome, m.pts, '', 'Pendente', m.chave, 'João');
    avisarPai_('fez ' + m.emoji + ' ' + m.nome + ' (+' + m.pts + ')');
    return getEstado();
  });
}

function pedirPremio(chave) {
  return comLock_(function () {
    const p = acharPremio_(chave), e = getEstado();
    if (e.pendentes.length >= 30) throw new Error('Muitos pedidos esperando o pai');
    if (e.disponivel < p.pts) throw new Error('Pontos insuficientes');
    novaLinha_('Prêmio', p.emoji + ' ' + p.nome, -p.pts, '', 'Pendente', p.chave, 'João');
    avisarPai_('quer o prêmio ' + p.emoji + ' ' + p.nome + ' (' + p.pts + ' pontos)');
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

// ---------- PAI: faz direto ----------
function marcarMissao(senha, chave) {
  exigirSenha_(senha);
  return comLock_(function () {
    const m = acharMissao_(chave), e = getEstado();
    const st = jaFeita_(e, m);
    if (st === 'feito') throw new Error(m.semanal ? 'Já marcada essa semana' : 'Já marcada hoje');
    if (st === 'pendente') {
      const pend = lerHist_().filter(function (h) { return h.status === 'Pendente' && h.chave === m.chave; }).pop();
      if (pend) { aba_().getRange(pend.linha, 6).setValue('Aprovado'); combo_(); return getEstado(); }
    }
    novaLinha_(m.semanal ? 'Meta' : 'Missão', m.emoji + ' ' + m.nome, m.pts, '', 'Aprovado', m.chave, 'Pai');
    combo_();
    return getEstado();
  });
}

function resgatarPremio(senha, chave) {
  exigirSenha_(senha);
  return comLock_(function () {
    const p = acharPremio_(chave), e = getEstado();
    if (e.disponivel < p.pts) throw new Error('Pontos insuficientes');
    novaLinha_('Prêmio', p.emoji + ' ' + p.nome, -p.pts, '', 'Aprovado', p.chave, 'Pai');
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
function decidir(senha, id, aprovar) {
  exigirSenha_(senha);
  return comLock_(function () {
    const h = lerHist_().filter(function (x) { return x.id === id && x.status === 'Pendente'; })[0];
    if (!h) return getEstado();
    if (aprovar && h.pts < 0) {
      const e = getEstado();
      if (e.pontos < -h.pts) throw new Error('Ele não tem pontos suficientes pra isso');
    }
    aba_().getRange(h.linha, 6).setValue(aprovar ? 'Aprovado' : 'Recusado');
    if (aprovar && h.tipo === 'Missão') combo_();
    return getEstado();
  });
}

function desfazerUltimo(senha) {
  exigirSenha_(senha);
  return comLock_(function () {
    const sh = aba_();
    if (sh.getLastRow() > 1) sh.deleteRow(sh.getLastRow());
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
  if (AVISAR_EMAIL) MailApp.getRemainingDailyQuota(); // pede a permissão de e-mail
  Logger.log('Tudo certo! Abas Historico, Missoes e Premios prontas.');
}
