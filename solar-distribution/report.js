/* Solar Distribution: documentos em PDF (jsPDF, A4 em mm).
   - relatorio(): relatório do cliente, no estilo da fatura do Solar Organization (empresa, logo e cor no cabeçalho),
     com a situação de cada usina e o rateio de cada unidade. Os formulários da Equatorial saem à parte.
   - formulario(): Formulário de Solicitação de Rateio - GD (modelo da aba RATEIO da planilha), numa página. */
(function(root){'use strict';
const W=210,H=297,M=16,CINZA=[92,111,99],TINTA=[22,36,29],LINHA=[221,229,218];
const texto=s=>String(s??'').replace(/[  ]/g,' ').replace(/[—–−]/g,'-').replace(/→/g,'->');
const fmt=(v,d=0)=>v===null||v===undefined||!Number.isFinite(v)?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const kwh=v=>v===null||v===undefined||!Number.isFinite(v)?'—':fmt(v)+' kWh';
function rgb(hex){const m=/^#?([0-9a-f]{6})$/i.exec(hex||'');const n=parseInt(m?m[1]:'1B4D3E',16);return [n>>16&255,n>>8&255,n&255];}
/* Cores das unidades na barra do rateio: tons da cor da empresa alternados com neutros legíveis. */
function paleta(base){const [r,g,b]=base,mix=(t,c)=>[0,1,2].map(i=>Math.round([r,g,b][i]*(1-t)+c[i]*t));return [base,mix(.45,[255,255,255]),[201,138,27],mix(.25,[0,0,0]),[86,128,170],mix(.7,[255,255,255]),[150,95,150],[120,120,120]];}
function dimensoes(src){return new Promise(ok=>{if(!src)return ok(null);const i=new Image();i.onload=()=>ok({w:i.naturalWidth,h:i.naturalHeight});i.onerror=()=>ok(null);i.src=src;});}
const formatoImg=s=>/^data:image\/png/i.test(s||'')?'PNG':'JPEG';

/* Relatório do cliente em UMA folha (pedido do usuário, 15/11/2026: duas folhas ficam cheias demais e a segunda com poucas
   linhas fica feia). Desenha no nível normal e, se passar da folha, tenta níveis mais compactos: logo menor, letra e
   espaçamentos menores. Só se nem o mais compacto couber (muitas usinas/unidades) sai em mais de uma folha, e o site avisa. */
const NIVEIS=[{s:1,g:1,logo:40},{s:.94,g:.86,logo:30},{s:.88,g:.74,logo:24},{s:.82,g:.64,logo:18},{s:.78,g:.55,logo:15}];
async function relatorio(model,empresa,opcoes={}){const dim=empresa?.logoBase64?await dimensoes(empresa.logoBase64):null;let doc=null;
 for(let k=0;k<NIVEIS.length;k++){doc=desenharRelatorio(model,empresa,dim,NIVEIS[k]);if(doc.internal.getNumberOfPages()===1)break;}
 doc.__paginas=doc.internal.getNumberOfPages();return doc;}
function desenharRelatorio(model,empresa,dim,N){const doc=new root.jspdf.jsPDF({unit:'mm',format:'a4'}),cor=rgb(empresa?.corPrimaria),cores=paleta(cor);let y=16;
 const S=N.s,G=N.g,fs=v=>Math.max(6,v*S),dm=v=>v*S,gp=v=>v*G;
 const fonte=(size,bold,c)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(fs(size));doc.setTextColor(...(c||TINTA));};
 const escrever=(s,x,yy,o)=>doc.text(texto(s),x,yy,o||{});
 const rodape=()=>{const n=doc.internal.getNumberOfPages();for(let p=1;p<=n;p++){doc.setPage(p);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...CINZA);const t=[empresa?.nomeEmpresa,empresa?.textoRodape].filter(Boolean).join(' · ');if(t)doc.splitTextToSize(texto(t),W-2*M-30).slice(0,2).forEach((l,i)=>escrever(l,M,H-10+i*3.4));escrever('Página '+p+' de '+n,W-M,H-10,{align:'right'});}};
 const novaPagina=()=>{doc.addPage();y=14;fonte(8,true,cor);escrever('RELATÓRIO DE RATEIO',M,y);fonte(8,false,CINZA);escrever(model.cliente.nome,W-M,y,{align:'right'});y+=3;doc.setDrawColor(...LINHA);doc.line(M,y,W-M,y);y+=8;};
 const espaco=h=>{if(y+h>H-16)novaPagina();};
 const linhaTxt=size=>fs(size)*.42+gp(1);
 const titulo=s=>{espaco(gp(12));y+=gp(1);fonte(10,true,cor);escrever(s,M,y);y+=gp(2.5);doc.setDrawColor(...LINHA);doc.setLineWidth(.3);doc.line(M,y,W-M,y);y+=gp(5.5);};
 const paragrafo=(s,size=9,c=CINZA,gap=2)=>{fonte(size,false,c);for(const l of doc.splitTextToSize(texto(s),W-2*M)){espaco(linhaTxt(size));escrever(l,M,y);y+=linhaTxt(size);}y+=gp(gap);};
 /* Cabeçalho: dados da empresa à esquerda; logo à direita, centralizado (até 40 mm de altura no nível normal, menor nos compactos).
    Tamanho do logo (Empresas): acima de 100% a área do logo cresce para a esquerda (até 62% da largura). */
 const escL=root.IGCompanies&&root.IGCompanies.logoEscala?root.IGCompanies.logoEscala(empresa):1;
 const topo=y-5,zonaW=Math.min((W-2*M)*0.62,((W-2*M)*0.5-6)*Math.max(1,escL)),colW=dim?W-2*M-zonaW-6:W-2*M;
 const linhasEmpresa=empresa&&root.IGCompanies?root.IGCompanies.lines(empresa):[];
 linhasEmpresa.forEach((l,i)=>{fonte(i?8.5:12,!i,i?CINZA:TINTA);for(const t of doc.splitTextToSize(texto(l),colW)){escrever(t,M,y);y+=i?dm(4):dm(5.5);}});
 if(dim){const zx=M+colW+6,zw=W-M-zx,altMax=Math.min(40*escL,N.logo*Math.max(1,escL)),lw=Math.min(zw,altMax*dim.w/dim.h),lh=lw*dim.h/dim.w,bloco=Math.max(y-topo,lh);
  doc.addImage(empresa.logoBase64,formatoImg(empresa.logoBase64),zx+(zw-lw)/2,topo+(bloco-lh)/2,lw,lh,undefined,'FAST');y=topo+bloco+gp(5);}
 else y+=gp(4);
 doc.setFillColor(...cor);doc.rect(M,y,W-2*M,.8,'F');y+=gp(9);
 fonte(15,true,TINTA);escrever(model.titulo||'Relatório de rateio de créditos',M,y);fonte(9,false,CINZA);escrever('Emitido em '+new Date(model.data).toLocaleDateString('pt-BR'),W-M,y,{align:'right'});y+=gp(7);
 titulo('CLIENTE');
 /* Cliente e documento na mesma linha; e-mail e telefone na seguinte (economiza espaço). */
 const cl=model.cliente,pares=[['Cliente',cl.nome],['CPF/CNPJ',cl.documento],['E-mail',cl.email],['Telefone',cl.telefone]].filter(x=>x[1]);
 for(let i=0;i<pares.length;i+=2){pares.slice(i,i+2).forEach(([k,v],j)=>{const x=M+j*(W-2*M)/2;fonte(9,true);const kw=doc.getTextWidth(k+': ');escrever(k+':',x,y);fonte(9,false);escrever(doc.splitTextToSize(texto(v),(W-2*M)/2-kw-4)[0],x+kw+.5,y);});y+=dm(4.8);}
 paragrafo(model.usinas.length+(model.usinas.length>1?' usinas geradoras':' usina geradora')+' e '+model.unidades+(model.unidades>1?' unidades':' unidade')+' recebendo os créditos. '+model.metodo,8.5,CINZA,2);
 /* Quadro de resumo: a geração considerada vem primeiro (geração → para o rateio → a compensar → situação → rateio). */
 const r=model.resumo,met=[...(r.geracao>0?[['Geração considerada das usinas',kwh(r.geracao)+'/mês']]:[]),['Energia das usinas para o rateio',kwh(r.energia)+'/mês'],['A compensar (consumo médio − mínimo)',kwh(r.compensar)+'/mês'],['Situação',r.deficit>0.5?'Faltam '+kwh(r.deficit)+'/mês':'A geração atende o consumo'],['Rateio',r.ok?'Fechado em 100% por usina':'Em ajuste']];
 const nc=met.length>4?3:2,cw=(W-2*M)/nc,linhasR=Math.ceil(met.length/nc),passoR=Math.max(8.5,dm(10.5)),hR=gp(5)+linhasR*passoR;
 titulo('RESUMO');espaco(hR+4);doc.setFillColor(244,247,243);doc.roundedRect(M,y,W-2*M,hR,2,2,'F');
 met.forEach(([k,v],i)=>{const x=M+5+(i%nc)*cw,yy=y+gp(5)+Math.floor(i/nc)*passoR;fonte(7.5,false,CINZA);escrever(doc.splitTextToSize(texto(k),cw-7)[0],x,yy);fonte(10.5,true,v.startsWith('Faltam')?[153,55,37]:cor);escrever(v,x,yy+dm(4.6));});y+=hR+gp(5);
 if(r.deficit>0.5&&r.ampliacao)paragrafo('Para atender todo o consumo, faltam '+kwh(r.deficit)+'/mês, o equivalente a '+r.ampliacao+' de geração.',8.5,[139,76,30],1.5);
 paragrafo('"A compensar" = consumo médio − mínimo não compensado (custo de disponibilidade: 30 kWh mono, 50 bi, 100 trifásico), que a Equatorial cobra mesmo com créditos. Valores estimados com a geração e o consumo médio informados; a Equatorial aplica o rateio a partir do ciclo seguinte ao pedido. Créditos valem por 60 meses.',7.8,CINZA,1.5);
 /* Uma seção por usina: geração, barra do rateio e tabela das unidades. */
 const cols=[{k:'nome',t:'Unidade',w:44},{k:'consumo',t:'Consumo médio',w:19},{k:'compensar',t:'A compensar',w:19},{k:'atual',t:'Rateio atual',w:15},{k:'final',t:'Novo rateio',w:15},{k:'credito',t:'Crédito/mês',w:19},{k:'saldo',t:'Saldo hoje',w:16},{k:'depois',t:'Saldo após o mês',w:31}];
 for(const us of model.usinas){espaco(gp(45));titulo((/^usina\b/i.test(us.nome.trim())?'':'USINA ')+us.nome.toUpperCase());
  paragrafo('UC '+(us.uc||'—')+' · Classificação: '+(us.gd||'GD não informada')+' · Geração considerada: '+us.geracaoTxt+(us.liquida!==null&&Math.abs(us.liquida-us.bruta)>0.5?' · Consumo da própria geradora: '+kwh(us.bruta-us.liquida)+' · Para o rateio: '+kwh(us.liquida)+'/mês':'')+(us.reserva?' · Fica com a geradora: '+us.reserva+'%':''),8.5,CINZA,1.5);
  /* Barra do rateio: cada unidade com a sua cor e porcentagem. */
  const bh=Math.max(4.5,7*G);espaco(bh+4);let x=M;const bw=W-2*M;doc.setFillColor(238,243,236);doc.roundedRect(M,y,bw,bh,1.5,1.5,'F');
  us.linhas.forEach((l,i)=>{const w=bw*l.final/100;if(w<=0)return;doc.setFillColor(...cores[i%cores.length]);doc.rect(x,y,w,bh,'F');if(w>9){fonte(7.5,true,i%cores.length===1||i%cores.length===5?TINTA:[255,255,255]);escrever(l.final+'%',x+w/2,y+bh/2+dm(1.3),{align:'center'});}x+=w;});
  if(us.reserva){const w=bw*us.reserva/100;doc.setFillColor(200,200,200);doc.rect(x,y,w,bh,'F');}y+=bh+gp(4);
  /* Tabela */
  const cab=()=>{fonte(7,true,CINZA);let cx=M;cols.forEach((c,i)=>{const lines=doc.splitTextToSize(c.t,c.w-1.5);lines.forEach((t,j)=>escrever(t,i?cx+c.w-1:cx,y+j*dm(3),i?{align:'right'}:{}));cx+=c.w;});y+=dm(6.5);doc.setDrawColor(...LINHA);doc.line(M,y-2.5,W-M,y-2.5);};
  cab();
  us.linhas.forEach((l,i)=>{const nome=doc.splitTextToSize(texto(l.nome),cols[0].w-6),lh=dm(3.6),h=Math.max(nome.length*lh+lh,l.mesesTxt||l.compensarTxt||l.ajuste?dm(7.6):0)+gp(2.5);const antes=doc.internal.getNumberOfPages();espaco(h+1);if(doc.internal.getNumberOfPages()!==antes)cab();
   doc.setFillColor(...cores[i%cores.length]);doc.rect(M,y-2.6,2.6,2.6,'F');fonte(8.2,true);nome.forEach((t,j)=>escrever(t,M+4,y+j*lh));fonte(7,false,CINZA);escrever('UC '+(l.uc||'—'),M+4,y+nome.length*lh);
   const vals={consumo:kwh(l.consumo),compensar:kwh(l.compensar),atual:l.atual===null?'—':l.atual+'%',final:l.final+'%',credito:kwh(l.credito),saldo:kwh(l.saldo),depois:l.saldoDepois===null?'—':kwh(l.saldoDepois)};
   let cx=M+cols[0].w;cols.slice(1).forEach(c=>{fonte(8.2,c.k==='final',c.k==='depois'&&l.saldoDepois<0?[153,55,37]:c.k==='final'?cor:TINTA);escrever(vals[c.k],cx+c.w-1,y,{align:'right'});cx+=c.w;});
   if(l.mesesTxt){fonte(6.8,false,CINZA);escrever(l.mesesTxt,W-M-1,y+lh,{align:'right'});}
   if(l.compensarTxt){fonte(6.3,false,CINZA);escrever(l.compensarTxt.replace(/ \(mínimo.*\)$/,''),M+cols[0].w+cols[1].w+cols[2].w-1,y+lh,{align:'right'});}
   /* Consumo ajustado (previsão): mostra a média da fatura e o ajuste embaixo do consumo considerado. */
   if(l.ajuste){fonte(6.3,false,[139,76,30]);escrever('fatura '+fmt(l.consumoFatura)+(l.ajuste>0?' + ':' - ')+fmt(Math.abs(l.ajuste)),M+cols[0].w+cols[1].w-1,y+lh,{align:'right'});}
   y+=h;doc.setDrawColor(236,240,234);doc.line(M,y-2.8,W-M,y-2.8);});
  espaco(dm(5));fonte(8,true);escrever('Total',M+4,y+.5);escrever(us.linhas.reduce((a,l)=>a+l.final,0)+(us.reserva||0)+'%',M+cols.slice(0,5).reduce((a,c)=>a+c.w,0)-1,y+.5,{align:'right'});escrever(kwh(us.linhas.reduce((a,l)=>a+(l.credito||0),0)),M+cols.slice(0,6).reduce((a,c)=>a+c.w,0)-1,y+.5,{align:'right'});y+=gp(7);
  /* Unidades que saem do rateio desta usina (pedido de exclusão à Equatorial, com o % de hoje). */
  if(us.exclusoes&&us.exclusoes.length)paragrafo('Sai do rateio desta usina (pedido de exclusão à Equatorial): '+us.exclusoes.map(x=>x.nome+' (UC '+(x.uc||'—')+', hoje '+fmt(x.percentual,x.percentual%1?2:0)+'%)').join('; ')+'.',8.5,[139,76,30],2);}
 if(model.avisos.length){titulo('PONTOS DE ATENÇÃO');model.avisos.forEach(a=>paragrafo('• '+a,8.3,[92,71,16],.8));}
 /* Sem "próximos passos": quem monta a usina decide e analisa isso (usuário, 05/11/2026). Formulários da Equatorial saem em PDFs separados. */
 rodape();doc.setProperties({title:texto(model.titulo+' - '+model.cliente.nome)});return doc;}

/* Desenha o formulário da Equatorial na página atual de "doc". */
function formulario(doc,us,linhas,reserva,quando,tipos){const dt=new Date(quando||Date.now());let y=16;
 const t=(txt,x,yy,o={})=>{doc.setFont('helvetica',o.bold?'bold':'normal');doc.setFontSize(o.size||9.5);doc.setTextColor(0,0,0);doc.text(texto(txt),x,yy,o.align?{align:o.align}:undefined);};
 /* Texto longo (ex.: classe comercial) diminui a letra até caber; só corta abaixo de 6,5 pt. */
 const campo=(rot,val,x,yy,larg)=>{t(rot,x,yy,{bold:true});const w=doc.getTextWidth(rot)+1.5,s=texto(val||'—');doc.setFont('helvetica','normal');let fs=9.5;doc.setFontSize(fs);while(fs>6.5&&doc.getTextWidth(s)>larg-w){fs-=0.5;doc.setFontSize(fs);}t(doc.splitTextToSize(s,larg-w)[0],x+w,yy,{size:fs});doc.setDrawColor(190);doc.line(x+w,yy+1,x+larg,yy+1);doc.setDrawColor(0);};
 const caixa=(marcado,rot,x,yy)=>{doc.rect(x,yy-3,3.4,3.4);if(marcado)t('X',x+0.6,yy-0.2,{bold:true,size:9});t(rot,x+5,yy);};
 t('EQUATORIAL ENERGIA',W/2,y,{bold:true,size:11,align:'center'});y+=5;t('Rua 2, Nº 505, Edifício Eletra',W/2,y,{size:9,align:'center'});y+=4.2;t('Jardim Goiás, Goiânia, GO, Brasil – CEP: 74805-180',W/2,y,{size:9,align:'center'});y+=12;
 t('Formulário de Solicitação de Rateio - GD',W/2,y,{bold:true,size:14,align:'center'});y+=12;
 t('1. Identificação da Unidade Consumidora (UC):',M,y,{bold:true,size:10.5});t('DATA: '+dt.toLocaleDateString('pt-BR'),W-M,y,{bold:true,align:'right'});y+=8;
 const c2=M+98,lg=92;
 campo('Código da UC:',us.uc,M,y,lg);campo('Classe:',us.classe,c2,y,W-M-c2);y+=7.5;
 campo('Titular da UC:',us.titular,M,y,lg);campo('CNPJ/CPF:',us.documento,c2,y,W-M-c2);y+=7.5;
 campo('Endereço:',us.endereco,M,y,lg);campo('CEP:',us.cep,c2,y,W-M-c2);y+=7.5;
 campo('Bairro:',us.bairro,M,y,lg);campo('Cidade:',[us.cidade,us.cidade?(us.uf||'GO'):''].filter(Boolean).join(' - '),c2,y,W-M-c2);y+=7.5;
 campo('E-mail:',us.email,M,y,lg);campo('Telefone:',us.telefone,c2,y,W-M-c2);y+=7.5;
 campo('Celular:',us.celular,M,y,lg);y+=10;
 /* Tipo: vem do pedido calculado (inclusão/alteração no principal, exclusão no pedido separado); rateios antigos sem isso usam o que estava na usina. */
 const tp=tipos||{[us.tipoSolicitacao||'alteracao']:true},cp=us.compensacao||'normal';
 caixa(!!tp.inclusao,'Inclusão',M,y);caixa(!!tp.alteracao,'Alteração',M+32,y);caixa(!!tp.exclusao,'Exclusão',M+66,y);
 t('Tipo de compensação:',c2,y,{bold:true});caixa(cp==='normal','Normal',c2+38,y);caixa(cp==='consorcio','Consórcio',c2+62,y);y+=12;
 t('2. Lista de unidades consumidoras participantes do sistema de compensação',M,y,{bold:true,size:10.5});y+=5;t('indicando a porcentagem de rateio dos créditos e o enquadramento:',M,y);y+=4.5;t('(Conforme incisos VI a VIII do art. 2º da Resolução Normativa nº 482/2012)',M,y,{size:8.5});y+=7;
 const cols=[M,M+44,M+104,W-M];t('UC',cols[0],y,{bold:true});t('Unidade',cols[1],y,{bold:true});t('CNPJ/CPF',cols[2],y,{bold:true});t('Rateio',cols[3],y,{bold:true,align:'right'});y+=2;doc.line(M,y,W-M,y);y+=5.5;
 const rows=[...(reserva?[{uc:us.uc,nome:'Própria geradora',documento:us.documento,percentual:reserva}]:[]),...linhas];
 for(const l of rows){if(y>255){doc.addPage();y=20;}t('UC: '+(l.uc||'—'),cols[0],y);t(doc.splitTextToSize(texto(l.nome||''),56)[0],cols[1],y);t(l.documento||'—',cols[2],y);t(l.percentual+'%',cols[3],y,{bold:true,align:'right'});y+=6.5;}
 doc.line(M,y-3.5,W-M,y-3.5);if(!tp.exclusao){t('Total',cols[1],y+1,{bold:true});t(rows.reduce((a,l)=>a+l.percentual,0)+'%',cols[3],y+1,{bold:true,align:'right'});}y+=11;
 if(y>235){doc.addPage();y=20;}
 t('IMPORTANTE',W/2,y,{bold:true,size:10,align:'center'});y+=6;
 for(const p of ['• Caso a leitura da unidade beneficiária ocorra antes ou no mesmo dia que a unidade geradora, os créditos serão faturados apenas no próximo faturamento.','• Para solicitação de acesso o formulário de rateio é opcional e, caso não seja fornecido, será considerada a inexistência de unidades beneficiárias. O modelo deste formulário trata-se apenas de uma sugestão, sendo que o cliente poderá apresentar as informações de rateio por qualquer outro meio.']){doc.setFont('helvetica','normal');doc.setFontSize(9);for(const part of doc.splitTextToSize(p,W-2*M)){t(part,M,y,{size:9});y+=4.3;}y+=1.5;}
 y=Math.max(y+16,250);doc.line(M+35,y,W-M-35,y);t('Titular da UC ou Representante legal',W/2,y+5,{align:'center'});
 t('EQUATORIAL ENERGIA Goiás – Rua 2, Nº 505, Edifício Eletra – Jardim Goiás, Goiânia, GO, Brasil – CEP: 74805-180',W/2,289,{size:7.5,align:'center'});}

root.IGDistributionReport={relatorio,formulario};
})(globalThis);
