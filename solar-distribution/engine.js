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
 /* Algumas faturas trazem a UC ao lado do CEP ou do nome da Equatorial: pega a primeira numeração no formato da UC que não seja o CPF/CNPJ. */
 if(!out.uc){const doc=(/CNPJ\/CPF:\s*([\d.\/-]+)/.exec(t)||[])[1];for(const x of t.matchAll(/(^|[^\d.\/:])(\d{1,3}(?:\.\d{3}){2,4}-\d{2})(?![\d])/g)){if(x[2]===doc||/CPF:\s*$/.test(t.slice(Math.max(0,x.index-12),x.index+x[1].length)))continue;out.uc=ucFormat(x[2]);break;}}
 m=/Tipo de fornecimento:\s*(MONOF|BIF|TRIF)/i.exec(t);if(m){const f=m[1].toUpperCase();out.fases=f.startsWith('MONO')?'MONO':f.startsWith('BI')?'BI':'TRI';out.minimo=MINIMO_FASES[out.fases];}
 m=/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{1,3})\s+(\d{2}\/\d{2}\/\d{4})/.exec(t);if(m){out.leituraAnterior=dateIso(m[1]);out.leituraAtual=dateIso(m[2]);out.dias=Number(m[3]);out.proximaLeitura=dateIso(m[4]);
  const after=t.slice(m.index+m[0].length).split('\n').map(s=>s.trim()).filter(Boolean);if(after[0]&&!/CNPJ|CPF/.test(after[0]))out.titular=after[0];}
 m=/CNPJ\/CPF:\s*([\d.\/-]+)/.exec(t);if(m)out.documento=m[1];
 /* Dados do formulário de rateio (modelo da planilha): classe, endereço, bairro, CEP e cidade da UC. */
 m=/Classifica[çc][ãa]o:\s*([^\n]+)/i.exec(t);if(m)out.classe=m[1].trim().replace(/\s*-$/,'');
 {const ls=t.split('\n'),i=ls.findIndex(l=>/CNPJ\/CPF:/.test(l)),j=ls.findIndex((l,k)=>k>i&&/^\s*CEP:/.test(l));if(i>=0&&j>i&&j-i<=6){const end=ls.slice(i+1,j).map(l=>l.replace(/\s*NOTA FISCAL.*$/i,'').trim()).filter(Boolean);if(end.length>=2){out.bairro=end.pop();out.endereco=end.join(' ');}else if(end.length)out.endereco=end[0];}}
 m=/CEP:\s*(\d{5})-?(\d{3})\s+(.+?)\s+([A-Z]{2})\s+BRASIL/.exec(t);if(m){out.cep=m[1]+'-'+m[2];out.cidade=m[3].trim();out.uf=m[4];}
 m=new RegExp('\\b('+MESES.join('|')+')\\/(\\d{4})\\s+R\\$\\**\\s*([\\d.,]+)').exec(t);if(m){out.referencia=m[1]+'/'+m[2];out.valorFatura=num(m[3]);}
 m=/ENERGIA ATIVA\s*-\s*KWH[^\n]*?\s([\d.,]+)\s+([\d.,]+)\s+[\d.,]+\s+([\d.,]+)/i.exec(t);if(m)out.consumoMes=num(m[3]);
 m=/ENERGIA GERA[ÇC][ÃA]O\s*-\s*KWH[^\n]*?\s([\d.,]+)\s+([\d.,]+)\s+[\d.,]+\s+([\d.,]+)/i.exec(t);if(m)out.geracaoMedida=num(m[3]);
 /* O bloco do SCEE e o cadastro do rateio às vezes quebram de linha: lê com as linhas juntas. */
 const flat=t.replace(/\n+/g,' ');const sc=/INFORMA[ÇC][ÕO]ES DO SCEE:(.*?)(?=PER[ÍI]ODO DE REFER|PIS\/PASEP|FORNECIMENTO ICMS|$)/i.exec(flat);
 if(sc){const s=sc[1],N='(\\d{1,3}(?:\\.\\d{3})*,\\d+|\\d+(?:,\\d+)?)',g=(re)=>{const x=new RegExp(re+N,'i').exec(s);return x?num(x[x.length-1]):null;};const ciclo=new RegExp('GERA[ÇC][ÃA]O CICLO\\s*\\((\\d{1,2})\\/(\\d{4})\\)\\s*KWH:\\s*UC\\s*(\\d+)\\s*:\\s*'+N,'i').exec(s);
  const lista=(rot)=>{const x=new RegExp(rot+'\\s*(?:\\(\\d{1,2}\\/\\d{4}\\)\\s*)?KWH:\\s*((?:UC\\s*\\d+\\s*:\\s*[\\d.,]+,?\\s*)+)','i').exec(s);return x?[...x[1].matchAll(/UC\s*(\d+)\s*:\s*(\d{1,3}(?:\.\d{3})*,\d+|\d+(?:,\d+)?)/gi)].map(y=>({uc:ucFormat(y[1]),kwh:num(y[2])})):[];};
  const ger=lista('GERA[ÇC][ÃA]O CICLO'),exc=lista('EXCEDENTE RECEBIDO');
  out.scee={geradoras:ger.map(g=>({uc:g.uc,geracaoCiclo:g.kwh,excedenteRecebido:(exc.find(e=>ucKey(e.uc)===ucKey(g.uc))||{}).kwh??null})),cicloGeracao:ciclo?String(ciclo[1]).padStart(2,'0')+'/'+ciclo[2]:null,ucGeradora:ciclo?ucFormat(ciclo[3]):null,geracaoCiclo:ciclo?num(ciclo[4]):null,excedenteRecebido:g('EXCEDENTE RECEBIDO KWH:\\s*(?:UC\\s*\\d+\\s*:\\s*)?'),creditoRecebido:g('CR[ÉE]DITO RECEBIDO KWH\\s*'),saldo:g('SALDO KWH:\\s*'),saldoExpira30:g('SALDO A EXPIRAR EM 30 DIAS KWH:\\s*'),saldoExpira60:g('SALDO A EXPIRAR EM 60 DIAS KWH:\\s*')};}
 const rc=/CADASTRO\s+RATEIO\s+GERA[ÇC][ÃA]O:(.*?)(?=PER[ÍI]ODO DE REFER|PIS\/PASEP|FORNECIMENTO ICMS|$)/i.exec(flat);if(rc){const re=/UC\s*(\d+)\s*=\s*(\d+(?:[.,]\d+)?)\s*%/gi;let x;while((x=re.exec(rc[1])))out.rateioCadastrado.push({uc:ucFormat(x[1]),percentual:num(x[2])});}
 let nc=0,found=false;for(const x of t.matchAll(/CONSUMO (?:N[ÃA]O COMPENSADO(?: S\/ DESC\.)?|BR C\/ DESC\.[^\n]*?) kWh\s+([\d.,]+)/gi)){const v=num(x[1]);if(v!==null){nc+=v;found=true;}}
 if(!found&&!sc){const x=/\nCONSUMO kWh kWh\s+([\d.,]+)/i.exec(t);if(x){nc=num(x[1]);found=nc!==null;}}
 out.naoCompensado=found?Math.round(nc*100)/100:null;
 for(const x of t.matchAll(/(?:^|\s)([\d.]*\d,\d{2})\s+(\d{2})\s+(LIDA|M[ÉE]DIA|M[ÍI]NIMO)\b/gm))out.historico.push({consumo:num(x[1]),dias:Number(x[2]),tipo:x[3].toUpperCase().replace('É','E').replace('Í','I')});
 out.ehGeradora=out.geracaoMedida!==null;
 /* Geradora: o histórico da Equatorial alterna, mês a mês, consumo da rede e energia injetada ("geração"); as duas
    primeiras linhas são as médias impressas. Guarda os meses (mais recente primeiro) e a média dos últimos 3 meses
    (ou dos meses que existirem), regra do IG Base para a geração. */
 if(out.ehGeradora){const i=t.search(/M[ÊE]S\/ANO\s+CONSUMO FATURADO/i);if(i>=0){const vals=[];for(const ln of t.slice(i).split('\n').slice(1)){if(/^\s*TOTAL\b/i.test(ln))break;const x=/(\d[\d.]*,\d{2})(?:\s+\d{1,2}\s+(?:LIDA|M[ÉE]DIA|M[ÍI]NIMO))?\s*$/i.exec(ln);if(x)vals.push(num(x[1]));}
  if(vals.length>=4){const meses=[];for(let k=2;k+1<vals.length;k+=2)meses.push({consumo:vals[k],injecao:vals[k+1]});out.historicoGeradora=meses.slice(0,13);out.mediaConsumoImpressa=vals[0];out.mediaInjecaoImpressa=vals[1];
   const ult=meses.slice(0,3),med=k=>round2(ult.reduce((a,m)=>a+m[k],0)/ult.length);out.injecao3=med('injecao');out.consumoRede3=med('consumo');out.meses3=ult.length;}}}const hist=out.ehGeradora?[]:out.historico.filter(h=>h.tipo!=='MINIMO').map(h=>h.consumo).filter(v=>v!==null);if(hist.length)out.consumoMedio=Math.round(hist.reduce((a,b)=>a+b,0)/hist.length*100)/100;
 if(!out.uc)avisos.push('UC não encontrada. Informe o número da unidade.');
 if(!out.fases)avisos.push('Tipo de fornecimento não encontrado. Confira o mínimo (30, 50 ou 100 kWh).');
 if(out.consumoMedio===null&&!out.ehGeradora)avisos.push('Média de consumo não encontrada. Informe o consumo médio.');
 if(out.naoCompensado!==null&&out.minimo!==null&&out.naoCompensado>out.minimo+0.5)avisos.push('Consumo não compensado de '+fmt(out.naoCompensado)+' kWh, acima do mínimo de '+out.minimo+' kWh: a geração não cobriu todo o consumo neste mês.');
 out.avisos=avisos;return out;}

function fmt(v,d=2){return v===null||v===undefined||!Number.isFinite(v)?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});}
function round2(v){return Math.round(v*100)/100;}

/* ---------- Modelo ---------- */
function fresh(){return {version:VERSION,modo:'homogenea',considerarSaldo:false,mesesRevisao:3,clientes:[],usinas:[],unidades:[],rateios:[]};}
function usina(nome='Nova usina'){return {id:uid(),nome,uc:'',titular:'',documento:'',kwp:null,fator:115,geracaoReal:null,geracaoMeses:[null,null,null],monitoramento:'APsystems',fonteGeracao:'media3',injecaoFatura:null,injecao3:null,consumoRede3:null,meses3:null,placaW:620,consumoGeradora:null,minimoGeradora:null,reservaGeradora:0,leituraAtual:null,classe:'',endereco:'',bairro:'',cep:'',cidade:'',uf:'',email:'',telefone:'',celular:'',tipoSolicitacao:'alteracao',compensacao:'normal',saldo:null,rateioCadastrado:[],ajustes:{},fatura:null};}
function unidade(nome='Nova unidade'){return {id:uid(),nome,uc:'',titular:'',documento:'',fases:'TRI',minimo:100,consumoMedio:null,consumoMes:null,saldo:null,naoCompensado:null,leituraAtual:null,valorFatura:null,prioritaria:false,usinas:[],fatura:null};}
function validate(d){if(!d||typeof d!=='object')throw Error('Dados do Solar Distribution inválidos.');if(d.version!==VERSION)throw Error('Versão de dados do Solar Distribution incompatível.');for(const k of ['usinas','unidades','rateios'])if(!Array.isArray(d[k]))throw Error('Dados do Solar Distribution incompletos.');if(d.clientes!==undefined&&!Array.isArray(d.clientes))throw Error('Clientes do Solar Distribution inválidos.');for(const u of d.usinas)if(typeof u.id!=='string')throw Error('Usina inválida.');for(const u of d.unidades)if(typeof u.id!=='string'||!Array.isArray(u.usinas))throw Error('Unidade inválida.');return d;}

/* ---------- Clientes ----------
   Cada cliente agrupa as suas usinas e unidades (ex.: Silas = 2 geradoras + 3 unidades). Dados antigos, sem clientes,
   são organizados pelo CPF/CNPJ do titular da usina; o id é derivado do documento ou da usina, então organizar de novo
   (antes de salvar) dá o mesmo resultado. */
function cliente(nome='Novo cliente',documento=''){return {id:uid(),nome,documento:documento||'',email:'',telefone:'',observacoes:''};}
function docKey(v){const k=String(v||'').replace(/\D/g,'');return k.length>=11?k:'';}
function organizarClientes(d){if(!Array.isArray(d.clientes))d.clientes=[];let mudou=false;const existe=id=>!!id&&d.clientes.some(c=>c.id===id);
 const porDoc=doc=>{const k=docKey(doc);return k?d.clientes.find(c=>docKey(c.documento)===k):null;};
 const novo=(nome,documento,id)=>{const c=Object.assign(cliente(String(nome||'Cliente').trim()||'Cliente',documento),{id});d.clientes.push(c);return c;};
 for(const us of d.usinas){if(existe(us.clienteId))continue;const k=docKey(us.documento),c=porDoc(us.documento)||novo(us.titular||us.nome,us.documento,k?'cli-'+k:'cli-u-'+us.id);us.clienteId=c.id;mudou=true;}
 for(const un of d.unidades){if(existe(un.clienteId))continue;const us=d.usinas.find(u=>un.usinas.includes(u.id)),k=docKey(un.documento);const c=us?d.clientes.find(x=>x.id===us.clienteId):(porDoc(un.documento)||novo(un.titular||un.nome,un.documento,k?'cli-'+k:'cli-n-'+un.id));un.clienteId=c.id;mudou=true;}
 return mudou;}
/* Usinas e unidades de um cliente. Uma unidade ligada a uma usina do cliente aparece junto, mesmo se cadastrada em outro. */
function itensCliente(d,id){const usinas=d.usinas.filter(u=>u.clienteId===id),ids=new Set(usinas.map(u=>u.id));return {usinas,unidades:d.unidades.filter(un=>un.clienteId===id||un.usinas.some(x=>ids.has(x)))};}
/* O que falta para fechar o rateio de um cliente, na ordem em que o usuário resolve. Lista vazia = pronto. */
function pendencias(d,c,id){const {usinas,unidades}=itensCliente(d,id),out=[],add=(etapa,texto,ref)=>out.push(Object.assign({etapa,texto},ref||{}));
 if(!usinas.length)add('faturas','Lance a fatura da usina geradora (ou cadastre a usina).');
 if(!unidades.length)add('faturas','Lance as faturas das unidades que recebem os créditos.');
 for(const us of usinas){const r=c.usinas.find(x=>x.usinaId===us.id);if(r&&r.energia.disponivel===null)add('geracao','Informe a geração esperada (kWh/mês) ou a potência (kWp) da usina '+us.nome+'.',{usinaId:us.id});
  if(!unidades.some(un=>un.usinas.includes(us.id)))add('ligacoes','Marque as unidades que recebem da usina '+us.nome+'.',{usinaId:us.id});}
 for(const un of unidades){if(!un.usinas.length)add('ligacoes','Ligue a unidade '+un.nome+' a uma usina.',{unidadeId:un.id});if(num(un.consumoMedio)===null)add('dados','Informe o consumo médio da unidade '+un.nome+'.',{unidadeId:un.id});}
 for(const us of usinas){const r=c.usinas.find(x=>x.usinaId===us.id);if(r&&Object.keys(r.final).length&&!r.ok)add('ajuste','Feche '+r.alvo+'% na usina '+us.nome+' (hoje soma '+r.soma+'%; cada unidade com pelo menos 1%).',{usinaId:us.id});}
 /* Contato do formulário da Equatorial (não vem na fatura): pelo menos e-mail ou um telefone por usina com unidades. */
 for(const us of usinas)if(unidades.some(un=>un.usinas.includes(us.id))&&!String(us.email||us.telefone||us.celular||'').trim())add('formulario','Informe o e-mail ou um telefone da usina '+us.nome+' (vai no formulário da Equatorial).',{usinaId:us.id});
 return out;}
/* Resumo de um cliente a partir do cálculo geral: só as usinas, unidades, avisos e sistemas dele. */
function resumoCliente(d,c,id){const {usinas,unidades}=itensCliente(d,id),uIds=new Set(usinas.map(u=>u.id)),nIds=new Set(unidades.map(u=>u.id));
 const sistemas=c.sistemas.filter(s=>s.usinas.some(x=>uIds.has(x)));
 return {usinas,unidades,porUsina:c.usinas.filter(r=>uIds.has(r.usinaId)),porUnidade:c.unidades.filter(u=>nIds.has(u.id)),
  alertas:c.alertas.filter(a=>a.usinaId?uIds.has(a.usinaId):a.unidadeId?nIds.has(a.unidadeId):a.sistema?a.sistema.some(x=>uIds.has(x)):false),
  sistemas,energia:usinas.reduce((a,us)=>a+((c.usinas.find(r=>r.usinaId===us.id)||{}).energia?.disponivel||0),0),
  compensar:unidades.reduce((a,un)=>a+necessidade(un,d),0),deficit:sistemas.reduce((a,s)=>a+Math.max(0,s.deficit),0),
  ok:usinas.length>0&&c.usinas.filter(r=>uIds.has(r.usinaId)).every(r=>r.ok&&r.energia.disponivel!==null),pendencias:pendencias(d,c,id)};}

/* Energia de uma usina disponível para as unidades no mês. */
const FONTES={media3:'média dos últimos 3 meses',estimada:'estimada (kWp × fator)',fatura:'injetada na rede, média de 3 meses da fatura'};
const MONITORAMENTOS=['APsystems','SolarEdge','Outro'];
/* Regra do IG Base: a geração considerada é a média dos últimos 3 meses (90 dias), ou dos meses que a usina tiver. */
function mesesGeracao(u){const a=Array.isArray(u.geracaoMeses)?u.geracaoMeses.map(num).filter(v=>v!==null&&v>=0):[];if(a.length)return a.slice(0,3);const r=num(u.geracaoReal);return r!==null?[r]:[];}
/* Energia de uma usina para as unidades no mês. Padrão: potência × fator (115). Opcional: geração real
   do monitoramento (APsystems, SolarEdge ou outro) ou a energia injetada lida na fatura da geradora. */
function fonteGeracao(u){if(FONTES[u.fonteGeracao])return u.fonteGeracao;return ['apsystems','solaredge','outro'].includes(u.fonteGeracao)||u.usarGeracaoReal?'media3':'estimada';}
function energiaUsina(u){let fonte=fonteGeracao(u),bruta=null,meses=0;const est=()=>num(u.kwp)!==null?num(u.kwp)*(num(u.fator)??115):null;
 if(fonte==='media3'){const v=mesesGeracao(u);meses=v.length;if(meses)bruta=v.reduce((a,b)=>a+b,0)/meses;else{fonte='estimada';bruta=est();}}
 else if(fonte==='fatura'){bruta=num(u.injecao3)??num(u.injecaoFatura);meses=num(u.injecao3)!==null?(num(u.meses3)||3):1;}
 else bruta=est();
 const real=fonte!=='estimada';if(bruta===null)return {bruta:null,autoconsumo:0,rede:0,consumoGeradora:0,liquida:null,reserva:0,disponivel:null,origem:real?'real':'estimada',fonte};const reserva=Math.max(0,Math.min(100,Math.round(num(u.reservaGeradora)||0))),inj=num(u.injecao3)??num(u.injecaoFatura),autoconsumo=fonte!=='fatura'&&inj!==null?Math.max(0,bruta-inj):0,rede=Math.max(0,(num(u.consumoGeradora)||0)-(num(u.minimoGeradora)||0)),consumoGeradora=autoconsumo+rede,liquida=Math.max(0,bruta-consumoGeradora);return {bruta,autoconsumo,rede,consumoGeradora,liquida,reserva,disponivel:liquida*(100-reserva)/100,origem:real?'real':'estimada',fonte,meses};}
/* Como na planilha (v7: consumo na geração = produção − injeção + consumo da rede): geração para rateio = produção − o que a própria
   geradora consome. Esse consumo tem duas partes: o que ela usa na hora (produção − energia injetada, quando a fatura informa a injeção)
   e o consumo da rede (média dos últimos 3 meses) acima do mínimo dela: o mínimo nunca é compensado (usuário, 31/10/2026). */
/* Placas para uma ampliação: só quando a potência da placa (W) do projeto foi informada; vazio = só kWp. */
function placaUsina(u){if(u&&u.placaW===undefined)return 620;const w=num(u&&u.placaW);return w!==null&&w>0?w:null;}
function ampliacaoTexto(kwp,w){return 'cerca de '+fmt(kwp,1)+' kWp'+(w?' ('+Math.ceil(kwp*1000/w)+' placas de '+fmt(w,0)+' W)':'');}
/* O mínimo (30/50/100 kWh) nunca é compensado: cada unidade só precisa de crédito para o que passa dele.
   Ex.: mínimo 100 e consumo médio 200 → a unidade precisa de 100 (usuário, 31/10/2026). É a base do rateio. */
function minimoUnidade(un){return num(un.minimo)??MINIMO_FASES[un.fases]??0;}
function necessidadeBase(un){const c=num(un.consumoMedio);if(c===null)return 0;return Math.max(0,c-minimoUnidade(un));}
function necessidade(un,d){return coberta(un,d)?0:necessidadeBase(un);}
/* Com o saldo: a unidade cujo saldo cobre 3 meses (90 dias) do que ela usa fica com 1% (o mínimo da Equatorial);
   as demais, mesmo com algum saldo, recebem normalmente pelo consumo − mínimo (usuário, 31/10/2026). */
function coberta(un,d){if(!usaSaldo(d))return false;const saldo=Math.max(0,num(un.saldo)||0);if(!(saldo>0))return false;const uso=necessidadeBase(un);return uso<=0||saldo>=uso*mesesRevisao(d);}
/* Duas formas de calcular, à escolha do usuário (31/10/2026):
   - sem considerar o saldo (padrão): pelo consumo menos o mínimo; o rateio pode ficar sem mexer por muito tempo;
   - considerando o saldo: quem tem saldo para mais de 3 meses fica com 1%; refazer o rateio em 3 meses. */
function usaSaldo(d){return !!(d&&d.considerarSaldo);}
function mesesRevisao(d){return 3;}
function fatorUsina(u){const f=num(u&&u.fator);return f!==null&&f>0?f:115;}

/* Arredonda para inteiros somando exatamente "total" (maiores restos). */
/* A Equatorial exige no mínimo 1% para cada unidade do rateio, sempre em números inteiros. As fixadas (saldo para
   3 meses) e as que dariam menos de 1% ficam com 1%; o restante é dividido em inteiros na proporção das demais. */
function inteirosMin(pesos,total,fixos,reserva){const n=pesos.length;if(!n)return [];if(total<n)return inteiros(pesos,total);const fix=fixos?fixos.slice():pesos.map(()=>false);
 for(let volta=0;volta<=n;volta++){const livres=pesos.map((p,i)=>i).filter(i=>!fix[i]);if(!livres.length)return reserva?inteirosMin(reserva,total,null,null):pesos.map(()=>Math.floor(total/n)+(0));
  const resto=total-(n-livres.length),tot=livres.reduce((a,i)=>a+Math.max(0,pesos[i]),0);if(!(tot>0)){const igual=inteiros(livres.map(()=>1),resto),out=pesos.map(()=>1);livres.forEach((i,k)=>out[i]=igual[k]);return out;}
  const baixos=livres.filter(i=>Math.max(0,pesos[i])*resto/tot<1);if(!baixos.length||baixos.length===livres.length&&volta>0){const q=inteiros(livres.map(i=>Math.max(0,pesos[i])),resto),out=pesos.map(()=>1);livres.forEach((i,k)=>out[i]=Math.max(1,q[k]));const dif=out.reduce((a,b)=>a+b,0)-total;if(dif>0){let k=dif;for(const i of [...livres].sort((a,b)=>out[b]-out[a])){while(k>0&&out[i]>1){out[i]--;k--;}}}return out;}
  baixos.forEach(i=>fix[i]=true);}
 return inteiros(pesos,total);}
function inteiros(pesos,total){const soma=pesos.reduce((a,b)=>a+b,0);if(!(soma>0))return pesos.map(()=>0);const raw=pesos.map(p=>p*total/soma),base=raw.map(Math.floor);let falta=total-base.reduce((a,b)=>a+b,0);const ordem=raw.map((r,i)=>[r-base[i],i]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]);for(let k=0;k<falta;k++)base[ordem[k%ordem.length][1]]++;return base;}

/* Rateio sugerido.
   - Base: o que cada unidade precisa compensar = consumo médio − mínimo (30/50/100), porque o mínimo nunca é compensado.
   - Cada usina (começando pelas que atendem menos unidades) atende primeiro as unidades que só podem receber dela;
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
 for(const un of unidades)restante[un.id]=necessidade(un,d);
 /* Ordem de cálculo: primeiro as usinas que atendem menos unidades (ex.: usina que só atende uma casa entrega 100% a ela e o
    que faltar fica para as outras); empate segue a ordem da lateral. A exibição continua na ordem da lateral. */
 const nLig=us=>unidades.filter(un=>un.usinas.includes(us.id)).length,ordem=usinas.map((us,i)=>({us,i})).sort((a,b)=>nLig(a.us)-nLig(b.us)||a.i-b.i).map(x=>x.us);
 ordem.forEach((us,idx)=>{
  const en=energiaUsina(us),ligadas=unidades.filter(un=>un.usinas.includes(us.id));
  const r={usinaId:us.id,energia:en,percentuais:{},creditos:{},semEnergia:en.disponivel===null};
  if(!ligadas.length){resultado.push(r);return;}
  if(en.disponivel===null){alertas.push({tipo:'erro',usinaId:us.id,texto:'Informe a potência (kWp) ou a geração real da usina '+us.nome+'.'});resultado.push(r);return;}
  const ultima=un=>!ordem.slice(idx+1).some(o=>un.usinas.includes(o.id));
  const exclusivas=ligadas.filter(ultima),compartilhadas=ligadas.filter(un=>!ultima(un));
  let energia=en.disponivel;const credito={};ligadas.forEach(un=>credito[un.id]=0);
  const distribuir=(grupo)=>{const need=grupo.reduce((a,un)=>a+restante[un.id],0);if(!(need>0)||!(energia>0))return;const dar=Math.min(energia,need);for(const un of grupo){const parte=dar*restante[un.id]/need;credito[un.id]+=parte;restante[un.id]-=parte;}energia-=dar;};
  if(modo(d)==='prioritaria'){const p=g=>g.filter(un=>un.prioritaria),n=g=>g.filter(un=>!un.prioritaria);distribuir(p(exclusivas));distribuir(p(compartilhadas));distribuir(n(exclusivas));distribuir(n(compartilhadas));}
  else{distribuir(exclusivas);distribuir(compartilhadas);}
  if(energia>1e-9){const pesos=ligadas.map(un=>necessidade(un,d)),tot=pesos.reduce((a,b)=>a+b,0);ligadas.forEach((un,i)=>{credito[un.id]+=tot>0?energia*pesos[i]/tot:energia/ligadas.length;});energia=0;}
  const alvo=100-en.reserva,pesos=ligadas.map(un=>credito[un.id]),ints=inteirosMin(pesos,alvo,ligadas.map(un=>coberta(un,d)),ligadas.map(necessidadeBase));
  ligadas.forEach((un,i)=>{r.percentuais[un.id]=ints[i];});resultado.push(r);});
 resultado.sort((a,b)=>usinas.findIndex(u=>u.id===a.usinaId)-usinas.findIndex(u=>u.id===b.usinaId));
 return {usinas:resultado,alertas};}

/* Aplica ajustes manuais (pontos percentuais por unidade) e calcula projeções e alertas. */
function calcular(d,sugestao){
 sugestao=sugestao||sugerir(d);const alertas=[...sugestao.alertas],porUnidade={},porUsina=[];
 for(const un of d.unidades)porUnidade[un.id]={credito:0,origens:[]};
 for(const r of sugestao.usinas){const us=d.usinas.find(u=>u.id===r.usinaId);const aj=us.ajustes||{},finais={};let soma=0;
  for(const [id,p] of Object.entries(r.percentuais)){const v=Math.round(p+(num(aj[id])||0));finais[id]=v;soma+=v;}
  const alvo=100-r.energia.reserva,ok=Object.keys(finais).length===0||soma===alvo,negativos=Object.entries(finais).filter(([,v])=>v<1);
  if(Object.keys(finais).length&&!ok)alertas.push({tipo:'erro',usinaId:us.id,texto:us.nome+': os percentuais somam '+soma+'%. Ajuste até fechar '+alvo+'%'+(r.energia.reserva?' (a geradora fica com '+r.energia.reserva+'%)':'')+'.'});
  if(negativos.length)alertas.push({tipo:'erro',usinaId:us.id,texto:us.nome+': cada unidade precisa de pelo menos 1% (regra da Equatorial). Ajuste até nenhuma ficar abaixo de 1%.'});
  for(const [id,v] of Object.entries(finais)){const c=r.energia.disponivel===null?null:(r.energia.liquida*v/100);if(c!==null){porUnidade[id].credito+=c;porUnidade[id].origens.push({usinaId:us.id,percentual:v,credito:c});}}
  porUsina.push({usinaId:us.id,energia:r.energia,sugerido:r.percentuais,final:finais,soma,alvo,ok:ok&&!negativos.length});}
 const unidades=d.unidades.map(un=>{const p=porUnidade[un.id],consumo=num(un.consumoMedio),minimo=minimoUnidade(un),saldo=num(un.saldo)??0;
  const uso=consumo===null?null:Math.max(0,consumo-minimo),projetado=uso===null?null:saldo+p.credito-uso,cobertura=uso?p.credito/uso:null,meses=saldo>0&&uso>0?saldo/uso:null;
  const venc=(num(un.saldoExpira30)||0)+(num(un.saldoExpira60)||0);if(venc>0.5)alertas.push({tipo:'aviso',unidadeId:un.id,texto:un.nome+': '+fmt(venc,0)+' kWh de saldo vencem nos próximos 60 dias'+(num(un.saldoExpira30)>0.5?' ('+fmt(num(un.saldoExpira30),0)+' kWh em 30 dias)':'')+'. Use esse saldo antes: a porcentagem desta unidade pode baixar por um tempo.'});
  if(!un.usinas.length)alertas.push({tipo:'aviso',unidadeId:un.id,texto:un.nome+' não está ligada a nenhuma usina.'});
  else if(uso!==null&&projetado<0)alertas.push({tipo:'aviso',unidadeId:un.id,texto:un.nome+': faltam cerca de '+fmt(-projetado,0)+' kWh no mês, mesmo usando o saldo. Ligue mais uma usina ou aumente a porcentagem.'});
  if(num(un.naoCompensado)!==null&&num(un.naoCompensado)>minimo+0.5){const us0=d.usinas.find(u=>u.id===un.usinas[0]),falta=num(un.naoCompensado)-minimo,kwp=falta/fatorUsina(us0),w=placaUsina(us0);alertas.push({tipo:'aviso',unidadeId:un.id,ampliacao:{kwh:falta,kwp,placaW:w,placas:w?Math.ceil(kwp*1000/w):null},texto:un.nome+': o não compensado da última fatura ('+fmt(num(un.naoCompensado),0)+' kWh) passou do mínimo de '+fmt(minimo,0)+' kWh. A geração não cobriu '+fmt(falta,0)+' kWh do consumo. Sugestão de ampliação: '+ampliacaoTexto(kwp,w)+', ou aumentar a porcentagem desta unidade.'});}
  for(const o of p.origens){const us=d.usinas.find(u=>u.id===o.usinaId);if(us&&us.documento&&un.documento&&ucKey(us.documento)!==ucKey(un.documento))alertas.push({tipo:'aviso',unidadeId:un.id,texto:un.nome+': CPF/CNPJ diferente do titular da usina '+us.nome+'. No autoconsumo remoto a titularidade precisa ser a mesma.'});
   if(us&&us.leituraAtual&&un.leituraAtual){const du=Number(un.leituraAtual.slice(8,10)),dg=Number(us.leituraAtual.slice(8,10));if(du<=dg)alertas.push({tipo:'info',unidadeId:un.id,texto:un.nome+' é lida antes ou no mesmo dia da usina '+us.nome+' (dia '+du+' × dia '+dg+'): o crédito entra na fatura seguinte.'});}}
  return {id:un.id,credito:p.credito,origens:p.origens,consumo,uso,saldo,projetado,cobertura,meses};});
 const totalConsumo=d.unidades.reduce((a,u)=>a+necessidade(u,d),0),totalEnergia=sugestao.usinas.reduce((a,r)=>a+(r.energia.disponivel||0),0);
 /* Cada sistema (usinas e unidades ligadas entre si) é conferido separado: uma conta pode ter vários clientes. */
 const pai={},raiz=x=>{while(pai[x]!==x)x=pai[x]=pai[pai[x]];return x;},une=(a,b)=>{pai[raiz(a)]=raiz(b);};
 for(const us of d.usinas)pai['u:'+us.id]='u:'+us.id;for(const un of d.unidades){pai['n:'+un.id]='n:'+un.id;for(const id of un.usinas)if(pai['u:'+id])une('n:'+un.id,'u:'+id);}
 const grupos=new Map();for(const us of d.usinas){const r=raiz('u:'+us.id);if(!grupos.has(r))grupos.set(r,{usinas:[],unidades:[]});grupos.get(r).usinas.push(us);}
 for(const un of d.unidades){if(!un.usinas.length)continue;const r=raiz('n:'+un.id);if(grupos.has(r))grupos.get(r).unidades.push(un);}
 const sistemas=[...grupos.values()].filter(g=>g.unidades.length).map(g=>{const consumo=g.unidades.reduce((a,u)=>a+necessidade(u,d),0),energia=g.usinas.reduce((a,us)=>a+((sugestao.usinas.find(r=>r.usinaId===us.id)||{}).energia?.disponivel||0),0),fat=g.usinas.map(fatorUsina),pl=[...new Set(g.usinas.map(placaUsina))];
  return {usinas:g.usinas.map(u=>u.id),unidades:g.unidades.map(u=>u.id),nomes:g.usinas.map(u=>u.nome),consumo,energia,deficit:consumo-energia,fator:fat.reduce((a,b)=>a+b,0)/fat.length,placa:pl.length===1?pl[0]:null};});
 for(const sis of sistemas)if(sis.deficit>0.5)alertas.push({tipo:'aviso',sistema:sis.usinas,texto:(sistemas.length>1?'Sistema '+sis.nomes.join(' + ')+': as usinas não atendem o consumo das suas unidades':'As usinas não atendem o consumo total')+': faltam '+fmt(sis.deficit,0)+' kWh/mês, '+ampliacaoTexto(sis.deficit/sis.fator,sis.placa)+'.'});
 const deficit=sistemas.reduce((a,x)=>a+Math.max(0,x.deficit),0);
 const ok=porUsina.every(u=>u.ok)&&!alertas.some(a=>a.tipo==='erro');
 return {usinas:porUsina,unidades,alertas,totalConsumo,totalEnergia,deficit,sistemas,ok};}

const api={VERSION,MINIMO_FASES,cliente,docKey,organizarClientes,itensCliente,pendencias,resumoCliente,ampliacaoTexto,minimoUnidade,necessidade,necessidadeBase,coberta,inteirosMin,usaSaldo,mesesRevisao,FONTES,MONITORAMENTOS,mesesGeracao,MODOS,modo,placaUsina,fonteGeracao,fatorUsina,num,ucKey,ucFormat,linesFromItems,parseInvoice,fresh,usina,unidade,validate,energiaUsina,inteiros,sugerir,calcular,fmt,round2,clone,uid};
root.SolarDistribution=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
