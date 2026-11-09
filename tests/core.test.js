import test from 'node:test';
import assert from 'node:assert/strict';
import { countdown, validateRSVP, validateGift, safeUrl } from '../src/utils/validation.js';
import { buildPix, crc16, validPixConfig } from '../src/utils/pix.js';
const base={name:'Pessoa Teste',email:'teste@example.com',phone:'',attending:'Sim',adults:1,children:0,notes:'',responseId:'00000000-0000-4000-8000-000000000001'};
test('contagem respeita UTC-03 e encerra sem negativos',()=>{
  const target='2027-04-10T17:00:00-03:00';
  assert.deepEqual(countdown(target,Date.parse('2027-04-09T19:59:59Z')).values,[1,0,0,1]);
  assert.equal(countdown(target,Date.parse('2027-04-10T20:00:00Z')).done,true);
  assert.deepEqual(countdown(target,Date.parse('2028-01-01')).values,[0,0,0,0]);
});
test('RSVP exige contato, nome completo e quantidades inteiras',()=>{
  assert.equal(validateRSVP(base).adults,1);
  for(const patch of [{name:'Ana'},{email:''},{adults:0},{children:-1},{children:1.5},{email:'inválido'},{phone:'abc'},{adults:31}])assert.throws(()=>validateRSVP({...base,...patch}));
  assert.deepEqual([validateRSVP({...base,attending:'Não',adults:-1,children:2}).adults,validateRSVP({...base,attending:'Não'}).children],[0,0]);
});
test('presente valida identificação e links recusam protocolos executáveis',()=>{
  assert.throws(()=>validateGift({name:'Teste',id:'x',requestId:'r'}));
  assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('http://example.com'),'');
  assert.equal(safeUrl('https://example.com/'),'https://example.com/');
});
test('BR Code contém valor, nome normalizado, txid e checksum CRC16 correto',()=>{
  // Fixture sintética, nunca utilizada no site. Não é chave dos noivos.
  const config={enabled:true,key:'teste@example.com',name:'Pessoa de Teste',city:'São Paulo'};
  assert.equal(crc16('123456789'),'29B1');
  const code=buildPix(config,50);
  assert.ok(code.includes('540550.00'));assert.ok(code.includes('SAO PAULO'));assert.ok(code.includes('62070503***'));
  assert.equal(code.slice(-4),crc16(code.slice(0,-4)));
  assert.notEqual(code,buildPix(config,100));
  for(const amount of [0,-1,1.001,Infinity,'abc'])assert.throws(()=>buildPix(config,amount));
  assert.equal(validPixConfig({...config,key:''}),false);assert.equal(validPixConfig({...config,enabled:false}),false);
});
