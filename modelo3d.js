/*
 * Modelos 3D prontos com medidas ajustáveis e cálculo de áreas e volumes.
 * Usa three.js (pasta vendor/). Unidades: metros.
 * As contas ficam em CALCULOS (testáveis sem navegador); o desenho fica em DESENHO.
 */
(function (raiz) {
  "use strict";

  // ---------------- Modelos e campos ----------------
  var MODELOS = {
    casa: {
      nome: "Casa",
      campos: [
        { id: "comp", nome: "Comprimento", un: "m", v: 10, min: 3, max: 40, passo: 0.5 },
        { id: "larg", nome: "Largura", un: "m", v: 8, min: 3, max: 30, passo: 0.5 },
        { id: "pe", nome: "Pé-direito", un: "m", v: 2.8, min: 2.4, max: 5, passo: 0.1 },
        { id: "pav", nome: "Pavimentos", un: "", v: 1, min: 1, max: 4, passo: 1 },
        { id: "parede", nome: "Espessura da parede", un: "cm", v: 15, min: 9, max: 30, passo: 1 },
        { id: "portas", nome: "Portas (0,80 x 2,10 m)", un: "", v: 3, min: 0, max: 30, passo: 1 },
        { id: "janelas", nome: "Janelas (1,20 x 1,00 m)", un: "", v: 5, min: 0, max: 40, passo: 1 },
        { id: "incl", nome: "Inclinação do telhado", un: "%", v: 30, min: 10, max: 100, passo: 5 },
        { id: "beiral", nome: "Beiral", un: "cm", v: 50, min: 0, max: 150, passo: 10 }
      ]
    },
    estrutura: {
      nome: "Estrutura",
      campos: [
        { id: "vx", nome: "Vão na frente (entre pilares)", un: "m", v: 4, min: 2, max: 10, passo: 0.5 },
        { id: "nx", nome: "Quantos vãos na frente", un: "", v: 3, min: 1, max: 10, passo: 1 },
        { id: "vy", nome: "Vão no fundo (entre pilares)", un: "m", v: 4, min: 2, max: 10, passo: 0.5 },
        { id: "ny", nome: "Quantos vãos no fundo", un: "", v: 2, min: 1, max: 10, passo: 1 },
        { id: "pe", nome: "Pé-direito", un: "m", v: 2.8, min: 2.4, max: 5, passo: 0.1 },
        { id: "pav", nome: "Pavimentos", un: "", v: 2, min: 1, max: 10, passo: 1 },
        { id: "pa", nome: "Pilar: lado menor", un: "cm", v: 19, min: 14, max: 60, passo: 1 },
        { id: "pb", nome: "Pilar: lado maior", un: "cm", v: 30, min: 14, max: 100, passo: 1 },
        { id: "vb", nome: "Viga: largura", un: "cm", v: 15, min: 10, max: 40, passo: 1 },
        { id: "vh", nome: "Viga: altura", un: "cm", v: 40, min: 20, max: 100, passo: 5 },
        { id: "laje", nome: "Laje: espessura", un: "cm", v: 10, min: 7, max: 30, passo: 1 }
      ]
    },
    piscina: {
      nome: "Piscina / reservatório",
      campos: [
        { id: "comp", nome: "Comprimento", un: "m", v: 8, min: 1, max: 50, passo: 0.5 },
        { id: "larg", nome: "Largura", un: "m", v: 4, min: 1, max: 25, passo: 0.5 },
        { id: "prof", nome: "Profundidade", un: "m", v: 1.4, min: 0.5, max: 5, passo: 0.1 },
        { id: "folga", nome: "Folga de escavação em cada lado", un: "cm", v: 30, min: 0, max: 100, passo: 10 }
      ]
    }
  };

  // Taxas médias de aço por m³ de concreto (estimativa de orçamento, não substitui o detalhamento)
  var ACO_KG_M3 = { pilar: 120, viga: 100, laje: 80 };

  function linha(nome, valor, un, nota) { return { nome: nome, valor: valor, un: un, nota: nota || "" }; }

  var CALCULOS = {
    casa: function (p) {
      var t = p.parede / 100, b = p.beiral / 100, i = p.incl / 100;
      var construida = p.comp * p.larg * p.pav;
      var util = Math.max(p.comp - 2 * t, 0) * Math.max(p.larg - 2 * t, 0) * p.pav;
      var perim = 2 * (p.comp + p.larg);
      var aberturas = p.portas * 0.8 * 2.1 + p.janelas * 1.2 * 1.0;
      var paredes = Math.max(perim * p.pe * p.pav - aberturas, 0);
      var telhadoProj = (p.comp + 2 * b) * (p.larg + 2 * b);
      var telhado = telhadoProj * Math.sqrt(1 + i * i);
      return [
        linha("Área construída", construida, "m²", "comprimento x largura x pavimentos"),
        linha("Área útil (dentro das paredes externas)", util, "m²", "sem descontar paredes internas"),
        linha("Perímetro", perim, "m"),
        linha("Paredes externas (um lado)", paredes, "m²", "já descontando portas e janelas"),
        linha("Reboco e pintura (dentro + fora)", paredes * 2, "m²", "aproximado"),
        linha("Blocos de 14 x 19 x 39 cm", Math.ceil(paredes * 12.5 * 1.05), "un", "12,5 por m² + 5% de perda"),
        linha("Telhado (área inclinada)", telhado, "m²", "com beiral"),
        linha("Contrapiso de 5 cm", util / p.pav * 0.05, "m³", "só o térreo"),
        linha("Volume interno", util * p.pe, "m³")
      ];
    },
    estrutura: function (p) {
      var a = p.pa / 100, bb = p.pb / 100, vb = p.vb / 100, vh = p.vh / 100, e = p.laje / 100;
      var nPil = (p.nx + 1) * (p.ny + 1);
      var Lx = p.nx * p.vx, Ly = p.ny * p.vy;
      var compVigas = ((p.ny + 1) * Lx + (p.nx + 1) * Ly) * p.pav;
      var areaLaje = Lx * Ly * p.pav;
      var vPil = nPil * a * bb * p.pe * p.pav;
      var vVig = compVigas * vb * Math.max(vh - e, 0);
      var vLaj = areaLaje * e;
      var forma = nPil * 2 * (a + bb) * p.pe * p.pav + compVigas * (vb + 2 * Math.max(vh - e, 0)) + areaLaje;
      var aco = vPil * ACO_KG_M3.pilar + vVig * ACO_KG_M3.viga + vLaj * ACO_KG_M3.laje;
      var total = vPil + vVig + vLaj;
      return [
        linha("Área de laje", areaLaje, "m²", Lx.toFixed(1).replace(".", ",") + " x " + Ly.toFixed(1).replace(".", ",") + " m por pavimento"),
        linha("Pilares por pavimento", nPil, "un"),
        linha("Comprimento de vigas", compVigas, "m"),
        linha("Concreto dos pilares", vPil, "m³"),
        linha("Concreto das vigas", vVig, "m³", "parte abaixo da laje"),
        linha("Concreto das lajes", vLaj, "m³"),
        linha("Concreto total", total, "m³", "peça mais 5% a 10% de perda"),
        linha("Área de forma", forma, "m²", "aproximado"),
        linha("Aço (estimativa)", aco, "kg", "pilar 120, viga 100, laje 80 kg por m³")
      ];
    },
    piscina: function (p) {
      var f = p.folga / 100;
      var volume = p.comp * p.larg * p.prof;
      var fundo = p.comp * p.larg;
      var lados = 2 * (p.comp + p.larg) * p.prof;
      var escav = (p.comp + 2 * f) * (p.larg + 2 * f) * (p.prof + 0.2);
      return [
        linha("Volume de água", volume * 1000, "litros", "cheia até a borda"),
        linha("Volume de água", volume, "m³"),
        linha("Área do fundo", fundo, "m²"),
        linha("Área das paredes", lados, "m²"),
        linha("Impermeabilização (fundo + paredes)", fundo + lados, "m²"),
        linha("Revestimento com 10% de perda", (fundo + lados) * 1.1, "m²"),
        linha("Perímetro da borda", 2 * (p.comp + p.larg), "m"),
        linha("Escavação", escav, "m³", "com folga nos lados e 20 cm a mais no fundo")
      ];
    }
  };

  function padrao(tipo) {
    var p = {};
    MODELOS[tipo].campos.forEach(function (c) { p[c.id] = c.v; });
    return p;
  }

  var api = { MODELOS: MODELOS, CALCULOS: CALCULOS, padrao: padrao };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  raiz.Modelo3D = api;

  // ---------------- Interface ----------------
  var doc = raiz.document;
  var area = doc.getElementById("vista3d");
  if (!area) return;

  var estado = { tipo: "casa", p: padrao("casa") };
  var THREE = raiz.THREE;
  var cena, camera, render, controles, grupo, chao;
  var pronto = false;

  function fmt(n, un) {
    var casas = (un === "un" || un === "litros" || un === "kg") ? 0 : 2;
    return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }

  function iniciar3D() {
    if (pronto) return;
    if (!THREE) {
      area.innerHTML = '<p class="dica" style="padding:16px">Não consegui carregar o 3D neste aparelho. As contas abaixo continuam funcionando.</p>';
      return;
    }
    pronto = true;
    cena = new THREE.Scene();
    cena.background = new THREE.Color(0xcfdbe8);
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
    render = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    render.setPixelRatio(Math.min(raiz.devicePixelRatio || 1, 2));
    area.appendChild(render.domElement);
    controles = new THREE.OrbitControls(camera, render.domElement);
    controles.enableDamping = true;
    controles.maxPolarAngle = Math.PI * 0.49;
    cena.add(new THREE.HemisphereLight(0xffffff, 0x667788, 0.65));
    var sol = new THREE.DirectionalLight(0xffffff, 0.6);
    sol.position.set(20, 30, 15);
    cena.add(sol);
    chao = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: 0x9fb08a }));
    chao.rotation.x = -Math.PI / 2;
    chao.position.y = -0.01;
    cena.add(chao);
    var grade = new THREE.GridHelper(100, 100, 0x8a9a78, 0xa3b291);
    cena.add(grade);
    raiz.addEventListener("resize", ajustarTamanho);
    (function animar() {
      raiz.requestAnimationFrame(animar);
      controles.update();
      render.render(cena, camera);
    })();
  }

  function ajustarTamanho() {
    if (!pronto) return;
    var w = area.clientWidth || 600, h = Math.round(Math.min(w * 0.75, 460));
    render.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  var MAT = {};
  function mat(cor, opac) {
    var k = cor + "_" + (opac || 1);
    if (!MAT[k]) {
      MAT[k] = new THREE.MeshLambertMaterial({ color: cor, transparent: !!opac, opacity: opac || 1 });
    }
    return MAT[k];
  }
  function caixa(g, sx, sy, sz, x, y, z, cor, opac) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat(cor, opac));
    m.position.set(x, y, z);
    g.add(m);
    var bordas = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.35 }));
    bordas.position.copy(m.position);
    g.add(bordas);
    return m;
  }

  var DESENHO = {
    casa: function (g, p) {
      var t = p.parede / 100, H = p.pe, C = p.comp, L = p.larg;
      for (var k = 0; k < p.pav; k++) {
        var y0 = k * H;
        caixa(g, C, t, L, 0, y0 + t / 2, 0, 0xc7c2b8);                    // piso
        caixa(g, C, H, t, 0, y0 + H / 2, L / 2 - t / 2, 0xf1e3c6);          // frente
        caixa(g, C, H, t, 0, y0 + H / 2, -L / 2 + t / 2, 0xf1e3c6);         // fundo
        caixa(g, t, H, L - 2 * t, C / 2 - t / 2, y0 + H / 2, 0, 0xe9d8b5);  // lado
        caixa(g, t, H, L - 2 * t, -C / 2 + t / 2, y0 + H / 2, 0, 0xe9d8b5); // lado
      }
      // portas e janelas espalhadas na fachada da frente (só para visualizar)
      var zF = L / 2 + 0.01;
      var cabem = Math.max(1, Math.floor(C / 1.8));
      var nP = Math.min(p.portas, cabem);
      var restoJ = p.janelas;
      for (var k2 = 0; k2 < p.pav; k2++) {
        var portasAqui = k2 === 0 ? nP : 0;
        var janAqui = Math.min(restoJ, cabem - portasAqui, Math.ceil(p.janelas / p.pav));
        restoJ -= janAqui;
        var total = portasAqui + janAqui;
        for (var s2 = 0; s2 < total; s2++) {
          var x = -C / 2 + C * (s2 + 0.5) / total;
          // alterna porta e janela para não ficarem todas juntas
          var ehPorta = portasAqui > 0 && (s2 % 2 === 0 || total - s2 <= portasAqui) && portasAqui-- > 0;
          if (ehPorta) caixa(g, 0.8, 2.1, 0.04, x, k2 * H + 1.05 + t, zF, 0x7a4a24);
          else caixa(g, 1.2, 1.0, 0.04, x, k2 * H + 1.6, zF, 0x7fb3d5, 0.85);
        }
      }
      // telhado de duas águas
      var b = p.beiral / 100, meia = L / 2 + b, alt = (L / 2) * p.incl / 100;
      var forma = new THREE.Shape();
      forma.moveTo(-meia, 0); forma.lineTo(meia, 0); forma.lineTo(0, alt); forma.lineTo(-meia, 0);
      var geo = new THREE.ExtrudeGeometry(forma, { depth: C + 2 * b, bevelEnabled: false });
      var tel = new THREE.Mesh(geo, mat(0xb5532f));
      tel.rotation.y = Math.PI / 2;
      tel.position.set(-C / 2 - b, p.pav * H, 0);
      g.add(tel);
    },
    estrutura: function (g, p) {
      var a = p.pa / 100, bb = p.pb / 100, vb = p.vb / 100, vh = p.vh / 100, e = p.laje / 100;
      var Lx = p.nx * p.vx, Ly = p.ny * p.vy, H = p.pe;
      for (var k = 0; k < p.pav; k++) {
        var y0 = k * H;
        for (var i = 0; i <= p.nx; i++) {
          for (var j = 0; j <= p.ny; j++) {
            caixa(g, bb, H - vh, a, -Lx / 2 + i * p.vx, y0 + (H - vh) / 2, -Ly / 2 + j * p.vy, 0x9aa3ad);
          }
        }
        var yv = y0 + H - vh / 2;
        for (var jj = 0; jj <= p.ny; jj++) caixa(g, Lx + bb, vh, vb, 0, yv, -Ly / 2 + jj * p.vy, 0x6f8fb3);
        for (var ii = 0; ii <= p.nx; ii++) caixa(g, vb, vh, Ly + a, -Lx / 2 + ii * p.vx, yv, 0, 0x6f8fb3);
        caixa(g, Lx + bb, e, Ly + a, 0, y0 + H - e / 2 + 0.002, 0, 0xcfd6dd, 0.75);
      }
    },
    piscina: function (g, p) {
      var C = p.comp, L = p.larg, P = p.prof, t = 0.15;
      var topo = 0.05;
      caixa(g, C + 2 * t, t, L + 2 * t, 0, -P - t / 2 + topo, 0, 0x9aa3ad);
      caixa(g, C + 2 * t, P, t, 0, -P / 2 + topo, L / 2 + t / 2, 0x9aa3ad);
      caixa(g, C + 2 * t, P, t, 0, -P / 2 + topo, -L / 2 - t / 2, 0x9aa3ad);
      caixa(g, t, P, L, C / 2 + t / 2, -P / 2 + topo, 0, 0x9aa3ad);
      caixa(g, t, P, L, -C / 2 - t / 2, -P / 2 + topo, 0, 0x9aa3ad);
      caixa(g, C, P * 0.92, L, 0, -P / 2 + topo - P * 0.04, 0, 0x2f8fd8, 0.45);
      // borda
      caixa(g, C + 2 * t + 0.6, 0.06, 0.3, 0, topo + 0.03, L / 2 + t + 0.15, 0xe7e1d6);
      caixa(g, C + 2 * t + 0.6, 0.06, 0.3, 0, topo + 0.03, -L / 2 - t - 0.15, 0xe7e1d6);
      caixa(g, 0.3, 0.06, L + 2 * t, C / 2 + t + 0.15, topo + 0.03, 0, 0xe7e1d6);
      caixa(g, 0.3, 0.06, L + 2 * t, -C / 2 - t - 0.15, topo + 0.03, 0, 0xe7e1d6);
    }
  };

  var ultimoTipoCamera = null;
  function redesenhar() {
    if (!pronto) return;
    if (grupo) {
      cena.remove(grupo);
      grupo.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
    }
    grupo = new THREE.Group();
    DESENHO[estado.tipo](grupo, estado.p);
    // na piscina o chão some para mostrar o que fica enterrado
    chao.visible = estado.tipo !== "piscina";
    cena.add(grupo);
    if (ultimoTipoCamera !== estado.tipo) {
      enquadrar();
      ultimoTipoCamera = estado.tipo;
    }
  }

  function enquadrar() {
    var caixaG = new THREE.Box3().setFromObject(grupo);
    var tam = caixaG.getSize(new THREE.Vector3()).length();
    var centro = caixaG.getCenter(new THREE.Vector3());
    if (estado.tipo === "piscina") centro.y = Math.min(centro.y, 0);
    controles.target.copy(centro);
    camera.position.set(centro.x + tam * 0.75, centro.y + tam * 0.6, centro.z + tam * 0.9);
    camera.near = tam / 100; camera.far = tam * 20;
    camera.updateProjectionMatrix();
    controles.update();
  }

  function montarCampos() {
    var cont = doc.getElementById("campos3d");
    cont.innerHTML = "";
    MODELOS[estado.tipo].campos.forEach(function (c) {
      var lab = doc.createElement("div");
      lab.className = "campo3d";
      lab.innerHTML =
        '<label for="c3_' + c.id + '">' + c.nome + (c.un ? ' <span class="sub">(' + c.un + ')</span>' : "") + '</label>' +
        '<div class="ajuste">' +
        '<button type="button" class="menos" aria-label="Diminuir">−</button>' +
        '<input type="text" inputmode="decimal" id="c3_' + c.id + '">' +
        '<button type="button" class="mais" aria-label="Aumentar">+</button></div>';
      cont.appendChild(lab);
      var inp = lab.querySelector("input");
      function mostrar() { inp.value = String(estado.p[c.id]).replace(".", ","); }
      function definir(v) {
        if (!isFinite(v)) return;
        v = Math.min(c.max, Math.max(c.min, Math.round(v / c.passo) * c.passo));
        estado.p[c.id] = Math.round(v * 100) / 100;
        mostrar();
        atualizar();
      }
      mostrar();
      lab.querySelector(".menos").addEventListener("click", function () { definir(estado.p[c.id] - c.passo); });
      lab.querySelector(".mais").addEventListener("click", function () { definir(estado.p[c.id] + c.passo); });
      inp.addEventListener("change", function () { definir(parseFloat(inp.value.replace(",", "."))); });
    });
  }

  function atualizar() {
    var linhas = CALCULOS[estado.tipo](estado.p);
    var tb = doc.getElementById("quant3d");
    tb.innerHTML = "";
    linhas.forEach(function (l) {
      var tr = doc.createElement("tr");
      var a = doc.createElement("td");
      a.textContent = l.nome;
      if (l.nota) {
        var s = doc.createElement("span"); s.className = "nota"; s.textContent = l.nota; a.appendChild(s);
      }
      var b = doc.createElement("td"); b.className = "valor";
      b.textContent = fmt(l.valor, l.un) + " " + l.un;
      tr.appendChild(a); tr.appendChild(b);
      tb.appendChild(tr);
    });
    redesenhar();
  }

  doc.querySelectorAll(".modelo").forEach(function (b) {
    b.addEventListener("click", function () {
      doc.querySelectorAll(".modelo").forEach(function (x) {
        x.classList.toggle("ativo", x === b);
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      estado.tipo = b.dataset.modelo;
      estado.p = padrao(estado.tipo);
      montarCampos();
      atualizar();
    });
  });

  doc.getElementById("centralizar3d").addEventListener("click", function () { if (pronto) enquadrar(); });
  doc.getElementById("padrao3d").addEventListener("click", function () {
    estado.p = padrao(estado.tipo); montarCampos(); atualizar();
  });

  // O 3D só é criado quando a aba abre (economiza bateria no celular)
  raiz.abrirModelo3D = function () {
    iniciar3D();
    ajustarTamanho();
    redesenhar();
  };

  montarCampos();
  atualizar();
})(this);
