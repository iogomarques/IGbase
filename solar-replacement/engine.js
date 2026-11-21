/* Solar Replacement: motor puro, sem tela. Usinas, catálogo de modelos, equipamentos (estoque de backup),
   chamados de garantia com as cinco etapas e o ressarcimento da energia perdida.
   Base da ideia do sócio (20/11/2026), adaptada ao IG Base: dados na conta do usuário, área "solarReplacement". */
(function(root){'use strict';
const VERSION=1;
const uid=()=>globalThis.crypto?.randomUUID?.()||'g-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const clone=x=>JSON.parse(JSON.stringify(x));
const num=v=>{if(v===null||v===undefined||v==='')return null;if(typeof v==='number')return Number.isFinite(v)?v:null;const s=String(v).trim().replace(/\s/g,'');if(!s)return null;const n=Number(/,/.test(s)?s.replace(/\./g,'').replace(',','.'):s);return Number.isFinite(n)?n:null;};
const round2=v=>Math.round((v+Number.EPSILON)*100)/100;
const hojeIso=()=>new Date().toISOString().slice(0,10);
/* Diferença em dias corridos entre duas datas AAAA-MM-DD (fuso não interfere: compara meio-dia UTC). */
function dias(a,b){if(!a||!b)return null;const x=Date.parse(a+'T12:00:00Z'),y=Date.parse(b+'T12:00:00Z');if(!Number.isFinite(x)||!Number.isFinite(y))return null;return Math.round((y-x)/86400000);}
const fmt=(v,d=0)=>v===null||v===undefined||!Number.isFinite(v)?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const soSerial=s=>String(s||'').replace(/\D/g,'');

const TIPOS={MICROINVERSOR:'Microinversor',PLACA:'Placa',OTIMIZADOR:'Otimizador'};
const STATUS={ATIVO:'Ativo na usina',EM_GARANTIA:'Em garantia',AGUARDANDO_RMA:'Aguardando envio (RMA)',BACKUP_DISPONIVEL:'Backup disponível',BACKUP_EM_USO:'Backup em uso',SUCATA:'Sucata / retirado'};
const ETAPAS=[[1,'Visita e testes'],[2,'Aguardando o fabricante'],[3,'Backup instalado'],[4,'Peça no depósito'],[5,'Troca concluída']];
/* Legenda fixa do checklist de campo (texto da ideia original). */
const TESTES=[['t01','Verificação de tensão CC/CA e conectores MC4'],['t02','Teste de isolamento, continuidade e aterramento'],['t03','Inversão de porta/canal ou módulo para isolar a falha'],['t04','Reinício da comunicação (ECU/DTU) e leitura dos LEDs de erro']];
/* Catálogo inicial: os dois modelos citados na ideia. Potência e entradas editáveis; o usuário cadastra os demais. */
const MODELOS_INICIAIS=[{marca:'APsystems',modelo:'DS3-D',tipo:'MICROINVERSOR',potenciaKw:2.0,entradas:2},{marca:'APsystems',modelo:'QS1-A',tipo:'MICROINVERSOR',potenciaKw:1.5,entradas:4}];

function fresh(){return {version:VERSION,config:{carenciaDias:30,contarAte:'backup',fatorPadrao:4.8},usinas:[],modelos:MODELOS_INICIAIS.map(m=>Object.assign({id:uid()},m)),equipamentos:[],chamados:[],proximoNumero:1};}
function usina(o={}){return Object.assign({id:uid(),idMonitoramento:'',nome:'',cliente:'',marca:'',kwp:null,fator:null,tarifa:null,observacoes:''},o);}
function modelo(o={}){return Object.assign({id:uid(),marca:'',modelo:'',tipo:'MICROINVERSOR',potenciaKw:null,entradas:1},o);}
function equipamento(o={}){return Object.assign({id:uid(),serial:'',tipo:'MICROINVERSOR',marca:'',modelo:'',potenciaKw:null,backup:false,status:'ATIVO',usinaId:null,chamadoId:null},o);}
function chamado(d,o={}){const n=d.proximoNumero||1;d.proximoNumero=n+1;return Object.assign({id:uid(),numero:n,usinaId:null,serialDefeito:'',modeloId:null,marca:'',modelo:'',tipo:'MICROINVERSOR',potenciaKw:null,potenciaAfetadaKw:null,
 testes:{t01:false,t02:false,t03:false,t04:false},perdaGeracao:false,fabricante:'',casoFabricante:'',fotos:[],observacoes:'',
 serialBackup:'',backupId:null,serialNovo:'',destino:'GARANTIA',fator:null,tarifa:null,carenciaDias:null,
 datas:{abertura:hojeIso(),caso:null,backup:null,deposito:null,conclusao:null}},o);}

function validate(d){if(!d||typeof d!=='object')throw Error('Dados do Solar Replacement inválidos.');for(const k of ['usinas','modelos','equipamentos','chamados'])if(!Array.isArray(d[k]))throw Error('Dados do Solar Replacement incompletos ('+k+').');d.config=Object.assign({carenciaDias:30,contarAte:'backup',fatorPadrao:4.8},d.config||{});for(const c of d.chamados)if(!Array.isArray(c.fotos))c.fotos=[];if(!(d.proximoNumero>0))d.proximoNumero=d.chamados.reduce((m,c)=>Math.max(m,c.numero||0),0)+1;return d;}

/* Etapa atual, pelo que já aconteceu (o backup é opcional: sem perda de geração, pula a etapa 3). */
function etapa(ch){const t=ch.datas||{};if(t.conclusao)return 5;if(t.deposito)return 4;if(t.backup)return 3;if(String(ch.casoFabricante||'').trim()||t.caso)return 2;return 1;}
const etapaNome=n=>(ETAPAS.find(e=>e[0]===n)||[])[1]||'';
const testesFeitos=ch=>TESTES.filter(([k])=>ch.testes&&ch.testes[k]).length;

/* Ressarcimento da energia perdida (fórmula da ideia, centavo por centavo):
   perda por dia = potência afetada (kW) × fator de geração (kWh/kWp/dia)
   dias parados  = do dia da abertura até o fim da perda (instalação do backup ou troca final, conforme a configuração; aberto = hoje)
   dias indenizáveis = dias parados − carência (nunca negativo)
   valor = dias indenizáveis × perda por dia × tarifa, arredondado em centavos. */
function ressarcimento(ch,d,us){const cfg=(d&&d.config)||{},hoje=hojeIso();
 const potencia=num(ch.potenciaAfetadaKw),fator=num(ch.fator)??num(us&&us.fator)??num(cfg.fatorPadrao),tarifa=num(ch.tarifa)??num(us&&us.tarifa),carencia=num(ch.carenciaDias)??num(cfg.carenciaDias)??30;
 const t=ch.datas||{},fimPorBackup=cfg.contarAte==='backup'&&t.backup,fim=fimPorBackup?t.backup:(t.conclusao||null),emAberto=!fim;
 const parados=dias(t.abertura,fim||hoje);const faltam=[];if(potencia===null)faltam.push('potência afetada');if(fator===null)faltam.push('fator de geração');if(tarifa===null)faltam.push('tarifa');if(!t.abertura)faltam.push('data de abertura');
 const perdaDia=potencia!==null&&fator!==null?potencia*fator:null,diasInd=parados===null?null:Math.max(0,parados-carencia);
 const valor=perdaDia!==null&&tarifa!==null&&diasInd!==null?round2(diasInd*perdaDia*tarifa):null;
 return {potencia,fator,tarifa,carencia,parados,diasIndenizaveis:diasInd,perdaDia,valor,fim:fim||null,emAberto,ateBackup:!!fimPorBackup,faltam};}

/* Potência afetada: total do equipamento, uma entrada (potência ÷ entradas) ou personalizada. */
function potenciaPorEntrada(m){const p=num(m&&m.potenciaKw),e=num(m&&m.entradas);return p!==null&&e>0?Math.round(p/e*1000)/1000:null;}

/* Instalar backup: o equipamento reserva passa a "em uso" na usina do chamado. */
function instalarBackup(d,chId,eqId,data){const ch=d.chamados.find(c=>c.id===chId),eq=d.equipamentos.find(e=>e.id===eqId);if(!ch||!eq)throw Error('Chamado ou backup não encontrado.');
 if(eq.status!=='BACKUP_DISPONIVEL')throw Error('Este equipamento não está disponível como backup.');if(ch.backupId)throw Error('Este chamado já tem um backup instalado.');
 eq.status='BACKUP_EM_USO';eq.usinaId=ch.usinaId;eq.chamadoId=ch.id;ch.backupId=eq.id;ch.serialBackup=eq.serial;ch.datas.backup=data||hojeIso();return ch;}
/* Desfazer o backup (instalado por engano): volta ao estoque. */
function retirarBackup(d,chId){const ch=d.chamados.find(c=>c.id===chId);if(!ch||!ch.backupId)return;const eq=d.equipamentos.find(e=>e.id===ch.backupId);if(eq){eq.status='BACKUP_DISPONIVEL';eq.usinaId=null;eq.chamadoId=null;}ch.backupId=null;ch.serialBackup='';ch.datas.backup=null;}
/* Troca final: o serial novo da garantia fica ativo na usina e o backup volta sozinho ao estoque. */
function concluirTroca(d,chId,serialNovo,data){const ch=d.chamados.find(c=>c.id===chId);if(!ch)throw Error('Chamado não encontrado.');const s=soSerial(serialNovo);
 if(s.length<12||s.length>15)throw Error('O serial novo precisa ter de 12 a 15 dígitos.');
 if(ch.backupId){const eq=d.equipamentos.find(e=>e.id===ch.backupId);if(eq){eq.status='BACKUP_DISPONIVEL';eq.usinaId=null;eq.chamadoId=null;}}
 let novo=d.equipamentos.find(e=>soSerial(e.serial)===s);if(!novo){novo=equipamento({serial:s,tipo:ch.tipo,marca:ch.marca,modelo:ch.modelo,potenciaKw:num(ch.potenciaKw)});d.equipamentos.push(novo);}
 novo.status='ATIVO';novo.backup=false;novo.usinaId=ch.usinaId;novo.chamadoId=null;
 const velho=d.equipamentos.find(e=>soSerial(e.serial)===soSerial(ch.serialDefeito));if(velho){velho.status=ch.destino==='SUCATA'?'SUCATA':'EM_GARANTIA';velho.usinaId=null;}
 ch.serialNovo=s;ch.datas.conclusao=data||hojeIso();return ch;}
/* Serial com 12 a 15 dígitos (leitores de código de barras e prints do monitoramento). */
const serialValido=s=>{const n=soSerial(s).length;return n>=12&&n<=15;};
/* Situação de um serial lido (base para a conferência de prints): ativo, em garantia, substituído ou backup de outra usina. */
function situacaoSerial(d,serial,usinaId){const s=soSerial(serial);if(!s)return {cor:'cinza',texto:'Serial vazio'};
 const ch=d.chamados.find(c=>soSerial(c.serialDefeito)===s);if(ch&&!ch.datas.conclusao)return {cor:'amarelo',texto:'Em garantia (chamado nº '+ch.numero+')',chamadoId:ch.id};
 if(ch&&ch.datas.conclusao)return {cor:'cinza',texto:'Substituído na troca do chamado nº '+ch.numero,chamadoId:ch.id};
 const eq=d.equipamentos.find(e=>soSerial(e.serial)===s);if(eq&&eq.backup&&eq.usinaId&&usinaId&&eq.usinaId!==usinaId)return {cor:'roxo',texto:'Backup de outra usina'};
 if(eq&&eq.status==='BACKUP_EM_USO')return {cor:'roxo',texto:'Backup em uso'};
 return {cor:'verde',texto:eq?'Ativo (cadastrado)':'Ativo (não cadastrado)'};}

const api={VERSION,TIPOS,STATUS,ETAPAS,TESTES,uid,clone,num,round2,dias,fmt,soSerial,hojeIso,fresh,usina,modelo,equipamento,chamado,validate,etapa,etapaNome,testesFeitos,ressarcimento,potenciaPorEntrada,instalarBackup,retirarBackup,concluirTroca,serialValido,situacaoSerial};
root.SolarReplacement=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
