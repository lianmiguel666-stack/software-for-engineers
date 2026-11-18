/*
 * Calculadora comum e cálculos rápidos de obra.
 * As contas ficam em CALC_OBRA e calcularExpressao (testáveis sem navegador).
 */
(function (raiz) {
  "use strict";

  // ---------------- Calculadora comum (sem eval) ----------------
  function calcularExpressao(txt) {
    var s = String(txt).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/,/g, ".").replace(/\s+/g, "");
    var i = 0;
    function numero() {
      var m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (!m) throw new Error("conta inválida");
      i += m[0].length;
      var v = parseFloat(m[0]);
      if (s[i] === "%") { i++; v = v / 100; }
      return v;
    }
    function fator() {
      if (s[i] === "-") { i++; return -fator(); }
      if (s[i] === "+") { i++; return fator(); }
      if (s[i] === "(") {
        i++;
        var v = soma();
        if (s[i] !== ")") throw new Error("parêntese aberto");
        i++;
        return v;
      }
      return numero();
    }
    function produto() {
      var v = fator();
      while (s[i] === "*" || s[i] === "/") {
        var op = s[i++], b = fator();
        if (op === "/" && b === 0) throw new Error("divisão por zero");
        v = op === "*" ? v * b : v / b;
      }
      return v;
    }
    function soma() {
      var v = produto();
      while (s[i] === "+" || s[i] === "-") {
        var op = s[i++], b = produto();
        v = op === "+" ? v + b : v - b;
      }
      return v;
    }
    if (!s) return 0;
    var r = soma();
    if (i < s.length) throw new Error("conta inválida");
    return Math.round(r * 1e10) / 1e10;
  }

  // ---------------- Cálculos de obra ----------------
  var BITOLAS = { "5": 0.154, "6.3": 0.245, "8": 0.395, "10": 0.617, "12.5": 0.963, "16": 1.578, "20": 2.466, "25": 3.853 };
  var BLOCOS = {
    bloco14: { nome: "Bloco de concreto 14 x 19 x 39 cm", porM2: 12.5 },
    bloco9: { nome: "Bloco de concreto 9 x 19 x 39 cm", porM2: 12.5 },
    baiano: { nome: "Tijolo baiano 9 x 19 x 19 cm", porM2: 25 },
    baianoDeitado: { nome: "Tijolo baiano 9 x 14 x 19 cm", porM2: 33 },
    macico: { nome: "Tijolo maciço 5 x 10 x 20 cm (em pé)", porM2: 80 }
  };
  var UNIDADES = {
    comprimento: { nome: "Comprimento", u: { "m": 1, "cm": 0.01, "mm": 0.001, "polegada": 0.0254, "pé": 0.3048, "km": 1000 } },
    area: { nome: "Área", u: { "m²": 1, "cm²": 0.0001, "hectare": 10000, "alqueire paulista": 24200, "km²": 1e6, "pé²": 0.09290304 } },
    volume: { nome: "Volume", u: { "m³": 1, "litro": 0.001, "cm³": 1e-6, "galão (EUA)": 0.003785411784 } },
    pressao: { nome: "Pressão / resistência", u: { "MPa": 1, "kgf/cm²": 0.0980665, "kN/m²": 0.001, "tf/m²": 0.00980665, "psi": 0.006894757 } },
    forca: { nome: "Força / peso", u: { "kN": 1, "kgf": 0.00980665, "tf": 9.80665, "N": 0.001 } }
  };

  function linha(nome, valor, un, nota) { return { nome: nome, valor: valor, un: un, nota: nota || "" }; }
  function n(v) { var x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : 0; }

  var CALC_OBRA = {
    concreto: {
      nome: "Concreto",
      campos: [
        { id: "c", nome: "Comprimento", un: "m", v: "4" },
        { id: "l", nome: "Largura", un: "m", v: "0,15" },
        { id: "a", nome: "Altura ou espessura", un: "m", v: "0,40" },
        { id: "q", nome: "Quantidade de peças iguais", un: "", v: "1" }
      ],
      calc: function (p) {
        var vol = n(p.c) * n(p.l) * n(p.a) * Math.max(n(p.q), 0);
        var comPerda = vol * 1.1;
        return [
          linha("Volume", vol, "m³"),
          linha("Volume com 10% de perda", comPerda, "m³", "é o que deve ser pedido"),
          linha("Cimento (sacos de 50 kg)", Math.ceil(comPerda * 7), "sacos", "traço 1 : 2 : 3, aproximado"),
          linha("Areia", comPerda * 0.56, "m³", "traço 1 : 2 : 3"),
          linha("Brita", comPerda * 0.84, "m³", "traço 1 : 2 : 3"),
          linha("Água", comPerda * 200, "litros", "aproximado; não passe disso")
        ];
      }
    },
    piso: {
      nome: "Piso e revestimento",
      campos: [
        { id: "c", nome: "Comprimento", un: "m", v: "5" },
        { id: "l", nome: "Largura", un: "m", v: "4" },
        { id: "perda", nome: "Perda", un: "%", v: "10" },
        { id: "caixa", nome: "m² por caixa", un: "m²", v: "2,5" }
      ],
      calc: function (p) {
        var area = n(p.c) * n(p.l);
        var total = area * (1 + n(p.perda) / 100);
        var r = [linha("Área", area, "m²"), linha("Com perda", total, "m²"), linha("Rodapé (perímetro)", 2 * (n(p.c) + n(p.l)), "m", "sem descontar portas")];
        if (n(p.caixa) > 0) r.push(linha("Caixas", Math.ceil(total / n(p.caixa)), "caixas"));
        r.push(linha("Argamassa colante", Math.ceil(total * 5 / 20), "sacos de 20 kg", "cerca de 5 kg por m²"));
        return r;
      }
    },
    blocos: {
      nome: "Blocos e tijolos",
      campos: [
        { id: "c", nome: "Comprimento da parede", un: "m", v: "4" },
        { id: "a", nome: "Altura da parede", un: "m", v: "2,8" },
        { id: "vaos", nome: "Área de portas e janelas", un: "m²", v: "1,68" },
        { id: "tipo", nome: "Tipo", un: "", v: "bloco14", opcoes: BLOCOS }
      ],
      calc: function (p) {
        var area = Math.max(n(p.c) * n(p.a) - n(p.vaos), 0);
        var b = BLOCOS[p.tipo] || BLOCOS.bloco14;
        return [
          linha("Área de parede", area, "m²", "já descontando os vãos"),
          linha("Quantidade", Math.ceil(area * b.porM2 * 1.05), "un", b.porM2 + " por m² + 5% de perda"),
          linha("Argamassa de assentamento", area * 0.015, "m³", "aproximado")
        ];
      }
    },
    aco: {
      nome: "Peso do aço",
      campos: [
        { id: "b", nome: "Bitola", un: "mm", v: "10", opcoes: BITOLAS },
        { id: "comp", nome: "Comprimento de cada barra", un: "m", v: "3" },
        { id: "q", nome: "Quantidade de barras", un: "", v: "10" }
      ],
      calc: function (p) {
        var kgm = BITOLAS[p.b] || 0;
        var total = n(p.comp) * n(p.q);
        return [
          linha("Peso por metro", kgm, "kg/m", "tabela do aço CA-50"),
          linha("Comprimento total", total, "m"),
          linha("Peso total", total * kgm, "kg"),
          linha("Barras de 12 m para comprar", Math.ceil(total * 1.1 / 12), "barras", "com 10% para emendas e perdas")
        ];
      }
    },
    tinta: {
      nome: "Tinta",
      campos: [
        { id: "area", nome: "Área a pintar", un: "m²", v: "60" },
        { id: "demaos", nome: "Demãos", un: "", v: "2" },
        { id: "rend", nome: "Rendimento", un: "m² por litro por demão", v: "10" }
      ],
      calc: function (p) {
        var litros = n(p.rend) > 0 ? n(p.area) * n(p.demaos) / n(p.rend) : 0;
        return [
          linha("Tinta necessária", litros, "litros"),
          linha("Latas de 18 L", Math.ceil(litros / 18), "latas"),
          linha("Ou galões de 3,6 L", Math.ceil(litros / 3.6), "galões")
        ];
      }
    }
  };

  function converter(grupo, valor, de, para) {
    var g = UNIDADES[grupo];
    if (!g || !(de in g.u) || !(para in g.u)) return null;
    return valor * g.u[de] / g.u[para];
  }

  var api = { calcularExpressao: calcularExpressao, CALC_OBRA: CALC_OBRA, converter: converter, UNIDADES: UNIDADES, BITOLAS: BITOLAS };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  raiz.Calculadora = api;

  // ---------------- Interface ----------------
  var doc = raiz.document;
  var $ = function (id) { return doc.getElementById(id); };
  if (!$("calc")) return;

  function fmt(v, un) {
    var casas = /sacos|caixas|latas|galões|barras|^un$|litros/.test(un) ? 0 : (un === "kg/m" ? 3 : 2);
    return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }

  // Teclado da calculadora
  var visor = $("visor"), conta = $("contaAnterior");
  var expr = "";
  function mostrar() { visor.textContent = expr || "0"; }
  function tecla(t) {
    if (t === "C") { expr = ""; conta.textContent = ""; }
    else if (t === "⌫") { expr = expr.slice(0, -1); }
    else if (t === "=") {
      try {
        var r = calcularExpressao(expr);
        conta.textContent = expr + " =";
        expr = String(r).replace(".", ",");
        visor.classList.remove("pulso"); void visor.offsetWidth; visor.classList.add("pulso");
      } catch (e) { conta.textContent = "Conta inválida"; }
    } else { expr += t; }
    mostrar();
  }
  doc.querySelectorAll(".tecla").forEach(function (b) {
    b.addEventListener("click", function () { tecla(b.dataset.t); });
  });
  doc.addEventListener("keydown", function (e) {
    if ($("calc").hidden || /input|select|textarea/i.test(e.target.tagName)) return;
    var mapa = { "*": "×", "/": "÷", "-": "−", "Enter": "=", "Backspace": "⌫", "Escape": "C", ".": ",", ",": "," };
    var k = mapa[e.key] || e.key;
    if (/^[0-9+%()]$/.test(k) || ["×", "÷", "−", "=", "⌫", "C", ","].indexOf(k) >= 0) { e.preventDefault(); tecla(k); }
  });
  mostrar();

  // Cálculos de obra
  var atual = "concreto", valores = {};
  function montarObra() {
    var c = CALC_OBRA[atual], cont = $("camposCalc");
    if (!valores[atual]) { valores[atual] = {}; c.campos.forEach(function (f) { valores[atual][f.id] = f.v; }); }
    cont.innerHTML = "";
    c.campos.forEach(function (f) {
      var lab = doc.createElement("label");
      lab.textContent = f.nome + (f.un ? " (" + f.un + ")" : "");
      var inp;
      if (f.opcoes) {
        inp = doc.createElement("select");
        Object.keys(f.opcoes).forEach(function (k) {
          var o = doc.createElement("option");
          o.value = k;
          o.textContent = f.opcoes[k].nome || (k.replace(".", ",") + " mm");
          inp.appendChild(o);
        });
      } else {
        inp = doc.createElement("input");
        inp.type = "text"; inp.inputMode = "decimal";
      }
      inp.value = valores[atual][f.id];
      inp.addEventListener("input", function () { valores[atual][f.id] = inp.value; resultado(); });
      inp.addEventListener("change", function () { valores[atual][f.id] = inp.value; resultado(); });
      lab.appendChild(inp);
      cont.appendChild(lab);
    });
    resultado();
  }
  function resultado() {
    var tb = $("resCalc");
    tb.innerHTML = "";
    CALC_OBRA[atual].calc(valores[atual]).forEach(function (l) {
      var tr = doc.createElement("tr");
      var a = doc.createElement("td"); a.textContent = l.nome;
      if (l.nota) { var s = doc.createElement("span"); s.className = "nota"; s.textContent = l.nota; a.appendChild(s); }
      var b = doc.createElement("td"); b.className = "valor"; b.textContent = fmt(l.valor, l.un) + " " + l.un;
      tr.appendChild(a); tr.appendChild(b); tb.appendChild(tr);
    });
  }
  doc.querySelectorAll(".calcTipo").forEach(function (b) {
    b.addEventListener("click", function () {
      doc.querySelectorAll(".calcTipo").forEach(function (x) {
        x.classList.toggle("ativo", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      atual = b.dataset.calc;
      montarObra();
    });
  });
  montarObra();

  // Conversor de unidades
  var gSel = $("convGrupo"), de = $("convDe"), para = $("convPara"), val = $("convValor"), saida = $("convResultado");
  Object.keys(UNIDADES).forEach(function (k) {
    var o = doc.createElement("option"); o.value = k; o.textContent = UNIDADES[k].nome; gSel.appendChild(o);
  });
  function montarUnidades() {
    var us = Object.keys(UNIDADES[gSel.value].u);
    [de, para].forEach(function (sel, i) {
      sel.innerHTML = "";
      us.forEach(function (u) { var o = doc.createElement("option"); o.value = u; o.textContent = u; sel.appendChild(o); });
      sel.value = us[Math.min(i, us.length - 1)];
    });
    converterAgora();
  }
  function converterAgora() {
    var r = converter(gSel.value, n(val.value), de.value, para.value);
    saida.textContent = r === null ? "" :
      (val.value || "0") + " " + de.value + " = " +
      Number(r).toLocaleString("pt-BR", { maximumFractionDigits: 4 }) + " " + para.value;
  }
  gSel.addEventListener("change", montarUnidades);
  [de, para].forEach(function (s) { s.addEventListener("change", converterAgora); });
  val.addEventListener("input", converterAgora);
  $("convTrocar").addEventListener("click", function () { var t = de.value; de.value = para.value; para.value = t; converterAgora(); });
  montarUnidades();
})(this);
