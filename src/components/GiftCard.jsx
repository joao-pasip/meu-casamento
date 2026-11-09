import { Gift, ExternalLink, Check } from 'lucide-react';
import { safeUrl } from '../utils/validation';
export const money = value => new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL' }).format(value);
export default function GiftCard({ gift, onChoose }) {
  const chosen = gift.status === 'Escolhido';
  return <article className={`gift-card ${chosen ? 'chosen' : ''}`}><div className="gift-image">{safeUrl(gift.image) ? <img src={safeUrl(gift.image)} alt={gift.name} loading="lazy" onError={e => { e.currentTarget.style.display='none'; }}/>: <Gift size={44} strokeWidth={1}/>}<span className="availability">{chosen ? <><Check size={12}/>Já escolhido</> : 'Disponível'}</span></div><div className="gift-content"><p className="eyebrow">{gift.category || 'Com carinho'}</p><h3>{gift.name}</h3><p>{gift.description}</p>{Number.isFinite(gift.price) && gift.price > 0 && <p className="price">{money(gift.price)}<small>valor de referência</small></p>}{gift.store && <p className="store">Loja sugerida: {gift.store}</p>}{safeUrl(gift.url) && <a className="reference-link" href={safeUrl(gift.url)} target="_blank" rel="noopener noreferrer">Ver sugestão <ExternalLink size={13}/></a>}<button className="button" type="button" disabled={chosen} onClick={() => onChoose(gift)}>{chosen ? 'Já escolhido' : 'Escolher este presente'}</button></div></article>;
}
