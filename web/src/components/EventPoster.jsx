import { ArrowUpRight } from 'lucide-react';
import { eventVisual } from '../data/reference-events.js';

export default function EventPoster({ event, large = false }) {
  const visual = eventVisual(event);
  return <div className={`event-poster event-photo ${event.theme} ${large ? 'poster-large' : ''} ${visual.sourcedPoster ? 'official-poster' : 'illustrated-event'}`} aria-hidden="true">
    <img className={`event-photo-image fit-${visual.fit}`} src={visual.src} alt="" loading={large ? 'eager' : 'lazy'} decoding="async" />
    {!visual.sourcedPoster && <><span className="photo-scrim" /><span className="poster-label">PARRE.UG PRESENTS</span><span className="poster-title">{event.title}</span><span className="poster-footer">WE WANNA PARRE!<ArrowUpRight size={22} /></span></>}
  </div>;
}
