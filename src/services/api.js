export const demo = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE !== 'false';
const sample = { gifts: [{ id: 'DEMO', name: 'Exemplo de presente', description: 'Item demonstrativo para visualizar a lista. Não está disponível para escolha.', category: 'Demonstração', price: 150, store: 'Loja a definir', image: '', url: '', status: 'Disponível' }], hotels: [], artists: [], pix: { enabled: false } };
export async function api(action, data = {}) {
  if (demo) {
    if (action === 'public') return structuredClone(sample);
    throw new Error('Modo demonstrativo: nenhuma informação foi gravada. Configure a integração para enviar.');
  }
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch('/api/wedding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, data }), signal: controller.signal });
    const result = await response.json();
    if (!response.ok || !result.ok) { const error = new Error(result.message || 'Não foi possível concluir. Tente novamente.'); error.code = result.code; throw error; }
    return result.data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('O servidor demorou a responder. Tente novamente; seu envio não será duplicado.');
    if (error instanceof SyntaxError || error instanceof TypeError) throw new Error('Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.');
    throw error;
  } finally { clearTimeout(timer); }
}
