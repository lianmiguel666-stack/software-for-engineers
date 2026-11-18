/*
 * Regras de verificação baseadas na NBR 6118:2014 (concreto armado).
 * Cada verificação devolve: { nivel: "ok" | "atencao" | "erro", titulo, texto, norma }.
 * Unidades de entrada: centímetros (cm) para medidas, milímetros (mm) para barras.
 * O texto da norma não é copiado aqui; só os valores usados nas contas.
 */
(function (raiz) {
  "use strict";

  // Tabela 6.1 / 7.1 / 7.2 da NBR 6118 (resumida)
  var CLASSES = {
    I:   { nome: "Fraca (zona rural ou obra submersa)", fckMin: 20, acMax: 0.65, cobLaje: 2.0, cobVigaPilar: 2.5 },
    II:  { nome: "Moderada (cidade)",                   fckMin: 25, acMax: 0.60, cobLaje: 2.5, cobVigaPilar: 3.0 },
    III: { nome: "Forte (beira-mar ou zona industrial)", fckMin: 30, acMax: 0.55, cobLaje: 3.5, cobVigaPilar: 4.0 },
    IV:  { nome: "Muito forte (respingo de maré, indústria química)", fckMin: 40, acMax: 0.45, cobLaje: 4.5, cobVigaPilar: 5.0 }
  };

  // Taxa mínima de armadura de flexão em vigas (Tabela 17.3, CA-50, seção retangular), em %
  function taxaMinimaViga(fck) {
    if (fck <= 30) return 0.150;
    if (fck <= 35) return 0.164;
    if (fck <= 40) return 0.179;
    if (fck <= 45) return 0.194;
    return 0.208;
  }

  function areaBarra(diamMm) {
    return Math.PI * diamMm * diamMm / 400; // cm²
  }

  function fmt(n, casas) {
    if (casas === undefined) casas = 1;
    return Number(n).toFixed(casas).replace(".", ",");
  }

  function num(v) {
    if (v === null || v === undefined || v === "") return null;
    var n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return isFinite(n) && n > 0 ? n : null;
  }

  function item(nivel, titulo, texto, norma) {
    return { nivel: nivel, titulo: titulo, texto: texto, norma: norma || "" };
  }

  function verificarConcreto(d, r, cobMin) {
    var classe = CLASSES[d.classe];
    if (!classe) return;
    var fck = num(d.fck);
    if (fck) {
      if (fck < classe.fckMin) {
        r.push(item("erro", "Concreto fraco para o local",
          "O concreto é C" + fck + ", mas para agressividade " + classe.nome.toLowerCase() +
          " o mínimo é C" + classe.fckMin + ". Peça concreto C" + classe.fckMin + " ou mais forte.",
          "NBR 6118, tabela 7.1"));
      } else {
        r.push(item("ok", "Resistência do concreto", "C" + fck + " atende o mínimo C" + classe.fckMin + " para este local.", "NBR 6118, tabela 7.1"));
      }
    }
    r.push(item("ok", "Lembrete para a usina de concreto",
      "Fator água/cimento no máximo " + fmt(classe.acMax, 2) + ". Confira na nota fiscal do concreto.",
      "NBR 6118, tabela 7.1"));
    var cob = num(d.cobrimento);
    if (cob) {
      if (cob < cobMin) {
        r.push(item("erro", "Cobrimento pequeno",
          "O cobrimento é " + fmt(cob) + " cm, mas o mínimo aqui é " + fmt(cobMin) + " cm. " +
          "Com pouco concreto por fora, o aço enferruja e a peça trinca. Use espaçadores de " + fmt(cobMin) + " cm.",
          "NBR 6118, tabela 7.2"));
      } else {
        r.push(item("ok", "Cobrimento", fmt(cob) + " cm atende o mínimo de " + fmt(cobMin) + " cm.", "NBR 6118, tabela 7.2"));
      }
    } else {
      r.push(item("atencao", "Cobrimento não informado",
        "Para este local o cobrimento mínimo é " + fmt(cobMin) + " cm. Use espaçadores desse tamanho.",
        "NBR 6118, tabela 7.2"));
    }
  }

  function verificarViga(d) {
    var r = [];
    var bw = num(d.largura), h = num(d.altura), L = num(d.vao);
    var fck = num(d.fck) || 25;
    var classe = CLASSES[d.classe] || CLASSES.II;

    if (!bw || !h) {
      r.push(item("erro", "Faltam medidas", "Meça ou digite a largura e a altura da viga.", ""));
      return r;
    }
    if (bw < 10) {
      r.push(item("erro", "Viga estreita demais",
        "A largura é " + fmt(bw) + " cm. A norma não aceita viga com menos de 12 cm (10 cm só em casos especiais). Aumente para 12 cm ou mais.",
        "NBR 6118, item 13.2.2"));
    } else if (bw < 12) {
      r.push(item("atencao", "Viga no limite",
        "A largura é " + fmt(bw) + " cm. Abaixo de 12 cm só é aceito em casos especiais, com cuidado redobrado na concretagem.",
        "NBR 6118, item 13.2.2"));
    } else {
      r.push(item("ok", "Largura da viga", fmt(bw) + " cm atende o mínimo de 12 cm.", "NBR 6118, item 13.2.2"));
    }

    if (L) {
      var hSug = L / 12;
      if (h < L / 15) {
        r.push(item("erro", "Viga baixa para o vão",
          "Vão de " + fmt(L / 100, 2) + " m com altura de " + fmt(h) + " cm. Pela regra prática a altura deveria ficar perto de " +
          fmt(hSug, 0) + " cm (vão ÷ 12). A viga pode envergar e trincar. Peça a conferência do cálculo.",
          "Regra prática de pré-dimensionamento"));
      } else if (h < hSug) {
        r.push(item("atencao", "Altura da viga um pouco baixa",
          "Pela regra prática (vão ÷ 12) a altura seria " + fmt(hSug, 0) + " cm. Confira a flecha no cálculo.",
          "Regra prática de pré-dimensionamento"));
      } else {
        r.push(item("ok", "Altura da viga", fmt(h) + " cm é compatível com o vão de " + fmt(L / 100, 2) + " m.", "Regra prática"));
      }
    }

    verificarConcreto(d, r, classe.cobVigaPilar);

    var n = num(d.nBarras), fi = num(d.diamBarra), ft = num(d.diamEstribo) || 5;
    if (n && fi) {
      var as = n * areaBarra(fi);
      var asMin = taxaMinimaViga(fck) / 100 * bw * h;
      var asMax = 0.04 * bw * h;
      if (as < asMin) {
        r.push(item("erro", "Pouco aço na viga",
          n + " barras de " + fmt(fi, 1) + " mm dão " + fmt(as, 2) + " cm² de aço. O mínimo para esta viga é " + fmt(asMin, 2) + " cm².",
          "NBR 6118, item 17.3.5.2.1"));
      } else if (as > asMax) {
        r.push(item("erro", "Aço demais na viga",
          "São " + fmt(as, 2) + " cm² de aço, acima do máximo de " + fmt(asMax, 2) + " cm² (4% da seção). Aumente a viga.",
          "NBR 6118, item 17.3.5.2.4"));
      } else {
        r.push(item("ok", "Quantidade de aço", fmt(as, 2) + " cm² está entre o mínimo (" + fmt(asMin, 2) + ") e o máximo (" + fmt(asMax, 2) + ").", "NBR 6118, item 17.3.5.2"));
      }

      // Espaço livre entre barras numa camada (brita 1: diâmetro máximo 19 mm)
      var cob = num(d.cobrimento) || classe.cobVigaPilar;
      var livreMin = Math.max(2.0, fi / 10, 1.2 * 1.9);
      if (n > 1) {
        var livre = (bw - 2 * cob - 2 * ft / 10 - n * fi / 10) / (n - 1);
        if (livre < livreMin) {
          r.push(item("erro", "As barras não cabem em uma camada",
            "Sobram só " + fmt(Math.max(livre, 0)) + " cm entre as barras; o mínimo é " + fmt(livreMin) + " cm para o concreto passar. " +
            "Use duas camadas, barras mais grossas e em menor número, ou uma viga mais larga.",
            "NBR 6118, item 18.3.2.2"));
        } else {
          r.push(item("ok", "Espaço entre barras", fmt(livre) + " cm entre barras (mínimo " + fmt(livreMin) + " cm).", "NBR 6118, item 18.3.2.2"));
        }
      }
    }

    if (ft) {
      if (ft < 5) {
        r.push(item("erro", "Estribo fino demais", "O estribo precisa ter pelo menos 5 mm.", "NBR 6118, item 18.3.3.2"));
      } else if (ft > bw * 10 / 10) {
        r.push(item("erro", "Estribo grosso demais", "O estribo não pode passar de 1/10 da largura da viga (" + fmt(bw, 0) + " mm).", "NBR 6118, item 18.3.3.2"));
      }
    }
    var s = num(d.espEstribo);
    if (s) {
      var dUtil = h - (num(d.cobrimento) || classe.cobVigaPilar) - 1;
      var sMax = Math.min(0.6 * dUtil, 30);
      if (s > sMax) {
        r.push(item("atencao", "Estribos muito afastados",
          "Os estribos estão a cada " + fmt(s) + " cm. Em geral o máximo é " + fmt(sMax, 0) + " cm para esta viga (pode ser menor perto dos apoios).",
          "NBR 6118, item 18.3.3.2"));
      } else {
        r.push(item("ok", "Espaçamento dos estribos", "A cada " + fmt(s) + " cm, dentro do máximo de " + fmt(sMax, 0) + " cm.", "NBR 6118, item 18.3.3.2"));
      }
    }
    return r;
  }

  function verificarPilar(d) {
    var r = [];
    var a = num(d.largura), b = num(d.altura), H = num(d.vao);
    var classe = CLASSES[d.classe] || CLASSES.II;
    if (!a || !b) {
      r.push(item("erro", "Faltam medidas", "Meça ou digite os dois lados do pilar.", ""));
      return r;
    }
    var menor = Math.min(a, b), maior = Math.max(a, b);
    var area = a * b;
    if (menor < 14) {
      r.push(item("erro", "Pilar fino demais",
        "O lado menor é " + fmt(menor) + " cm. A norma não aceita pilar com lado menor que 14 cm. Aumente para 19 cm ou mais.",
        "NBR 6118, item 13.2.3"));
    } else if (menor < 19) {
      r.push(item("atencao", "Pilar entre 14 e 19 cm",
        "Com lado de " + fmt(menor) + " cm é permitido, mas o cálculo precisa usar o coeficiente adicional γn (cargas aumentadas). Confira com o calculista.",
        "NBR 6118, item 13.2.3"));
    } else {
      r.push(item("ok", "Lado menor do pilar", fmt(menor) + " cm atende o mínimo de 19 cm.", "NBR 6118, item 13.2.3"));
    }
    if (area < 360) {
      r.push(item("erro", "Pilar pequeno demais", "A área é " + fmt(area, 0) + " cm²; o mínimo é 360 cm².", "NBR 6118, item 13.2.3"));
    }
    if (maior > 5 * menor) {
      r.push(item("atencao", "Isto é um pilar-parede",
        "Um lado é mais de 5 vezes o outro. Ele deve ser calculado como pilar-parede.", "NBR 6118, item 18.5"));
    }
    if (H) {
      var lambda = 3.46 * H / menor;
      if (lambda > 200) {
        r.push(item("erro", "Pilar esbelto demais",
          "Com " + fmt(H / 100, 2) + " m de altura e lado de " + fmt(menor) + " cm, a esbeltez é " + fmt(lambda, 0) + ". O máximo é 200. Aumente o lado ou trave o pilar.",
          "NBR 6118, item 15.8.1"));
      } else if (lambda > 90) {
        r.push(item("atencao", "Pilar esbelto",
          "Esbeltez " + fmt(lambda, 0) + " (acima de 90). O cálculo precisa considerar a fluência do concreto. Confira com o calculista.",
          "NBR 6118, item 15.8.4"));
      } else {
        r.push(item("ok", "Esbeltez do pilar", "Esbeltez " + fmt(lambda, 0) + ", dentro do comum (até 90).", "NBR 6118, item 15.8"));
      }
    }

    verificarConcreto(d, r, classe.cobVigaPilar);

    var n = num(d.nBarras), fi = num(d.diamBarra), ft = num(d.diamEstribo), s = num(d.espEstribo);
    if (n) {
      if (n < 4) r.push(item("erro", "Poucas barras", "Pilar retangular precisa de pelo menos 4 barras, uma em cada canto.", "NBR 6118, item 18.4.2.2"));
    }
    if (fi) {
      if (fi < 10) {
        r.push(item("erro", "Barra fina demais", "No pilar a barra principal precisa ter pelo menos 10 mm.", "NBR 6118, item 18.4.2.1"));
      } else if (fi > menor * 10 / 8) {
        r.push(item("erro", "Barra grossa demais", "A barra não pode passar de 1/8 do lado menor (" + fmt(menor * 10 / 8, 0) + " mm).", "NBR 6118, item 18.4.2.1"));
      }
    }
    if (n && fi) {
      var as = n * areaBarra(fi);
      var asMin = 0.004 * area, asMax = 0.04 * area;
      if (as < asMin) {
        r.push(item("erro", "Pouco aço no pilar",
          n + " barras de " + fmt(fi, 1) + " mm dão " + fmt(as, 2) + " cm². O mínimo é " + fmt(asMin, 2) + " cm² (0,4% da seção).",
          "NBR 6118, item 17.3.5.3.1"));
      } else if (as > asMax) {
        r.push(item("erro", "Aço demais no pilar",
          fmt(as, 2) + " cm² passa de 4% da seção (" + fmt(asMax, 2) + " cm²). Nas emendas isso dobra e o concreto não passa.",
          "NBR 6118, item 17.3.5.3.2"));
      } else {
        r.push(item("ok", "Quantidade de aço", fmt(as, 2) + " cm² entre o mínimo (" + fmt(asMin, 2) + ") e o máximo (" + fmt(asMax, 2) + ").", "NBR 6118, item 17.3.5.3"));
      }
    }
    if (ft && fi && ft < Math.max(5, fi / 4)) {
      r.push(item("erro", "Estribo fino demais",
        "O estribo precisa ter pelo menos 5 mm e 1/4 da barra principal (" + fmt(Math.max(5, fi / 4), 1) + " mm).", "NBR 6118, item 18.4.3"));
    }
    if (s) {
      var sMax = Math.min(20, menor, fi ? 12 * fi / 10 : 20);
      if (s > sMax) {
        r.push(item("erro", "Estribos muito afastados",
          "Estão a cada " + fmt(s) + " cm; o máximo para este pilar é " + fmt(sMax, 1) + " cm. Sem isso as barras podem flambar.",
          "NBR 6118, item 18.4.3"));
      } else {
        r.push(item("ok", "Espaçamento dos estribos", "A cada " + fmt(s) + " cm, dentro do máximo de " + fmt(sMax, 1) + " cm.", "NBR 6118, item 18.4.3"));
      }
    }
    return r;
  }

  var USOS_LAJE = {
    cobertura: { nome: "Cobertura (não em balanço)", min: 7 },
    piso:      { nome: "Piso (não em balanço)", min: 8 },
    balanco:   { nome: "Laje em balanço (marquise, sacada)", min: 10 },
    garagem:   { nome: "Garagem de carro (até 3 t)", min: 10 },
    garagemPesada: { nome: "Veículos pesados (mais de 3 t)", min: 12 }
  };

  function verificarLaje(d) {
    var r = [];
    var e = num(d.altura), L = num(d.vao);
    var classe = CLASSES[d.classe] || CLASSES.II;
    var uso = USOS_LAJE[d.usoLaje] || USOS_LAJE.piso;
    if (!e) {
      r.push(item("erro", "Falta a espessura", "Meça ou digite a espessura da laje.", ""));
      return r;
    }
    if (e < uso.min) {
      r.push(item("erro", "Laje fina demais",
        "Para " + uso.nome.toLowerCase() + " a laje maciça precisa de pelo menos " + uso.min + " cm. Está com " + fmt(e) + " cm.",
        "NBR 6118, item 13.2.4.1"));
    } else {
      r.push(item("ok", "Espessura da laje", fmt(e) + " cm atende o mínimo de " + uso.min + " cm para " + uso.nome.toLowerCase() + ".", "NBR 6118, item 13.2.4.1"));
    }
    if (L) {
      var div = d.usoLaje === "balanco" ? 10 : 40;
      var eSug = L / div;
      if (e < eSug * 0.85) {
        r.push(item("atencao", "Laje fina para o vão",
          "Para " + fmt(L / 100, 2) + " m de vão a regra prática pede uns " + fmt(eSug, 0) + " cm (vão ÷ " + div + "). A laje pode envergar. Confira a flecha no cálculo.",
          "Regra prática de pré-dimensionamento"));
      } else {
        r.push(item("ok", "Espessura x vão", "Compatível com o vão de " + fmt(L / 100, 2) + " m.", "Regra prática"));
      }
    }
    verificarConcreto(d, r, classe.cobLaje);
    return r;
  }

  function verificar(tipo, dados) {
    var r;
    if (tipo === "viga") r = verificarViga(dados);
    else if (tipo === "pilar") r = verificarPilar(dados);
    else r = verificarLaje(dados);
    var ordem = { erro: 0, atencao: 1, ok: 2 };
    return r.sort(function (x, y) { return ordem[x.nivel] - ordem[y.nivel]; });
  }

  var api = { verificar: verificar, CLASSES: CLASSES, USOS_LAJE: USOS_LAJE, areaBarra: areaBarra };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.Normas = api;
})(this);
