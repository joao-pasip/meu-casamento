import { useState } from 'react';
import CardCarousel from '../components/CardCarousel';
import { BedDouble, Sparkles, ExternalLink, Phone, MessageCircle, Instagram } from 'lucide-react';
import Section from '../components/Section';
import { safeUrl } from '../utils/validation';
function Image({ src, alt }) { return safeUrl(src) ? <img src={safeUrl(src)} alt={alt} loading="lazy" onError={e => { e.currentTarget.hidden = true; }}/> : null; }
function Contact({ item }) {
  const phone = String(item.phone || '').replace(/[^\d+]/g,''), whatsapp = String(item.whatsapp || '').replace(/\D/g,'');
  return <div className="contact-links">{phone && <a href={`tel:${phone}`}><Phone size={15}/>{item.phone}</a>}{whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={15}/>WhatsApp</a>}{safeUrl(item.instagram) && <a href={safeUrl(item.instagram)} target="_blank" rel="noopener noreferrer"><Instagram size={15}/>Instagram</a>}{safeUrl(item.url) && <a href={safeUrl(item.url)} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>Saiba mais</a>}</div>;
}
function Content({ items, state, kind }) {
  if (state.loading) return <p className="empty" role="status">Preparando as recomendações…</p>;
  if (state.error) return <div className="empty" role="alert"><p>Não foi possível carregar as recomendações.</p><small>{state.error}</small><button className="text-button" onClick={state.refresh}>Tentar novamente</button></div>;
  if (!items?.length) return <div className="empty">{kind === 'hotel' ? <BedDouble size={27} strokeWidth={1}/> : <Sparkles size={27} strokeWidth={1}/>}<p>Estamos preparando nossas recomendações com carinho.</p><small>Volte em breve para conferir.</small></div>;
  return <CardCarousel label={kind === 'hotel' ? 'Hospedagem' : 'Profissionais de beleza'}>{items.map((item,i) => <article key={`${item.name}-${i}`} className="recommendation-card"><Image src={item.image} alt={item.name}/><div><h3>{item.name}</h3>{item.specialty && <p>{item.specialty}</p>}{item.address && <p>{item.address}</p>}{item.notes && <p className="muted">{item.notes}</p>}<Contact item={item}/></div></article>)}</CardCarousel>;
}
export function Hotels({ state }) { return <Section id="hospedagem" eyebrow="Sinta-se em casa" title="Onde se hospedar"><p className="section-intro">Vem de outra cidade? Queremos que sua estadia em Amargosa seja tão especial quanto a sua presença. Aqui você encontrará nossas sugestões de hospedagem.</p><Content items={state.data?.hotels} state={state} kind="hotel"/></Section>; }
export function MakeupArtists({ state }) {
  const [category, setCategory] = useState('');
  const artists = state.data?.artists || [];
  const services = item => String(item.specialty || '').split(/[,;|/]+/).map(value => value.trim()).filter(Boolean);
  const categories = [...new Set(artists.flatMap(services))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const filtered = artists.filter(item => !category || services(item).includes(category));
  return <Section id="beleza" eyebrow="Cuide de você, celebre com a gente" title="Beleza e preparação" className="tinted">
    <p className="section-intro">Encontre profissionais para se preparar para este dia e fale diretamente com eles.</p>
    {!state.loading && !state.error && categories.length > 0 && <div className="filters beauty-filters"><label>Serviço<select aria-label="Serviço" value={category} onChange={event => setCategory(event.target.value)}><option value="">Todos os serviços</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label></div>}
    <Content key={category} items={filtered} state={state} kind="artist"/>
  </Section>;
}
