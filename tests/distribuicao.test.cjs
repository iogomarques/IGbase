/* Solar Distribution: leitura de fatura e cálculo do rateio. Dados 100% fictícios (repositório público). */
const test=require('node:test');const assert=require('node:assert/strict');
const E=require('../solar-distribution/engine.js');

const fatura=(o={})=>`Classificação: B B1 RESIDENCIAL
Tipo de fornecimento: ${o.fases||'MONOFÁSICO'}
${o.leitura||'01/08/2026 31/08/2026 30 30/09/2026'}
FULANO DE TESTE
CNPJ/CPF: 000.000.001-91
PERDAS DE TRANSFORMAÇÃO / RAMAL: 0% ${o.uc||'9.999.001.012-11'}
SET/2026 R$*********${o.valor||'50,00'} 15/10/2026
${o.scee===false?'':'INFORMAÇÕES DO SCEE: GERAÇÃO CICLO (8/2026) KWH: UC 000999000001299 : 2.000,00, EXCEDENTE RECEBIDO KWH: UC 000999000001299 : 600,00, CRÉDITO RECEBIDO KWH 700,00, SALDO KWH: 1.234,56, SALDO A EXPIRAR EM 30 DIAS KWH: 0,00,'}
${o.rateio||'CADASTRO RATEIO GERAÇÃO: UC 000999000001299 = 30%'}
CONSUMO NÃO COMPENSADO kWh ${o.nc||'30,00'} 1,000000 30,00
MÊS/ANO CONSUMO FATURADO(kWh) DIAS FATURAMENTO
700,00 30 LIDA
600,00 31 MÉDIA
800,00 30 LIDA
99999999-9 ENERGIA ATIVA - KWH ÚNICO 1000 1700 1,000000 700
${o.extra||''}`;

test('fatura de unidade: campos usados no rateio',()=>{const f=E.parseInvoice(fatura());
 assert.equal(f.uc,'9.999.001.012-11');assert.equal(f.fases,'MONO');assert.equal(f.minimo,30);assert.equal(f.leituraAtual,'2026-08-31');assert.equal(f.referencia,'SET/2026');assert.equal(f.valorFatura,50);
 assert.equal(f.consumoMes,700);assert.equal(f.consumoMedio,700);assert.equal(f.naoCompensado,30);assert.equal(f.ehGeradora,false);
 assert.deepEqual(f.scee,{cicloGeracao:'08/2026',ucGeradora:'9.990.000.012-99',geracaoCiclo:2000,excedenteRecebido:600,creditoRecebido:700,saldo:1234.56,saldoExpira30:0});
 assert.deepEqual(f.rateioCadastrado,[{uc:'9.990.000.012-99',percentual:30}]);assert.deepEqual(f.avisos,[]);});

test('fatura da geradora: geração medida e sem média de consumo',()=>{const f=E.parseInvoice(fatura({fases:'TRIFÁSICO',extra:'99999999-9 ENERGIA GERAÇÃO - KWH ÚNICO 5000 8000 1,000000 3000'}));
 assert.equal(f.ehGeradora,true);assert.equal(f.geracaoMedida,3000);assert.equal(f.consumoMedio,null);assert.equal(f.minimo,100);});

test('não compensado acima do mínimo gera aviso; campo ausente fica vazio (não zero)',()=>{const f=E.parseInvoice(fatura({nc:'250,00'}));assert.match(f.avisos.join(' '),/geração não cobriu/);
 const g=E.parseInvoice('texto qualquer sem fatura');assert.equal(g.uc,null);assert.equal(g.consumoMedio,null);assert.equal(g.naoCompensado,null);assert.ok(g.avisos.length>=2);});

test('UC compara formatos diferentes',()=>{assert.equal(E.ucKey('9.876.543.012-10'),E.ucKey('000987654301210'));assert.equal(E.ucFormat('000987654301210'),'9.876.543.012-10');});

test('porcentagens inteiras sempre fecham o total',()=>{for(const p of [[1,1,1],[1,1,1,1],[7.1,34.8,19.7,17.8,20.5],[0.2,0.2,99.6],[5]]){const r=E.inteiros(p,100);assert.equal(r.reduce((a,b)=>a+b,0),100);assert.ok(r.every(Number.isInteger));}
 assert.deepEqual(E.inteiros([1,1,1,1],100),[25,25,25,25]);});

function cenario(){const d=E.fresh(),u=E.usina('Usina A');Object.assign(u,{kwp:10,fator:100});d.usinas.push(u);
 for(const [n,c] of [['U1',300],['U2',300],['U3',300],['U4',100]]){const x=E.unidade(n);Object.assign(x,{consumoMedio:c,minimo:30,saldo:0,usinas:[u.id]});d.unidades.push(x);}return d;}

test('uma usina: proporcional ao consumo, inteiros, 100%',()=>{const d=cenario(),r=E.calcular(d),f=Object.values(r.usinas[0].final);assert.deepEqual(f,[30,30,30,10]);assert.equal(r.usinas[0].soma,100);assert.equal(r.ok,true);});

test('ajuste manual precisa fechar 100%',()=>{const d=cenario(),[u1,u2]=d.unidades;d.usinas[0].ajustes={[u1.id]:5};let r=E.calcular(d);assert.equal(r.ok,false);assert.equal(r.usinas[0].soma,105);
 d.usinas[0].ajustes={[u1.id]:5,[u2.id]:-5};r=E.calcular(d);assert.equal(r.ok,true);assert.equal(r.usinas[0].final[u1.id],35);assert.equal(r.usinas[0].final[u2.id],25);});

test('reserva da geradora: padrão 0%, opcional',()=>{const d=cenario();assert.equal(E.calcular(d).usinas[0].alvo,100);d.usinas[0].reservaGeradora=10;const r=E.calcular(d);assert.equal(r.usinas[0].alvo,90);assert.equal(r.usinas[0].soma,90);assert.equal(r.ok,true);});

test('várias usinas: o que uma não cobre passa para a próxima',()=>{const d=E.fresh(),a=E.usina('A'),b=E.usina('B');Object.assign(a,{kwp:10,fator:100});Object.assign(b,{kwp:10,fator:100});d.usinas.push(a,b);
 const mk=(n,c,us)=>{const x=E.unidade(n);Object.assign(x,{consumoMedio:c,minimo:30,saldo:0,usinas:us});d.unidades.push(x);return x;};
 const x1=mk('X1',300,[a.id]),x2=mk('X2',300,[a.id]),big=mk('Grande',1200,[a.id,b.id]);
 const r=E.calcular(d),ra=r.usinas[0].final,rb=r.usinas[1].final;
 assert.equal(ra[x1.id],30);assert.equal(ra[x2.id],30);assert.equal(ra[big.id],40);assert.equal(rb[big.id],100);
 const g=r.unidades.find(u=>u.id===big.id);assert.equal(Math.round(g.credito),1400);});

test('alerta quando as usinas não atendem o consumo total',()=>{const d=cenario();d.unidades[0].consumoMedio=2000;const r=E.calcular(d);assert.ok(r.deficit>0);assert.match(r.alertas.map(a=>a.texto).join(' '),/não atendem/);});

test('fonte da geração: estimada por padrão; monitoramento ou fatura quando escolhidos',()=>{const d=cenario(),u=d.usinas[0];u.geracaoReal=1500;u.injecaoFatura=1200;assert.equal(E.energiaUsina(u).bruta,1000);assert.equal(E.energiaUsina(u).fonte,'estimada');
 for(const f of ['apsystems','solaredge','outro']){u.fonteGeracao=f;assert.equal(E.energiaUsina(u).bruta,1500);assert.equal(E.energiaUsina(u).origem,'real');}
 u.fonteGeracao='fatura';assert.equal(E.energiaUsina(u).bruta,1200);
 const antigo=E.usina('Antiga');delete antigo.fonteGeracao;Object.assign(antigo,{kwp:10,usarGeracaoReal:true,geracaoReal:900});assert.equal(E.energiaUsina(antigo).bruta,900);});

test('não compensado acima do mínimo da fase sugere ampliação',()=>{const d=cenario(),un=d.unidades[0];un.minimo=50;un.naoCompensado=165;const a=E.calcular(d).alertas.find(x=>x.unidadeId===un.id&&x.ampliacao);
 assert.ok(a);assert.equal(a.ampliacao.kwh,115);assert.equal(a.ampliacao.kwp,1.15);assert.equal(a.ampliacao.placas,2);assert.match(a.texto,/ampliação/);
 un.naoCompensado=50;assert.equal(E.calcular(d).alertas.some(x=>x.unidadeId===un.id&&x.ampliacao),false);});

test('consumo da geradora acima do mínimo sai da geração para rateio (planilha: geração − consumo da geradora)',()=>{const d=cenario(),u=d.usinas[0];
 u.consumoGeradora=64;u.minimoGeradora=100;assert.equal(E.energiaUsina(u).liquida,1000);
 u.consumoGeradora=300;assert.equal(E.energiaUsina(u).liquida,800);const r=E.calcular(d);assert.equal(Math.round(r.unidades[0].credito),240);
 u.minimoGeradora=null;assert.equal(E.energiaUsina(u).liquida,700);});

test('fator editável muda a geração e a sugestão de ampliação',()=>{const d=cenario(),u=d.usinas[0];u.fator=130;assert.equal(E.energiaUsina(u).bruta,1300);
 const un=d.unidades[0];un.naoCompensado=160;const a=E.calcular(d).alertas.find(x=>x.ampliacao);assert.equal(a.ampliacao.kwp,1);});
