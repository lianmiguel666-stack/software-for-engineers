/*
 * Checklist dos problemas mais comuns na obra.
 * Cada problema tem uma explicação curta, o que conferir e as fontes.
 * As marcações ficam salvas só neste aparelho (localStorage).
 */
(function () {
  "use strict";

  var PROBLEMAS = [
    {
      id: "compat",
      titulo: "Projetos que não conversam entre si",
      texto: "Arquitetura, estrutura, elétrica e hidráulica feitas separadas geram conflito na obra, retrabalho e desperdício.",
      itens: [
        "Os projetos de arquitetura, estrutura, elétrica e hidráulica foram sobrepostos e conferidos juntos",
        "Nenhum cano ou eletroduto passa por dentro de viga ou pilar sem estar previsto no projeto estrutural",
        "Todos na obra estão usando a mesma versão (revisão) dos projetos"
      ],
      fontes: [["Diário de Obras", "https://diariodeobras.net/5-principais-falhas-da-construcao-civil-e-o-que-fazer-para-resolve-las/"]]
    },
    {
      id: "prazo",
      titulo: "Atrasos e cronograma irreal",
      texto: "O prazo estoura quando ninguém acompanha o andamento ou quando chuva e falta de material não foram previstas.",
      itens: [
        "O cronograma tem folga para chuva e atraso de entrega de material",
        "O andamento é conferido toda semana contra o cronograma",
        "Os materiais com entrega demorada foram pedidos com antecedência"
      ],
      fontes: [["AECweb", "https://www.aecweb.com.br/revista/materias/conheca-5-problemas-gerenciais-com-os-quais-os-engenheiros-devem-lidar-nas-obras/20790"]]
    },
    {
      id: "orcamento",
      titulo: "Estouro do orçamento",
      texto: "Orçamento mal feito, falta de controle de gastos e aumento no preço dos materiais apertam o caixa da obra.",
      itens: [
        "Os quantitativos do orçamento (concreto, aço, formas, blocos) foram conferidos com o projeto",
        "Os gastos reais são comparados com o orçado pelo menos uma vez por mês",
        "Existe uma reserva para imprevistos e aumento de preço"
      ],
      fontes: [["Bonin Engenharia", "https://bonin.eng.br/bonews/riscos-na-construcao-civil/"]]
    },
    {
      id: "maodeobra",
      titulo: "Mão de obra sem treinamento",
      texto: "Equipe sem preparo executa errado e aumenta os erros construtivos.",
      itens: [
        "O mestre e os encarregados conhecem os detalhes do projeto antes de começar cada etapa",
        "Serviços críticos (armação, concretagem, impermeabilização) têm alguém experiente acompanhando",
        "Os erros encontrados são explicados para a equipe, não só corrigidos"
      ],
      fontes: [
        ["Planilha de Obra", "https://planilhadeobra.com.br/blog/2020/12/20/os-sete-maiores-erros-do-engenheiro/"],
        ["Mason Equipamentos", "https://www.masonequipamentos.com.br/erros-em-obras/"]
      ]
    },
    {
      id: "comunicacao",
      titulo: "Falhas de comunicação",
      texto: "Recado mal passado entre escritório, engenheiro, mestre de obras e equipe vira erro de execução.",
      itens: [
        "As decisões e mudanças ficam registradas por escrito (diário de obra)",
        "O mestre de obras recebe as mudanças de projeto no mesmo dia",
        "Existe uma conversa rápida de planejamento no começo do dia ou da semana"
      ],
      fontes: [["AECweb", "https://www.aecweb.com.br/revista/materias/conheca-5-problemas-gerenciais-com-os-quais-os-engenheiros-devem-lidar-nas-obras/20790"]]
    },
    {
      id: "seguranca",
      titulo: "Segurança do trabalho",
      texto: "Uso correto de EPI e cumprimento das Normas Regulamentadoras (NRs) precisam de fiscalização constante para evitar acidentes.",
      itens: [
        "Todos estão usando capacete, bota, luva e, em altura, cinto de segurança",
        "Bordas de laje, poços e aberturas têm guarda-corpo ou proteção",
        "A obra segue a NR-18 e os trabalhadores receberam o treinamento obrigatório"
      ],
      fontes: [
        ["Mason Equipamentos", "https://www.masonequipamentos.com.br/erros-em-obras/"],
        ["BRWK", "https://www.brwk.com.br/quais-sao-os-principais-desafios-enfrentados-por-engenheiros-civis"]
      ]
    },
    {
      id: "materiais",
      titulo: "Material de baixa qualidade",
      texto: "Material fora da especificação reduz a durabilidade e pode causar problemas na estrutura no futuro.",
      itens: [
        "O concreto que chega confere com o pedido (fck e slump na nota fiscal)",
        "Foram moldados corpos de prova do concreto em cada caminhão ou lote",
        "Aço, blocos e cimento conferem com o especificado em projeto e estão bem armazenados"
      ],
      fontes: [
        ["Vídeo no YouTube", "https://www.youtube.com/watch?v=Kd7FFdJh5CM&t=121"],
        ["Planilha de Obra", "https://planilhadeobra.com.br/blog/2020/12/20/os-sete-maiores-erros-do-engenheiro/"]
      ]
    }
  ];

  var CHAVE = "confere-obra-checklist";
  var marcados = {};
  try { marcados = JSON.parse(localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { marcados = {}; }
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(marcados)); } catch (e) { /* sem armazenamento: segue sem salvar */ }
  }

  var lista = document.getElementById("problemas");
  var progresso = document.getElementById("progressoObra");

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  function contar(p) {
    return p.itens.filter(function (_, i) { return marcados[p.id + "." + i]; }).length;
  }

  function atualizar() {
    var total = 0, feitos = 0;
    PROBLEMAS.forEach(function (p) {
      total += p.itens.length;
      var n = contar(p);
      feitos += n;
      var selo = document.getElementById("selo-" + p.id);
      selo.textContent = n + " de " + p.itens.length;
      selo.className = "contagem" + (n === p.itens.length ? " completo" : "");
    });
    progresso.textContent = feitos + " de " + total + " itens conferidos";
  }

  PROBLEMAS.forEach(function (p, idx) {
    var d = el("details", "problema");
    var s = el("summary");
    s.appendChild(el("span", "pnum", String(idx + 1)));
    s.appendChild(el("span", "ptitulo", p.titulo));
    var selo = el("span", "contagem"); selo.id = "selo-" + p.id;
    s.appendChild(selo);
    d.appendChild(s);

    d.appendChild(el("p", "ptexto", p.texto));
    var ul = el("ul", "itens");
    p.itens.forEach(function (t, i) {
      var li = el("li");
      var lab = el("label");
      var cb = el("input"); cb.type = "checkbox";
      cb.checked = !!marcados[p.id + "." + i];
      cb.addEventListener("change", function () {
        if (cb.checked) marcados[p.id + "." + i] = true; else delete marcados[p.id + "." + i];
        salvar(); atualizar();
      });
      lab.appendChild(cb);
      lab.appendChild(el("span", "", t));
      li.appendChild(lab);
      ul.appendChild(li);
    });
    d.appendChild(ul);

    var f = el("p", "fontes", "Fonte: ");
    p.fontes.forEach(function (fo, i) {
      if (i) f.appendChild(document.createTextNode(", "));
      var a = el("a", "", fo[0]); a.href = fo[1]; a.target = "_blank"; a.rel = "noopener";
      f.appendChild(a);
    });
    d.appendChild(f);
    lista.appendChild(d);
  });

  document.getElementById("limparObra").addEventListener("click", function () {
    marcados = {}; salvar();
    lista.querySelectorAll("input[type=checkbox]").forEach(function (c) { c.checked = false; });
    atualizar();
  });

  atualizar();

  // ---------- Navegação: tela inicial e abas ----------
  function irPara(aba) {
    document.getElementById("abas").hidden = aba === "inicio";
    document.querySelectorAll(".aba[role=tab]").forEach(function (x) {
      var ativa = x.dataset.aba === aba;
      x.classList.toggle("ativa", ativa);
      x.setAttribute("aria-selected", ativa ? "true" : "false");
    });
    ["inicio", "peca", "obra", "modelo"].forEach(function (id) {
      document.getElementById(id).hidden = aba !== id;
    });
    window.scrollTo(0, 0);
    if (aba === "modelo" && window.abrirModelo3D) window.abrirModelo3D();
  }
  document.querySelectorAll(".aba, .cartao").forEach(function (b) {
    b.addEventListener("click", function () { irPara(b.dataset.aba); });
  });
  document.getElementById("irInicio").addEventListener("click", function () { irPara("inicio"); });
})();
