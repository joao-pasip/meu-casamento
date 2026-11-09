import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/wedding.js';
const env={APPS_SCRIPT_URL:'https://script.google.com/macros/s/example/exec',APPS_SCRIPT_SECRET:'x'.repeat(32)};
function call(body,options={}){return onRequest({request:new Request('https://example.com/api/wedding',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com',...options.headers},body:JSON.stringify(body)}),env:options.env||env});}
test('proxy falha explicitamente sem configuração',async()=>{assert.equal((await call({action:'public'},{env:{}})).status,503);});
test('proxy rejeita origem diferente, operação arbitrária e formulário automatizado',async()=>{
  assert.equal((await call({action:'public'},{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await call({action:'admin'})).status,400);
  const data={id:'P1',name:'Pessoa Teste',requestId:'abc',startedAt:Date.now(),website:'spam'};
  assert.equal((await call({action:'choose',data})).status,400);
});
test('proxy valida RSVP antes de acessar integração',async()=>{assert.equal((await call({action:'rsvp',data:{}})).status,400);});

test('proxy distingue falha de rede e resposta HTML de uma entrada inválida',async t=>{
  const fetchMock=t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('fetch failed');});
  let response=await call({action:'public'});
  assert.equal(response.status,502);
  assert.equal((await response.json()).code,'UPSTREAM_NETWORK');
  fetchMock.mock.mockImplementation(async()=>new Response('<html>Sign in</html>',{headers:{'Content-Type':'text/html'}}));
  response=await call({action:'public'});
  assert.equal(response.status,502);
  assert.equal((await response.json()).code,'UPSTREAM_RESPONSE');
});

test('proxy encaminha leitura dos hotéis com segredo somente no pedido ao servidor',async t=>{
  const hotels=[{name:'Hospedagem de teste',image:'https://example.com/hotel.jpg'}];
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(url,env.APPS_SCRIPT_URL);
    const body=JSON.parse(options.body);
    assert.equal(body.secret,env.APPS_SCRIPT_SECRET);
    assert.equal(body.action,'public');
    assert.match(body.client,/^[a-f0-9]{64}$/);
    return Response.json({ok:true,data:{hotels}});
  });
  const response=await call({action:'public'});
  assert.equal(response.status,200);
  const raw=await response.text();
  assert.deepEqual(JSON.parse(raw).data.hotels,hotels);
  assert.equal(raw.includes(env.APPS_SCRIPT_SECRET),false);
});
