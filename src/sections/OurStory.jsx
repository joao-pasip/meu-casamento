import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import Section from '../components/Section';
import '../styles/story-book.css';
import { wedding } from '../data/wedding';
const chapters = [
  { title: 'Um encontro pela Providência', start: 0, end: 3 },
  { title: '600 km até você', start: 3, end: 4 },
  { title: 'A certeza do amor', start: 4, end: 5 },
  { title: 'O nosso sim', start: 5, end: 6 },
  { title: 'Até o altar', start: 6, end: 8 },
];
const numerals = ['I', 'II', 'III', 'IV', 'V'];
function pages(paragraphs) {
  if (paragraphs.length > 1) return [paragraphs.slice(0, 1), paragraphs.slice(1)];
  const sentences = (paragraphs[0] || '').match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [''];
  const middle = Math.ceil(sentences.length / 2);
  return [[sentences.slice(0, middle).join('').trim()], [sentences.slice(middle).join('').trim()].filter(Boolean)];
}
export default function OurStory() {
  const [index, setIndex] = useState(0), [complete, setComplete] = useState(false);
  const [side, setSide] = useState(0), [mobile, setMobile] = useState(() => window.matchMedia('(max-width:640px)').matches);
  const heading = useRef(null), rightHeading = useRef(null), touch = useRef(null);
  useEffect(() => { const query = window.matchMedia('(max-width:640px)'); const update = () => setMobile(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }, []);
  const paragraphs = wedding.story.text.split('\n\n'), chapter = chapters[index];
  const [left, right] = pages(paragraphs.slice(chapter.start, chapter.end));
  function move(next, nextSide = 0) {
    setIndex(Math.max(0, Math.min(chapters.length - 1, next))); setSide(nextSide);
    requestAnimationFrame(() => {
      const target = mobile && nextSide === 1 ? rightHeading.current : heading.current;
      target?.focus({ preventScroll: true });
      if (target?.getBoundingClientRect().top < 85) target.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  const leafCounts = chapters.map(item => pages(paragraphs.slice(item.start, item.end))[1].length ? 2 : 1);
  const firstLeaf = chapterIndex => leafCounts.slice(0, chapterIndex).reduce((sum, count) => sum + count, 0);
  const position = mobile ? firstLeaf(index) + side : index, total = mobile ? leafCounts.reduce((sum, count) => sum + count, 0) : chapters.length;
  function turn(delta) {
    const next = Math.max(0, Math.min(total - 1, position + delta));
    if (!mobile) { move(next); return; }
    const chapterIndex = chapters.findIndex((item, i) => next < firstLeaf(i) + leafCounts[i]);
    move(chapterIndex, next - firstLeaf(chapterIndex));
  }
  return <Section id="historia" eyebrow="Escrito pela Providência" title="Nossa história">
    <p className="book-intro">O começo do nosso para sempre, um capítulo de cada vez.</p>
    <div className="book-toolbar"><button type="button" className="text-button" aria-pressed={complete} onClick={() => setComplete(value => !value)}><BookOpen size={16}/>{complete ? 'Voltar ao livro' : 'Ler a história completa'}</button></div>
    {complete ? <div className="story story-complete">{paragraphs.map((text, i) => <p key={i}>{text}</p>)}</div> : <div className="story-book" role="region" aria-label="Livro da nossa história" onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); turn(event.key === 'ArrowLeft' ? -1 : 1); }
    }}>
      <div className="book-spread" key={`${index}-${side}`} onTouchStart={event => { touch.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }} onTouchCancel={() => { touch.current = null; }} onTouchMove={event => { const start = touch.current; if (start && (event.touches.length !== 1 || Math.abs(event.touches[0].clientY - start.y) > 24)) touch.current = null; }} onTouchEnd={event => {
        const start = touch.current; touch.current = null;
        if (!start || !event.changedTouches.length || window.getSelection()?.toString()) return;
        const dx = event.changedTouches[0].clientX - start.x, dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) turn(dx < 0 ? 1 : -1);
      }}>
        <div className="book-page book-page-left" hidden={mobile && side !== 0}><p className="eyebrow">Capítulo {numerals[index]}</p><h3 ref={heading} tabIndex={-1}>{chapter.title}</h3><div className="book-ornament" aria-hidden="true"><span/><Heart size={14}/><span/></div>{left.map((text, i) => <p className="book-copy" key={i}>{text}</p>)}<span className="book-folio" aria-hidden="true">{index * 2 + 1}</span></div>
        <div className="book-page book-page-right" hidden={mobile && side !== 1}><p className="book-running-title" aria-hidden="true">João Paulo &amp; Paloma</p>{mobile && <div className="book-continuation"><p className="eyebrow">Capítulo {numerals[index]} · continuação</p><h3 ref={rightHeading} tabIndex={-1}>{chapter.title}</h3></div>}{right.map((text, i) => <p className="book-copy" key={i}>{text}</p>)}<span className="book-folio" aria-hidden="true">{index * 2 + 2}</span></div>
      </div>
      <nav className="book-navigation" aria-label="Páginas da nossa história"><button type="button" className="book-arrow" disabled={position === 0} onClick={() => turn(-1)} aria-label={mobile ? 'Página anterior' : 'Capítulo anterior'}><ChevronLeft size={18}/><span>Anterior</span></button><span className="book-progress" aria-live="polite">{mobile ? `Página ${position + 1} de ${total}` : `Capítulo ${index + 1} de ${chapters.length}`}</span><button type="button" className="book-arrow" disabled={position === total - 1} onClick={() => turn(1)} aria-label={mobile ? 'Próxima página' : 'Próximo capítulo'}><span>Próximo</span><ChevronRight size={18}/></button></nav>
      <div className="book-chapters" role="group" aria-label="Ir para um capítulo">{chapters.map((item, i) => <button type="button" key={item.title} aria-label={`Capítulo ${i + 1}: ${item.title}`} aria-current={index === i ? 'step' : undefined} onClick={() => move(i)}>{numerals[i]}</button>)}</div>
    </div>}
    {wedding.story.provisional && <p className="muted">Este espaço está sendo preparado pelos noivos.</p>}
  </Section>;
}
