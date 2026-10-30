/* Solar Distribution: dados privados na linha de configuração da conta (configuracoes_documento),
   numa área própria ("solarDistribution"). Preserva empresas, Budget e demais áreas.
   Cada gravação relê a linha e só grava se ninguém alterou a conta no meio (updated_at). */
(function(root){'use strict';const clone=x=>JSON.parse(JSON.stringify(x)),KEY='solarDistribution';
function service(db,user){let stamp=null,data=null,writing=false;const S=root.SolarDistribution,query=()=>db.from('configuracoes_documento');
 async function session(){const r=await db.auth.getSession();if(r.error||r.data?.session?.user?.id!==user.id)throw Error('A sessão mudou. Entre novamente antes de salvar.');}
 async function read(){await session();const r=await query().select('data,updated_at').eq('user_id',user.id).maybeSingle();if(r.error)throw Error('Dados da conta indisponíveis: '+r.error.message);const raw=r.data?.data||{};if(typeof raw!=='object'||Array.isArray(raw))throw Error('Configuração da conta inválida.');const own=raw[KEY]?S.validate(clone(raw[KEY])):S.fresh();return {raw,stamp:r.data?.updated_at||null,own};}
 async function load(){const r=await read();data=r.own;stamp=r.stamp;return api;}
 async function save(next){if(writing)throw Error('Aguarde o salvamento em andamento.');writing=true;try{S.validate(next);const r=await read();if(r.stamp!==stamp&&JSON.stringify(r.own)!==JSON.stringify(data))throw Error('Os dados do Solar Distribution mudaram em outra aba ou aparelho. Recarregue a página antes de salvar.');const row=clone(r.raw);row[KEY]=clone(next);if(new Blob([JSON.stringify(row)]).size>24*1024*1024)throw Error('Dados da conta acima de 24 MB. Nada foi alterado.');await session();const now=new Date(Math.max(Date.now(),(Date.parse(r.stamp)||0)+1)).toISOString(),q=r.stamp?query().update({data:row,updated_at:now}).eq('user_id',user.id).eq('updated_at',r.stamp):query().insert({user_id:user.id,data:row,updated_at:now});const res=await q.select('user_id');if(res.error)throw Error(res.error.message);if(!res.data?.length)throw Error('A conta mudou em outra sessão. Recarregue a página e tente salvar novamente.');data=clone(next);stamp=now;return api;}finally{writing=false;}}
 const api={load,save,get data(){return clone(data);}};return api;}
root.IGDistributionStore={service};
})(globalThis);
