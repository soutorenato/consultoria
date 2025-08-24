/* ===========================================================
   UTILITÁRIOS GERAIS
=========================================================== */
function formatBRL(v){
  return "R$ " + (Number(v||0)).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2});
}
function parseValorBR(v){
  if (typeof v === "number") return v;
  const s = String(v||"").replace(/\s/g,"").replace(/^r\$\s?/i,"").replace(/\./g,"").replace(",",".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
function norm(s){
  return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}

/* ===========================================================
   DADOS DO FORMULÁRIO
=========================================================== */
const RECEITAS_FIXAS = [
  "Salário","Salário conjuge","Salário outros",
  "Aposentadoria de familiar","Renda de imóveis alugados","Juros de investimentos"
];
const RECEITAS_VARIAVEIS = [
  "13º salário/Férias","Bônus anual","Resgate de investimentos",
  "Rendas extras (bicos/temporários)","Vendas de bens ou objetos","Outros"
];
const receitasCampos = [...RECEITAS_FIXAS, ...RECEITAS_VARIAVEIS];

const patrimonioCampos = ["Imóvel", "Veículo", "Investimentos"];

const despesasCategorias = {
  "Casa": ["Aluguel", "Financiamento imobiliário", "IPTU", "Condomínio", "Conta de Água", "Conta de Luz", "Conta de Gás", "Mensalista/diarista", "Conta de internet / TV a cabo", "Conta de telefone fixo", "Conta de celular", "Reformas/consertos", "Seguro da casa", "Animais de estimação (ração, tosa, remédios, etc.)", "Outros"],
  "Alimentação": ["Supermercado", "Açougue", "Hortifruti / feira", "Padaria", "Mercearia", "Restaurante do dia a dia", "Outros"],
  "Saúde e Proteção": ["Convênio Médico", "Médico", "Dentista", "Terapeuta", "Medicamentos e tratamentos", "Seguro de Vida", "Outros"],
  "Transporte": ["Financiamento do automóvel", "Combustível", "Lavagens", "Licenciamento", "Seguro", "IPVA", "Mecânico", "Estacionamento", "Multas", "Transporte público", "Outros"],
  "Educação": ["Matrícula", "Mensalidade escolar", "Material didático", "Uniforme", "Perua escolar", "Cursos / ensino de línguas", "Livros", "Outros"],
  "Cuidados Pessoais": ["Higiene pessoal (sabonete, papel higiênico, etc.)", "Barbeiro / cabeleireiro", "Manicure e depilação", "Vestuário", "Calçados", "Acessórios", "Academia", "Lavanderia", "Outros"],
  "Celebrações e compromissos": ["Buffet Festas (aniversário, casamentos, batizados...)", "Presentes", "Aluguel de roupas", "Celebrações no trabalho (amigo secreto, churrasco)", "Celebrações na igreja", "Dízimos e doações", "Outros"],
  "Lazer e viagens": ["Restaurantes no fim de semana", "Passeios/bares/baladas/cafés", "Livraria", "Cinema", "Jogos", "Assinaturas de aplicativos (Spotify, Netflix)", "Viagens", "Outros"],
  "Dívidas": ["Dívidas em atraso ou negociações", "Empréstimos pessoais e consignados", "Financiamentos atrasados", "Juros de Cheque especial", "Rotativo do Cartão", "Empréstimos familiares", "Outros"],
  "Investimentos": ["Investimentos (quanto $ você guarda)", "Previdência", "Poupança", "Renda fixa (CDB, CDI...)", "Fundos", "Outros"]
};

/* ===========================================================
   PLUGIN: TEXTO NO CENTRO DOS DONUTS (Chart.js)
=========================================================== */
(function registerCenterTextPlugin(){
  function doRegister(){
    if (!window.Chart || window.__centerTextRegistered) return;
    const CenterTextPlugin = {
      id: 'centerText',
      afterDraw(chart) {
        const opts = chart?.options?.plugins?.centerText;
        if (!opts || !opts.text) return;

        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const x = (chartArea.left + chartArea.right) / 2;
        const y = (chartArea.top + chartArea.bottom) / 2;

        const family = opts.fontFamily || getComputedStyle(document.body).fontFamily || 'Inter, sans-serif';
        const mainSize = opts.fontSize || 18;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = opts.color || '#495057';
        ctx.font = `${opts.fontWeight || 700} ${mainSize}px ${family}`;
        ctx.fillText(String(opts.text), x, y);

        if (opts.subtext) {
          ctx.fillStyle = opts.subColor || '#878a99';
          ctx.font = `400 ${Math.round(mainSize * 0.7)}px ${family}`;
          ctx.fillText(String(opts.subtext), x, y + mainSize * 0.9);
        }
        ctx.restore();
      }
    };
    Chart.register(CenterTextPlugin);
    window.__centerTextRegistered = true;
  }
  if (window.Chart) doRegister();
  else window.addEventListener('load', doRegister);
})();

/* ===========================================================
   MODAIS (RECEITAS / DESPESAS / PATRIMÔNIO)
=========================================================== */
function abrirModal(tipo) {
  const modalContainer = document.getElementById("modal-container");
  let html = '<div class="modal" style="display:flex;"><div class="modal-content">';
  html += '<span class="close" onclick="fecharModal()">&times;</span>';
  html += `<h3>Atualizar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>`;

  if (tipo === "receitas") {
    html += "<table>";
    receitasCampos.forEach(campo => {
      html += `<tr><td>${campo}</td><td><input type="number" id="${campo}" value="${localStorage.getItem(campo) || ""}" /></td></tr>`;
    });
    html += "</table>";
    html += `<button onclick="salvarReceitas()">Salvar</button>`;
  }

  if (tipo === "patrimonio") {
    html += "<table>";
    patrimonioCampos.forEach(campo => {
      html += `<tr><td>${campo}</td><td><input type="number" id="${campo}" value="${localStorage.getItem(campo) || ""}" /></td></tr>`;
    });
    html += "</table>";
    html += `<button onclick="salvarPatrimonio()">Salvar</button>`;
  }

  if (tipo === "despesas") {
    html += '<div class="category-buttons">';
    Object.keys(despesasCategorias).forEach(cat => {
      html += `<button onclick="abrirCategoria('${cat}', this)">${cat}</button>`;
    });
    html += '</div>';
    html += '<div id="categoria-form"></div>';
  }

  html += "</div></div>";
  modalContainer.innerHTML = html;
}
function fecharModal() {
  document.getElementById("modal-container").innerHTML = "";
}

/* ===========================================================
   SALVAR FORMULÁRIOS (sem depender dos gráficos antigos)
=========================================================== */
function salvarReceitas() {
  let total = 0;
  receitasCampos.forEach(campo => {
    const input = document.getElementById(campo);
    const val = parseFloat(input?.value) || 0;
    localStorage.setItem(campo, input?.value ?? "");
    total += val;
  });
  localStorage.setItem("receitasTotal", total);

  // UI nova
  window.refreshReceitasDonut?.();
  window.updateTopWidgets?.();
  window.syncInsightsToPanel?.();
  window.notifyDataChanged?.();

  // (se o valor-resumo existir em algum card, atualiza)
  const el = document.getElementById("valor-receitas");
  if (el) el.innerText = formatBRL(total);

  fecharModal();
}

function salvarPatrimonio() {
  let total = 0;
  patrimonioCampos.forEach(campo => {
    const input = document.getElementById(campo);
    const val = parseFloat(input?.value) || 0;
    localStorage.setItem(campo, input?.value ?? "");
    total += val;
  });
  localStorage.setItem("patrimonioTotal", total);

  window.refreshPatrimonioDonut?.();
  window.updateTopWidgets?.();
  window.atualizarCard4Diagnostico?.();
  window.syncInsightsToPanel?.();
  window.notifyDataChanged?.();

  const el = document.getElementById("valor-patrimonio");
  if (el) el.innerText = formatBRL(total);

  fecharModal();
}

let despesasTotais = {};
function abrirCategoria(cat, btn) {
  document.querySelectorAll(".category-buttons button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const formDiv = document.getElementById("categoria-form");
  let html = "<table>";
  despesasCategorias[cat].forEach(campo => {
    html += `<tr><td>${campo}</td><td><input type="number" id="${campo}" value="${localStorage.getItem(campo) || ""}" /></td></tr>`;
  });
  html += "</table>";
  html += `<button onclick="salvarDespesas('${cat}', this)">Salvar</button>`;
  formDiv.innerHTML = html;
}

function salvarDespesas(cat, btn) {
  // carrega o agregado atual para não perder outras categorias
  try { despesasTotais = JSON.parse(localStorage.getItem("despesasTotais") || "{}"); } catch { despesasTotais = {}; }

  let total = 0;
  despesasCategorias[cat].forEach(campo => {
    const input = document.getElementById(campo);
    const val = parseFloat(input?.value) || 0;
    localStorage.setItem(campo, input?.value ?? "");
    total += val;
  });
  despesasTotais[cat] = total;
  localStorage.setItem("despesasTotais", JSON.stringify(despesasTotais));

  // feedback opcional no botão
  if (btn) {
    btn.classList.add("active");
    btn.style.background = "green";
    btn.style.color = "white";
    btn.style.borderColor = "green";
  }

  const totalGeral = Object.values(despesasTotais).reduce((a,b) => a + (parseValorBR(b) || 0), 0);
  const el = document.getElementById("valor-despesas");
  if (el) el.innerText = formatBRL(totalGeral);

  window.refreshDespesasDonut?.();
  window.updateTopWidgets?.();
  window.atualizarCard4Diagnostico?.();
  window.syncInsightsToPanel?.();
  window.notifyDataChanged?.();

  fecharModal();
}

/* ===========================================================
   WIDGETS SUPERIORES (4 cards)
=========================================================== */
function getTotalReceitasLS(){
  const ag = localStorage.getItem("receitasTotal");
  if (ag!=null && ag!=="") return parseValorBR(ag);
  return 0;
}
function getTotalDespesasLS(){
  try{
    const tot = JSON.parse(localStorage.getItem("despesasTotais")||"{}");
    return Object.values(tot).reduce((a,b)=> a + parseValorBR(b), 0);
  }catch{ return 0; }
}
function getTotalPatrimonioLS(){
  const t = localStorage.getItem("patrimonioTotal");
  if (t!=null && t!=="") return parseValorBR(t);
  const chaves = ["Imóvel","Imovel","Veículo","Veiculo","Investimentos"];
  return chaves.reduce((acc,k)=> acc + parseValorBR(localStorage.getItem(k)), 0);
}
function animateCurrency(el, toValue, duration=900){
  if (!el) return;
  const startText = (el.textContent||"").replace(/[^\d,.-]/g,"").replace(/\./g,"").replace(",",".");
  const start = isNaN(parseFloat(startText)) ? 0 : parseFloat(startText);
  const t0 = performance.now();
  const fmt = new Intl.NumberFormat("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2});
  function step(t){
    const p = Math.min(1, (t - t0)/duration);
    const val = start + (toValue - start)*p;
    el.textContent = "R$ " + fmt.format(val);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function animateInt(el, toValue, duration=800){
  if (!el) return;
  const start = parseInt(el.textContent.replace(/\D/g,"")||"0",10);
  const t0 = performance.now();
  function step(t){
    const p = Math.min(1,(t - t0)/duration);
    el.textContent = Math.round(start + (toValue - start)*p);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function updateTopWidgets(){
  animateCurrency(document.getElementById("stat-receitas"), getTotalReceitasLS());
  animateCurrency(document.getElementById("stat-despesas"), getTotalDespesasLS());
  animateCurrency(document.getElementById("stat-patrimonio"), getTotalPatrimonioLS());
  animateInt(document.getElementById("stat-diagnosticos"), contarDiagnosticosAtivos());
}

/* ===========================================================
   DIAGNÓSTICOS (CARD 4) + REGRAS
=========================================================== */
function getDet(){ try{ return JSON.parse(localStorage.getItem("despesasDetalhadas")||"{}"); }catch{ return {}; } }
function lerCasaItem(nome){
  const det = getDet();
  if (det?.Casa && det.Casa[nome]!=null) return parseValorBR(det.Casa[nome]);
  const v = localStorage.getItem("Casa:"+nome) ?? localStorage.getItem(nome);
  return parseValorBR(v);
}
function lerCatItem(cat,item){
  const det = getDet();
  for (const [nomeCat, itens] of Object.entries(det||{})){
    if (norm(nomeCat)===norm(cat)){
      for (const [lbl, raw] of Object.entries(itens||{})){
        if (norm(lbl)===norm(item)) return parseValorBR(raw);
      }
    }
  }
  const k1 = `${cat}:${item}`, k2 = `${norm(cat)}:${item}`, k3 = `${cat}:${norm(item)}`;
  return parseValorBR(localStorage.getItem(k1) || localStorage.getItem(k2) || localStorage.getItem(k3) || localStorage.getItem(item));
}
function contarDiagnosticosAtivos(){
  let n = 0;
  const luz = lerCasaItem("Conta de Luz");
  if (luz >= 250) n++;
  const segCasa = lerCasaItem("Seguro da casa");
  if (segCasa === 0) n++;
  const segVida = lerCatItem("Saúde e Proteção", "Seguro de Vida");
  if (segVida === 0) n++;
  const combust = lerCatItem("Transporte", "Combustível") || lerCatItem("Transporte", "Combustivel");
  if (combust > 0) n++;
  const presentes = lerCatItem("Celebrações e compromissos", "Presentes") || lerCatItem("Celebracoes e compromissos","Presentes");
  if (presentes > 0) n++;
  return n;
}

function obterValorContaDeLuz() {
  let v = localStorage.getItem("Conta de Luz");
  if (v != null) return parseFloat(v) || 0;
  v = localStorage.getItem("Casa:Conta de Luz");
  if (v != null) return parseFloat(v) || 0;
  try {
    const det = JSON.parse(localStorage.getItem("despesasDetalhadas") || "{}");
    if (det?.Casa && det.Casa["Conta de Luz"] != null) {
      return parseFloat(det.Casa["Conta de Luz"]) || 0;
    }
  } catch (_) {}
  return 0;
}
function obterValorSeguroDaCasa() {
  let v = localStorage.getItem("Seguro da casa");
  if (v != null && v !== "") return parseValorBR(v);
  const alternativas = ["Seguro da Casa", "Casa:Seguro da casa", "Casa:Seguro da Casa"];
  for (const k of alternativas) {
    v = localStorage.getItem(k);
    if (v != null && v !== "") return parseValorBR(v);
  }
  return 0;
}
function obterValorAnimaisEstimacao() {
  const key = "Animais de estimação (ração, tosa, remédios, etc.)";
  let v = localStorage.getItem(key);
  if (v != null && v !== "") return parseValorBR(v);
  v = localStorage.getItem("Casa:" + key);
  if (v != null && v !== "") return parseValorBR(v);
  try {
    const det = JSON.parse(localStorage.getItem("despesasDetalhadas") || "{}");
    for (const categoria of Object.values(det || {})) {
      for (const [label, raw] of Object.entries(categoria || {})) {
        const L = norm(label);
        if (L.startsWith("animais de estimacao")) {
          const n = parseValorBR(raw);
          if (n > 0) return n;
        }
      }
    }
  } catch {}
  return 0;
}
function getCategoria(det, nomeAlvo) {
  const alvo = norm(nomeAlvo);
  for (const [nome, obj] of Object.entries(det || {})) {
    if (norm(nome) === alvo) return obj || {};
  }
  return {};
}
function getDespesasDetalhadas() {
  try { return JSON.parse(localStorage.getItem("despesasDetalhadas") || "{}"); }
  catch { return {}; }
}
function obterValorSeguroDeVida() {
  const det = getDespesasDetalhadas();
  const catSaude = getCategoria(det, "Saúde e Proteção");
  for (const [label, raw] of Object.entries(catSaude||{})) {
    const L = norm(label);
    if (L === "seguro de vida" || (L.includes("seguro") && L.includes("vida"))) {
      return parseValorBR(raw);
    }
  }
  const chaves = ["Saúde e Proteção:Seguro de Vida","Saude e Protecao:Seguro de Vida","Seguro de Vida"];
  for (const k of chaves) {
    const v = localStorage.getItem(k);
    if (v != null && v !== "") return parseValorBR(v);
  }
  return 0;
}
function obterTotalPatrimonio() {
  try {
    const pat = JSON.parse(localStorage.getItem("patrimonioDetalhado") || "{}");
    if (pat && typeof pat === "object" && Object.keys(pat).length) {
      return Object.values(pat).reduce((acc, v) => acc + parseValorBR(v), 0);
    }
  } catch {}
  const chaves = [
    "Imóvel","Imovel","Veículo","Veiculo","Investimentos",
    "Patrimônio:Imóvel","Patrimonio:Imovel",
    "Patrimônio:Veículo","Patrimonio:Veiculo",
    "Patrimônio:Investimentos","Patrimonio:Investimentos"
  ];
  let total = 0;
  for (const k of chaves) {
    const v = localStorage.getItem(k);
    if (v != null && v !== "") total += parseValorBR(v);
  }
  return total;
}
function obterTotalDespesasCAE() {
  try {
    const tot = JSON.parse(localStorage.getItem("despesasTotais") || "{}");
    if (tot && typeof tot === "object" && Object.keys(tot).length) {
      const somaTotais =
        parseValorBR(tot["Casa"]) +
        (tot["Alimentação"] != null ? parseValorBR(tot["Alimentação"]) : parseValorBR(tot["Alimentacao"])) +
        (tot["Educação"]   != null ? parseValorBR(tot["Educação"])   : parseValorBR(tot["Educacao"]));
      if (somaTotais > 0) return somaTotais;
    }
  } catch {}
  try {
    const det = JSON.parse(localStorage.getItem("despesasDetalhadas") || "{}");
    const categoriasAlvo = ["Casa", "Alimentação", "Alimentacao", "Educação", "Educacao"].map(norm);
    let total = 0;
    for (const [nomeCat, itens] of Object.entries(det || {})) {
      if (!categoriasAlvo.includes(norm(nomeCat))) continue;
      for (const val of Object.values(itens || {})) total += parseValorBR(val);
    }
    if (total > 0) return total;
  } catch {}
  let totalPrefixos = 0;
  const prefixos = ["Casa:", "Alimentação:", "Alimentacao:", "Educação:", "Educacao:"];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || "";
    if (prefixos.some(p => k.startsWith(p))) {
      totalPrefixos += parseValorBR(localStorage.getItem(k));
    }
  }
  return totalPrefixos;
}
function arredondarParaCimaMultiplo(valor, multiplo) {
  if (multiplo <= 0) return valor;
  return Math.ceil((valor || 0) / multiplo) * multiplo;
}
function obterValorCombustivelTransporte() {
  let total = 0;
  try {
    const det = getDespesasDetalhadas();
    for (const [nomeCat, itens] of Object.entries(det || {})) {
      if (norm(nomeCat) !== "transporte") continue;
      for (const [label, raw] of Object.entries(itens || {})) {
        const L = norm(label);
        if (L === "combustivel" || L.includes("combustivel")) {
          total += parseValorBR(raw);
        }
      }
    }
  } catch {}
  if (total > 0) return total;
  const chaves = ["Transporte:Combustível", "Transporte:Combustivel", "Combustível", "Combustivel"];
  for (const k of chaves) {
    const v = localStorage.getItem(k);
    if (v != null && v !== "") total += parseValorBR(v);
  }
  return total;
}
function obterValorPresentesCelebracoes() {
  let total = 0;
  try {
    const det = getDespesasDetalhadas();
    for (const [nomeCat, itens] of Object.entries(det || {})) {
      if (norm(nomeCat) === "celebracoes e compromissos") {
        for (const [label, raw] of Object.entries(itens || {})) {
          const L = norm(label);
          if (L.startsWith("presente")) total += parseValorBR(raw);
        }
      }
    }
  } catch {}
  if (total > 0) return total;
  const chavesExatas = [
    "Celebrações e compromissos:Presentes",
    "Celebracoes e compromissos:Presentes",
    "Presentes"
  ];
  for (const k of chavesExatas) {
    const v = localStorage.getItem(k);
    if (v != null && v !== "") total += parseValorBR(v);
  }
  if (total > 0) return total;
  const prefixos = ["Celebrações e compromissos:", "Celebracoes e compromissos:"];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || "";
    if (prefixos.some(p => k.startsWith(p))) {
      const rotulo = k.split(":")[1] || "";
      if (norm(rotulo).startsWith("presente")) {
        total += parseValorBR(localStorage.getItem(k));
      }
    }
  }
  return 0 + total;
}
function atualizarCard4Diagnostico() {
  // calcula os valores
  const valorLuz         = obterValorContaDeLuz();
  const valorSeguroCasa  = obterValorSeguroDaCasa();
  const valorPet         = obterValorAnimaisEstimacao();
  const valorSeguroVida  = obterValorSeguroDeVida();
  const valorCombustivel = obterValorCombustivelTransporte();
  const valorPresentes   = obterValorPresentesCelebracoes();

  const chips = [];

  if (valorLuz >= 250) {
    const economia10 = valorLuz * 0.10;
    const economia15 = valorLuz * 0.15;
    chips.push(`
      <div class="indicacao">
        <button type="button" class="chip-produto">FIT Energia</button>
        <div class="tooltip">A conta da energia é de <b>${formatBRL(valorLuz)}</b>. Terá uma economia entre <b>${formatBRL(economia10)}</b> a <b>${formatBRL(economia15)}</b> ao mês.</div>
      </div>`);
  }
  if (valorSeguroCasa === 0) {
    chips.push(`
      <div class="indicacao">
        <button type="button" class="chip-produto">Seguro Residencial</button>
        <div class="tooltip">${valorPet > 0
          ? "Possui custos com moradia, oferte as assistências do seguro residencial e não deixe de falar do serviço Pet."
          : "Possui custos com moradia, oferte as assistências do seguro residencial."}
        </div>
      </div>`);
  }
  if (valorSeguroVida === 0) {
    const totalPatrimonio   = obterTotalPatrimonio();
    const totalDespesasCAE  = obterTotalDespesasCAE();
    const capitalBase       = (totalPatrimonio * 0.10) + (totalDespesasCAE * 60);
    const capitalSugerido   = arredondarParaCimaMultiplo(capitalBase, 50000);
    chips.push(`
      <div class="indicacao">
        <button type="button" class="chip-produto">Seguro Vida</button>
        <div class="tooltip">Oferte o capital assegurado de <b>${formatBRL(capitalSugerido)}</b> (cálculo baseado nas despesas e patrimônio).</div>
      </div>`);
  }
  if (valorCombustivel > 0) {
    chips.push(`
      <div class="indicacao">
        <button type="button" class="chip-produto">Auto Compara</button>
        <div class="tooltip">Agende o vencimento do seguro auto.</div>
      </div>`);
  }
  if (valorPresentes > 0) {
    chips.push(`
      <div class="indicacao">
        <button type="button" class="chip-produto">Esfera</button>
        <div class="tooltip">Oferecer descontos para presentes nas lojas parceiras do Esfera.</div>
      </div>`);
  }

  // 2. escreve no CARD (se existir)
  const card4 = document.querySelector(".card-grid .card:nth-child(4)");
  if (card4) {
    card4.innerHTML = "";
    const h4 = document.createElement("h4"); h4.textContent = "Diagnóstico";
    const sub = document.createElement("div"); sub.className = "valor";
    card4.append(h4, sub);
    if (chips.length) {
      card4.insertAdjacentHTML('beforeend', chips.join(''));
    } else {
      const vazio = document.createElement("p");
      vazio.className = "sem-indicacao";
      vazio.textContent = "Nenhuma indicação no momento.";
      card4.appendChild(vazio);
    }
  }

  // 3. escreve SEMPRE na fonte invisível (para o painel)
  const src = ensureDiagSource();
  src.innerHTML = chips.length ? chips.join('') : '<p class="sem-indicacao">Nenhuma indicação no momento.</p>';

  // 4. atualiza o painel
  window.syncInsightsToPanel?.();
}


/* ===========================================================
   PAINEL LATERAL (espelha os insights do card 4)
=========================================================== */
(function(){
  const BTN_ID = 'btn-rightside';
  const PANEL_ID = 'rightside-panel';
  const BACKDROP_ID = 'rightside-backdrop';

  function ensureRightside(){
    if (document.getElementById(PANEL_ID)) return;
    const backdrop = document.createElement('div');
    backdrop.id = BACKDROP_ID; backdrop.className = 'rightside-backdrop';
    const panel = document.createElement('aside');
    panel.id = PANEL_ID; panel.className = 'rightside-panel'; panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true');
    panel.innerHTML = `
      <div class="rightside-header">
        <div class="rightside-title">Painel lateral</div>
        <button type="button" class="rightside-close" aria-label="Fechar">&times;</button>
      </div>
      <div class="rightside-body" id="rightside-content"></div>`;
    const close = ()=>{ panel.classList.remove('open'); backdrop.classList.remove('show'); setBtnExpanded(false); };
    backdrop.addEventListener('click', close);
    panel.querySelector('.rightside-close').addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') close(); });
    document.body.append(backdrop, panel);
  }
  function getPanel(){ return document.getElementById(PANEL_ID); }
  function getBackdrop(){ return document.getElementById(BACKDROP_ID); }
  function openRightside(){ ensureRightside(); getPanel().classList.add('open'); getBackdrop().classList.add('show'); setBtnExpanded(true); }
  function toggleRightside(){ const p=getPanel(); if (!p || !p.classList.contains('open')) openRightside(); else { p.classList.remove('open'); getBackdrop().classList.remove('show'); setBtnExpanded(false);} }
  function setBtnExpanded(v){ const btn=document.getElementById(BTN_ID); if (btn) btn.setAttribute('aria-expanded', v?'true':'false'); }

  function collectInsightsHTML(){
    const src = document.getElementById('diagnostico-source');
    if (!src) return '<p class="sem-indicacao">Nenhuma indicação no momento.</p>';
    const chips = Array.from(src.querySelectorAll('.indicacao'));
    if (!chips.length) return '<p class="sem-indicacao">Nenhuma indicação no momento.</p>';
    return chips.map(ch => {
      const label = ch.querySelector('.chip-produto')?.textContent?.trim() || 'Produto';
      const tipHtml = ch.querySelector('.tooltip')?.innerHTML || '';
      return `
        <div class="insight-item" style="border-bottom:1px solid #e9ebec;padding:10px 0;">
          <div style="font-weight:600;color:#495057">${label}</div>
          <div style="color:#64748b;font-size:13px;margin-top:4px;">${tipHtml}</div>
        </div>`;
    }).join('');
  }

  function syncInsightsToPanel(){
    ensureRightside();
    const body = document.getElementById('rightside-content');
    if (!body) return;
    body.innerHTML = `<h4 style="margin:0 0 8px 0;font-size:14px;color:#495057;font-weight:600;">Insights</h4>${collectInsightsHTML()}`;
  }
  function attachObserver(){
    const grid = document.querySelector('.card-grid');
    if (!grid) return;
    const mo = new MutationObserver(syncInsightsToPanel);
    mo.observe(grid, { childList:true, subtree:true });
  }
  document.addEventListener('DOMContentLoaded', () => {
    ensureRightside();
    const btn = document.getElementById(BTN_ID);
    if (btn) btn.addEventListener('click', toggleRightside);
    attachObserver();
    syncInsightsToPanel();
  });

  window.syncInsightsToPanel = syncInsightsToPanel;
})();

/* ===========================================================
   DONUTS “COMPOSIÇÃO” (Receitas / Despesas / Patrimônio)
=========================================================== */
/* --- Receitas --- */
function lerReceitasDetalhadas(filtro='todas'){
  let campos = [];
  if (filtro === 'fixas') campos = RECEITAS_FIXAS;
  else if (filtro === 'variaveis') campos = RECEITAS_VARIAVEIS;
  else campos = [...RECEITAS_FIXAS, ...RECEITAS_VARIAVEIS];

  const itens = [];
  for (const k of campos) {
    const n = parseValorBR(localStorage.getItem(k));
    if (n > 0) itens.push({ label: k, valor: n });
  }
  return itens;
}
function topComOutras(itens, N = 8){
  if (itens.length <= N) return itens;
  const ordenado = [...itens].sort((a,b)=> b.valor - a.valor);
  const top = ordenado.slice(0, N);
  const resto = ordenado.slice(N);
  const somaResto = resto.reduce((acc, it)=> acc + it.valor, 0);
  if (somaResto > 0) top.push({ label: "Outras", valor: somaResto });
  return top;
}
let chartReceitasDonut = null;
function renderReceitasDonut(filtro='todas'){
  const elCanvas = document.getElementById('donut-receitas');
  const elLista  = document.getElementById('lista-receitas');
  if (!elCanvas || !elLista) return;

  const itens = topComOutras( lerReceitasDetalhadas(filtro), 8 );
  const total = itens.reduce((a,b)=> a+b.valor, 0);

  elLista.innerHTML = '';
  if (chartReceitasDonut) { try{ chartReceitasDonut.destroy(); }catch{} chartReceitasDonut = null; }

  if (!total || !itens.length){
    elLista.innerHTML = `
      <li class="list-item">
        <div class="list-row">
          <div class="list-left">
            <span class="avatar-xs"><i class="ri-error-warning-line"></i></span>
            <div class="list-text">
              <h6>Nenhuma receita informada</h6>
              <p class="mb-0">Preencha o formulário para ver a composição.</p>
            </div>
          </div>
        </div>
      </li>`;
    if (window.Chart){
      chartReceitasDonut = new Chart(elCanvas.getContext('2d'), {
        type: 'doughnut',
        data: { labels: ["Sem dados"], datasets: [{ data: [1] }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%', radius: '92%',
          plugins: { legend:{display:false}, centerText:{ text: formatBRL(0), subtext:'Total', fontSize:16 } }
        }
      });
    }
    return;
  }

  const labels = itens.map(i => i.label);
  const data   = itens.map(i => i.valor);

  if (window.Chart) {
    chartReceitasDonut = new Chart(elCanvas.getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data, borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%', radius: '92%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => {
            const val = ctx.parsed || 0;
            const pct = total ? (val/total*100) : 0;
            return `${formatBRL(val)} (${pct.toFixed(1)}%)`;
          }}},
          centerText: { text: formatBRL(total), subtext: 'Total', fontSize: 16 }
        }
      }
    });
  }

  itens.forEach(it => {
    const pct = total ? (it.valor/total*100) : 0;
    const li = document.createElement('li');
    li.className = 'list-item';
    li.innerHTML = `
      <div class="list-row">
        <div class="list-left">
          <span class="avatar-xs"><i class="ri-bank-card-line"></i></span>
          <div class="list-text">
            <h6 class="mb-1">${it.label}</h6>
            <p class="mb-0"></p>
          </div>
        </div>
        <div class="list-right">
          <div class="val">${formatBRL(it.valor)}</div>
          <div class="pct ${pct>0 ? 'up' : 'neutral'}">${pct.toFixed(1)}%</div>
        </div>
      </div>`;
    elLista.appendChild(li);
  });
}

/* --- Despesas --- */
const DESPESAS_CATEGORIAS = [
  "Casa","Alimentação","Saúde e Proteção","Transporte","Educação",
  "Cuidados Pessoais","Celebrações e compromissos","Lazer e viagens","Dívidas","Investimentos"
];
const DESPESAS_ESSENCIAIS = ["Casa","Alimentação","Saúde e Proteção","Transporte","Educação","Dívidas"];
const DESPESAS_VARIAVEIS  = ["Cuidados Pessoais","Celebrações e compromissos","Lazer e viagens","Investimentos"];

function getDespesasTotais(){ try { return JSON.parse(localStorage.getItem("despesasTotais") || "{}"); } catch { return {}; } }
function getSomaCategoriaFromDetalhadas(categoria){
  try {
    const det = JSON.parse(localStorage.getItem("despesasDetalhadas") || "{}");
    const mapa = det && det[categoria];
    if (!mapa || typeof mapa !== "object") return 0;
    return Object.values(mapa).reduce((acc, raw)=> acc + parseValorBR(raw), 0);
  } catch { return 0; }
}
function lerDespesasPorCategoria(filtro='todas'){
  const base = filtro === 'essenciais' ? DESPESAS_ESSENCIAIS : filtro === 'variaveis' ? DESPESAS_VARIAVEIS : DESPESAS_CATEGORIAS;
  const totais = getDespesasTotais();
  const itens = [];
  for (const cat of base) {
    let n = 0;
    if (Object.prototype.hasOwnProperty.call(totais, cat)) n = parseValorBR(totais[cat]);
    else n = getSomaCategoriaFromDetalhadas(cat);
    if (n > 0) itens.push({ label: cat, valor: n });
  }
  return itens;
}
function topComOutrasDespesas(itens, N = 8){
  if (itens.length <= N) return itens;
  const sorted = [...itens].sort((a,b)=> b.valor - a.valor);
  const top = sorted.slice(0, N);
  const resto = sorted.slice(N);
  const somaResto = resto.reduce((acc, it)=> acc + it.valor, 0);
  if (somaResto > 0) top.push({ label: "Outras", valor: somaResto });
  return top;
}
let chartDespesasDonut = null;
function renderDespesasDonut(filtro='todas'){
  const elCanvas = document.getElementById('donut-despesas');
  const elLista  = document.getElementById('lista-despesas');
  if (!elCanvas || !elLista) return;

  const itens = topComOutrasDespesas( lerDespesasPorCategoria(filtro), 8 );
  const total = itens.reduce((a,b)=> a + b.valor, 0);

  elLista.innerHTML = '';
  if (chartDespesasDonut) { try{ chartDespesasDonut.destroy(); }catch{} chartDespesasDonut = null; }

  if (!total || !itens.length){
    elLista.innerHTML = `
      <li class="list-item">
        <div class="list-row">
          <div class="list-left">
            <span class="avatar-xs"><i class="ri-error-warning-line"></i></span>
            <div class="list-text">
              <h6>Nenhuma despesa informada</h6>
              <p class="mb-0">Preencha o formulário para ver a composição.</p>
            </div>
          </div>
        </div>
      </li>`;
    if (window.Chart){
      chartDespesasDonut = new Chart(elCanvas.getContext('2d'), {
        type:'doughnut',
        data:{ labels:["Sem dados"], datasets:[{ data:[1], borderWidth:0 }] },
        options:{
          responsive:true, maintainAspectRatio:false, cutout:'65%', radius:'92%',
          plugins:{ legend:{display:false}, centerText:{ text: formatBRL(0), subtext:'Total', fontSize:16 } }
        }
      });
    }
    return;
  }

  const labels = itens.map(i=> i.label);
  const data   = itens.map(i=> i.valor);

  if (window.Chart){
    chartDespesasDonut = new Chart(elCanvas.getContext('2d'), {
      type:'doughnut',
      data:{ labels, datasets:[{ data, borderWidth:0 }] },
      options:{
        responsive:true, maintainAspectRatio:false, cutout:'65%', radius:'92%',
        plugins:{
          legend:{ display:false },
          tooltip:{ callbacks:{ label:(ctx)=> {
            const val = ctx.parsed||0, pct = total ? (val/total*100) : 0;
            return `${formatBRL(val)} (${pct.toFixed(1)}%)`;
          }}},
          centerText:{ text: formatBRL(total), subtext: 'Total', fontSize:16 }
        }
      }
    });
  }

  itens.forEach(it=>{
    const pct = total ? (it.valor/total*100) : 0;
    const li = document.createElement('li');
    li.className = 'list-item';
    li.innerHTML = `
      <div class="list-row">
        <div class="list-left">
          <span class="avatar-xs"><i class="ri-shopping-bag-3-line"></i></span>
          <div class="list-text">
            <h6 class="mb-1">${it.label}</h6>
            <p class="mb-0"></p>
          </div>
        </div>
        <div class="list-right">
          <div class="val">${formatBRL(it.valor)}</div>
          <div class="pct ${pct>0 ? 'up' : 'neutral'}">${pct.toFixed(1)}%</div>
        </div>
      </div>`;
    elLista.appendChild(li);
  });
}

/* --- Patrimônio --- */
function lerPatrimonioItens(filtro = 'todas') {
  const labelsPadrao = ["Imóvel","Imovel","Veículo","Veiculo","Investimentos"];

  const isBem = (label) => /im[óo]vel|imovel|ve[íi]culo|veiculo/i.test(label || "");
  const isInvest = (label) => /invest/i.test(label || "");

  const itens = [];
  try {
    const det = JSON.parse(localStorage.getItem("patrimonioDetalhado") || "{}");
    if (det && typeof det === "object") {
      for (const k of labelsPadrao) {
        const val = parseValorBR(det[k]);
        if (val > 0) itens.push({ label: k, valor: val });
      }
    }
  } catch {}

  if (!itens.length) {
    for (const k of labelsPadrao) {
      const val = parseValorBR(localStorage.getItem(k));
      if (val > 0) itens.push({ label: k, valor: val });
    }
  }

  if (filtro === 'bens') return itens.filter(it => isBem(it.label));
  if (filtro === 'investimentos') return itens.filter(it => isInvest(it.label));
  return itens; // todas
}

let chartPatrimonioDonut = null;
function renderPatrimonioDonut(filtro = 'todas'){
  const elCanvas = document.getElementById('donut-patrimonio');
  const elLista  = document.getElementById('lista-patrimonio');
  if (!elCanvas || !elLista) return;

  const itens = lerPatrimonioItens(filtro);
  const total = itens.reduce((a,b)=> a + b.valor, 0);

  elLista.innerHTML = '';
  if (chartPatrimonioDonut) { try{ chartPatrimonioDonut.destroy(); }catch{} chartPatrimonioDonut = null; }

  if (!total || !itens.length){
    elLista.innerHTML = `
      <li class="list-item">
        <div class="list-row">
          <div class="list-left">
            <span class="avatar-xs"><i class="ri-error-warning-line"></i></span>
            <div class="list-text">
              <h6>Nenhum patrimônio informado</h6>
              <p class="mb-0">Preencha o formulário para ver a composição.</p>
            </div>
          </div>
        </div>
      </li>`;
    if (window.Chart){
      chartPatrimonioDonut = new Chart(elCanvas.getContext('2d'), {
        type:'doughnut',
        data:{ labels:["Sem dados"], datasets:[{ data:[1], borderWidth:0 }] },
        options:{
          responsive:true, maintainAspectRatio:false, cutout:'65%', radius:'92%',
          plugins:{ legend:{display:false}, centerText:{ text: formatBRL(0), subtext:'Total', fontSize:16 } }
        }
      });
    }
    return;
  }

  const labels = itens.map(i=> i.label);
  const data   = itens.map(i=> i.valor);

  if (window.Chart){
    chartPatrimonioDonut = new Chart(elCanvas.getContext('2d'), {
      type:'doughnut',
      data:{ labels, datasets:[{ data, borderWidth:0 }] },
      options:{
        responsive:true, maintainAspectRatio:false, cutout:'65%', radius:'92%',
        plugins:{
          legend:{ display:false },
          tooltip:{ callbacks:{ label:(ctx)=>{
            const val = ctx.parsed||0, pct = total ? (val/total*100) : 0;
            return `${formatBRL(val)} (${pct.toFixed(1)}%)`;
          }}},
          centerText:{ text: formatBRL(total), subtext: 'Total', fontSize: 16 }
        }
      }
    });
  }

  const iconFor = (label) => {
    const l = (label||"").toLowerCase();
    if (l.includes("imó") || l.includes("imo")) return "ri-home-3-line";
    if (l.includes("veíc") || l.includes("veic") || l.includes("carro")) return "ri-car-line";
    if (l.includes("invest")) return "ri-line-chart-line";
    return "ri-donut-chart-line";
  };
  itens.forEach(it=>{
    const pct = total ? (it.valor/total*100) : 0;
    const li = document.createElement('li');
    li.className = 'list-item';
    li.innerHTML = `
      <div class="list-row">
        <div class="list-left">
          <span class="avatar-xs"><i class="${iconFor(it.label)}"></i></span>
          <div class="list-text">
            <h6 class="mb-1">${it.label}</h6>
            <p class="mb-0"></p>
          </div>
        </div>
        <div class="list-right">
          <div class="val">${formatBRL(it.valor)}</div>
          <div class="pct ${pct>0 ? 'up' : 'neutral'}">${pct.toFixed(1)}%</div>
        </div>
      </div>`;
    elLista.appendChild(li);
  });
}


/* ===========================================================
   DROPDOWNS “like” (abrir/fechar + filtros nos cards)
=========================================================== */
(function(){
  function closeAll(){ document.querySelectorAll('.dropdown-like.open').forEach(d => d.classList.remove('open')); }
  document.addEventListener('click', (e)=>{
    const dd = e.target.closest('.dropdown-like');
    if (dd) {
      if (e.target.closest('.btn')) dd.classList.toggle('open');
    } else closeAll();
  });

  // Receitas: filtro
  document.addEventListener('click', (e)=>{
    const item = e.target.closest('.receitas-filter-item');
    if (!item) return;
    const filtro = item.getAttribute('data-filter') || 'todas';
    const dd = item.closest('.dropdown-like');
    dd?.querySelector('.btn span')?.replaceChildren(document.createTextNode(
      filtro === 'fixas' ? 'Fixas' : filtro === 'variaveis' ? 'Variáveis' : 'Todas'
    ));
    dd?.classList.remove('open');
    renderReceitasDonut(filtro);
  });

  // Despesas: filtro
  document.addEventListener('click', (e)=>{
    const item = e.target.closest('.despesas-filter-item');
    if (!item) return;
    const filtro = item.getAttribute('data-filter') || 'todas';
    const dd = item.closest('.dropdown-like');
    const label = filtro === 'essenciais' ? 'Essenciais' : filtro === 'variaveis' ? 'Variáveis' : 'Todas';
    dd?.querySelector('.btn span')?.replaceChildren(document.createTextNode(label));
    dd?.classList.remove('open');
    renderDespesasDonut(filtro);
  });

  // Patrimônio: filtro
  document.addEventListener('click', (e)=>{
    const item = e.target.closest('.patrimonio-filter-item');
    if (!item) return;
    const filtro = item.getAttribute('data-filter') || 'todas';
    const dd = item.closest('.dropdown-like');
    dd?.querySelector('.filter-chip .chip-text')?.replaceChildren(
      document.createTextNode(
        filtro === 'bens' ? 'Bens' :
        filtro === 'investimentos' ? 'Investimentos' : 'Todas'
      )
    );
    dd?.classList.remove('open');
    renderPatrimonioDonut(filtro);
  });
})();

/* ===========================================================
   E-MAIL (com tabela de gráficos) – mantido
=========================================================== */
function enviarEmail() {
  const receitasCamposFixas = RECEITAS_FIXAS;
  const receitasCamposVariaveis = RECEITAS_VARIAVEIS;
  const categoriasDespesas = DESPESAS_CATEGORIAS;
  const patrimonioCamposLoc = ["Imóvel","Veículo","Investimentos"];

  const soma = arr => arr.reduce((a,b)=>a+b,0);
  const getNum = key => parseFloat(localStorage.getItem(key) || "0");

  const totalFixas = soma(receitasCamposFixas.map(getNum));
  const totalVariaveis = soma(receitasCamposVariaveis.map(getNum));
  const totalReceitas = totalFixas + totalVariaveis;

  const pctFixas = totalReceitas > 0 ? (totalFixas / totalReceitas) : 0;
  const compRenda = pctFixas >= 0.6 ? "fontes fixas" : "fontes variáveis";
  const perfilRenda = pctFixas >= 0.6 ? "estabilidade" : "variação";

  const despesasTotaisLS = JSON.parse(localStorage.getItem("despesasTotais") || "{}");
  const getDespesa = cat => Number(despesasTotaisLS[cat] || 0);
  const mapaDespesas = Object.fromEntries(categoriasDespesas.map(c => [c, getDespesa(c)]));
  const totalDespesas = Object.values(mapaDespesas).reduce((a,b)=>a+b,0);

  const mapaPatrimonio = Object.fromEntries(patrimonioCamposLoc.map(campo => [campo, getNum(campo)]));
  const totalPatrimonio = Object.values(mapaPatrimonio).reduce((a,b)=>a+b,0);

  const imgReceitas   = document.getElementById('grafico-receitas')?.toDataURL?.() || "";
  const imgDespesas   = document.getElementById('grafico-despesas')?.toDataURL?.() || "";
  const imgPatrimonio = document.getElementById('grafico-patrimonio')?.toDataURL?.() || "";

  const tabelaGraficos = (imgReceitas && imgDespesas && imgPatrimonio) ? `
<table style="width:100%; border-collapse:collapse; table-layout:fixed; margin:16px 0;">
  <thead>
    <tr style="background-color:transparent;">
      <th style="text-align:center; padding:8px; font-weight:600;">Receitas</th>
      <th style="text-align:center; padding:8px; font-weight:600;">Despesas</th>
      <th style="text-align:center; padding:8px; font-weight:600;">Patrimônio</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color:transparent;">
      <td style="text-align:center; vertical-align:middle; padding:12px;">
        <img src="${imgReceitas}"   alt="Gráfico de Receitas"   style="max-width:220px; height:auto;">
      </td>
      <td style="text-align:center; vertical-align:middle; padding:12px;">
        <img src="${imgDespesas}"   alt="Gráfico de Despesas"   style="max-width:220px; height:auto;">
      </td>
      <td style="text-align:center; vertical-align:middle; padding:12px;">
        <img src="${imgPatrimonio}" alt="Gráfico de Patrimônio" style="max-width:220px; height:auto;">
      </td>
    </tr>
  </tbody>
</table>` : "";

  const corpoEmail = `
<p>Olá,</p>
<p>Com base nas informações compartilhadas sobre sua realidade financeira, realizei uma análise inicial considerando suas receitas, despesas e patrimônio. Abaixo, apresento os principais pontos observados para apoiar uma avaliação mais clara e estratégica da sua situação financeira.</p>
${tabelaGraficos}
<p><b>1. Receitas</b></p>
<p>A soma total das receitas está em torno de <b>${formatBRL(totalReceitas)}</b>, provenientes de diferentes fontes como salário, aposentadoria, bônus, aluguéis, entre outras.</p>
<p>Foi possível identificar que a composição da renda é majoritariamente baseada em <b>${compRenda}</b>, o que indica um perfil de <b>${perfilRenda}</b>. Esse entendimento é fundamental para definir o potencial de economia mensal, investimentos e eventual quitação de dívidas.</p>
<p><b>2. Despesas</b></p>
<p>As despesas mensais somam aproximadamente <b>${formatBRL(totalDespesas)}</b>, distribuídas da seguinte forma:</p>
<p>
Casa: ${formatBRL(mapaDespesas["Casa"])}<br>
Alimentação: ${formatBRL(mapaDespesas["Alimentação"])}<br>
Saúde e Proteção: ${formatBRL(mapaDespesas["Saúde e Proteção"])}<br>
Transporte: ${formatBRL(mapaDespesas["Transporte"])}<br>
Educação: ${formatBRL(mapaDespesas["Educação"])}<br>
Cuidados Pessoais: ${formatBRL(mapaDespesas["Cuidados Pessoais"])}<br>
Celebrações e Compromissos: ${formatBRL(mapaDespesas["Celebrações e compromissos"])}<br>
Lazer e Viagens: ${formatBRL(mapaDespesas["Lazer e viagens"])}<br>
Dívidas: ${formatBRL(mapaDespesas["Dívidas"])}<br>
Investimentos: ${formatBRL(mapaDespesas["Investimentos"])}
</p>
<p><b>3. Patrimônio</b></p>
<p>
Imóvel: ${formatBRL(mapaPatrimonio["Imóvel"])}<br>
Veículo: ${formatBRL(mapaPatrimonio["Veículo"])}<br>
Investimentos: ${formatBRL(mapaPatrimonio["Investimentos"])}<br>
<b>Total estimado:</b> ${formatBRL(totalPatrimonio)}
</p>
<p><b>Recomendações iniciais:</b></p>
<ul>
  <li>Definir um orçamento mensal com metas claras de economia.</li>
  <li>Construir ou reforçar a reserva de emergência.</li>
  <li>Avaliar os gastos recorrentes e identificar oportunidades de otimização.</li>
  <li>Redirecionar sobras de receita para investimentos alinhados ao perfil financeiro.</li>
  <li>Reduzir ou eliminar dívidas que impactem negativamente o fluxo mensal.</li>
</ul>
<p>Caso queira aprofundar esta análise ou traçar um plano de ação personalizado, fico à disposição para continuar com o acompanhamento.</p>
<p>Atenciosamente,</p>`;

  const mailto = `mailto:?subject=Consultoria Financeira&body=${encodeURIComponent('Cole o conteúdo copiado no corpo do e-mail.')}`;
  const w = window.open("", "_blank");
  w.document.write(`
    <html><head><title>Copiar análise para e-mail</title></head>
    <body>
      <h2>Copie e cole o conteúdo abaixo no corpo do e-mail:</h2>
      ${corpoEmail}
      <p style="margin-top:16px;">
        <button onclick="copiarConteudo()">Copiar conteúdo</button>
        <a href="${mailto}" target="_blank"><button>Abrir Outlook</button></a>
      </p>
      <script>
        function copiarConteudo() {
          navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([\`${corpoEmail}\`], { type: 'text/html' })
            })
          ]).then(() => {
            alert('Conteúdo copiado! Agora cole no e-mail com Ctrl+V.');
          }).catch(() => {
            alert('Não foi possível copiar. Verifique permissões do navegador (HTTPS é necessário).');
          });
        }
      </script>
    </body></html>
  `);
}

/* ===========================================================
   INICIALIZAÇÃO
=========================================================== */
window.addEventListener('load', function(){
  // Carrega agregados existentes (se houver) para exibir valores-resumo
  const r = parseFloat(localStorage.getItem("receitasTotal"));
  const p = parseFloat(localStorage.getItem("patrimonioTotal"));
  try { despesasTotais = JSON.parse(localStorage.getItem("despesasTotais") || "{}"); } catch { despesasTotais = {}; }

  const elR = document.getElementById("valor-receitas");
  if (!isNaN(r) && elR) elR.innerText = formatBRL(r);
  const elP = document.getElementById("valor-patrimonio");
  if (!isNaN(p) && elP) elP.innerText = formatBRL(p);
  const elD = document.getElementById("valor-despesas");
  if (elD) {
    const totalGeral = Object.values(despesasTotais).reduce((a,b)=> a + (parseValorBR(b)||0), 0);
    elD.innerText = formatBRL(totalGeral);
  }

  // Render dos donuts (2ª linha)
  renderReceitasDonut('todas');
  renderDespesasDonut('todas');
  renderPatrimonioDonut('todas');

  // Widgets + Diagnóstico inicial + Painel lateral
  updateTopWidgets();
  atualizarCard4Diagnostico();
  syncInsightsToPanel();
});

/* APIs para atualizar via outros pontos do código */
window.refreshDashboardWidgets = updateTopWidgets;
window.refreshReceitasDonut = function(){
  const btn = document.getElementById('btnReceitasFiltro');
  let filtro = 'todas';
  const label = btn?.querySelector('span')?.textContent?.trim().toLowerCase();
  if (label === 'fixas') filtro = 'fixas';
  else if (label === 'variáveis' || label === 'variaveis') filtro = 'variaveis';
  renderReceitasDonut(filtro);
};
window.refreshDespesasDonut = function(){
  const btn = document.getElementById('btnDespesasFiltro');
  let filtro = 'todas';
  const txt = btn?.querySelector('span')?.textContent?.trim().toLowerCase();
  if (txt === 'essenciais') filtro = 'essenciais';
  else if (txt === 'variáveis' || txt === 'variaveis') filtro = 'variaveis';
  renderDespesasDonut(filtro);
};
// preserva o filtro atual do Patrimônio
window.refreshPatrimonioDonut = function(){
  const chip = document.querySelector('#card-patrimonio-donut .filter-chip .chip-text');
  let filtro = 'todas';
  const label = chip?.textContent?.trim().toLowerCase();
  if (label === 'bens') filtro = 'bens';
  else if (label === 'investimentos') filtro = 'investimentos';
  renderPatrimonioDonut(filtro);
};

/* ===== Util: marcar cards clicáveis e abrir modal com clique/teclado ===== */
function makeCardOpenModal(cards, modalTipo) {
  cards.forEach(card => {
    if (!card) return;
    if (card.dataset.boundModal === modalTipo) return; // evita bind duplicado
    card.dataset.boundModal = modalTipo;

    card.classList.add('is-clickable-card');
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');

    const onClick = (e) => {
      if (e.target.closest('button, a, input, select, textarea, label, .dropdown-like, .dropdown-like-menu')) return;
      abrirModal(modalTipo);
    };
    const onKey = (e) => {
      const inDropdown = document.activeElement.closest('.dropdown-like');
      if (inDropdown) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirModal(modalTipo); }
    };

    card.addEventListener('click', onClick);
    card.addEventListener('keydown', onKey);
  });
}
function findStatCardByTitle(title) {
  const cards = document.querySelectorAll('.stats-row .stat-card');
  for (const c of cards) {
    const t = (c.querySelector('.stat-title')?.textContent || '').toLowerCase();
    if (t.includes(title.toLowerCase())) return c;
  }
  return null;
}
function bindAbrirModalReceitas() {
  const statCard = findStatCardByTitle('Receitas');
  const compCard = document.querySelector('.receitas-card');
  const gridCard = document.getElementById('grafico-receitas')?.closest('.card');
  makeCardOpenModal([statCard, compCard, gridCard], 'receitas');
}
function bindAbrirModalDespesas() {
  const statCard = findStatCardByTitle('Despesas');
  const compCard = document.getElementById('card-despesas-donut');
  const gridCard = document.getElementById('grafico-despesas')?.closest('.card');
  makeCardOpenModal([statCard, compCard, gridCard], 'despesas');
}
function bindAbrirModalPatrimonio() {
  const statCard = findStatCardByTitle('Patrimônio');
  const compCard = document.getElementById('donut-patrimonio')?.closest('.card');
  const gridCard = document.getElementById('grafico-patrimonio')?.closest('.card');
  makeCardOpenModal([statCard, compCard, gridCard], 'patrimonio');
}
document.addEventListener('DOMContentLoaded', () => {
  bindAbrirModalReceitas();
  bindAbrirModalDespesas();
  bindAbrirModalPatrimonio();
});

/* ---- Refresh central: atualiza tudo que é visual ---- */
function refreshAllVisuals() {
  window.updateTopWidgets?.();
  window.refreshReceitasDonut?.();
  window.refreshDespesasDonut?.();
  window.refreshPatrimonioDonut?.();
  window.atualizarCard4Diagnostico?.();
  window.syncInsightsToPanel?.();
  window.updateNotificationDropdown?.(); // <— importante
  rebuildLegacyCharts?.();
}


/* ---- Dispara refresh em MESMA aba e OUTRAS abas ---- */
function notifyDataChanged() {
  window.dispatchEvent(new Event('dados:atualizados'));
  localStorage.setItem('__lastUpdate', String(Date.now()));
}
window.addEventListener('dados:atualizados', refreshAllVisuals);
window.addEventListener('storage', (e) => { if (e.key === '__lastUpdate') refreshAllVisuals(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshAllVisuals(); });

/* ---- Compat: gráficos legados (no-op) ---- */
function atualizarGrafico(){ /* removido: gráficos legados excluídos */ }
window.rebuildLegacyCharts = window.rebuildLegacyCharts || function(){};

// Fonte invisível para o diagnóstico (sempre disponível)
function ensureDiagSource(){
  let el = document.getElementById('diagnostico-source');
  if (!el) {
    el = document.createElement('div');
    el.id = 'diagnostico-source';
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  return el;
}


/* === TOPBAR DROPDOWNS — CONTROLADOR ÚNICO (apenas clique) ============ */
(function () {
  const CONTAINER_SEL = '.topbar [data-dropdown]';
  const TOGGLE_SEL    = '[data-toggle="dropdown"]';

  function containers() { return document.querySelectorAll(CONTAINER_SEL); }
  function toggles()    { return document.querySelectorAll(CONTAINER_SEL + ' ' + TOGGLE_SEL); }

  function closeAll(except) {
    containers().forEach(c => { if (c !== except) c.classList.remove('show'); });
    toggles().forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest(TOGGLE_SEL);
    const host = btn ? btn.closest(CONTAINER_SEL) : null;

    if (btn && host) {
      e.preventDefault();
      const willOpen = !host.classList.contains('show');
      closeAll(host);
      host.classList.toggle('show', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
      return; // não propaga para o "clique fora"
    }

    // clique fora: fecha tudo
    if (!e.target.closest(CONTAINER_SEL)) closeAll();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
})();





/* ===== Notificações: abas + contadores + listas ===== */
(function(){
  const els = {
    badge:       document.getElementById('notif-badge'),
    newBadge:    document.getElementById('notif-new-badge'),
    tabAllCount: document.getElementById('notifTabAllCount'),
    tabDiagCount:document.getElementById('notifTabDiagCount'),
    tabInsCount: document.getElementById('notifTabInsCount'),
    listAll:     document.getElementById('notif-all-list'),
    listDiag:    document.getElementById('notif-diag-list'),
    listIns:     document.getElementById('notif-ins-list'),
    menu:        document.getElementById('notif-menu')
  };

  function getCounts(){
    const diag = (typeof contarDiagnosticosAtivos === 'function') ? contarDiagnosticosAtivos() : 0;
    const src  = document.getElementById('diagnostico-source') || (typeof ensureDiagSource === 'function' ? ensureDiagSource() : null);
    const ins  = src ? src.querySelectorAll('.indicacao').length : 0;
    return { diag, ins, total: diag + ins };
  }

  // Cria itens dos DIAGNÓSTICOS (mesma lógica das regras do card)
  function computeDiagnosticsItems(){
    const items = [];

    const valorLuz         = (typeof obterValorContaDeLuz === 'function') ? obterValorContaDeLuz() : 0;
    const valorSeguroCasa  = (typeof obterValorSeguroDaCasa === 'function') ? obterValorSeguroDaCasa() : 0;
    const valorPet         = (typeof obterValorAnimaisEstimacao === 'function') ? obterValorAnimaisEstimacao() : 0;
    const valorSeguroVida  = (typeof obterValorSeguroDeVida === 'function') ? obterValorSeguroDeVida() : 0;
    const valorCombustivel = (typeof obterValorCombustivelTransporte === 'function') ? obterValorCombustivelTransporte() : 0;
    const valorPresentes   = (typeof obterValorPresentesCelebracoes === 'function') ? obterValorPresentesCelebracoes() : 0;

    if (valorLuz >= 250){
      const econ10 = valorLuz * 0.10, econ15 = valorLuz * 0.15;
      items.push({
        icon:'bx bx-bulb',
        title:'Conta de Luz alta',
        desc:`Pode economizar entre <b>${formatBRL(econ10)}</b> e <b>${formatBRL(econ15)}</b> ao mês (FIT Energia).`,
        when:'agora'
      });
    }
    if (valorSeguroCasa === 0){
      items.push({
        icon:'bx bx-home-alt',
        title:'Sem seguro residencial',
        desc: valorPet > 0
          ? 'Tem custos de moradia e pet. Considere as assistências do seguro residencial (inclui serviço Pet).'
          : 'Tem custos de moradia. Considere as assistências do seguro residencial.',
        when:'agora'
      });
    }
    if (valorSeguroVida === 0){
      const totalPatrimonio   = (typeof obterTotalPatrimonio === 'function') ? obterTotalPatrimonio() : 0;
      const totalDespesasCAE  = (typeof obterTotalDespesasCAE === 'function') ? obterTotalDespesasCAE() : 0;
      const base              = (totalPatrimonio * 0.10) + (totalDespesasCAE * 60);
      const sugerido          = (typeof arredondarParaCimaMultiplo === 'function') ? arredondarParaCimaMultiplo(base, 50000) : base;
      items.push({
        icon:'bx bx-shield-quarter',
        title:'Sem seguro de vida',
        desc:`Capital sugerido: <b>${formatBRL(sugerido)}</b> (com base em despesas e patrimônio).`,
        when:'agora'
      });
    }
    if (valorCombustivel > 0){
      items.push({
        icon:'bx bx-gas-pump',
        title:'Gasto com combustível',
        desc:'Agende o vencimento do seguro auto (Auto Compara).',
        when:'agora'
      });
    }
    if (valorPresentes > 0){
      items.push({
        icon:"bx bx-gift",
        title:'Gastos com presentes',
        desc:'Aproveite descontos no Esfera para compras de presente.',
        when:'agora'
      });
    }
    return items;
  }

  // Cria itens dos INSIGHTS a partir dos chips do diagnóstico
  function computeInsightsItems(){
    const list = [];
    const src = document.getElementById('diagnostico-source') || (typeof ensureDiagSource === 'function' ? ensureDiagSource() : null);
    if (!src) return list;
    src.querySelectorAll('.indicacao').forEach(ch => {
      const title = ch.querySelector('.chip-produto')?.textContent?.trim() || 'Insight';
      const tip   = ch.querySelector('.tooltip')?.innerHTML || '';
      list.push({
        icon:'bx bx-info-circle',
        title, desc:tip, when:'recente'
      });
    });
    return list;
  }

  function itemHTML(item){
    // ícone usando Boxicons (já tem remixicon; esse usa classe bx, mas visual é ok)
    return `
      <a href="#!" class="text-reset notification-item d-block dropdown-item">
        <div class="d-flex">
          <div class="avatar-xs">
            <span class="avatar-title rounded-circle">
              <i class="${item.icon}"></i>
            </span>
          </div>
          <div class="flex-grow-1">
            <h6 class="mt-0 mb-1 fs-13">${item.title}</h6>
            <div class="fs-13 text-muted">
              <p class="mb-1">${item.desc}</p>
            </div>
            <p class="mb-0 fs-11 fw-medium text-uppercase text-muted">
              <span><i class="mdi mdi-clock-outline"></i> ${item.when}</span>
            </p>
          </div>
        </div>
      </a>`;
  }

  function emptyHTML(msg){
    return `
      <div class="p-4 text-center">
        <div style="width:72px;height:72px;margin:0 auto 8px auto;opacity:.7;">
          <i class="ri-notification-off-line" style="font-size:64px;"></i>
        </div>
        <div class="fs-13 text-muted">${msg}</div>
      </div>`;
  }

  function renderAll(){
    const counts = getCounts();
    // contadores
    if (els.badge)    els.badge.textContent = counts.total;
    if (els.newBadge) els.newBadge.textContent = `${counts.total} novas`;
    if (els.tabAllCount)  els.tabAllCount.textContent  = counts.total;
    if (els.tabDiagCount) els.tabDiagCount.textContent = counts.diag;
    if (els.tabInsCount)  els.tabInsCount.textContent  = counts.ins;

    // listas
    const diags = computeDiagnosticsItems();
    const ins   = computeInsightsItems();

    if (els.listDiag) els.listDiag.innerHTML = diags.length ? diags.map(itemHTML).join('') : emptyHTML('Sem diagnósticos no momento.');
    if (els.listIns)  els.listIns.innerHTML  = ins.length   ? ins.map(itemHTML).join('')   : emptyHTML('Sem insights no momento.');

    if (els.listAll){
      const all = [...diags, ...ins];
      els.listAll.innerHTML = all.length ? all.map(itemHTML).join('') : emptyHTML('Nada por aqui ainda.');
    }
  }

  // tabs (sem bootstrap)
  function bindTabs(){
    const wrap = els.menu;
    if (!wrap) return;
    const links = wrap.querySelectorAll('.notif-tabs .nav-link');
    links.forEach(link=>{
      link.addEventListener('click', (ev)=>{
        ev.preventDefault();
        const tab = link.getAttribute('data-tab') || 'all';
        // ativa link
        links.forEach(l => l.classList.toggle('active', l===link));
        links.forEach(l => l.setAttribute('aria-selected', l===link ? 'true':'false'));
        // ativa pane
        wrap.querySelectorAll('.tab-pane').forEach(p => {
          const on = (p.getAttribute('data-pane') === tab);
          p.classList.toggle('show', on);
        });
      });
    });
  }

  // inicialização
  document.addEventListener('DOMContentLoaded', ()=>{
    bindTabs();
    renderAll();
  });

  // deixa público para o refresh geral
  window.updateNotificationDropdown = renderAll;
})();

// inclua no seu refresh central
// (se já tiver, mantenha; senão adicione esta linha no refreshAllVisuals)
window.updateNotificationDropdown?.();


/* ===== Notificações (tabs + listas + contadores) ===== */
(function(){
  const SEL_MENU = '#notif-menu';

  function stripTags(html){ const d=document.createElement('div'); d.innerHTML=html||''; return d.textContent||d.innerText||''; }

  function listDiagnostics(){
    const itens = [];
    const luz = obterValorContaDeLuz();
    const segCasa = obterValorSeguroDaCasa();
    const segVida = obterValorSeguroDeVida();
    const combust = obterValorCombustivelTransporte();
    const presentes = obterValorPresentesCelebracoes();

    if (luz >= 250) itens.push({icon:'ri-flashlight-line', title:'Conta de luz elevada', sub:`${formatBRL(luz)} — considerar economia (10% a 15%).`});
    if (segCasa === 0) itens.push({icon:'ri-shield-home-line', title:'Sem seguro residencial', sub:'Rever coberturas e assistências úteis.'});
    if (segVida === 0) itens.push({icon:'ri-heart-pulse-line', title:'Sem seguro de vida', sub:'Sugerir capital baseado em despesas e patrimônio.'});
    if (combust > 0) itens.push({icon:'ri-gas-station-line', title:'Gasto com combustível', sub:'Avaliar data do seguro auto.'});
    if (presentes > 0) itens.push({icon:'ri-gift-line', title:'Gastos com presentes', sub:'Oferecer descontos via parceiras.'});
    return itens;
  }

  function listInsights(){
    const src = document.getElementById('diagnostico-source');
    if (!src) return [];
    return Array.from(src.querySelectorAll('.indicacao')).map(ch => {
      const title = (ch.querySelector('.chip-produto')?.textContent || 'Insight').trim();
      const tipHtml = ch.querySelector('.tooltip')?.innerHTML || '';
      return { icon:'ri-lightbulb-flash-line', title, sub: stripTags(tipHtml) };
    });
  }

  function renderList(ul, items){
    ul.innerHTML = '';
    if (!items.length){
      ul.innerHTML = `
        <li class="list-item">
          <div class="list-row">
            <div class="list-left">
              <span class="avatar-xs"><i class="ri-error-warning-line"></i></span>
              <div class="list-text">
                <h6>Nenhum item por aqui</h6>
                <p class="mb-0">Sem registros no momento.</p>
              </div>
            </div>
          </div>
        </li>`;
      return;
    }
    items.forEach(it=>{
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <div class="list-row">
          <div class="list-left">
            <span class="avatar-xs"><i class="${it.icon}"></i></span>
            <div class="list-text">
              <h6 class="mb-1">${it.title}</h6>
              <p class="mb-0">${it.sub || ''}</p>
            </div>
          </div>
        </div>`;
      ul.appendChild(li);
    });
  }

  function syncNotif(){
    const diag = listDiagnostics();
    const ins  = listInsights();
    const all  = [...diag, ...ins];

    const menu = document.querySelector(SEL_MENU);
    if (!menu) return;

    // contadores
    menu.querySelector('#notif-count-all')?.replaceChildren(document.createTextNode(String(all.length)));
    menu.querySelector('#notif-count-diag')?.replaceChildren(document.createTextNode(String(diag.length)));
    menu.querySelector('#notif-count-insights')?.replaceChildren(document.createTextNode(String(ins.length)));
    const badge = menu.querySelector('#notif-badge-total');
    if (badge) badge.textContent = all.length ? `${all.length} novas` : 'Sem novidades';

    // listas
    renderList(menu.querySelector('#notif-list-all'), all);
    renderList(menu.querySelector('#notif-list-diag'), diag);
    renderList(menu.querySelector('#notif-list-insights'), ins);
  }

  // tabs por clique (não fecha o dropdown)
  document.addEventListener('click', (e)=>{
    const tab = e.target.closest(SEL_MENU+' .dropdown-tab');
    if (!tab) return;
    const wrap = tab.closest(SEL_MENU);
    wrap.querySelectorAll('.dropdown-tab').forEach(t=> t.classList.remove('active'));
    tab.classList.add('active');

    const target = tab.getAttribute('data-tab');
    wrap.querySelectorAll('.tab-pane').forEach(p=> p.classList.toggle('active', p.getAttribute('data-pane') === target));
  });

  // sincroniza em momentos chave
  document.addEventListener('DOMContentLoaded', syncNotif);
  window.addEventListener('dados:atualizados', syncNotif);
  window.syncNotifDropdown = syncNotif; // opcional, se quiser chamar manualmente
})();
