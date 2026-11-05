/* IG Base: destaque do que falta preencher, igual em todos os sistemas.
   IGFalta.marcar(campo, mensagem) rola até o campo, foca, contorna em laranja e escreve o que falta logo abaixo.
   O destaque sai sozinho quando o usuário mexe no campo. IGFalta.marcarTodos([[campo, mensagem], ...]) destaca vários
   e leva ao primeiro. Sem dependências; só mexe no que recebe. */
(function(root){'use strict';
const sel=x=>typeof x==='string'?document.querySelector(x):x;
const CAMPO='input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea:not([disabled])';
function caixaDe(el){if(el.matches('label,fieldset,.field,.ig-falta-caixa'))return el;if(el.matches(CAMPO)||el.matches('button,a'))return el.closest('label,.field')||el;return el;}
function limpar(el){if(!el)return;el.classList.remove('ig-falta');el.querySelectorAll?.('[aria-invalid="true"]').forEach(c=>c.removeAttribute('aria-invalid'));if(el.matches?.('[aria-invalid="true"]'))el.removeAttribute('aria-invalid');const n=el._igFaltaNota;if(n&&n.isConnected)n.remove();el._igFaltaNota=null;}
function limparTudo(raiz){(raiz||document).querySelectorAll('.ig-falta').forEach(limpar);}
/* Destaca sem rolar. Devolve o elemento a focar (o campo, se houver). */
function destacar(x,msg){const el=sel(x);if(!el)return null;const caixa=caixaDe(el),campo=el.matches(CAMPO)?el:caixa.querySelector?.(CAMPO)||null;
 limpar(caixa);caixa.classList.add('ig-falta');if(campo)campo.setAttribute('aria-invalid','true');
 if(msg){const n=document.createElement('div');n.className='ig-falta-nota';n.setAttribute('role','alert');n.textContent=msg;if(caixa.matches('input,select,textarea,button,a'))caixa.after(n);else caixa.append(n);caixa._igFaltaNota=n;}
 const sair=()=>{limpar(caixa);caixa.removeEventListener('input',sair,true);caixa.removeEventListener('change',sair,true);caixa.removeEventListener('click',sairClique,true);};
 const sairClique=e=>{if(e.target.closest('input[type=checkbox],input[type=radio],input[type=file],select'))sair();};
 caixa.addEventListener('input',sair,true);caixa.addEventListener('change',sair,true);caixa.addEventListener('click',sairClique,true);
 return campo||el;}
function irPara(el){if(!el)return;const alvo=el.closest?.('.ig-falta')||el;alvo.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>{try{el.focus({preventScroll:true});}catch(e){}},350);}
function marcar(x,msg){const foco=destacar(x,msg);irPara(foco);return !!foco;}
function marcarTodos(lista){let primeiro=null;for(const [x,msg] of lista){const f=destacar(x,msg);if(f&&!primeiro)primeiro=f;}irPara(primeiro);return !!primeiro;}
/* Campos obrigatórios de formulários (ex.: login do IG Base) ganham o mesmo destaque quando o navegador barra o envio. */
document.addEventListener('invalid',e=>{const c=e.target;if(c&&c.matches&&c.matches(CAMPO))destacar(c,c.validationMessage||'Preencha este campo.');},true);
root.IGFalta={marcar,marcarTodos,destacar,limpar,limparTudo};
})(globalThis);
