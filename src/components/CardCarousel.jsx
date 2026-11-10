import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CardCarousel({ children, label }) {
  const track = useRef(null);
  const [position, setPosition] = useState({ index: 0, end: false });
  const count = children.length;
  useEffect(() => {
    const element = track.current;
    function update() {
      const slides = [...element.children];
      const index = slides.reduce((best, slide, i) => Math.abs(slide.offsetLeft - element.offsetLeft - element.scrollLeft) < Math.abs(slides[best].offsetLeft - element.offsetLeft - element.scrollLeft) ? i : best, 0);
      setPosition({ index, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 4 });
    }
    element.scrollLeft = 0;
    element.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => { element.removeEventListener('scroll', update); observer.disconnect(); };
  }, [count]);
  function move(delta) {
    const element = track.current;
    const next = element.children[Math.max(0, Math.min(count - 1, position.index + delta))];
    element.scrollTo({ left: next.offsetLeft - element.offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <div className="card-carousel" role="region" aria-roledescription="carrossel" aria-label={label}>
    <div className="card-carousel-track" ref={track} tabIndex={0} onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }}>{children}</div>
    {count > 1 && <div className="carousel-navigation"><button type="button" className="icon-button" aria-label={`Anterior: ${label}`} disabled={position.index === 0} onClick={() => move(-1)}><ChevronLeft/></button><span aria-live="polite">{position.index + 1} de {count}</span><button type="button" className="icon-button" aria-label={`Próximo: ${label}`} disabled={position.end} onClick={() => move(1)}><ChevronRight/></button></div>}
  </div>;
}
