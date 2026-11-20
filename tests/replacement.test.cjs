/* Solar Replacement (subsite em construção): cálculo do ressarcimento e movimentação do estoque de backup. Dados fictícios. */
const test=require('node:test');const assert=require('node:assert/strict');
const G=require('../solar-replacement/engine.js');

function base(){const d=G.fresh();const us=G.usina({idMonitoramento:'TESTE/001',nome:'Usina teste',fator:4.83,tarifa:1.25});d.usinas.push(us);return {d,us};}

test('ressarcimento: exemplo da ideia, 2,0 kW parado 75 dias com 30 de carência = R$ 543,38; uma entrada de 0,5 kW = R$ 135,84',()=>{
 const {d,us}=base();const ch=G.chamado(d,{usinaId:us.id,potenciaAfetadaKw:2.0,datas:{abertura:'2026-01-01',conclusao:'2026-03-17'}});
 const r=G.ressarcimento(ch,d,us);assert.equal(r.parados,75);assert.equal(r.diasIndenizaveis,45);assert.equal(r.valor,543.38);assert.equal(Math.round(r.perdaDia*100)/100,9.66);
 ch.potenciaAfetadaKw=0.5;assert.equal(G.ressarcimento(ch,d,us).valor,135.84);});

test('ressarcimento: dentro da carência é zero; aberto conta até hoje; sem tarifa avisa o que falta',()=>{
 const {d,us}=base();const ch=G.chamado(d,{usinaId:us.id,potenciaAfetadaKw:2,datas:{abertura:'2026-01-01',conclusao:'2026-01-20'}});
 assert.equal(G.ressarcimento(ch,d,us).valor,0);
 const aberto=G.chamado(d,{usinaId:us.id,potenciaAfetadaKw:2,datas:{abertura:G.hojeIso()}});const r=G.ressarcimento(aberto,d,us);assert.equal(r.emAberto,true);assert.equal(r.parados,0);
 const semTarifa=G.chamado(d,{usinaId:us.id,potenciaAfetadaKw:2});const r2=G.ressarcimento(semTarifa,d,G.usina({fator:4.8}));assert.equal(r2.valor,null);assert.ok(r2.faltam.includes('tarifa'));});

test('ressarcimento: padrão conta até a instalação do backup (decisão de 20/11/2026); opção "até a troca final" conta até a troca',()=>{
 const {d,us}=base();const ch=G.chamado(d,{usinaId:us.id,potenciaAfetadaKw:2,datas:{abertura:'2026-01-01',backup:'2026-02-15',conclusao:'2026-03-17'}});
 const r=G.ressarcimento(ch,d,us);assert.equal(d.config.contarAte,'backup');assert.equal(r.parados,45);assert.equal(r.diasIndenizaveis,15);assert.equal(r.ateBackup,true);
 d.config.contarAte='troca';assert.equal(G.ressarcimento(ch,d,us).parados,75);});

test('estoque: instalar backup e concluir a troca devolvem o backup ao estoque e ativam o serial novo na usina',()=>{
 const {d,us}=base();const bk=G.equipamento({serial:'111122223333',backup:true,status:'BACKUP_DISPONIVEL'});d.equipamentos.push(bk);
 const ch=G.chamado(d,{usinaId:us.id,serialDefeito:'999988887777',potenciaAfetadaKw:2});d.chamados.push(ch);
 G.instalarBackup(d,ch.id,bk.id,'2026-02-01');assert.equal(bk.status,'BACKUP_EM_USO');assert.equal(bk.usinaId,us.id);assert.equal(G.etapa(ch),3);
 assert.throws(()=>G.instalarBackup(d,ch.id,bk.id),/não está disponível|já tem/);
 assert.throws(()=>G.concluirTroca(d,ch.id,'123'),/12 a 15/);
 G.concluirTroca(d,ch.id,'555566667777','2026-03-01');assert.equal(bk.status,'BACKUP_DISPONIVEL');assert.equal(bk.usinaId,null);
 const novo=d.equipamentos.find(e=>e.serial==='555566667777');assert.equal(novo.status,'ATIVO');assert.equal(novo.usinaId,us.id);assert.equal(G.etapa(ch),5);
 assert.equal(G.situacaoSerial(d,'999988887777').cor,'cinza');});

test('chamados numerados em sequência e etapa pelo que já aconteceu (backup é opcional)',()=>{
 const {d,us}=base();const a=G.chamado(d,{usinaId:us.id}),b=G.chamado(d,{usinaId:us.id});assert.equal(a.numero,1);assert.equal(b.numero,2);
 assert.equal(G.etapa(a),1);a.casoFabricante='RMA-1';assert.equal(G.etapa(a),2);a.datas.deposito='2026-02-01';assert.equal(G.etapa(a),4);
 assert.equal(G.potenciaPorEntrada({potenciaKw:2,entradas:2}),1);assert.equal(G.potenciaPorEntrada({potenciaKw:1.5,entradas:4}),0.375);});
