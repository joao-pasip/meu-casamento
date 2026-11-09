import { useEffect, useState } from 'react';
import Section from '../components/Section';
import { wedding } from '../data/wedding';
import { countdown } from '../utils/validation';
export default function WeddingCountdown() {
  const [remaining, setRemaining] = useState(() => countdown(wedding.instant));
  useEffect(() => { const id = setInterval(() => setRemaining(countdown(wedding.instant)), 1000); return () => clearInterval(id); }, []);
  return <Section id="contagem" eyebrow="Cada dia, mais perto" title="Contando os dias para o nosso sim!" className="countdown-section">{remaining.done ? <p className="big-day" role="status">Chegou o nosso grande dia!</p> : <div className="countdown" role="timer" aria-label="Tempo até o casamento">{remaining.values.map((value, i) => <div key={i}><span>{String(value).padStart(2,'0')}</span><small>{['Dias','Horas','Minutos','Segundos'][i]}</small></div>)}</div>}</Section>;
}
