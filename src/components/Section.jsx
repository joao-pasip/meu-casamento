import { Heart } from 'lucide-react';
export default function Section({ id, eyebrow, title, children, className = '' }) {
  return <section id={id} className={`section ${className}`} aria-labelledby={`${id}-title`}><div className="container"><div className="section-heading">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id={`${id}-title`}>{title}</h2><div className="flourish" aria-hidden="true"><span/><Heart size={13}/><span/></div></div>{children}</div></section>;
}
