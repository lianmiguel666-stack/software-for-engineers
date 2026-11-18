# Confere Obra

App simples para engenheiros conferirem **vigas, pilares e lajes de concreto armado** pela **NBR 6118**.

**Abrir o app:** https://lianmiguel666-stack.github.io/software-for-engineers/

## Como usar

1. Escolha a peça: viga, pilar ou laje.
2. Tire uma foto **de frente**, com algo de tamanho conhecido **encostado na peça** (folha A4, bloco de concreto, trena aberta).
3. Marque a referência na foto (duas pontas) e depois cada medida. O app calcula os centímetros sozinho. Também dá para digitar.
4. Informe onde fica a obra, o concreto, o cobrimento e as barras.
5. Toque em **Conferir**. Cada item aparece como **OK**, **ATENÇÃO** ou **ERRO**, com a explicação e o item da norma.

## O que ele confere

- Viga: largura mínima, altura x vão, armadura mínima e máxima, espaço entre barras, estribos.
- Pilar: lado mínimo (19 cm / 14 cm), área mínima, esbeltez, número e bitola das barras, armadura mínima e máxima, estribos.
- Laje: espessura mínima conforme o uso, espessura x vão.
- Todas: concreto mínimo, fator água/cimento e cobrimento conforme a agressividade do local.

## Checklist da obra

Na aba **Checklist da obra** ficam os 7 problemas mais comuns no canteiro, cada um com itens para marcar:
projetos que não conversam entre si, atrasos, estouro do orçamento, mão de obra sem treinamento,
falhas de comunicação, segurança do trabalho e material de baixa qualidade. As marcações ficam salvas no aparelho.

## Limites

- A medida pela foto tem erro de alguns centímetros e só vale se a referência estiver no mesmo plano da medida e a foto for tirada de frente.
- Não substitui o cálculo estrutural nem a responsabilidade técnica (ART).

## Para desenvolvedores

Site estático, sem instalação: `index.html`, `style.css`, `app.js`, `normas.js` (as regras), `obra.js` (checklist da obra) e `logo.svg`.
Testes das regras: `node --test testes/normas.test.js`.
