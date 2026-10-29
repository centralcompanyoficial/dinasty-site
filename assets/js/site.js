/* =========================================================================
   DINASTY — script compartilhado do site (sem frameworks).
   Cada bloco só roda se a página tiver os elementos dele.
   ========================================================================= */
(() => {
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===================== dados da central (os mesmos do jogo e do Discord) ===================== */
const SUPA = "https://drjxrhjbkqcjhhqkssvz.supabase.co";
const CHAVE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyanhyaGpia3FjamhocWtzc3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MTc4NjIsImV4cCI6MjEwNzM5Mzg2Mn0.i9HC2IL-zgO8NT35pt4PqDCxHqno8h_stEKwmGnD1rY";
const API = SUPA + "/functions/v1/dinasty-api";
const H = {apikey: CHAVE, Authorization: "Bearer " + CHAVE};
const ler = (q) => fetch(SUPA + "/rest/v1/" + q, {headers: H}).then(r => r.ok ? r.json() : Promise.reject(r.status));
// Sem emoji no site (decisão do Gustavo): textos que vêm do servidor/Discord (anúncios, campeonatos, nicks) perdem os emojis aqui
/** Sem ícone enviado: um símbolo simples por tipo de prêmio (no traço do site, sem emoji colorido). */
const ICONE_PREMIO = { dinheiro: "$", skin: "◆", trofeu: "♛", item: "✦", titulo: "♔", outro: "★" };
const semEmoji = (s) => String(s ?? "").replace(/(?![\u00A9\u00AE\u2122])[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu, "").replace(/[ \t]{2,}/g, " ").replace(/^[\s・·:|-]+/, "");
const esc = (s) => semEmoji(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const negrito = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const fmtData = new Intl.DateTimeFormat("pt-BR", {timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"});
const fmtDia = new Intl.DateTimeFormat("pt-BR", {timeZone: "America/Sao_Paulo", day: "2-digit", month: "short"});
const fmtHora = new Intl.DateTimeFormat("pt-BR", {timeZone: "America/Sao_Paulo", weekday: "long", hour: "2-digit", minute: "2-digit"});

/* links antigos do site de uma página só (o bot do Discord ainda manda /#campeonatos) */
const ANTIGOS = {"#campeonatos": "/campeonatos/", "#anuncios": "/novidades/", "#novidades": "/novidades/", "#baixar": "/baixar/", "#classes": "/classes/", "#mapa": "/mapa/", "#comunidade": "/baixar/"};
if (ANTIGOS[location.hash] && !document.getElementById(location.hash.slice(1))) location.replace(ANTIGOS[location.hash]);

/* ===================== topo e menu do celular ===================== */
const topo = $("#topo");
if (topo) {
  const rolou = () => topo.classList.toggle("rolou", scrollY > 40);
  addEventListener("scroll", rolou, {passive: true}); rolou();
  const botao = $(".hamburguer", topo), menu = $("#menu");
  const fechar = (focar) => {
    topo.classList.remove("aberto"); document.body.classList.remove("menu-aberto");
    botao.setAttribute("aria-expanded", "false"); botao.setAttribute("aria-label", "Abrir menu");
    if (focar) botao.focus();
  };
  botao?.addEventListener("click", () => {
    const abrir = botao.getAttribute("aria-expanded") !== "true";
    if (!abrir) return fechar();
    topo.classList.add("aberto"); document.body.classList.add("menu-aberto");
    botao.setAttribute("aria-expanded", "true"); botao.setAttribute("aria-label", "Fechar menu");
    $("a", menu)?.focus();
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && topo.classList.contains("aberto")) fechar(true); });
  $$("a", menu).forEach(a => a.addEventListener("click", () => fechar()));
  matchMedia("(min-width: 981px)").addEventListener("change", e => { if (e.matches) fechar(); });
}

/* ===================== revelar ao rolar ===================== */
const revelar = $$("[data-revela]");
if (calmo || !("IntersectionObserver" in window)) revelar.forEach(el => el.classList.add("visivel"));
else {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visivel"); io.unobserve(e.target); } }), {rootMargin: "0px 0px -8% 0px"});
  revelar.forEach(el => io.observe(el));
}

/* ===================== vídeos (degradam sem quebrar) ===================== */
// Vídeo de fundo do topo: só aparece se o arquivo existir e tocar. Sem arquivo = fica a arte animada.
// Herói em movimento: aparece por cima da foto quando começa a tocar. Toca sempre (movimento lento, sem piscar),
// inclusive com "animações desligadas" no Windows, que senão deixava o site parado.
$$(".hero-arte-video").forEach(v => {
  v.muted = true;
  v.addEventListener("playing", () => v.classList.add("tocando"), {once: true});
  if (!v.paused && v.readyState >= 3) v.classList.add("tocando"); // já estava tocando antes do script
  v.play?.().catch(() => {});
});
$$("video[data-fundo]").forEach(v => {
  if (calmo || matchMedia("(max-width: 760px)").matches || navigator.connection?.saveData) { v.remove(); return; }
  v.addEventListener("playing", () => v.classList.add("tocando"), {once: true});
  $$("source", v).forEach(s => s.addEventListener("error", () => v.remove()));
  v.addEventListener("error", () => v.remove());
  v.src = v.dataset.fundo; v.load();
  v.play?.().catch(() => {});
});
// Players com controles: se o arquivo não existir, mostra a reserva ("em breve").
$$(".player[data-video]").forEach(p => {
  const v = document.createElement("video");
  v.controls = true; v.preload = "metadata"; v.playsInline = true;
  if (p.dataset.capa) v.poster = p.dataset.capa;
  v.setAttribute("aria-label", p.dataset.rotulo || "Vídeo de gameplay");
  v.addEventListener("loadedmetadata", () => { p.classList.add("com-video"); p.prepend(v); }, {once: true});
  v.addEventListener("error", () => v.remove());
  v.src = p.dataset.video;
});

/* ===================== Discord, versão e jogadores online ===================== */
$$(".js-discord").forEach(a => { a.href = API + "/convite?ir"; a.target = "_blank"; a.rel = "noopener"; });

// versao.json: o mesmo arquivo que o jogo lê pra avisar atualização ("instalador" é relativo à raiz do site)
if ($("[data-versao],[data-tamanho],[data-instalador]")) {
  fetch("/versao.json", {cache: "no-store"}).then(r => r.json()).then(v => {
    if (v.instalador) $$("[data-instalador]").forEach(a => a.href = new URL(v.instalador, location.origin + "/").href);
    if (v.tamanho) $$("[data-tamanho]").forEach(el => el.textContent = v.tamanho);
    if (v.versao) $$("[data-versao]").forEach(el => el.textContent = "Versão " + v.versao);
    if (v.novidades) $$("[data-versao-novidades]").forEach(el => { el.textContent = "· " + semEmoji(v.novidades); el.hidden = false; });
  }).catch(() => {});
}

if ($("[data-online]")) {
  const online = () => fetch(SUPA + "/rest/v1/rpc/jogadores_online", {method: "POST", headers: {...H, "Content-Type": "application/json"}, body: "{}"})
    .then(r => r.json()).then(n => {
      if (typeof n !== "number") return;
      $$("[data-online]").forEach(el => {
        el.hidden = false;
        $(".txt", el).textContent = n === 0 ? "Seja o primeiro a entrar agora" : n === 1 ? "1 pessoa jogando agora" : n + " pessoas jogando agora";
      });
    }).catch(() => {});
  online(); setInterval(online, 60000);
}

/* ===================== NOVIDADES ===================== */
const TIPOS = {novidade:["Novidade","#9B6BFF"], atualizacao:["Atualização","#3AA0FF"], campeonato:["Campeonato","#FFD147"], evento:["Evento","#FF4FD8"], manutencao:["Manutenção","#FF5A5A"]};
const alvoAnuncios = $("#listaAnuncios"), faixa = $("#faixaAviso");
if (alvoAnuncios || faixa) {
  ler("anuncios?select=*&publicado=eq.true&order=fixado.desc,criado_em.desc&limit=13").then(lista => {
    if (faixa && lista.length) {
      const a = lista[0];
      $("#faixaTipo").textContent = (TIPOS[a.tipo] || TIPOS.novidade)[0];
      $("#faixaTitulo").textContent = semEmoji(a.titulo);
      faixa.hidden = false;
    }
    if (!alvoAnuncios) return;
    if (!lista.length) { alvoAnuncios.innerHTML = `<div class="vazio-msg">Nenhum anúncio ainda. Entre no Discord pra saber primeiro.</div>`; return; }
    const limite = +alvoAnuncios.dataset.limite || lista.length;
    alvoAnuncios.innerHTML = lista.slice(0, limite).map((a, i) => {
      const [nome, cor] = TIPOS[a.tipo] || TIPOS.novidade;
      const link = a.link && /^https?:/.test(a.link) ? `<a class="abrir" href="${esc(a.link)}" target="_blank" rel="noopener">Abrir</a>` : "";
      const img = a.imagem_url && /^https?:/.test(a.imagem_url) ? `<img src="${esc(a.imagem_url)}" alt="" loading="lazy">` : "";
      const corpo = `<div class="meta"><span class="tipo">${nome}</span><span>${fmtData.format(new Date(a.criado_em))}</span></div>` +
        `<h3>${esc(a.titulo)}</h3><div class="texto">${negrito(a.texto)}</div>${link}`;
      return i === 0 ? `<article class="anuncio destaque" style="--cor-a:${cor}"><div>${corpo}</div>${img || ""}</article>`
                     : `<article class="anuncio" style="--cor-a:${cor}">${img}${corpo}</article>`;
    }).join("");
  }).catch(() => { if (alvoAnuncios) alvoAnuncios.innerHTML = `<div class="vazio-msg">Não deu pra carregar agora. Tente de novo em instantes.</div>`; });
}

/* ===================== CAMPEONATOS ===================== */
const STATUS = {em_breve:"Inscrições encerradas", inscricoes:"Inscrições abertas", em_andamento:"Acontecendo agora", encerrado:"Encerrado"};
const MODOS = {"battle royale":"Battle Royale · duplas", "br duplas":"Battle Royale · duplas", "br solo":"Battle Royale · solo", "arena 3v3":"Arena 3v3 · trios", "arena 2v2":"Arena 2v2 · duplas", "arena 1v1":"Arena 1v1 · solo"};
const tamanhoEquipe = (modo) => /1v1|solo/i.test(modo) ? 1 : /3v3/i.test(modo) ? 3 : 2;
const unidade = (modo) => ["", "jogadores", "duplas", "trios"][tamanhoEquipe(modo)];
const linkOk = (u) => typeof u === "string" && /^https?:\/\//i.test(u);
const paginaCamp = (id, parte) => `/campeonatos/?c=${id}${parte ? "#" + parte : ""}`;
const fmtCompleto = new Intl.DateTimeFormat("pt-BR", {timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit"});
const campId = +new URLSearchParams(location.search).get("c") || 0;

const alvoCamp = $("#listaCamp");
function carregarCampeonatos() {
  Promise.all([ler("campeonatos?select=*&order=comeca_em.desc&limit=20"), ler("campeonatos_vagas?select=id,inscritos")]).then(([cs, vs]) => {
    const vagas = Object.fromEntries(vs.map(v => [v.id, v.inscritos]));
    let lista = cs.map(c => ({...c, inscritos: vagas[c.id] || 0}))
      .sort((a, b) => (a.status === "encerrado") - (b.status === "encerrado") || (a.status === "encerrado" ? b.comeca_em.localeCompare(a.comeca_em) : a.comeca_em.localeCompare(b.comeca_em)));
    if (campId) { lista = lista.filter(c => c.id !== campId); const t = $("#tituloLista"); if (t) t.hidden = !lista.length; }
    if (!lista.length) { alvoCamp.innerHTML = campId ? "" : `<div class="vazio-msg">Nenhum campeonato marcado agora. Os próximos são anunciados no Discord, no jogo e aqui.</div>`; return; }
    const limite = +alvoCamp.dataset.limite || lista.length;
    alvoCamp.innerHTML = lista.slice(0, limite).map(c => {
      const d = new Date(c.comeca_em), aberto = c.status === "inscricoes" && c.inscritos < c.vagas;
      const pct = Math.min(100, Math.round(c.inscritos / c.vagas * 100));
      return `<article class="camp ${c.status === "encerrado" ? "encerrado" : ""}">
        <div class="data">${fmtDia.format(d).replace(".", "")}<small>${fmtHora.format(d)}</small></div>
        <div><h3><a href="${paginaCamp(c.id)}">${esc(c.nome)}</a></h3>
          <div class="linha">${esc(MODOS[c.modo] || c.modo)}, prêmio: ${esc(c.premio || "a definir")}. ${STATUS[c.status] || ""}.</div>
          ${c.vencedor ? `<div class="linha vencedor">Campeão: ${esc(c.vencedor)}</div>` : ""}
          <div class="vagas" title="${c.inscritos} de ${c.vagas} vagas"><i style="width:${pct}%"></i></div>
          <div class="linha">${c.inscritos} de ${c.vagas} ${unidade(c.modo)} inscritos</div>
        </div>
        <div>${aberto ? `<a class="btn btn-ouro" href="${paginaCamp(c.id, "inscrever")}">Como se inscrever</a>` : `<a class="btn btn-fantasma" href="${paginaCamp(c.id, "tabela")}">Ver tabela</a>`}</div>
      </article>`;
    }).join("");
  }).catch(() => { alvoCamp.innerHTML = `<div class="vazio-msg">Não deu pra carregar agora. Tente de novo em instantes.</div>`; });
}
if (alvoCamp) carregarCampeonatos();

/* ----- página de um campeonato: /campeonatos/?c=<id> (cabeçalho, como se inscrever NO JOGO e tabela ao vivo) ----- */
// Decisão do dono: a inscrição é SÓ dentro do jogo (aba CAMPEONATOS). O site explica, manda baixar e mostra a tabela.
const detalhe = $("#campeonato");
if (detalhe && campId) {
  let primeira = true, ultimo = null;
  const busca = $("#buscaNick"), buscaResp = $("#buscaResposta");

  // "Procure seu nick": filtra a tabela e diz em que equipe a pessoa está
  const aplicarBusca = () => {
    if (!busca || !ultimo) return;
    const q = busca.value.trim().toLowerCase();
    const linhas = $$("#cdTabela tbody tr[data-nicks]");
    if (!q) { linhas.forEach(tr => { tr.hidden = false; tr.classList.remove("achado"); }); buscaResp.className = "resposta"; buscaResp.textContent = ""; return; }
    const solo = tamanhoEquipe(ultimo.campeonato.modo) === 1;
    let exata = null, parciais = 0;
    linhas.forEach(tr => {
      const nicks = tr.dataset.nicks.split("\n");
      const igual = nicks.includes(q), parte = igual || nicks.some(n => n.includes(q));
      tr.hidden = !parte; tr.classList.toggle("achado", igual);
      if (igual && !exata) exata = ultimo.equipes[+tr.dataset.k];
      if (parte) parciais++;
    });
    if (exata) {
      buscaResp.className = "resposta ok";
      buscaResp.textContent = solo ? `Você está inscrito: ${exata.nome}.`
        : `Você está inscrito na equipe ${exata.nome}` + (exata.confirmada ? " (confirmada)." : ` (aguardando ${exata.faltam} ${exata.faltam === 1 ? "aceite" : "aceites"} no jogo).`);
    } else if (parciais) {
      buscaResp.className = "resposta"; buscaResp.textContent = `${parciais} ${parciais === 1 ? "resultado" : "resultados"} parecidos. Digite o nick completo.`;
    } else {
      buscaResp.className = "resposta erro";
      buscaResp.textContent = "Nick não encontrado. Se você foi convidado, aceite o convite no jogo (aba CAMPEONATOS): seu nick aparece aqui depois de aceitar.";
    }
  };
  busca?.addEventListener("input", aplicarBusca);

  const desenhar = (j) => {
    const c = j.campeonato;
    ultimo = j;
    document.title = `${c.nome} · Campeonatos Dinasty`;
    detalhe.hidden = false;
    $("#cdNome").textContent = semEmoji(c.nome);
    $("#cdDesc").textContent = semEmoji(c.descricao) || "Monte sua equipe, garanta a vaga e dispute a coroa.";
    const banner = $("#cdBanner"), img = linkOk(c.imagem_url) ? c.imagem_url : "/img/og.jpg";
    if (banner.getAttribute("src") !== img) { banner.src = img; banner.onerror = () => { banner.onerror = null; banner.src = "/img/og.jpg"; }; }
    $("#cdData").textContent = fmtCompleto.format(new Date(c.comeca_em));
    const premios = Array.isArray(c.premios) ? c.premios.filter((p) => p && p.texto) : [];
    const cdPremio = $("#cdPremio");
    if (premios.length) {
      cdPremio.innerHTML = `<ul class="premios">${premios.map((p) => `<li>${linkOk(p.icone_url) ? `<img src="${esc(p.icone_url)}" alt="" loading="lazy">` : `<span class="premio-sem">${ICONE_PREMIO[p.tipo] || "★"}</span>`}<span>${p.lugar ? `<b>${esc(semEmoji(p.lugar))}</b>` : ""}${esc(semEmoji(p.texto))}</span></li>`).join("")}</ul>`;
    } else cdPremio.textContent = semEmoji(c.premio) || "A definir";
    $("#cdModo").textContent = MODOS[c.modo] || c.modo;
    $("#cdVagas").textContent = `${j.ocupadas}/${c.vagas} ${unidade(c.modo)}`;
    const fechouData = c.inscricoes_ate && new Date(c.inscricoes_ate) < new Date();
    const aberta = c.status === "inscricoes" && !fechouData && j.ocupadas < c.vagas;
    $("#cdStatus").textContent = c.status === "encerrado" && c.vencedor ? `Encerrado · campeão: ${semEmoji(c.vencedor)}`
      : c.status === "inscricoes" && j.ocupadas >= c.vagas ? "Vagas esgotadas"
      : c.status === "inscricoes" && fechouData ? "Inscrições encerradas" : STATUS[c.status] || c.status;
    $("#cdIrInscrever").hidden = !aberta;
    const live = $("#cdLive");
    live.hidden = !linkOk(c.live_url);
    if (linkOk(c.live_url)) live.href = c.live_url;

    // Inscrição: só dentro do jogo
    const n = tamanhoEquipe(c.modo);
    $("#cdNoJogo").hidden = !aberta;
    const quem = $("#cdQuem"); if (quem) quem.textContent = n === 1 ? "ninguém (é solo: só confirmar)" : n === 2 ? "sua dupla" : "seu trio";
    $("#cdInscAviso").textContent = aberta
      ? (n === 1 ? "Inscrições abertas. A inscrição é solo e feita dentro do jogo." : `Inscrições abertas. Cada equipe tem ${n} jogadores e cada nick só pode estar em uma equipe.`)
      : c.status === "encerrado" ? "Este campeonato já terminou." : c.status === "em_andamento" ? "O campeonato está acontecendo. Acompanhe a tabela." : "As inscrições estão fechadas.";

    // Tabela
    const placar = j.tem_placar, solo = n === 1;
    $("#cdTabela").innerHTML = j.equipes.length ? `<thead><tr><th scope="col">#</th><th scope="col">${solo ? "Jogador" : "Equipe"}</th>${solo ? "" : `<th scope="col">Jogadores</th>`}${placar ? `<th scope="col" class="num">Pontos</th><th scope="col" class="num">Abates</th>` : ""}</tr></thead><tbody>` +
      j.equipes.map((e, k) => `<tr class="${e.confirmada ? "" : "pendente"}" data-k="${k}" data-nicks="${esc([...(e.jogadores || []), solo ? e.nome : ""].filter(Boolean).map(x => String(x).toLowerCase()).join("\n"))}">
        <td class="num">${e.colocacao ? e.colocacao + "º" : k + 1}</td>
        <td><b>${esc(e.nome)}</b>${e.confirmada ? "" : `<small> · aguardando ${e.faltam} ${e.faltam === 1 ? "aceite" : "aceites"}</small>`}</td>
        ${solo ? "" : `<td>${e.jogadores.map(esc).join(", ") || "—"}</td>`}
        ${placar ? `<td class="num">${e.pontos ?? 0}</td><td class="num">${e.abates ?? 0}</td>` : ""}
      </tr>`).join("") + "</tbody>"
      : `<tbody><tr><td class="vazio">Nenhuma ${solo ? "inscrição" : "equipe"} ainda. Monte a sua no jogo, aba CAMPEONATOS.</td></tr></tbody>`;
    $("#cdAtualizado").textContent = `${j.equipes.length} ${solo ? (j.equipes.length === 1 ? "inscrito" : "inscritos") : (j.equipes.length === 1 ? "equipe" : "equipes")} · atualiza sozinho a cada 20 segundos`;
    aplicarBusca(); // a busca continua valendo depois de cada atualização

    // Na 1ª carga, o conteúdo estava escondido: rola até #inscrever / #tabela se o link pedir
    if (primeira) {
      primeira = false;
      const alvo = location.hash && document.getElementById(location.hash.slice(1));
      if (alvo) requestAnimationFrame(() => alvo.scrollIntoView({behavior: calmo ? "auto" : "smooth", block: "start"}));
    }
  };

  const atualizar = () => fetch(API + "/tabela?id=" + campId, {headers: H})
    .then(r => r.status === 404 ? Promise.reject(404) : r.json()).then(desenhar)
    .catch(e => {
      if (ultimo) return; // falhou só uma atualização: mantém a última tabela
      detalhe.hidden = false;
      $("#cdNome").textContent = e === 404 ? "Campeonato não encontrado" : "Não deu pra carregar agora";
      $("#cdDesc").textContent = e === 404 ? "Confira o link ou escolha um campeonato na lista abaixo." : "Tente de novo em instantes.";
      $("#cdAtualizado").textContent = "";
      $("#cdNoJogo").hidden = true;
    });
  atualizar();
  setInterval(() => { if (!document.hidden) atualizar(); }, 20000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) atualizar(); });
}

/* ===================== CLASSES (dados em /assets/classes.json) ===================== */
// O HTML já vem pronto (bom pro Google). O JSON é a fonte: se mudar lá, o script atualiza a página.
const grade = $("#gradeClasses"), corpoClasse = document.body.dataset.classe;
const difHTML = (n) => [1, 2, 3].map(k => `<i class="${k <= n ? "on" : ""}"></i>`).join("");
const cartaHTML = (c, papeis) => `<a class="carta" href="/classes/${c.slug}/" style="--c:${c.cor}" data-papeis="${c.papeis.join(" ")}">
  <img class="arma" src="${c.icone}" alt="" width="96" height="96" loading="lazy">
  <img class="retrato" src="/img/classes/${c.slug}/retrato.webp" alt="" loading="lazy" onerror="this.remove()">
  <span class="nome">${esc(c.nome)}</span><span class="papel">${esc(c.funcao)} · ${esc(c.papeis.map(p => papeis[p]).join(" / "))}</span>
  <span class="dif" aria-label="Dificuldade ${c.dificuldade} de 3">${difHTML(c.dificuldade)}</span></a>`;

function filtrar(papel) {
  $$(".filtros button").forEach(b => b.setAttribute("aria-pressed", b.dataset.papel === papel));
  let n = 0;
  $$(".carta", grade).forEach(c => { const ok = papel === "todas" || c.dataset.papeis.split(" ").includes(papel); c.hidden = !ok; n += ok; });
  const st = $("#filtroStatus"); if (st) st.textContent = n + (n === 1 ? " classe" : " classes");
}
if (grade) {
  $$(".filtros button").forEach(b => b.addEventListener("click", () => filtrar(b.dataset.papel)));
  fetch("/assets/classes.json").then(r => r.json()).then(d => {
    grade.innerHTML = d.classes.map(c => cartaHTML(c, d.papeis)).join("");
    filtrar($(".filtros [aria-pressed=true]")?.dataset.papel || "todas");
  }).catch(() => {});
}
if (corpoClasse) {
  fetch("/assets/classes.json").then(r => r.json()).then(d => {
    const c = d.classes.find(x => x.slug === corpoClasse); if (!c) return;
    document.documentElement.style.setProperty("--cor", c.cor);
    $$("[data-campo]").forEach(el => {
      const k = el.dataset.campo;
      if (k === "dificuldade") { el.innerHTML = difHTML(c.dificuldade); el.setAttribute("aria-label", `Dificuldade ${c.dificuldade} de 3`); }
      else if (k === "icone") el.src = c.icone;
      else if (k === "papeis") el.textContent = c.papeis.map(p => d.papeis[p]).join(" / ");
      else if (c[k] != null) el.textContent = c[k];
    });
  }).catch(() => {});
}

/* ===================== MAPA: locais clicáveis ===================== */
const ilha = $("#ilhaSvg");
if (ilha) {
  const pontos = $$(".ponto-mapa", ilha), cartao = $("#cartaoLocal");
  const mostrar = (p) => {
    pontos.forEach(x => { x.classList.toggle("ativo", x === p); x.setAttribute("aria-pressed", x === p); });
    const d = p.dataset;
    cartao.innerHTML = `<span class="estado ${d.estado === "pronta" ? "pronta" : ""}">${esc(d.rotulo)}</span><h3>${esc(d.nome)}</h3><p>${esc(d.txt)}</p>`;
  };
  pontos.forEach(p => {
    p.addEventListener("click", () => mostrar(p));
    p.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); mostrar(p); } });
  });
  mostrar(pontos[0]);
}

/* ===================== BAIXAR: celular x PC ===================== */
const blocoPC = $("#baixarPC"), blocoCel = $("#baixarCelular");
if (blocoPC && blocoCel) {
  const celular = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (celular && !location.search.includes("pc")) { blocoPC.hidden = true; blocoCel.hidden = false; }
  $("#copiarLink")?.addEventListener("click", e => {
    const b = e.currentTarget, url = location.origin + "/baixar/";
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => b.textContent = "Link copiado!").catch(() => b.textContent = url);
  });
}
})();
