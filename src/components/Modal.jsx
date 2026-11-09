import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null), closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; ref.current.showModal();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={wide ? 'modal wide' : 'modal'} aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); closeRef.current(); }} onClick={e => { if (e.target === e.currentTarget) closeRef.current(); }}>
    <div className="modal-inner"><button className="icon-button modal-close" type="button" aria-label="Fechar" onClick={onClose}><X/></button><h2 id="modal-title">{title}</h2>{children}</div>
  </dialog>;
}
