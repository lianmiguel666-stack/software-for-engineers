// Rode com: node --test testes/modelo3d.test.js
const test = require("node:test");
const assert = require("node:assert");
const M = require("../modelo3d.js");
const valor = (linhas, nome) => linhas.find((l) => l.nome === nome).valor;

test("casa 10 x 8 tem 80 m² construídos", () => {
  const r = M.CALCULOS.casa(M.padrao("casa"));
  assert.strictEqual(valor(r, "Área construída"), 80);
  assert.strictEqual(valor(r, "Perímetro"), 36);
});
test("piscina 8 x 4 x 1,4 tem 44.800 litros", () => {
  const r = M.CALCULOS.piscina(M.padrao("piscina"));
  assert.ok(Math.abs(valor(r, "Volume de água") - 44800) < 1e-6);
});
test("estrutura 3 x 2 vãos tem 12 pilares por pavimento", () => {
  const r = M.CALCULOS.estrutura(M.padrao("estrutura"));
  assert.strictEqual(valor(r, "Pilares por pavimento"), 12);
});
