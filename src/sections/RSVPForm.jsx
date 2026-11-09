import { useRef, useState } from 'react';
import { Heart, Check } from 'lucide-react';
import Section from '../components/Section';
import FormExtras from '../components/FormExtras';
import { api, demo } from '../services/api';
import { validateRSVP } from '../utils/validation';
function getResponseId() { try { let id = localStorage.getItem('wedding-response'); if(!id) { id=crypto.randomUUID();localStorage.setItem('wedding-response',id); } return id; } catch { return crypto.randomUUID(); } }
export default function RSVPForm() {
  const [attending,setAttending] = useState('Sim'), [busy,setBusy] = useState(false), [error,setError] = useState(''), [success,setSuccess] = useState('');
  const responseId = useRef(null), startedAt = useRef(Date.now()); if (!responseId.current) responseId.current = getResponseId();
  async function submit(event) {
    event.preventDefault(); if (busy) return; setError('');setSuccess('');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const data = validateRSVP({ ...values, responseId:responseId.current });
      setBusy(true); await api('rsvp',{ ...data,website:values.website,startedAt:startedAt.current });
      setSuccess(attending==='Sim' ? 'Presença confirmada com sucesso! Ficamos muito felizes em ter você conosco neste dia tão especial.' : 'Recebemos sua resposta com carinho. Sentiremos sua falta, mas agradecemos por nos avisar.');
    } catch(err) {setError(err.message);} finally {setBusy(false);}
  }
  return <Section id="confirmacao" eyebrow="Você faz parte deste dia" title="Confirme sua presença" className="rsvp-section"><p className="section-intro">Será uma alegria imensa celebrar este dia com você! Por favor, confirme sua presença para nos ajudar a preparar tudo com muito carinho.</p><div className="rsvp-card"><div className="rsvp-card-header"><Heart size={22} strokeWidth={1}/><span className="script">Esperamos por você</span><p>Preencha com carinho os campos abaixo.</p></div>{demo && <p className="notice">Visualização demonstrativa. Configure a integração para registrar sua resposta.</p>}{success ? <div className="rsvp-success" role="status"><Check size={35}/><p>{success}</p><button className="button outline" onClick={() => {setSuccess('');startedAt.current=Date.now();}}>Atualizar minha resposta</button></div> : <form onSubmit={submit}><label>Nome completo *<input name="name" autoComplete="name" placeholder="Como você se chama?" required maxLength={120}/></label><fieldset><legend>Você irá ao casamento? *</legend><div className="radio-options">{['Sim','Não'].map(value => <label key={value}><input name="attending" type="radio" value={value} checked={attending===value} onChange={() => setAttending(value)}/>{value === 'Sim' ? 'Sim, estarei presente' : 'Não poderei ir'}</label>)}</div></fieldset>{attending==='Sim' && <div className="form-row"><label>Adultos, incluindo você *<input type="number" name="adults" defaultValue="1" min="1" max="30" required inputMode="numeric"/></label><label>Crianças *<input type="number" name="children" defaultValue="0" min="0" max="30" required inputMode="numeric"/></label></div>}<div className="form-row"><label>E-mail<input name="email" type="email" autoComplete="email" maxLength={254} placeholder="seu@email.com"/></label><label>Telefone / WhatsApp<input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="Com DDD"/></label></div><p className="field-help">Informe pelo menos uma forma de contato: e-mail ou telefone.</p><label>Observações <span>(opcional)</span><textarea name="notes" maxLength={1500} rows={3} placeholder="Algo que você gostaria de nos contar?"/></label><FormExtras/>{error && <p className="error" role="alert">{error}</p>}<button className="button submit" disabled={busy || demo}>{busy ? 'Enviando sua resposta…' : 'Enviar confirmação'}<Heart size={16}/></button><p className="privacy">Seus dados serão utilizados apenas para a organização do casamento. Neste navegador, um novo envio atualiza sua resposta anterior. Use um navegador separado para responder por outra família.</p></form>}</div></Section>;
}
