import { useRef, useState } from 'react';
import Modal from './Modal';
import FormExtras from './FormExtras';
import { api, demo } from '../services/api';
import { validateGift } from '../utils/validation';
export default function GiftSelectionModal({ gift, onClose, onSuccess, onConflict }) {
  const [busy,setBusy] = useState(false), [error,setError] = useState('');
  const requestId = useRef(crypto.randomUUID()), startedAt = useRef(Date.now());
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    setError('');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const data = validateGift({ ...values, id:gift.id, requestId:requestId.current });
      setBusy(true);
      await api('choose', { ...data, website:values.website, startedAt:startedAt.current });
      onSuccess(gift.id);
    } catch(err) { setError(err.message); if (err.code === 'CONFLICT') onConflict(); }
    finally { setBusy(false); }
  }
  return <Modal title="Um presente com carinho" onClose={() => { if (!busy) onClose(); }}><p className="modal-gift-name">{gift.name}</p><p>Você pode comprar onde preferir. A escolha reserva a sugestão na lista e não significa que a compra foi realizada.</p>{demo && <p className="notice">Demonstração: este formulário não grava dados.</p>}<form onSubmit={submit}><label>Nome completo *<input name="name" autoComplete="name" required maxLength={120}/></label><label>Telefone / WhatsApp <span>(opcional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={30}/></label><FormExtras/>{error && <p role="alert" className="error">{error}</p>}<p className="privacy">Seus dados serão vistos apenas pelos noivos para organizar os presentes.</p><div className="form-actions"><button type="button" className="button outline" disabled={busy} onClick={onClose}>Cancelar</button><button className="button" disabled={busy || demo}>{busy ? 'Registrando…' : 'Confirmar escolha'}</button></div></form></Modal>;
}
