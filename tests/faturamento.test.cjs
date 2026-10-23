const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'solar-organization/index.html'), 'utf8');
function engine() {
  const context = vm.createContext({ Intl, console });
  // Load the actual pure functions without starting authentication or contacting Supabase.
  vm.runInContext(html.slice(html.indexOf('function uid(){'), html.indexOf('var state = {')), context);
  vm.runInContext(html.slice(html.indexOf('function docConfigPadrao(){'), html.indexOf('async function loadAll(){')), context);
  return context;
}

test('condições lógicas ignoram o operando protegido e devolvem 0/1', () => {
  const e = engine();
  for (const [expression, expected] of [
    ['0 && (1 / 0)', 0], ['1 || (1 / 0)', 1],
    ['1 && 5', 1], ['0 || 5', 1], ['1 && 0', 0], ['0 || 0', 0],
    ['se(0, 1 / 0, 7)', 7], ['0 ? 1 / 0 : 7', 7],
  ]) assert.equal(e.runLine('valor = ' + expression, {}), expected, expression);
  assert.throws(() => e.runLine('valor = 1 && (1 / 0)', {}), /Divisão por zero/);
  assert.throws(() => e.runLine('valor = 0 || (1 / 0)', {}), /Divisão por zero/);
});

test('NaN e infinito não entram no escopo de faturamento', () => {
  const e = engine();
  for (const expression of ['0 % 0', '10 ^ 1000', '(-1) ^ 0.5', 'max()']) {
    const scope = { valor: 42 };
    assert.throws(() => e.runLine('valor = ' + expression, scope), /número finito/, expression);
    assert.equal(scope.valor, 42);
    assert.throws(() => e.runLine(expression, {}), /número finito/, expression);
  }
});

test('erro numérico do perfil informa a linha que falhou', () => {
  const result = engine().avaliarPerfil({ formulas: ['total = 0 % 0'] }, {}, null);
  assert.equal(result.ok, false);
  assert.equal(result.erro.linha, 1);
  assert.equal(result.erro.texto, 'total = 0 % 0');
});

test('modelos GD1 e GD2 mantêm os valores de referência', () => {
  const e = engine();
  for (const [preset, expected] of [['presetGD1', 110], ['presetGD2ComFioBUnico', 90]]) {
    const profile = e[preset]();
    const inputs = Object.fromEntries(profile.variaveis.map(v => [v.chave, v.valorPadrao]));
    Object.assign(inputs, { precoBase: 1, taxaBandeira: 0.2, desconto: 0.1, injecaoTotal: 100, saldoDelta: 0, fioB: 20, ajuste: 0 });
    const result = e.avaliarPerfil(profile, inputs, null);
    assert.equal(result.ok, true);
    assert.ok(Math.abs(result.scope[profile.chaveTotalFinal] - expected) < 1e-9);
  }
});

test('GD2 múltiplo aceita energia ativa zero sem avaliar divisão protegida', () => {
  const e = engine(), profile = e.presetGD2ComFioBMultiplos();
  const inputs = Object.fromEntries(profile.variaveis.map(v => [v.chave, v.valorPadrao]));
  Object.assign(inputs, { precoBase: 1, taxaBandeira: 0, desconto: 0.2, injecaoTotal: 100, consumoTotal: 100, injecaoNaConta: 100, energiaAtiva: 0, fioB: 0, ajuste: 0 });
  const result = e.avaliarPerfil(profile, inputs, [{ consumoKwh: 60, fioBPonto: 0 }, { consumoKwh: 40, fioBPonto: 0 }]);
  assert.equal(result.ok, true);
  assert.equal(result.scope.valorFioBPorKwh, 0);
  assert.equal(result.scope[profile.chaveTotalFinal], 80);
});

test('faturamento bloqueia total ausente e estouro após repasse da concessionária', () => {
  for (const overflow of [false, true]) {
    const e = engine(), messages = [];
    const profile = {
      chaveTotalFinal: 'total',
      formulas: overflow ? ['total = 10 ^ 308', 'valorFaturaInfo = total'] : ['outro = 1'],
    };
    Object.assign(e, {
      modoLancamentoFormulario: 'manual', state: { lastDraft: null },
      completarVariacaoContaGd2: () => true,
      selectedClient: () => ({ locadorPagaFatura: overflow }), getProfile: () => profile,
      validarTransferenciaSaldo: () => true, validarConciliacaoSaldo: () => true,
      getReferenciaAtual: () => '10/2026', num: () => 0, txt: () => '',
      resolverTarifasPeriodo: () => ({ valores: {}, aplicadas: [] }),
      readMensaisFromForm: () => ({}), perfilConsumoGD1: () => false,
      lerEnergiaDocumento: () => ({}), toast: message => messages.push(message),
      renderPreview: () => assert.fail('Não deve criar uma prévia para total inválido'),
    });
    vm.runInContext(html.slice(html.indexOf('function onCalcular(){'), html.indexOf('/* Grandezas físicas do documento.')), e);
    e.onCalcular();
    assert.equal(e.state.lastDraft, null);
    assert.equal(messages.length, 1);
    assert.match(messages[0], overflow ? /limite numérico/ : /valor final válido/);
  }
});

test('modelos padrão salvos no banco (chaves reordenadas) não contam como desatualizados', () => {
  const e = engine();
  const jsonb = v => Array.isArray(v) ? v.map(jsonb) : (v && typeof v === 'object')
    ? Object.fromEntries(Object.keys(v).sort((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)).map(k => [k, jsonb(v[k])])) : v;
  for (const preset of e.presetsPadrao()) {
    const salvo = jsonb(JSON.parse(JSON.stringify(preset)));
    const novo = JSON.parse(JSON.stringify(Object.assign({}, e.presetsPadrao().find(p => p.nome === preset.nome), { id: preset.id })));
    assert.notEqual(JSON.stringify(salvo), JSON.stringify(novo), 'a ordem das chaves deve diferir no teste');
    assert.equal(e.assinaturaDados(salvo), e.assinaturaDados(novo), preset.nome);
    const alterado = JSON.parse(JSON.stringify(salvo)); alterado.descricao += ' (alterado)';
    assert.notEqual(e.assinaturaDados(alterado), e.assinaturaDados(novo), 'mudança real continua detectada');
  }
});
