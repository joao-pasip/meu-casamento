const ascii = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 $%*+\-./:]/g,'').trim();
const field = (id, value) => { if (!value || value.length > 99) throw new Error('Configuração Pix inválida.'); return id + String(value.length).padStart(2,'0') + value; };
export function crc16(value) { let crc = 0xffff; for (const char of value) { crc ^= char.charCodeAt(0) << 8; for (let i=0; i<8; i++) crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff; } return crc.toString(16).toUpperCase().padStart(4,'0'); }
export function validPixConfig(config) {
  if (!config?.enabled) return false;
  const key = String(config.key || ''), name = ascii(config.name), city = ascii(config.city);
  const validKey = /^\d{11}$|^\d{14}$|^\+55\d{10,11}$|^[^\s@]+@[^\s@]+\.[^\s@]+$|^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(key);
  return validKey && /^[\x20-\x7e]{1,77}$/.test(key) && name.length > 0 && name.length <= 25 && city.length > 0 && city.length <= 15;
}
export function buildPix(config, amount) {
  if (!validPixConfig(config)) throw new Error('Pix ainda não configurado.');
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0.01 || value > 999999.99 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) throw new Error('Informe um valor entre R$ 0,01 e R$ 999.999,99, com até duas casas decimais.');
  const account = field('00','br.gov.bcb.pix') + field('01',config.key);
  const payload = field('00','01') + field('26',account) + field('52','0000') + field('53','986') + field('54',value.toFixed(2)) + field('58','BR') + field('59',ascii(config.name)) + field('60',ascii(config.city)) + field('62',field('05','***')) + '6304';
  return payload + crc16(payload);
}
