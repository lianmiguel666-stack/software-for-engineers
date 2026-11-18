(function () {
  "use strict";

  var CORES = { ref: "#ffd400", largura: "#00d1ff", altura: "#ff4fd8", vao: "#7dff4f" };

  var MEDIDAS = {
    viga: [
      { chave: "largura", nome: "Largura da viga", sub: "de um lado ao outro da viga" },
      { chave: "altura", nome: "Altura da viga", sub: "de baixo até o topo, com a laje se ela fizer parte" },
      { chave: "vao", nome: "Vão", sub: "distância entre os dois apoios, opcional" }
    ],
    pilar: [
      { chave: "largura", nome: "Lado 1 do pilar", sub: "uma face do pilar" },
      { chave: "altura", nome: "Lado 2 do pilar", sub: "a outra face" },
      { chave: "vao", nome: "Altura do pilar", sub: "do piso até a viga de cima, opcional" }
    ],
    laje: [
      { chave: "altura", nome: "Espessura da laje", sub: "meça na borda da laje" },
      { chave: "vao", nome: "Menor vão", sub: "menor distância entre apoios, opcional" }
    ]
  };

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $("canvas"), ctx = canvas.getContext("2d");

  var estado = {
    tipo: "viga",
    imagem: null,
    linhas: {},      // chave -> { p: [ {x,y}, {x,y} ] } em pixels da imagem
    ativa: null,     // chave sendo marcada
    arrasto: null,   // { chave, i }
    lupa: null       // ponto em pixels da imagem
  };

  // ---------- Tipo de peça ----------
  document.querySelectorAll("#passo1 .tipo").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("#passo1 .tipo").forEach(function (x) {
        x.classList.remove("ativo"); x.setAttribute("aria-pressed", "false");
      });
      b.classList.add("ativo"); b.setAttribute("aria-pressed", "true");
      estado.tipo = b.dataset.tipo;
      montarMedidas();
      document.querySelectorAll(".so-laje").forEach(function (e) { e.hidden = estado.tipo !== "laje"; });
      document.querySelectorAll(".nao-laje").forEach(function (e) { e.hidden = estado.tipo === "laje"; });
      $("resultado").hidden = true;
    });
  });

  function montarMedidas() {
    var cont = $("medidas");
    var antigos = {};
    cont.querySelectorAll("input").forEach(function (i) { antigos[i.dataset.chave] = i.value; });
    cont.innerHTML = "";
    MEDIDAS[estado.tipo].forEach(function (m) {
      var div = document.createElement("div");
      div.className = "medida";
      div.innerHTML =
        '<label for="m_' + m.chave + '"><span class="cor" style="background:' + CORES[m.chave] + '"></span>' + m.nome +
        ' <span class="sub">(' + m.sub + ')</span></label>' +
        '<div class="linha"><div class="campoUnidade"><input type="text" inputmode="decimal" id="m_' + m.chave +
        '" data-chave="' + m.chave + '" placeholder="' + (m.chave === "vao" ? "ex.: 400" : "0") + '"><span>cm</span></div>' +
        '<button type="button" class="botao marcar" data-medida="' + m.chave + '">Marcar</button></div>';
      cont.appendChild(div);
      var inp = div.querySelector("input");
      if (antigos[m.chave]) inp.value = antigos[m.chave];
      inp.addEventListener("input", function () { delete estado.linhas[m.chave]; desenhar(); });
    });
    ligarBotoesMarcar();
    // remove linhas que não pertencem a este tipo
    var validas = MEDIDAS[estado.tipo].map(function (m) { return m.chave; }).concat("ref");
    Object.keys(estado.linhas).forEach(function (k) { if (validas.indexOf(k) < 0) delete estado.linhas[k]; });
    desenhar();
  }

  function ligarBotoesMarcar() {
    document.querySelectorAll(".marcar").forEach(function (b) {
      b.onclick = function () {
        if (!estado.imagem) {
          avisar("Primeiro tire ou escolha uma foto no passo 2.");
          $("passo2").scrollIntoView({ behavior: "smooth" });
          return;
        }
        var chave = b.dataset.medida;
        if (chave !== "ref" && !estado.linhas.ref) {
          avisar("Primeiro marque a referência (a folha, o bloco ou a trena) para o app saber a escala.");
          comecar("ref");
          return;
        }
        comecar(chave);
      };
    });
  }

  function nomeDe(chave) {
    if (chave === "ref") return "a referência";
    var m = MEDIDAS[estado.tipo].filter(function (x) { return x.chave === chave; })[0];
    return m ? m.nome.toLowerCase() : chave;
  }

  function comecar(chave) {
    estado.ativa = chave;
    estado.linhas[chave] = { p: [] };
    document.querySelectorAll(".marcar").forEach(function (b) {
      b.classList.toggle("ativo", b.dataset.medida === chave);
    });
    instruir("Toque na PRIMEIRA ponta de " + nomeDe(chave) + ".");
    $("areaFoto").scrollIntoView({ behavior: "smooth", block: "start" });
    desenhar();
  }

  function instruir(t) { $("instrucao").textContent = t; }
  function avisar(t) { instruir(t); }

  // ---------- Foto ----------
  $("foto").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var url = URL.createObjectURL(f);
    carregarImagem(url);
  });

  $("exemplo").addEventListener("click", function () {
    carregarImagem(gerarExemplo());
  });

  function carregarImagem(src) {
    var img = new Image();
    img.onload = function () {
      estado.imagem = img;
      estado.linhas = {};
      estado.ativa = null;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      $("areaFoto").hidden = false;
      document.querySelectorAll(".medida input").forEach(function (i) { i.value = ""; });
      atualizarRef();
      instruir("Escolha a referência abaixo e toque em “Marcar”.");
      desenhar();
    };
    img.onerror = function () { alertaFoto(); };
    img.src = src;
  }

  function alertaFoto() {
    $("areaFoto").hidden = false;
    instruir("Não consegui abrir essa foto. Tente outra (JPG ou PNG).");
  }

  // Desenha uma foto de exemplo: viga de 15 x 40 cm com uma folha A4 encostada
  function gerarExemplo() {
    var c = document.createElement("canvas");
    var esc = 12; // pixels por cm
    c.width = 1000; c.height = 750;
    var g = c.getContext("2d");
    g.fillStyle = "#c9c2b5"; g.fillRect(0, 0, c.width, c.height);
    // parede de blocos
    g.strokeStyle = "#b3ab9c"; g.lineWidth = 2;
    for (var y = 0; y < c.height; y += 19 * esc / 2) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke();
    }
    // viga (seção) 15 x 40 cm
    var vx = 380, vy = 140;
    g.fillStyle = "#8f9296"; g.fillRect(vx, vy, 15 * esc, 40 * esc);
    g.fillStyle = "#7d8084";
    for (var i = 0; i < 300; i++) {
      g.fillRect(vx + Math.random() * 15 * esc, vy + Math.random() * 40 * esc, 3, 3);
    }
    g.strokeStyle = "#5c5f63"; g.lineWidth = 3; g.strokeRect(vx, vy, 15 * esc, 40 * esc);
    // folha A4 em pé (21 x 29,7 cm)
    var ax = 640, ay = 220;
    g.save();
    g.shadowColor = "rgba(0,0,0,.25)"; g.shadowBlur = 8;
    g.fillStyle = "#ffffff"; g.fillRect(ax, ay, 21 * esc, 29.7 * esc);
    g.restore();
    g.fillStyle = "#333"; g.font = "bold 28px sans-serif"; g.fillText("A4", ax + 100, ay + 190);
    g.fillStyle = "#222"; g.font = "22px sans-serif";
    g.fillText("Exemplo: viga 15 x 40 cm", 30, 50);
    return c.toDataURL("image/png");
  }

  // ---------- Referência ----------
  $("refTipo").addEventListener("change", function () {
    $("refOutro").hidden = this.value !== "outro";
    if (this.value === "outro") $("refOutro").focus();
    recalcular();
  });
  $("refOutro").addEventListener("input", recalcular);

  function tamanhoRef() {
    var v = $("refTipo").value === "outro" ? $("refOutro").value : $("refTipo").value;
    var n = parseFloat(String(v).replace(",", "."));
    return isFinite(n) && n > 0 ? n : null;
  }

  function comprimento(l) {
    if (!l || l.p.length < 2) return null;
    var dx = l.p[1].x - l.p[0].x, dy = l.p[1].y - l.p[0].y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function escala() { // cm por pixel
    var px = comprimento(estado.linhas.ref), cm = tamanhoRef();
    return px && cm ? cm / px : null;
  }

  function atualizarRef() {
    var e = $("refEstado");
    if (estado.linhas.ref && estado.linhas.ref.p.length === 2) {
      e.textContent = "Referência marcada. Agora marque as medidas no passo 3.";
      e.classList.add("feito");
    } else {
      e.textContent = "Ainda não marcada.";
      e.classList.remove("feito");
    }
  }

  function recalcular() {
    var s = escala();
    MEDIDAS[estado.tipo].forEach(function (m) {
      var l = estado.linhas[m.chave], px = comprimento(l);
      if (px && s) {
        var inp = $("m_" + m.chave);
        if (inp) inp.value = String(Math.round(px * s * 10) / 10).replace(".", ",");
      }
    });
    atualizarRef();
    desenhar();
  }

  // ---------- Toque na foto ----------
  function pontoImagem(ev) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) * canvas.width / r.width,
      y: (ev.clientY - r.top) * canvas.height / r.height
    };
  }
  function pxPorCss() {
    return canvas.width / canvas.getBoundingClientRect().width;
  }

  function pontoProximo(p) {
    var limite = 22 * pxPorCss(), melhor = null;
    Object.keys(estado.linhas).forEach(function (k) {
      estado.linhas[k].p.forEach(function (q, i) {
        var d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < limite && (!melhor || d < melhor.d)) melhor = { chave: k, i: i, d: d };
      });
    });
    return melhor;
  }

  canvas.addEventListener("pointerdown", function (ev) {
    if (!estado.imagem) return;
    var p = pontoImagem(ev);
    var l = estado.ativa && estado.linhas[estado.ativa];
    if (l && l.p.length < 2) {
      l.p.push(p);
      estado.arrasto = { chave: estado.ativa, i: l.p.length - 1 };
    } else {
      var q = pontoProximo(p);
      if (!q) {
        instruir("Toque em “Marcar” ao lado da medida que quer tirar. Para ajustar, arraste as bolinhas.");
        return;
      }
      estado.arrasto = q;
    }
    estado.lupa = p;
    canvas.setPointerCapture(ev.pointerId);
    desenhar();
  });

  canvas.addEventListener("pointermove", function (ev) {
    if (!estado.arrasto) return;
    var p = pontoImagem(ev);
    p.x = Math.max(0, Math.min(canvas.width, p.x));
    p.y = Math.max(0, Math.min(canvas.height, p.y));
    estado.linhas[estado.arrasto.chave].p[estado.arrasto.i] = p;
    estado.lupa = p;
    recalcular();
  });

  function soltar() {
    if (!estado.arrasto) return;
    estado.arrasto = null;
    estado.lupa = null;
    recalcular();
    var l = estado.ativa && estado.linhas[estado.ativa];
    if (l) {
      if (l.p.length === 1) {
        instruir("Agora toque na SEGUNDA ponta de " + nomeDe(estado.ativa) + ".");
      } else if (l.p.length === 2) {
        var feito = estado.ativa;
        estado.ativa = null;
        document.querySelectorAll(".marcar").forEach(function (b) { b.classList.remove("ativo"); });
        if (feito === "ref") {
          instruir("Pronto! Agora toque em “Marcar” em cada medida do passo 3.");
        } else {
          var v = $("m_" + feito) ? $("m_" + feito).value : "";
          instruir("Medido: " + v + " cm. Arraste as bolinhas para ajustar, se precisar.");
        }
      }
    }
    desenhar();
  }
  canvas.addEventListener("pointerup", soltar);
  canvas.addEventListener("pointercancel", soltar);

  // ---------- Desenho ----------
  function desenhar() {
    if (!estado.imagem) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(estado.imagem, 0, 0);
    var k = pxPorCss() || 1;
    var s = escala();
    Object.keys(estado.linhas).forEach(function (chave) {
      var l = estado.linhas[chave], cor = CORES[chave] || "#fff";
      ctx.lineWidth = 3 * k;
      if (l.p.length === 2) {
        ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 6 * k;
        linha(l.p[0], l.p[1]);
        ctx.strokeStyle = cor; ctx.lineWidth = 3 * k;
        linha(l.p[0], l.p[1]);
        var px = comprimento(l);
        var txt = chave === "ref" ? "ref. " + (tamanhoRef() || "?") + " cm"
          : (s ? (Math.round(px * s * 10) / 10).toString().replace(".", ",") + " cm" : "");
        if (txt) rotulo(txt, (l.p[0].x + l.p[1].x) / 2, (l.p[0].y + l.p[1].y) / 2, cor, k);
      }
      l.p.forEach(function (q) {
        ctx.beginPath(); ctx.arc(q.x, q.y, 9 * k, 0, Math.PI * 2);
        ctx.fillStyle = cor; ctx.fill();
        ctx.lineWidth = 2 * k; ctx.strokeStyle = "#000"; ctx.stroke();
      });
    });
    if (estado.lupa) lupa(estado.lupa, k);
  }

  function linha(a, b) {
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }

  function rotulo(t, x, y, cor, k) {
    ctx.font = "bold " + Math.round(16 * k) + "px system-ui, sans-serif";
    var w = ctx.measureText(t).width + 12 * k, h = 24 * k;
    ctx.fillStyle = "rgba(0,0,0,.75)";
    ctx.fillRect(x - w / 2, y - h - 10 * k, w, h);
    ctx.fillStyle = cor;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(t, x, y - h / 2 - 10 * k);
    ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";
  }

  // Lupa no canto para acertar a ponta com o dedo
  function lupa(p, k) {
    var r = 70 * k, zoom = 3;
    var cx = p.x < canvas.width / 2 ? canvas.width - r - 10 * k : r + 10 * k;
    var cy = r + 10 * k;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "#000"; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    var tam = (2 * r) / zoom;
    ctx.drawImage(estado.imagem, p.x - tam / 2, p.y - tam / 2, tam, tam, cx - r, cy - r, 2 * r, 2 * r);
    ctx.strokeStyle = "#ff3b3b"; ctx.lineWidth = 2 * k;
    ctx.beginPath(); ctx.moveTo(cx - 14 * k, cy); ctx.lineTo(cx + 14 * k, cy);
    ctx.moveTo(cx, cy - 14 * k); ctx.lineTo(cx, cy + 14 * k); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 3 * k; ctx.strokeStyle = "#fff"; ctx.stroke();
  }

  window.addEventListener("resize", desenhar);

  // ---------- Conferir ----------
  $("conferir").addEventListener("click", function () {
    var dados = {
      classe: $("classe").value,
      fck: $("fck").value,
      cobrimento: $("cobrimento").value,
      usoLaje: $("usoLaje").value,
      nBarras: $("nBarras").value,
      diamBarra: $("diamBarra").value,
      diamEstribo: $("diamEstribo").value,
      espEstribo: $("espEstribo").value
    };
    MEDIDAS[estado.tipo].forEach(function (m) { dados[m.chave] = $("m_" + m.chave).value; });
    var itens = Normas.verificar(estado.tipo, dados);
    mostrar(itens);
  });

  function mostrar(itens) {
    var erros = itens.filter(function (i) { return i.nivel === "erro"; }).length;
    var atencoes = itens.filter(function (i) { return i.nivel === "atencao"; }).length;
    var resumo = $("resumo");
    if (erros) {
      resumo.className = "resumo erro";
      resumo.textContent = erros === 1 ? "Encontrei 1 erro. Veja abaixo como corrigir." : "Encontrei " + erros + " erros. Veja abaixo como corrigir.";
    } else if (atencoes) {
      resumo.className = "resumo atencao";
      resumo.textContent = "Nenhum erro, mas " + (atencoes === 1 ? "1 ponto precisa" : atencoes + " pontos precisam") + " de atenção.";
    } else {
      resumo.className = "resumo ok";
      resumo.textContent = "Tudo certo com o que foi informado.";
    }
    var selo = { erro: "ERRO", atencao: "ATENÇÃO", ok: "OK" };
    var ul = $("lista");
    ul.innerHTML = "";
    itens.forEach(function (i) {
      var li = document.createElement("li");
      li.className = i.nivel;
      var t = document.createElement("div"); t.className = "titulo";
      var s = document.createElement("span"); s.className = "selo"; s.textContent = selo[i.nivel];
      t.appendChild(s); t.appendChild(document.createTextNode(i.titulo));
      var p = document.createElement("p"); p.textContent = i.texto;
      li.appendChild(t); li.appendChild(p);
      if (i.norma) {
        var n = document.createElement("p"); n.className = "norma"; n.textContent = i.norma; li.appendChild(n);
      }
      ul.appendChild(li);
    });
    $("resultado").hidden = false;
    $("resultado").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("imprimir").addEventListener("click", function () { window.print(); });

  montarMedidas();
})();
