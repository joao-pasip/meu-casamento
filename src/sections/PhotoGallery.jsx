import { useState } from 'react';
import { useRef } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import Section from '../components/Section';
import Modal from '../components/Modal';
import { wedding } from '../data/wedding';

export default function PhotoGallery() {
  const photos = wedding.photos;
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const touchStart = useRef(null);
  const suppressClickUntil = useRef(0);
  const move = delta => setIndex(current => (current + delta + photos.length) % photos.length);
  const swipeHandlers = {
    onTouchStart: event => {
      touchStart.current = event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
    },
    onTouchMove: event => {
      const start = touchStart.current;
      if (!start) return;
      if (event.touches.length !== 1) { touchStart.current = null; return; }
      const dx = Math.abs(event.touches[0].clientX - start.x);
      const dy = Math.abs(event.touches[0].clientY - start.y);
      if (dy > 12 && dy >= dx) touchStart.current = null;
    },
    onTouchEnd: event => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
      suppressClickUntil.current = Date.now() + 500;
      if (photos.length > 1) move(dx < 0 ? 1 : -1);
    },
    onTouchCancel: () => { touchStart.current = null; },
  };
  const handleKeys = event => {
    if (photos.length < 2) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  };
  const controls = photos.length > 1 && <div className="lightbox-controls"><button type="button" className="icon-button" aria-label="Foto anterior" onClick={() => move(-1)}><ChevronLeft/></button><span>{index + 1} / {photos.length}</span><button type="button" className="icon-button" aria-label="Próxima foto" onClick={() => move(1)}><ChevronRight/></button></div>;
  const photo = photos[index];
  return <Section id="fotos" eyebrow="Memórias que guardamos" title="Nossas fotos">
    {photo ? <div className="story-carousel" role="region" aria-roledescription="carrossel" aria-label="Etapas da nossa história" onKeyDown={handleKeys}>
      <figure className="story-slide" role="group" aria-roledescription="slide" aria-label={`${index + 1} de ${photos.length}`}>
        <button type="button" className="story-photo-button photo-swipe" {...swipeHandlers} onClick={event => { if (event.detail > 0 && Date.now() < suppressClickUntil.current) return; setExpanded(true); }} aria-label={`Ampliar: ${photo.alt}`}><img className="story-photo" src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async" draggable={false}/></button>
        {photo.caption && <figcaption className="story-caption" aria-live="polite"><p>{photo.caption}</p></figcaption>}
      </figure>
      {controls}
    </div> : <div className="empty photo-empty"><Camera size={30} strokeWidth={1}/><p>Um espaço para os nossos melhores momentos.</p><small>Em breve, nossas fotos estarão aqui.</small></div>}
    {expanded && photo && <Modal wide title="Nossas fotos" onClose={() => setExpanded(false)}><div onKeyDown={handleKeys}><img className="lightbox-image photo-swipe" {...swipeHandlers} src={photo.src} alt={photo.alt} draggable={false}/>{controls}{photo.caption && <p className="story-caption" aria-live="polite">{photo.caption}</p>}</div></Modal>}
  </Section>;
}
