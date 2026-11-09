import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { navigation } from '../data/wedding';
export default function Header() {
  const [open, setOpen] = useState(false);
  return <><a className="skip" href="#conteudo">Pular para o conteúdo</a><header className="header"><a className="monogram" href="#inicio" aria-label="João Paulo e Paloma, início">J<span>&</span>P</a><button type="button" className="icon-button menu-toggle" aria-expanded={open} aria-controls="navigation" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button><nav id="navigation" aria-label="Navegação principal" className={open ? 'nav open' : 'nav'} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}>{navigation.map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>)}<a className="button small" href="#confirmacao" onClick={() => setOpen(false)}>Confirmar presença</a></nav></header></>;
}
