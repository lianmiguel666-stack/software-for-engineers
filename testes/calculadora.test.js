// Rode com: node --test testes/calculadora.test.js
const test = require("node:test");
const assert = require("node:assert");
const C = require("../calculadora.js");

test("respeita a ordem das contas", () => {
  assert.strictEqual(C.calcularExpressao("2+3×4"), 14);
  assert.strictEqual(C.calcularExpressao("(2+3)×4"), 20);
  assert.strictEqual(C.calcularExpressao("10÷4"), 2.5);
  assert.strictEqual(C.calcularExpressao("1,5+1,5"), 3);
  assert.strictEqual(C.calcularExpressao("50%×200"), 100);
});
test("divisão por zero dá erro", () => {
  assert.throws(() => C.calcularExpressao("5÷0"));
});
test("concreto 4 x 0,15 x 0,40 = 0,24 m³", () => {
  const r = C.CALC_OBRA.concreto.calc({ c: "4", l: "0,15", a: "0,40", q: "1" });
  assert.ok(Math.abs(r[0].valor - 0.24) < 1e-9);
});
test("aço 10 mm: 30 m pesam 18,51 kg", () => {
  const r = C.CALC_OBRA.aco.calc({ b: "10", comp: "3", q: "10" });
  assert.ok(Math.abs(r[2].valor - 18.51) < 1e-9);
});
test("1 MPa = 10,2 kgf/cm²", () => {
  assert.ok(Math.abs(C.converter("pressao", 1, "MPa", "kgf/cm²") - 10.197) < 0.001);
});
