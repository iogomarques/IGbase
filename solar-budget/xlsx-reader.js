/* Read-only XLSX ZIP/XML extraction. Does not execute formulas, macros or links. */
(function(root){'use strict';
async function unzip(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);let end=-1;
 for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(view.getUint32(p,true)===0x06054b50){end=p;break;}
 if(end<0)throw Error('Arquivo XLSX inválido ou incompleto.');
 const count=view.getUint16(end+10,true);if(count>5000)throw Error('Planilha com arquivos internos demais.');let position=view.getUint32(end+16,true),total=0;const entries=new Map();
 for(let n=0;n<count;n++){
  if(view.getUint32(position,true)!==0x02014b50)throw Error('Estrutura XLSX inválida.');
  const flags=view.getUint16(position+8,true),method=view.getUint16(position+10,true),size=view.getUint32(position+20,true),plain=view.getUint32(position+24,true),nl=view.getUint16(position+28,true),el=view.getUint16(position+30,true),cl=view.getUint16(position+32,true),start=view.getUint32(position+42,true);
  const name=new TextDecoder().decode(bytes.slice(position+46,position+46+nl));position+=46+nl+el+cl;
  if(flags&1)throw Error('Planilha protegida por senha. Exporte uma cópia sem senha.');
  total+=plain;if(total>60*1024*1024||plain>20*1024*1024)throw Error('Conteúdo da planilha acima do limite.');
  if(!/\.xml$|\.rels$/i.test(name))continue;
  if(view.getUint32(start,true)!==0x04034b50)throw Error('Entrada XLSX inválida.');
  const offset=start+30+view.getUint16(start+26,true)+view.getUint16(start+28,true);const compressed=bytes.slice(offset,offset+size);
  let payload;
  if(method===0)payload=compressed;
  else if(method===8){
   let stream;try{stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));}catch(e){throw Error('Este navegador não suporta a leitura XLSX. Atualize-o ou exporte a lista como CSV.');}
   const reader=stream.getReader(),chunks=[];let length=0;for(;;){const r=await reader.read();if(r.done)break;length+=r.value.length;if(length>plain||length>20*1024*1024){await reader.cancel();throw Error('Planilha excede o tamanho declarado.');}chunks.push(r.value);}payload=new Uint8Array(length);let at=0;for(const chunk of chunks){payload.set(chunk,at);at+=chunk.length;}
  }else throw Error('Compressão XLSX não suportada.');
  if(payload.length!==plain)throw Error('Entrada XLSX incompleta.');entries.set(name,new TextDecoder().decode(payload));
 }
 return entries;
}
function xml(text){if(!text)throw Error('Estrutura XML ausente na planilha.');const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('XML inválido na planilha.');return doc;}
const tags=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
function textNodes(node){return tags(node,'t').map(t=>t.textContent).join('');}
async function read(file){
 const entries=await unzip(await file.arrayBuffer());const book=xml(entries.get('xl/workbook.xml')),rels=xml(entries.get('xl/_rels/workbook.xml.rels'));
 const shared=entries.has('xl/sharedStrings.xml')?tags(xml(entries.get('xl/sharedStrings.xml')),'si').map(textNodes):[];
 const relation=new Map(tags(rels,'Relationship').map(r=>[r.getAttribute('Id'),r.getAttribute('Target')]));const sheets=[];
 for(const sheet of tags(book,'sheet')){
  const name=sheet.getAttribute('name'),id=sheet.getAttribute('r:id')||sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'),target=relation.get(id);
  if(!target||target.includes('..')||target.startsWith('http'))throw Error('Referência de aba não suportada.');const path=target.startsWith('/')?target.slice(1):target.startsWith('xl/')?target:'xl/'+target;
  const doc=xml(entries.get(path)),rows=[];let cells=0;
  for(const row of tags(doc,'row')){const values=[];
   for(const cell of tags(row,'c')){
    if(++cells>100000)throw Error('Planilha acima de 100.000 células.');const letters=(cell.getAttribute('r')||'A1').match(/^[A-Z]+/)[0];let col=0;for(const letter of letters)col=col*26+letter.charCodeAt(0)-64;col--;
    if(col>2000)throw Error('Planilha com colunas demais.');const type=cell.getAttribute('t'),v=tags(cell,'v')[0]?.textContent;let value='';
    if(type==='s')value=shared[Number(v)]??'';else if(type==='inlineStr')value=textNodes(cell);else if(type==='e')value='ERRO NA ORIGEM: '+v;else if(v!==undefined)value=v;
    values[col]=String(value).replace(/[\t\r\n]/g,' ');
   }
   if(values.some(v=>v))rows.push(Array.from({length:values.length},(_,i)=>values[i]??'').join('\t'));
  }
  sheets.push({name:file.name+' · aba '+name,text:rows.join('\n')});
 }
 return sheets;
}
root.SolarBudgetXlsx={read};
})(typeof window!=='undefined'?window:globalThis);
