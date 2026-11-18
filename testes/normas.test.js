// Rode com: node --test testes/normas.test.js
const test = require("node:test");
const assert = require("node:assert");
const N = require("../normas.js");
const niveis = (r) => r.map((i) => i.nivel + ":" + i.titulo);

test("viga estreita dá erro", () => {
  const r = N.verificar("viga", { largura: 9, altura: 40, classe: "II", fck: 25 });
  assert.ok(niveis(r).includes("erro:Viga estreita demais"));
});
test("pilar de 12 cm não é aceito", () => {
  const r = N.verificar("pilar", { largura: 12, altura: 40, classe: "II", fck: 25 });
  assert.ok(niveis(r).includes("erro:Pilar fino demais"));
});
test("pilar 19x30 com 4 barras de 10 mm passa", () => {
  const r = N.verificar("pilar", { largura: 19, altura: 30, classe: "II", fck: 25, cobrimento: 3, nBarras: 4, diamBarra: 10, diamEstribo: 5, espEstribo: 12 });
  assert.strictEqual(r.filter((i) => i.nivel === "erro").length, 0, niveis(r).join("\n"));
});
test("concreto C20 na beira-mar dá erro", () => {
  const r = N.verificar("laje", { altura: 10, classe: "III", fck: 20, usoLaje: "piso" });
  assert.ok(niveis(r).includes("erro:Concreto fraco para o local"));
});
test("laje de piso com 7 cm dá erro", () => {
  const r = N.verificar("laje", { altura: 7, classe: "II", fck: 25, usoLaje: "piso" });
  assert.ok(niveis(r).includes("erro:Laje fina demais"));
});
test("aceita vírgula como decimal", () => {
  const r = N.verificar("viga", { largura: "14,5", altura: "40", classe: "II", fck: 25 });
  assert.ok(niveis(r).includes("ok:Largura da viga"));
});
