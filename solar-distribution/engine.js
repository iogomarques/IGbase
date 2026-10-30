/* Solar Distribution: leitura das faturas Equatorial e cálculo do rateio de créditos entre unidades.
   Funções puras, sem rede nem banco. Também exporta CommonJS para os testes em Node. */
(function(root){'use strict';
const VERSION=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=()=>(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():'id-'+Date.now().toString(36)+Math.random().toString(36).slice(2,10));
const MINIMO_FASES={MONO:30,BI:50,TRI:100};
const MESES=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

/* Número em formato brasileiro (1.234,56). Vazio ou inválido devolve null — nunca vira zero. */
function num(v){if(v===null||v===undefined)return null;if(typeof v==='number')return Number.isFinite(v)?v:null;let s=String(v).trim().replace(/\s/g,'').replace(/^R\$/,'');if(!s)return null;if(!/^-?[\d.,]+$/.test(s))return null;if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');else if(/^-?\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');const n=Number(s);return Number.isFinite(n)?n:null;}
/* UC sem pontuação e sem zeros à esquerda, para comparar "9.876.543.012-10" com "000987654301210". */
function ucKey(v){const d=String(v||'').replace(/\D/g,'').replace(/^0+/,'');return d||'';}
function ucFormat(v){const d=ucKey(v);if(d.length<3)return d;const body=d.slice(0,-2),dv=d.slice(-2);return body.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+'-'+dv;}
function dateIso(br){const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(br||''));return m?m[3]+'-'+m[2]+'-'+m[1]:null;}

/* Agrupa os itens de texto do PDF em linhas (mesma regra no navegador e nos testes). */
function linesFromItems(items){const rows=[];for(const it of items||[]){const str=String(it.str??it.text??'');if(!str.trim())continue;const x=it.transform?it.transform[4]:it.x||0,y=Math.round(it.transform?it.transform[5]:it.y||0);let row=rows.find(r=>Math.abs(r.y-y)<=2);if(!row){row={y,items:[]};rows.push(row);}row.items.push({x,str});}
 return rows.sort((a,b)=>b.y-a.y).map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ')).join('\n');}

/* Lê os campos usados no rateio a partir do texto de uma fatura da Equatorial.
   Campos não encontrados ficam null e geram aviso para revisão. */
function parseInvoice(text){
 const t=String(text||'').replace(/\r/g,''),avisos=[],out={uc:null,titular:null,documento:null,fases:null,minimo:null,leituraAnterior:null,leituraAtual:null,dias:null,proximaLeitura:null,referencia:null,valorFatura:null,consumoMes:null,consumoMedio:null,historico:[],naoCompensado:null,geracaoMedida:null,scee:null,rateioCadastrado:[]};
 let m=/RAMAL:\s*\d+%\s*([\d.]+-\d{2})/.exec(t)||/\n([\d]{1,3}(?:\.\d{3}){2,4}-\d{2})\s*\n/.exec(t);if(m)out.uc=ucFormat(m[1]);
 m=/Tipo de fornecimento:\s*(MONOF|BIF|TRIF)/i.exec(t);if(m){const f=m[1].toUpperCase();out.fases=f.startsWith('MONO')?'MONO':f.startsWith('BI')?'BI':'TRI';out.minimo=MINIMO_FASES[out.fases];}
 m=/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{1,3})\s+(\d{2}\/\d{2}\/\d{4})/.exec(t);if(m){out.leituraAnterior=dateIso(m[1]);out.leituraAtual=dateIso(m[2]);out.dias=Number(m[3]);out.proximaLeitura=dateIso(m[4]);
  const after=t.slice(m.index+m[0].length).split('\n').map(s=>s.trim()).filter(Boolean);if(after[0]&&!/CNPJ|CPF/.test(after[0]))out.titular=after[0];}
 m=/CNPJ\/CPF:\s*([\d.\/-]+)/.exec(t);if(m)out.documento=m[1];
 m=new RegExp('\\b('+MESES.join('|')+')\\/(\\d{4})\\s+R\\$\\**\\s*([\\d.,]+)').exec(t);if(m){out.referencia=m[1]+'/'+m[2];out.valorFatura=num(m[3]);}
 m=/ENERGIA ATIVA\s*-\s*KWH[^\n]*?\s([\d.,]+)\s+([\d.,]+)\s+[\d.,]+\s+([\d.,]+)/i.exec(t);if(m)out.consumoMes=num(m[3]);
 m=/ENERGIA GERA[ÇC][ÃA]O\s*-\s*KWH[^\n]*?\s([\d.,]+)\s+([\d.,]+)\s+[\d.,]+\s+([\d.,]+)/i.exec(t);if(m)out.geracaoMedida=num(m[3]);
 const sc=/INFORMA[ÇC][ÕO]ES DO SCEE:([^\n]*)/i.exec(t);
 if(sc){const s=sc[1],N='(\\d{1,3}(?:\\.\\d{3})*,\\d+|\\d+(?:,\\d+)?)',g=(re)=>{const x=new RegExp(re+N,'i').exec(s);return x?num(x[x.length-1]):null;};const ciclo=new RegExp('GERA[ÇC][ÃA]O CICLO\\s*\\((\\d{1,2})\\/(\\d{4})\\)\\s*KWH:\\s*UC\\s*(\\d+)\\s*:\\s*'+N,'i').exec(s);
  out.scee={cicloGeracao:ciclo?String(ciclo[1]).padStart(2,'0')+'/'+ciclo[2]:null,ucGeradora:ciclo?ucFormat(ciclo[3]):null,geracaoCiclo:ciclo?num(ciclo[4]):null,excedenteRecebido:g('EXCEDENTE RECEBIDO KWH:\\s*(?:UC\\s*\\d+\\s*:\\s*)?'),creditoRecebido:g('CR[ÉE]DITO RECEBIDO KWH\\s*'),saldo:g('SALDO KWH:\\s*'),saldoExpira30:g('SALDO A EXPIRAR EM 30 DIAS KWH:\\s*')};}
 const rc=/CADASTRO RATEIO GERA[ÇC][ÃA]O:([^\n]*)/i.exec(t);if(rc){const re=/UC\s*(\d+)\s*=\s*(\d+(?:[.,]\d+)?)\s*%/gi;let x;while((x=re.exec(rc[1])))out.rateioCadastrado.push({uc:ucFormat(x[1]),percentual:num(x[2])});}
 let nc=0,found=false;for(const x of t.matchAll(/CONSUMO (?:N[ÃA]O COMPENSADO(?: S\/ DESC\.)?|BR C\/ DESC\.[^\n]*?) kWh\s+([\d.,]+)/gi)){const v=num(x[1]);if(v!==null){nc+=v;found=true;}}
 if(!found&&!sc){const x=/\nCONSUMO kWh kWh\s+([\d.,]+)/i.exec(t);if(x){nc=num(x[1]);found=nc!==null;}}
 out.naoCompensado=found?Math.round(nc*100)/100:null;
 for(const x of t.matchAll(/(?:^|\s)([\d.]*\d,\d{2})\s+(\d{2})\s+(LIDA|M[ÉE]DIA|M[ÍI]NIMO)\b/gm))out.historico.push({consumo:num(x[1]),dias:Number(x[2]),tipo:x[3].toUpperCase().replace('É','E').replace('Í','I')});
 out.ehGeradora=out.geracaoMedida!==null;const hist=out.ehGeradora?[]:out.historico.filter(h=>h.tipo!=='MINIMO').map(h=>h.consumo).filter(v=>v!==null);if(hist.length)out.consumoMedio=Math.round(hist.reduce((a,b)=>a+b,0)/hist.length*100)/100;
 if(!out.uc)avisos.push('UC não encontrada. Informe o número da unidade.');
 if(!out.fases)avisos.push('Tipo de fornecimento não encontrado. Confira o mínimo (30, 50 ou 100 kWh).');
 if(out.consumoMedio===null&&!out.ehGeradora)avisos.push('Média de consumo não encontrada. Informe o consumo médio.');
 if(out.naoCompensado!==null&&out.minimo!==null&&out.naoCompensado>out.minimo+0.5)avisos.push('Consumo não compensado de '+fmt(out.naoCompensado)+' kWh, acima do mínimo de '+out.minimo+' kWh: a geração não cobriu todo o consumo neste mês.');
 out.avisos=avisos;return out;}

function fmt(v,d=2){return v===null||v===undefined||!Number.isFinite(v)?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});}
function round2(v){return Math.round(v*100)/100;}

/* ---------- Modelo ---------- */
function fresh(){return {version:VERSION,modo:'homogenea',usinas:[],unidades:[],rateios:[]};}
function usina(nome='Nova usina'){return {id:uid(),nome,uc:'',titular:'',documento:'',kwp:null,fator:115,geracaoReal:null,fonteGeracao:'estimada',injecaoFatura:null,placaW:620,consumoGeradora:null,minimoGeradora:null,reservaGeradora:0,leituraAtual:null,saldo:null,rateioCadastrado:[],ajustes:{},fatura:null};}
function unidade(nome='Nova unidade'){return {id:uid(),nome,uc:'',titular:'',documento:'',fases:'TRI',minimo:100,consumoMedio:null,consumoMes:null,saldo:null,naoCompensado:null,leituraAtual:null,valorFatura:null,prioritaria:false,usinas:[],fatura:null};}
function validate(d){if(!d||typeof d!=='object')throw Error('Dados do Solar Distribution inválidos.');if(d.version!==VERSION)throw Error('Versão de dados do Solar Distribution incompatível.');for(const k of ['usinas','unidades','rateios'])if(!Array.isArray(d[k]))throw Error('Dados do Solar Distribution incompletos.');for(const u of d.usinas)if(typeof u.id!=='string')throw Error('Usina inválida.');for(const u of d.unidades)if(typeof u.id!=='string'||!Array.isArray(u.usinas))throw Error('Unidade inválida.');return d;}

/* Energia de uma usina disponível para as unidades no mês. */
const FONTES={estimada:'estimada (kWp × fator)',apsystems:'APsystems',solaredge:'SolarEdge',outro:'outro monitoramento',fatura:'energia injetada na fatura'};
/* Energia de uma usina para as unidades no mês. Padrão: potência × fator (115). Opcional: geração real
   do monitoramento (APsystems, SolarEdge ou outro) ou a energia injetada lida na fatura da geradora. */
function fonteGeracao(u){if(FONTES[u.fonteGeracao])return u.fonteGeracao;return u.usarGeracaoReal?'outro':'estimada';}
function energiaUsina(u){const fonte=fonteGeracao(u),real=fonte!=='estimada';const bruta=fonte==='fatura'?num(u.injecaoFatura):real?num(u.geracaoReal):(num(u.kwp)!==null?num(u.kwp)*(num(u.fator)??115):null);if(bruta===null)return {bruta:null,consumoGeradora:0,liquida:null,reserva:0,disponivel:null,origem:real?'real':'estimada',fonte};const reserva=Math.max(0,Math.min(100,Math.round(num(u.reservaGeradora)||0))),consumoGeradora=Math.max(0,(num(u.consumoGeradora)||0)-(num(u.minimoGeradora)||0)),liquida=Math.max(0,bruta-consumoGeradora);return {bruta,consumoGeradora,liquida,reserva,disponivel:liquida*(100-reserva)/100,origem:real?'real':'estimada',fonte};}
/* Como na planilha: geração para rateio = geração − consumo do mês da própria geradora (Lei 14.300, art. 1º: excedente = injetada − consumida).
   Só abate o que passa do mínimo da geradora (30/50/100): abaixo dele a concessionária cobra o mínimo e não usa crédito (Lei 14.300, art. 16). */
/* Placas para uma ampliação: só quando a potência da placa (W) do projeto foi informada; vazio = só kWp. */
function placaUsina(u){if(u&&u.placaW===undefined)return 620;const w=num(u&&u.placaW);return w!==null&&w>0?w:null;}
function ampliacaoTexto(kwp,w){return 'cerca de '+fmt(kwp,1)+' kWp'+(w?' ('+Math.ceil(kwp*1000/w)+' placas de '+fmt(w,0)+' W)':'');}
function fatorUsina(u){const f=num(u&&u.fator);return f!==null&&f>0?f:115;}

/* Arredonda para inteiros somando exatamente "total" (maiores restos). */
function inteiros(pesos,total){const soma=pesos.reduce((a,b)=>a+b,0);if(!(soma>0))return pesos.map(()=>0);const raw=pesos.map(p=>p*total/soma),base=raw.map(Math.floor);let falta=total-base.reduce((a,b)=>a+b,0);const ordem=raw.map((r,i)=>[r-base[i],i]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]);for(let k=0;k<falta;k++)base[ordem[k%ordem.length][1]]++;return base;}

/* Rateio sugerido.
   - Base: consumo médio (consumo total) de cada unidade, como na planilha.
   - Cada usina, na ordem cadastrada, atende primeiro as unidades que só podem receber dela;
     a energia que sobra vai para as unidades que também estão ligadas a usinas seguintes.
   - O que uma usina não cobre passa para a próxima usina ligada à unidade.
   - Se a energia passa da necessidade, a sobra é dividida na mesma proporção (o total fecha 100%).
   - Porcentagens inteiras por usina, somando 100% menos a reserva da geradora.
   - Modo (escolha do usuário): 'homogenea' (padrão, como a planilha) divide tudo na proporção do consumo;
     'prioritaria' atende primeiro, por inteiro, as unidades marcadas como prioritárias e divide o resto entre as demais. */
const MODOS={homogenea:'Homogênea (proporcional ao consumo)',prioritaria:'Prioritária (unidades marcadas primeiro)'};
function modo(d){return d&&d.modo==='prioritaria'?'prioritaria':'homogenea';}
function sugerir(d){
 const usinas=d.usinas,unidades=d.unidades,restante={},resultado=[],alertas=[];
 for(const un of unidades)restante[un.id]=Math.max(0,num(un.consumoMedio)??0);
 usinas.forEach((us,idx)=>{
  const en=energiaUsina(us),ligadas=unidades.filter(un=>un.usinas.includes(us.id));
  const r={usinaId:us.id,energia:en,percentuais:{},creditos:{},semEnergia:en.disponivel===null};
  if(!ligadas.length){resultado.push(r);return;}
  if(en.disponivel===null){alertas.push({tipo:'erro',usinaId:us.id,texto:'Informe a potência (kWp) ou a geração real da usina '+us.nome+'.'});resultado.push(r);return;}
  const ultima=un=>!usinas.slice(idx+1).some(o=>un.usinas.includes(o.id));
  const exclusivas=ligadas.filter(ultima),compartilhadas=ligadas.filter(un=>!ultima(un));
  let energia=en.disponivel;const credito={};ligadas.forEach(un=>credito[un.id]=0);
  const distribuir=(grupo)=>{const need=grupo.reduce((a,un)=>a+restante[un.id],0);if(!(need>0)||!(energia>0))return;const dar=Math.min(energia,need);for(const un of grupo){const parte=dar*restante[un.id]/need;credito[un.id]+=parte;restante[un.id]-=parte;}energia-=dar;};
  if(modo(d)==='prioritaria'){const p=g=>g.filter(un=>un.prioritaria),n=g=>g.filter(un=>!un.prioritaria);distribuir(p(exclusivas));distribuir(p(compartilhadas));distribuir(n(exclusivas));distribuir(n(compartilhadas));}
  else{distribuir(exclusivas);distribuir(compartilhadas);}
  if(energia>1e-9){const pesos=ligadas.map(un=>Math.max(0,num(un.consumoMedio)??0)),tot=pesos.reduce((a,b)=>a+b,0);ligadas.forEach((un,i)=>{credito[un.id]+=tot>0?energia*pesos[i]/tot:energia/ligadas.length;});energia=0;}
  const alvo=100-en.reserva,pesos=ligadas.map(un=>credito[un.id]),ints=inteiros(pesos,alvo);
  ligadas.forEach((un,i)=>{r.percentuais[un.id]=ints[i];});resultado.push(r);});
 return {usinas:resultado,alertas};}

/* Aplica ajustes manuais (pontos percentuais por unidade) e calcula projeções e alertas. */
function calcular(d,sugestao){
 sugestao=sugestao||sugerir(d);const alertas=[...sugestao.alertas],porUnidade={},porUsina=[];
 for(const un of d.unidades)porUnidade[un.id]={credito:0,origens:[]};
 for(const r of sugestao.usinas){const us=d.usinas.find(u=>u.id===r.usinaId);const aj=us.ajustes||{},finais={};let soma=0;
  for(const [id,p] of Object.entries(r.percentuais)){const v=Math.round(p+(num(aj[id])||0));finais[id]=v;soma+=v;}
  const alvo=100-r.energia.reserva,ok=Object.keys(finais).length===0||soma===alvo,negativos=Object.entries(finais).filter(([,v])=>v<0);
  if(Object.keys(finais).length&&!ok)alertas.push({tipo:'erro',usinaId:us.id,texto:us.nome+': os percentuais somam '+soma+'%. Ajuste até fechar '+alvo+'%'+(r.energia.reserva?' (a geradora fica com '+r.energia.reserva+'%)':'')+'.'});
  if(negativos.length)alertas.push({tipo:'erro',usinaId:us.id,texto:us.nome+': há percentual negativo.'});
  for(const [id,v] of Object.entries(finais)){const c=r.energia.disponivel===null?null:(r.energia.liquida*v/100);if(c!==null){porUnidade[id].credito+=c;porUnidade[id].origens.push({usinaId:us.id,percentual:v,credito:c});}}
  porUsina.push({usinaId:us.id,energia:r.energia,sugerido:r.percentuais,final:finais,soma,alvo,ok:ok&&!negativos.length});}
 const unidades=d.unidades.map(un=>{const p=porUnidade[un.id],consumo=num(un.consumoMedio),minimo=num(un.minimo)??100,saldo=num(un.saldo)??0;
  const uso=consumo===null?null:Math.max(0,consumo-minimo),projetado=uso===null?null:saldo+p.credito-uso,cobertura=consumo?p.credito/consumo:null,meses=uso&&projetado>0?projetado/uso:null;
  if(!un.usinas.length)alertas.push({tipo:'aviso',unidadeId:un.id,texto:un.nome+' não está ligada a nenhuma usina.'});
  else if(uso!==null&&projetado<0)alertas.push({tipo:'aviso',unidadeId:un.id,texto:un.nome+': faltam cerca de '+fmt(-projetado,0)+' kWh no mês, mesmo usando o saldo. Ligue mais uma usina ou aumente a porcentagem.'});
  if(num(un.naoCompensado)!==null&&num(un.naoCompensado)>minimo+0.5){const us0=d.usinas.find(u=>u.id===un.usinas[0]),falta=num(un.naoCompensado)-minimo,kwp=falta/fatorUsina(us0),w=placaUsina(us0);alertas.push({tipo:'aviso',unidadeId:un.id,ampliacao:{kwh:falta,kwp,placaW:w,placas:w?Math.ceil(kwp*1000/w):null},texto:un.nome+': o não compensado da última fatura ('+fmt(num(un.naoCompensado),0)+' kWh) passou do mínimo de '+fmt(minimo,0)+' kWh. A geração não cobriu '+fmt(falta,0)+' kWh do consumo. Sugestão de ampliação: '+ampliacaoTexto(kwp,w)+', ou aumentar a porcentagem desta unidade.'});}
  for(const o of p.origens){const us=d.usinas.find(u=>u.id===o.usinaId);if(us&&us.documento&&un.documento&&ucKey(us.documento)!==ucKey(un.documento))alertas.push({tipo:'aviso',unidadeId:un.id,texto:un.nome+': CPF/CNPJ diferente do titular da usina '+us.nome+'. No autoconsumo remoto a titularidade precisa ser a mesma.'});
   if(us&&us.leituraAtual&&un.leituraAtual){const du=Number(un.leituraAtual.slice(8,10)),dg=Number(us.leituraAtual.slice(8,10));if(du<=dg)alertas.push({tipo:'info',unidadeId:un.id,texto:un.nome+' é lida antes ou no mesmo dia da usina '+us.nome+' (dia '+du+' × dia '+dg+'): o crédito entra na fatura seguinte.'});}}
  return {id:un.id,credito:p.credito,origens:p.origens,consumo,uso,saldo,projetado,cobertura,meses};});
 const totalConsumo=d.unidades.reduce((a,u)=>a+(num(u.consumoMedio)||0),0),totalEnergia=sugestao.usinas.reduce((a,r)=>a+(r.energia.disponivel||0),0);
 const deficit=totalConsumo-totalEnergia,fatores=d.usinas.map(fatorUsina),fatorMedio=fatores.length?fatores.reduce((a,b)=>a+b,0)/fatores.length:115,placas=[...new Set(d.usinas.map(placaUsina))],placaComum=placas.length===1?placas[0]:null;
 if(d.unidades.length&&d.usinas.length&&deficit>0.5)alertas.push({tipo:'aviso',texto:'As usinas não atendem o consumo total: faltam '+fmt(deficit,0)+' kWh/mês, '+ampliacaoTexto(deficit/fatorMedio,placaComum)+'.'});
 const ok=porUsina.every(u=>u.ok)&&!alertas.some(a=>a.tipo==='erro');
 return {usinas:porUsina,unidades,alertas,totalConsumo,totalEnergia,deficit,ok};}

const api={VERSION,MINIMO_FASES,FONTES,MODOS,modo,placaUsina,fonteGeracao,fatorUsina,num,ucKey,ucFormat,linesFromItems,parseInvoice,fresh,usina,unidade,validate,energiaUsina,inteiros,sugerir,calcular,fmt,round2,clone,uid};
root.SolarDistribution=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
