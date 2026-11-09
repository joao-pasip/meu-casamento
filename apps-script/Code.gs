/* Aplicação privada atrás da Pages Function. Nunca publique a planilha. */
const SPREADSHEET_ID = '1GqFTftQ0MBzt9N4SsRbUq5X4aZoCGmz90QeHFekKOuc';
const HEADERS = {
  Presentes:['ID','Item','Categoria','Descrição','Preço de referência (R$)','URL da imagem','Loja sugerida','Link de referência','Exibir no site?','Atualizado em','Observações internas','Status','Escolhido por (privado)','Contato (privado)','Escolhido em'],
  Escolhas:['Data/hora','ID do presente','Presente','Nome do convidado','Telefone','E-mail','Ação','Observações internas'],
  Confirmacoes:['Identificador da resposta','Data e hora','Nome completo','Comparecerá?','Quantidade de adultos','Quantidade de crianças','E-mail','Telefone','Observações'],
  Hoteis:['Nome','Imagem','Endereço','Telefone','WhatsApp','Link de referência','Observações'],
  Maquiadores:['Nome','Imagem','Especialidade','Telefone','WhatsApp','Instagram','Observações'],
  Pix:['Configuração','Valor','Orientação']
};
function book_(){return SpreadsheetApp.openById(SPREADSHEET_ID);}
function fail_(message,code){const error=new Error(message);error.code=code||'INVALID';throw error;}
function checked_(value,max,required){if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail_('Confira os campos enviados.');value=value.trim();if(required&&!value)fail_('Preencha os campos obrigatórios.');return value;}
function rows_(name){const sheet=book_().getSheetByName(name);if(!sheet)throw new Error('Execute a configuração inicial.');return sheet.getDataRange().getValues().slice(1);}
function publicText_(value,max){return String(value==null?'':value).slice(0,max||2000);}
function publicUrl_(value){return /^https:\/\/[^\s]+$/i.test(String(value||''))?String(value):'';}
function yes_(value){return String(value).trim().toLowerCase()==='sim';}
function money_(value){if(typeof value==='number')return Number.isFinite(value)?value:0;return Number(String(value||'').replace(/R\$|\s/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.'))||0;}
function instant_(){return Utilities.formatDate(new Date(),'America/Bahia',"yyyy-MM-dd'T'HH:mm:ssXXX");}
function withLock_(fn){const lock=LockService.getScriptLock();if(!lock.tryLock(10000))fail_('Há outro envio em andamento. Aguarde e tente novamente.','BUSY');try{return fn();}finally{lock.releaseLock();}}
function output_(object){return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);}
function doGet(){return output_({ok:false,message:'Acesso disponível apenas pela integração segura.'});}
function doPost(event){
  try{
    if(!event||!event.postData||event.postData.contents.length>14000)fail_('Pedido inválido.');
    const body=JSON.parse(event.postData.contents),secret=PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if(!secret||secret.length<32||body.secret!==secret)fail_('Acesso não autorizado.','AUTH');
    if(!['public','availability','choose','rsvp'].includes(body.action))fail_('Operação inválida.');
    if(!/^[a-f0-9]{64}$/.test(body.client||''))fail_('Origem inválida.');
    withLock_(function(){const cache=CacheService.getScriptCache(),write=['choose','rsvp'].includes(body.action),key=(write?'write:':'read:')+body.client,count=Number(cache.get(key)||0);if(count>=(write?8:90))fail_('Muitos pedidos. Aguarde um minuto antes de tentar novamente.','RATE_LIMIT');cache.put(key,String(count+1),60);});
    const data=body.data||{};let result;
    if(body.action==='public')result=publicData_();
    if(body.action==='availability')result=availability_(checked_(data.id,100,true));
    if(body.action==='choose')result=withLock_(function(){return choose_(data);});
    if(body.action==='rsvp')result=withLock_(function(){return rsvp_(data);});
    return output_({ok:true,data:result});
  }catch(error){return output_({ok:false,code:error.code||'SERVER',message:error.code?error.message:'O serviço está temporariamente indisponível. Tente novamente.'});}
}
function publicData_(){
  const all=rows_('Presentes'),counts={};all.forEach(function(r){const id=String(r[0]).trim();counts[id]=(counts[id]||0)+1;});
  const gifts=all.filter(function(r){return yes_(r[8])&&String(r[0]).trim()&&r[1];}).map(function(r){const status=String(r[11]).trim();return{id:publicText_(r[0],100).trim(),name:publicText_(r[1],200),category:publicText_(r[2],100),description:publicText_(r[3]),price:money_(r[4]),image:publicUrl_(r[5]),store:publicText_(r[6],200),url:publicUrl_(r[7]),status:counts[String(r[0]).trim()]!==1||(status&&status!=='Disponível')?'Escolhido':'Disponível'};});
  // Lista explícita: nenhuma coluna privada é retornada.
  const hotels=rows_('Hoteis').filter(function(r){return r[0];}).map(function(r){return{name:publicText_(r[0],200),image:publicUrl_(r[1]),address:publicText_(r[2],500),phone:publicText_(r[3],30),whatsapp:publicText_(r[4],30),url:publicUrl_(r[5]),notes:publicText_(r[6])};});
  const artists=rows_('Maquiadores').filter(function(r){return r[0];}).map(function(r){let instagram=String(r[5]||'').trim();if(/^@?[a-zA-Z0-9_.]+$/.test(instagram))instagram='https://www.instagram.com/'+instagram.replace(/^@/,'')+'/';return{name:publicText_(r[0],200),image:publicUrl_(r[1]),specialty:publicText_(r[2],500),phone:publicText_(r[3],30),whatsapp:publicText_(r[4],30),instagram:publicUrl_(instagram),notes:publicText_(r[6])};});
  const config={};rows_('Pix').forEach(function(r){config[String(r[0]).trim()]=r[1];});
  const enabled=yes_(config['Habilitar Pix no site?'])&&!!config['Chave Pix']&&!!config['Nome do recebedor']&&!!config['Cidade do recebedor'];
  const pix=enabled?{enabled:true,key:String(config['Chave Pix']).trim(),name:String(config['Nome do recebedor']).trim(),city:String(config['Cidade do recebedor']).trim(),amounts:String(config['Valores sugeridos (R$)']||'50, 100, 200').split(/[,;]/).map(Number).filter(function(n){return n>0&&n<=999999.99;}).slice(0,6),message:publicText_(config['Mensagem'])}:{enabled:false};
  return{gifts:gifts,hotels:hotels,artists:artists,pix:pix};
}
function giftRow_(id){const matches=[];rows_('Presentes').forEach(function(row,index){if(String(row[0]).trim()===id)matches.push({row:row,index:index+2});});if(matches.length!==1)fail_('Este presente não está disponível. Atualize a lista.','CONFLICT');return matches[0];}
function available_(row){const status=String(row[11]).trim();return yes_(row[8])&&(!status||status==='Disponível');}
function availability_(id){return{id:id,available:available_(giftRow_(id).row)};}
function choiceValidation_(data){const name=checked_(data.name,120,true),phone=checked_(data.phone||'',30,false),id=checked_(data.id,100,true),requestId=checked_(data.requestId,80,true);if(name.split(/\s+/).length<2)fail_('Informe seu nome completo.');if(phone&&!/^\+?[\d\s().-]{8,30}$/.test(phone))fail_('Informe um telefone válido com DDD.');if(!/^[a-f0-9-]{36}$/.test(requestId))fail_('Identificador inválido.');return{name:name,phone:phone,id:id,requestId:requestId};}
function choose_(data){
  data=choiceValidation_(data);
  const gift=giftRow_(data.id),history=rows_('Escolhas'),marker='request:'+data.requestId;
  // Idempotência: a repetição do mesmo pedido não cria outra entrada no histórico.
  const previous=history.filter(function(r){return String(r[1])===data.id;});
  if(previous.some(function(r){return r[6]==='Escolha'&&r[7]===marker;})){
    const latest=previous[previous.length-1];
    if(latest[7]===marker&&String(gift.row[11]).trim()==='Escolhido')return{id:data.id,status:'Escolhido'};
    fail_('Esta escolha foi alterada pelos noivos. Atualize a lista.','CONFLICT');
  }
  if(!available_(gift.row))fail_('Este presente já foi escolhido. Atualizamos a lista para você.','CONFLICT');
  const now=instant_(),b=book_();
  // Sheets batchUpdate é atômico: status e histórico são gravados juntos, sob LockService.
  Sheets.Spreadsheets.batchUpdate({requests:[updateRow_(b.getSheetByName('Presentes').getSheetId(),gift.index,11,['Escolhido',data.name,data.phone,now]),appendRow_(b.getSheetByName('Escolhas').getSheetId(),[now,data.id,String(gift.row[1]),data.name,data.phone,'','Escolha',marker])]},SPREADSHEET_ID);
  return{id:data.id,status:'Escolhido'};
}
function cell_(value){return{userEnteredValue:typeof value==='number'?{numberValue:value}:{stringValue:String(value==null?'':value)}};}
function updateRow_(sheetId,row,column,values){return{updateCells:{range:{sheetId:sheetId,startRowIndex:row-1,endRowIndex:row,startColumnIndex:column,endColumnIndex:column+values.length},rows:[{values:values.map(cell_)}],fields:'userEnteredValue'}};}
function appendRow_(sheetId,values){return{appendCells:{sheetId:sheetId,rows:[{values:values.map(cell_)}],fields:'userEnteredValue'}};}
function rsvp_(data){
  const name=checked_(data.name,120,true),email=checked_(data.email||'',254,false),phone=checked_(data.phone||'',30,false),notes=checked_(data.notes||'',1500,false),id=checked_(data.responseId,80,true);
  if(!/^[a-f0-9-]{36}$/.test(id)||name.split(/\s+/).length<2)fail_('Informe seu nome completo e um identificador válido.');
  if(!['Sim','Não'].includes(data.attending))fail_('Informe se você irá ao casamento.');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail_('Informe um e-mail válido.');
  if(phone&&!/^\+?[\d\s().-]{8,30}$/.test(phone))fail_('Informe um telefone válido com DDD.');
  if(!email&&!phone)fail_('Informe pelo menos uma forma de contato.');
  const adults=data.attending==='Não'?0:Number(data.adults),children=data.attending==='Não'?0:Number(data.children);
  if(!Number.isInteger(adults)||adults<(data.attending==='Sim'?1:0)||adults>30||!Number.isInteger(children)||children<0||children>30)fail_('Confira as quantidades de adultos e crianças.');
  const sheet=book_().getSheetByName('Confirmacoes'),existing=rows_('Confirmacoes').findIndex(function(r){return r[0]===id;});
  const values=[id,instant_(),name,data.attending,adults,children,email,phone,notes];
  // StringValue impede injeção de fórmulas em todos os campos livres.
  const request=existing>=0?updateRow_(sheet.getSheetId(),existing+2,0,values):appendRow_(sheet.getSheetId(),values);
  Sheets.Spreadsheets.batchUpdate({requests:[request]},SPREADSHEET_ID);
  return{recorded:true};
}
/** Execute manualmente no editor, uma vez. Não modifica dados/cabeçalhos já preenchidos. */
function configurarInicial(){
  return withLock_(function(){
    const b=book_();
    // Valide tudo antes de escrever qualquer cabeçalho.
    Object.keys(HEADERS).forEach(function(name){const sheet=b.getSheetByName(name);if(!sheet)return;const expected=HEADERS[name],actual=sheet.getRange(1,1,1,expected.length).getValues()[0];expected.forEach(function(header,i){if(actual[i]&&actual[i]!==header)throw new Error('Cabeçalho diferente em '+name+', coluna '+(i+1)+'. Confira antes de configurar.');});});
    Object.keys(HEADERS).forEach(function(name){const sheet=b.getSheetByName(name)||b.insertSheet(name);HEADERS[name].forEach(function(header,i){const cell=sheet.getRange(1,i+1);if(cell.isBlank())cell.setValue(header);});if(sheet.getFrozenRows()<1)sheet.setFrozenRows(1);});
    // Apenas cria configurações Pix ausentes; preserva todas as configurações existentes.
    const pix=b.getSheetByName('Pix'),keys=rows_('Pix').map(function(r){return String(r[0]);});
    [['Habilitar Pix no site?','Não'],['Chave Pix',''],['Nome do recebedor',''],['Cidade do recebedor',''],['Valores sugeridos (R$)','50, 100, 200'],['Mensagem','Sua presença é nosso maior presente!']].forEach(function(row){if(!keys.includes(row[0]))pix.appendRow(row);});
  });
}
/** Administração somente pelo editor autorizado. Nunca acessível por doPost. */
function liberarPresenteAdministrativo(){
  const ui=SpreadsheetApp.getUi(),idPrompt=ui.prompt('Liberar presente','Informe o ID exato do presente:',ui.ButtonSet.OK_CANCEL);if(idPrompt.getSelectedButton()!==ui.Button.OK)return;
  const reasonPrompt=ui.prompt('Motivo','Registre o motivo da desistência:',ui.ButtonSet.OK_CANCEL);if(reasonPrompt.getSelectedButton()!==ui.Button.OK)return;
  const id=idPrompt.getResponseText().trim(),reason=checked_(reasonPrompt.getResponseText(),500,true);
  withLock_(function(){const gift=giftRow_(id);if(String(gift.row[11]).trim()!=='Escolhido')fail_('O presente não está marcado como escolhido.');const b=book_(),now=instant_();Sheets.Spreadsheets.batchUpdate({requests:[updateRow_(b.getSheetByName('Presentes').getSheetId(),gift.index,11,['Disponível','','','']),appendRow_(b.getSheetByName('Escolhas').getSheetId(),[now,id,String(gift.row[1]),String(gift.row[12]||''),String(gift.row[13]||''),'','Liberação administrativa',reason])]},SPREADSHEET_ID);});
  ui.alert('Presente liberado e alteração registrada no histórico.');
}
function onOpen(){SpreadsheetApp.getUi().createMenu('Casamento').addItem('Liberar presente com histórico','liberarPresenteAdministrativo').addToUi();}
