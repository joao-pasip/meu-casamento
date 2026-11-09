import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
function environment(){
  const tables={Presentes:[['headers'],['P1','Panela','Cozinha','Descrição',100,'','','','Sim','','segredo','','Pessoa privada','contato privado','']],Escolhas:[['headers']],Confirmacoes:[['headers']],Hoteis:[['headers']],Maquiadores:[['headers']],Pix:[['headers'],['Habilitar Pix no site?','Não']]};
  let locked=false,failBatch=false,batches=0;const names=Object.keys(tables);
  const book={getSheetByName:name=>({getDataRange:()=>({getValues:()=>tables[name]}),getSheetId:()=>names.indexOf(name)})};
  const context=vm.createContext({console,SpreadsheetApp:{openById:()=>book},PropertiesService:{getScriptProperties:()=>({getProperty:()=> 's'.repeat(32)})},Utilities:{formatDate:()=> '2026-11-01T22:00:00-03:00'},ContentService:{MimeType:{JSON:'json'},createTextOutput:value=>({setMimeType:()=>JSON.parse(value)})},CacheService:{getScriptCache:()=>({get:()=>null,put:()=>{}})},LockService:{getScriptLock:()=>({tryLock:()=>{assert.equal(locked,false);locked=true;return true;},releaseLock:()=>{locked=false;}})},Sheets:{Spreadsheets:{batchUpdate:body=>{assert.equal(locked,true,'gravação deve estar sob LockService');if(failBatch)throw new Error('simulated failure');batches++;for(const req of body.requests){const part=req.updateCells||req.appendCells,sheet=names[part.range?.sheetId??part.sheetId],values=part.rows[0].values.map(cell=>cell.userEnteredValue.stringValue??cell.userEnteredValue.numberValue);if(req.appendCells)tables[sheet].push(values);else{const row=tables[sheet][part.range.startRowIndex];values.forEach((value,i)=>{row[part.range.startColumnIndex+i]=value;});}}}}}});
  vm.runInContext(fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8'),context);
  const request=(action,data={})=>context.doPost({postData:{contents:JSON.stringify({secret:'s'.repeat(32),client:'a'.repeat(64),action,data})}});
  return{context,tables,request,fail:()=>{failBatch=true;},batches:()=>batches,locked:()=>locked};
}
const choice={id:'P1',name:'Pessoa Teste',phone:'',requestId:'00000000-0000-4000-8000-000000000001'};
test('dados públicos excluem informações privadas e itens não exibidos',()=>{
  const env=environment();env.tables.Presentes.push(['P2','Oculto','','',0,'','','','Não']);
  const result=env.request('public');assert.equal(result.ok,true);assert.equal(result.data.gifts.length,1);assert.equal(result.data.gifts[0].status,'Disponível');
  const json=JSON.stringify(result);for(const value of ['segredo','Pessoa privada','contato privado'])assert.equal(json.includes(value),false);
});
test('escolha tem status e histórico juntos; repetição idempotente; concorrente recusado',()=>{
  const env=environment();assert.equal(env.request('choose',choice).ok,true);assert.equal(env.tables.Presentes[1][11],'Escolhido');assert.equal(env.tables.Escolhas.length,2);assert.equal(env.batches(),1);
  assert.equal(env.request('choose',choice).ok,true);assert.equal(env.tables.Escolhas.length,2);
  const other=env.request('choose',{...choice,requestId:'00000000-0000-4000-8000-000000000002'});assert.equal(other.code,'CONFLICT');assert.equal(env.tables.Escolhas.length,2);assert.equal(env.locked(),false);
});
test('falha da operação não apresenta sucesso e libera lock',()=>{
  const env=environment();env.fail();assert.equal(env.request('choose',choice).ok,false);assert.equal(env.tables.Presentes[1][11],'');assert.equal(env.tables.Escolhas.length,1);assert.equal(env.locked(),false);
});
test('ID duplicado ou item oculto não pode ser escolhido',()=>{
  const env=environment();env.tables.Presentes.push([...env.tables.Presentes[1]]);assert.equal(env.request('choose',choice).code,'CONFLICT');
  env.tables.Presentes.pop();env.tables.Presentes[1][8]='Não';assert.equal(env.request('choose',choice).code,'CONFLICT');
});
test('RSVP atualiza por identificador privado sem duplicar; textos são stringValue',()=>{
  const env=environment(),data={responseId:choice.requestId,name:'=Pessoa Teste',email:'teste@example.com',phone:'',attending:'Sim',adults:1,children:0,notes:'=IMPORTDATA("test")'};
  assert.equal(env.request('rsvp',data).ok,true);assert.equal(env.tables.Confirmacoes.length,2);assert.equal(env.tables.Confirmacoes[1][8],data.notes);
  assert.equal(env.request('rsvp',{...data,attending:'Não'}).ok,true);assert.equal(env.tables.Confirmacoes.length,2);assert.equal(env.tables.Confirmacoes[1][4],0);
  assert.equal(env.request('rsvp',{...data,email:''}).code,'INVALID');
});
test('Apps Script rejeita segredo ausente e operação administrativa pela API',()=>{
  const env=environment();assert.equal(env.context.doPost({postData:{contents:JSON.stringify({action:'public'})}}).code,'AUTH');assert.equal(env.request('liberarPresenteAdministrativo',{}).code,'INVALID');
});
test('reenvio antigo após liberação não reescolhe nem devolve sucesso falso',()=>{
  const env=environment();env.request('choose',choice);env.tables.Presentes[1][11]='Disponível';env.tables.Escolhas.push(['now','P1','Panela','','','','Liberação administrativa','Desistência']);
  assert.equal(env.request('choose',choice).code,'CONFLICT');assert.equal(env.tables.Presentes[1][11],'Disponível');
});
