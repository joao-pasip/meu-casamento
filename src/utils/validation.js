export function text(value, max = 200, required = false) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error('Confira o conteúdo dos campos.');
  const result = value.trim();
  if (required && !result) throw new Error('Preencha todos os campos obrigatórios.');
  return result;
}
export function validateRSVP(data) {
  const name = text(data.name, 120, true), email = text(data.email || '', 254), phone = text(data.phone || '', 30);
  if (name.split(/\s+/).length < 2) throw new Error('Informe seu nome completo.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.');
  if (phone && !/^\+?[\d\s().-]{8,30}$/.test(phone)) throw new Error('Informe um telefone válido com DDD.');
  if (!email && !phone) throw new Error('Informe pelo menos um contato: e-mail ou telefone.');
  if (!['Sim', 'Não'].includes(data.attending)) throw new Error('Informe se você irá ao casamento.');
  let adults = Number(data.adults), children = Number(data.children);
  if (data.attending === 'Não') { adults = 0; children = 0; }
  if (!Number.isInteger(adults) || adults < (data.attending === 'Sim' ? 1 : 0) || adults > 30 || !Number.isInteger(children) || children < 0 || children > 30) throw new Error('Confira as quantidades de adultos e crianças (até 30 por resposta).');
  return { name, email, phone, attending: data.attending, adults, children, notes: text(data.notes || '', 1500), responseId: text(data.responseId, 80, true) };
}
export function validateGift(data) {
  const name = text(data.name, 120, true), phone = text(data.phone || '', 30);
  if (name.split(/\s+/).length < 2) throw new Error('Informe seu nome completo.');
  if (phone && !/^\+?[\d\s().-]{8,30}$/.test(phone)) throw new Error('Informe um telefone válido com DDD.');
  return { name, phone, id: text(data.id, 100, true), requestId: text(data.requestId, 80, true) };
}
export function safeUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}
export function countdown(target, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  return { done: seconds === 0, values: [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60] };
}
