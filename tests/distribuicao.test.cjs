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
 assert.deepEqual(f.scee,{geradoras:[{uc:'9.990.000.012-99',geracaoCiclo:2000,excedenteRecebido:600}],cicloGeracao:'08/2026',ucGeradora:'9.990.000.012-99',geracaoCiclo:2000,excedenteRecebido:600,creditoRecebido:700,saldo:1234.56,saldoExpira30:0,saldoExpira60:null});
 assert.deepEqual(f.rateioCadastrado,[{uc:'9.990.000.012-99',percentual:30}]);assert.deepEqual(f.avisos,[]);});

test('fatura da geradora: geração medida e sem média de consumo',()=>{const f=E.parseInvoice(fatura({fases:'TRIFÁSICO',extra:'99999999-9 ENERGIA GERAÇÃO - KWH ÚNICO 5000 8000 1,000000 3000'}));
 assert.equal(f.ehGeradora,true);assert.equal(f.geracaoMedida,3000);assert.equal(f.consumoMedio,null);assert.equal(f.minimo,100);});

test('não compensado acima do mínimo gera aviso; campo ausente fica vazio (não zero)',()=>{const f=E.parseInvoice(fatura({nc:'250,00'}));assert.match(f.avisos.join(' '),/geração não cobriu/);
 const g=E.parseInvoice('texto qualquer sem fatura');assert.equal(g.uc,null);assert.equal(g.consumoMedio,null);assert.equal(g.naoCompensado,null);assert.ok(g.avisos.length>=2);});

test('UC compara formatos diferentes',()=>{assert.equal(E.ucKey('9.876.543.012-10'),E.ucKey('000987654301210'));assert.equal(E.ucFormat('000987654301210'),'9.876.543.012-10');});

test('porcentagens inteiras sempre fecham o total',()=>{for(const p of [[1,1,1],[1,1,1,1],[7.1,34.8,19.7,17.8,20.5],[0.2,0.2,99.6],[5]]){const r=E.inteiros(p,100);assert.equal(r.reduce((a,b)=>a+b,0),100);assert.ok(r.every(Number.isInteger));}
 assert.deepEqual(E.inteiros([1,1,1,1],100),[25,25,25,25]);});

function cenario(){const d=E.fresh(),u=E.usina('Usina A');Object.assign(u,{kwp:10,fator:100});d.usinas.push(u);
 for(const [n,c] of [['U1',300],['U2',300],['U3',300],['U4',100]]){const x=E.unidade(n);Object.assign(x,{consumoMedio:c,minimo:0,saldo:0,usinas:[u.id]});d.unidades.push(x);}return d;}

test('uma usina: proporcional ao consumo, inteiros, 100%',()=>{const d=cenario(),r=E.calcular(d),f=Object.values(r.usinas[0].final);assert.deepEqual(f,[30,30,30,10]);assert.equal(r.usinas[0].soma,100);assert.equal(r.ok,true);});

test('ajuste manual precisa fechar 100%',()=>{const d=cenario(),[u1,u2]=d.unidades;d.usinas[0].ajustes={[u1.id]:5};let r=E.calcular(d);assert.equal(r.ok,false);assert.equal(r.usinas[0].soma,105);
 d.usinas[0].ajustes={[u1.id]:5,[u2.id]:-5};r=E.calcular(d);assert.equal(r.ok,true);assert.equal(r.usinas[0].final[u1.id],35);assert.equal(r.usinas[0].final[u2.id],25);});

test('reserva da geradora: padrão 0%, opcional',()=>{const d=cenario();assert.equal(E.calcular(d).usinas[0].alvo,100);d.usinas[0].reservaGeradora=10;const r=E.calcular(d);assert.equal(r.usinas[0].alvo,90);assert.equal(r.usinas[0].soma,90);assert.equal(r.ok,true);});

test('várias usinas: a que atende só uma unidade entrega 100% a ela e a outra cobre o resto (caso Silas)',()=>{const d=E.fresh(),a=E.usina('A'),b=E.usina('B');Object.assign(a,{kwp:10,fator:100});Object.assign(b,{kwp:10,fator:100});d.usinas.push(a,b);
 const mk=(n,c,us)=>{const x=E.unidade(n);Object.assign(x,{consumoMedio:c,minimo:30,saldo:0,usinas:us});d.unidades.push(x);return x;};
 const x1=mk('X1',300,[a.id]),x2=mk('X2',300,[a.id]),big=mk('Grande',2000,[a.id,b.id]);
 let r=E.calcular(d),ra=r.usinas[0].final,rb=r.usinas[1].final;assert.equal(r.usinas[0].usinaId,a.id);
 assert.equal(rb[big.id],100);assert.ok(ra[big.id]>0);assert.equal(ra[x1.id],ra[x2.id]);assert.equal(ra[x1.id]+ra[x2.id]+ra[big.id],100);
 d.usinas.reverse();r=E.calcular(d);const rb2=r.usinas.find(u=>u.usinaId===b.id).final,ra2=r.usinas.find(u=>u.usinaId===a.id).final;assert.equal(rb2[big.id],100);assert.equal(ra2[big.id],ra[big.id]);});

test('geradora que consome na hora: só a sobra entra no rateio (produção − injeção + consumo da rede acima do mínimo)',()=>{const u=E.usina('G1');Object.assign(u,{geracaoMeses:[1200],injecao3:634.33,consumoGeradora:345.67,minimoGeradora:30});
 const en=E.energiaUsina(u);assert.equal(Math.round(en.autoconsumo),566);assert.equal(Math.round(en.rede),316);assert.equal(Math.round(en.liquida),319);
 u.injecao3=null;u.injecaoFatura=null;assert.equal(Math.round(E.energiaUsina(u).liquida),884);});

test('alerta quando as usinas não atendem o consumo total',()=>{const d=cenario();d.unidades[0].consumoMedio=2000;const r=E.calcular(d);assert.ok(r.deficit>0);assert.match(r.alertas.map(a=>a.texto).join(' '),/não atendem/);});

test('geração: média dos últimos 3 meses (ou dos meses existentes); sem meses usa potência × fator',()=>{const d=cenario(),u=d.usinas[0];
 assert.equal(E.fonteGeracao(u),'media3');assert.equal(E.energiaUsina(u).bruta,1000);assert.equal(E.energiaUsina(u).fonte,'estimada');
 u.geracaoMeses=[1200,null,null];assert.equal(E.energiaUsina(u).bruta,1200);assert.equal(E.energiaUsina(u).meses,1);
 u.geracaoMeses=[1200,1100,1300];assert.equal(E.energiaUsina(u).bruta,1200);assert.equal(E.energiaUsina(u).meses,3);assert.equal(E.energiaUsina(u).origem,'real');
 u.fonteGeracao='estimada';assert.equal(E.energiaUsina(u).bruta,1000);
 u.fonteGeracao='fatura';u.injecaoFatura=639;assert.equal(E.energiaUsina(u).bruta,639);u.injecao3=634.33;u.meses3=3;assert.equal(E.energiaUsina(u).bruta,634.33);
 const antigo=E.usina('Antiga');delete antigo.geracaoMeses;Object.assign(antigo,{kwp:10,fonteGeracao:'solaredge',geracaoReal:900});assert.equal(E.energiaUsina(antigo).bruta,900);
 const velho=E.usina('Velha');delete velho.fonteGeracao;delete velho.geracaoMeses;Object.assign(velho,{kwp:10,usarGeracaoReal:true,geracaoReal:800});assert.equal(E.energiaUsina(velho).bruta,800);});

test('fatura da geradora: meses de consumo da rede e injeção, média dos últimos 3',()=>{const f=E.parseInvoice(fatura({extra:'99999999-9 ENERGIA GERAÇÃO - KWH ÚNICO 5000 5639 1,000000 639'}).replace('MÊS/ANO CONSUMO FATURADO(kWh) DIAS FATURAMENTO\n700,00 30 LIDA\n600,00 31 MÉDIA\n800,00 30 LIDA','MÊS/ANO CONSUMO FATURADO(kWh) DIAS FATURAMENTO\n329,92\n669,92\n400,00\n639,00 31 LIDA\n303,00\n697,00 29 LIDA\n334,00 31 LIDA\n567,00\n365,00\n571,00 31 LIDA\nTOTAL 10,00'));
 assert.equal(f.ehGeradora,true);assert.equal(f.historicoGeradora.length,4);assert.deepEqual(f.historicoGeradora[2],{consumo:334,injecao:567});assert.equal(f.injecao3,634.33);assert.equal(f.consumoRede3,345.67);assert.equal(f.meses3,3);assert.equal(f.mediaInjecaoImpressa,669.92);});

test('não compensado acima do mínimo da fase sugere ampliação',()=>{const d=cenario(),un=d.unidades[0];un.minimo=50;un.naoCompensado=165;const a=E.calcular(d).alertas.find(x=>x.unidadeId===un.id&&x.ampliacao);
 assert.ok(a);assert.equal(a.ampliacao.kwh,115);assert.equal(a.ampliacao.kwp,1.15);assert.equal(a.ampliacao.placas,2);assert.match(a.texto,/ampliação/);
 un.naoCompensado=50;assert.equal(E.calcular(d).alertas.some(x=>x.unidadeId===un.id&&x.ampliacao),false);});

test('consumo da geradora acima do mínimo sai da geração para rateio',()=>{const d=cenario(),u=d.usinas[0];
 u.consumoGeradora=64;u.minimoGeradora=100;assert.equal(E.energiaUsina(u).liquida,1000);
 u.consumoGeradora=300;assert.equal(E.energiaUsina(u).liquida,800);u.minimoGeradora=null;assert.equal(E.energiaUsina(u).liquida,700);});

test('o mínimo da unidade nunca é compensado: mínimo 100 e consumo 200 → precisa de 100; o rateio segue essa necessidade',()=>{const un=E.unidade('X');Object.assign(un,{consumoMedio:200,minimo:100});assert.equal(E.necessidade(un),100);
 un.consumoMedio=80;assert.equal(E.necessidade(un),0);un.consumoMedio=null;assert.equal(E.necessidade(un),0);
 const d=cenario();d.unidades.forEach(x=>x.minimo=100);const r=E.calcular(d),f=Object.values(r.usinas[0].final);assert.deepEqual([...f].sort((a,b)=>a-b),[0,33,33,34]);assert.equal(f[3],0);assert.equal(Math.round(r.totalConsumo),600);});

test('fator editável muda a geração e a sugestão de ampliação',()=>{const d=cenario(),u=d.usinas[0];u.fator=130;assert.equal(E.energiaUsina(u).bruta,1300);
 const un=d.unidades[0];un.minimo=30;un.naoCompensado=160;const a=E.calcular(d).alertas.find(x=>x.ampliacao);assert.equal(a.ampliacao.kwp,1);});

test('modo homogêneo (padrão) × prioritário quando falta energia',()=>{const d=cenario();const [a,b,c,e]=d.unidades;a.consumoMedio=1000;a.prioritaria=true;
 assert.equal(E.modo(d),'homogenea');let r=E.calcular(d),f=r.usinas[0].final;assert.equal(f[a.id],59);assert.equal(r.usinas[0].soma,100);
 d.modo='prioritaria';r=E.calcular(d);f=r.usinas[0].final;assert.equal(f[a.id],100);assert.equal(f[b.id],0);assert.equal(r.usinas[0].soma,100);
 a.consumoMedio=600;r=E.calcular(d);f=r.usinas[0].final;assert.equal(f[a.id],60);assert.equal(f[b.id]+f[c.id]+f[e.id],40);assert.equal(f[b.id],f[c.id]);assert.ok(f[e.id]<f[b.id]);});

test('placa opcional: vazio mostra só kWp; outra potência muda a quantidade',()=>{const d=cenario(),u=d.usinas[0],un=d.unidades[0];un.minimo=30;un.naoCompensado=130;
 let a=E.calcular(d).alertas.find(x=>x.ampliacao);assert.equal(a.ampliacao.placaW,620);assert.equal(a.ampliacao.placas,2);
 u.placaW=550;a=E.calcular(d).alertas.find(x=>x.ampliacao);assert.equal(a.ampliacao.placas,2);u.placaW=null;a=E.calcular(d).alertas.find(x=>x.ampliacao);assert.equal(a.ampliacao.placas,null);assert.doesNotMatch(a.texto,/placas/);
 delete u.placaW;assert.equal(E.placaUsina(u),620);});

test('fatura com UC ao lado do CEP, rateio quebrado em duas linhas e duas geradoras no SCEE',()=>{const f=E.parseInvoice(`Tipo de fornecimento: MONOFÁSICO
04/08/2026 02/09/2026 29 02/10/2026
FULANO DE TESTE
CNPJ/CPF: 000.000.001-91
CEP: 74000000 GOIANIA GO BRASIL 999.888.012-77
PERDAS DE TRANSFORMAÇÃO / RAMAL: 0%
SET/2026 R$*********100,00 10/10/2026
INFORMAÇÕES DO SCEE: GERAÇÃO CICLO (9/2026) KWH: UC 000999000001299 : 269,00, UC 000888000001288 : 188,00, EXCEDENTE RECEBIDO KWH: UC 000999000001299 : 134,50, UC 000888000001288 : 178,60, CRÉDITO RECEBIDO KWH 313,10, SALDO KWH: 0,00, CADASTRO
RATEIO GERAÇÃO: UC 000888000001288 = 95%
PERÍODO DE REFERÊNCIA DA APURAÇÃO
CONSUMO NÃO COMPENSADO kWh 182,35 1,0 182,35`);
 assert.equal(f.uc,'999.888.012-77');assert.deepEqual(f.rateioCadastrado,[{uc:'8.880.000.012-88',percentual:95}]);
 assert.deepEqual(f.scee.geradoras,[{uc:'9.990.000.012-99',geracaoCiclo:269,excedenteRecebido:134.5},{uc:'8.880.000.012-88',geracaoCiclo:188,excedenteRecebido:178.6}]);});

test('saldo que vence em 30/60 dias gera aviso',()=>{const d=cenario(),un=d.unidades[1];un.saldoExpira30=120;un.saldoExpira60=80;const a=E.calcular(d).alertas.find(x=>x.unidadeId===un.id&&/vencem/.test(x.texto));assert.ok(a);assert.match(a.texto,/200 kWh/);
 un.saldoExpira30=0;un.saldoExpira60=null;assert.equal(E.calcular(d).alertas.some(x=>x.unidadeId===un.id&&/vencem/.test(x.texto)),false);
 const f=E.parseInvoice(fatura());assert.equal(f.scee.saldoExpira30,0);});

test('dois clientes na mesma conta: a falta é avisada por sistema, sem somar os dois',()=>{const d=cenario();d.unidades[0].consumoMedio=2000;
 const b=E.usina('Outro cliente');Object.assign(b,{kwp:10,fator:100});d.usinas.push(b);const x=E.unidade('Casa sobrando');Object.assign(x,{consumoMedio:200,minimo:30,saldo:0,usinas:[b.id]});d.unidades.push(x);
 const r=E.calcular(d);assert.equal(r.sistemas.length,2);const al=r.alertas.filter(a=>/não atendem/.test(a.texto));assert.equal(al.length,1);assert.match(al[0].texto,/^Sistema Usina A:/);assert.match(al[0].texto,/faltam 1\.700 kWh/);
 assert.equal(Math.round(r.deficit),1700);});

test('saldo dura saldo ÷ consumo médio meses (regra do Ivoney); fatura traz classe, endereço, CEP e cidade',()=>{const d=cenario(),un=d.unidades[3];un.saldo=1283;un.consumoMedio=129;const u=E.calcular(d).unidades.find(x=>x.id===un.id);assert.equal(Math.round(u.meses*10)/10,9.9);
 un.saldo=0;assert.equal(E.calcular(d).unidades.find(x=>x.id===un.id).meses,null);
 const f=E.parseInvoice(fatura().replace('CNPJ/CPF: 000.000.001-91','CNPJ/CPF: 000.000.001-91\nRUA 03, Q. 8, L. 1, S/N\nSETOR SANTO ANTONIO\nCEP: 76520000 NOVA CRIXAS GO BRASIL NOTA FISCAL Nº 1'));
 assert.equal(f.classe,'B B1 RESIDENCIAL');assert.equal(f.endereco,'RUA 03, Q. 8, L. 1, S/N');assert.equal(f.bairro,'SETOR SANTO ANTONIO');assert.equal(f.cep,'76520-000');assert.equal(f.cidade,'NOVA CRIXAS');});
