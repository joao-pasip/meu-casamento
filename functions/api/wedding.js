import { validateRSVP, validateGift } from '../../src/utils/validation.js';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store, max-age=0', 'X-Content-Type-Options':'nosniff' } });
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json({ ok:false,message:'Método não permitido.' },405);
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({ok:false,message:'Origem não permitida.'},403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ok:false,message:'Formato inválido.'},415);
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_SECRET) return json({ok:false,message:'A integração está sendo preparada pelos noivos. Tente novamente mais tarde.'},503);
  try {
    // O corpo é lido com limite real, inclusive quando Content-Length está ausente.
    const reader = request.body?.getReader(); let raw='', size=0; const decoder = new TextDecoder();
    if (!reader) throw new Error('Pedido vazio.');
    for (;;) { const {value,done}=await reader.read(); if(done) break; size+=value.byteLength; if(size>12000){await reader.cancel();return json({ok:false,message:'Envio muito grande.'},413);} raw+=decoder.decode(value,{stream:true}); } raw+=decoder.decode();
    const body = JSON.parse(raw), { action } = body;
    if (!['public','availability','choose','rsvp'].includes(action)) return json({ok:false,message:'Operação inválida.'},400);
    let data = {};
    if (action === 'rsvp') data = validateRSVP(body.data || {});
    if (action === 'choose') data = validateGift(body.data || {});
    if (action === 'availability') { if(typeof body.data?.id!=='string'||body.data.id.length>100) throw new Error('Presente inválido.'); data={id:body.data.id}; }
    if (['choose','rsvp'].includes(action)) {
      const elapsed = Date.now() - Number(body.data.startedAt);
      if (body.data.website || !Number.isFinite(elapsed) || elapsed < 2000 || elapsed > 86400000) return json({ok:false,message:'Aguarde alguns segundos, confira os campos e tente novamente.'},400);
    }
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.APPS_SCRIPT_SECRET+':'+ip));
    const client = Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
    const endpoint = new URL(env.APPS_SCRIPT_URL);
    if(endpoint.protocol!=='https:'||endpoint.hostname!=='script.google.com'||!endpoint.pathname.endsWith('/exec')) throw new Error('A integração precisa de configuração.');
    let response;
    try {
      response = await fetch(endpoint.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.APPS_SCRIPT_SECRET,action,data,client}),redirect:'follow',signal:AbortSignal.timeout(20000)});
    } catch {
      return json({ok:false,code:'UPSTREAM_NETWORK',message:'Não foi possível conectar ao serviço de informações. Tente novamente em instantes.'},502);
    }
    if(!response.ok) return json({ok:false,code:'UPSTREAM_HTTP',message:'O serviço de informações está indisponível. Tente novamente em instantes.'},502);
    let result;
    try { result = await response.json(); } catch {
      return json({ok:false,code:'UPSTREAM_RESPONSE',message:'O serviço de informações não retornou uma resposta válida.'},502);
    }
    if(!result || typeof result.ok!=='boolean') return json({ok:false,code:'UPSTREAM_RESPONSE',message:'O serviço de informações não retornou uma resposta válida.'},502);
    const status = result.ok ? 200 : result.code==='CONFLICT' ? 409 : result.code==='RATE_LIMIT' ? 429 : result.code==='INVALID' ? 400 : 503;
    return json(result,status);
  } catch(error) {
    const validation = error instanceof SyntaxError || /Informe|Preencha|Confira|Pedido|Presente|Operação/.test(error.message);
    return json({ok:false,message:validation ? error.message : 'Não foi possível registrar agora. Tente novamente; envios repetidos não serão duplicados.'},validation?400:502);
  }
}
