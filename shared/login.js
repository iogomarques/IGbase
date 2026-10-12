(function(){'use strict';
function timed(p,ms){let timer;return Promise.race([p,new Promise((_,no)=>{timer=setTimeout(()=>no(Error('Tempo de conexão excedido. Tente novamente.')),ms);})]).finally(()=>clearTimeout(timer));}
async function signIn(client,identifier,password,waitMs=20000){
 const entry=String(identifier||'').trim();
 if(!entry||typeof password!=='string'||!password)throw Error('Preencha e-mail ou nome de usuário e senha.');
 if(!client?.auth?.signInWithPassword)throw Error('Conexão indisponível. Tente novamente.');
 let email=entry;
 if(!entry.includes('@')){
  if(!/^[A-Za-z][A-Za-z0-9_.]{2,29}$/.test(entry))throw Error('Informe seu e-mail ou nome de usuário cadastrado.');
  let lookup;try{lookup=await timed(client.rpc('email_por_username',{p_username:entry.toLowerCase()}),waitMs);}catch(e){throw Error('Não foi possível verificar o nome de usuário. Tente novamente ou use seu e-mail.');}
  if(lookup?.error)throw Error('Não foi possível verificar o nome de usuário. Tente novamente ou use seu e-mail.');
  if(typeof lookup?.data!=='string'||!lookup.data.trim().includes('@'))throw Error('Usuário ou senha inválidos.');
  email=lookup.data.trim();
 }
 const result=await timed(client.auth.signInWithPassword({email:email.toLowerCase(),password}),waitMs);
 if(result?.error){if(result.error.code==='invalid_credentials'||/invalid login credentials/i.test(result.error.message||''))throw Error('E-mail, usuário ou senha inválidos.');throw Error(result.error.message||'Não foi possível entrar. Tente novamente.');}
 if(!result?.data?.user)throw Error('Não foi possível confirmar seu acesso. Tente novamente.');
 return result;
}
const api={signIn};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(typeof window!=='undefined')window.IGLogin=api;
})();
