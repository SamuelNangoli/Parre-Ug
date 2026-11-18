// Public reference listings, not Parre inventory. Details checked 18 November 2026.
export const referenceEvents = [
  {
    id: 'quicket-unity-2026', reference: true, source: 'Quicket',
    title: 'Unity On The Square', date: '2026-12-19',
    venue: 'Greenmarket Square, Cape Town, South Africa', category: 'Music', theme: 'orange',
    image: '/images/events/unity-poster.webp', imageFit: 'contain',
    sourceUrl: 'https://www.quicket.co.za/events/387597-unity-on-the-square/',
    priceLabel: 'From R75',
    ticketDetails: 'Adult General R150 · Child General R75 · VIP R300',
    description: 'An open-air afternoon and evening of South African live music in central Cape Town. The event returns for its sixth edition.',
    tickets: [],
  },
  {
    id: 'quicket-arno-2026', reference: true, source: 'Quicket',
    title: 'Arno Carstens at Cape Point Vineyards', date: '2026-12-17',
    venue: 'Cape Point Vineyards, Noordhoek, South Africa', category: 'Music', theme: 'green',
    image: '/images/events/arno-carstens-poster.webp', imageFit: 'contain',
    sourceUrl: 'https://www.quicket.co.za/events/351853-cape-point-vineyards-christmas-concert-ft-arno-carstens/',
    priceLabel: 'R350 per person', ticketDetails: 'Children under 12 enter free.',
    description: 'Arno Carstens headlines a festive outdoor concert at the Noordhoek estate, with performances by ALAS Academy. Proceeds support MasiCorp.',
    tickets: [],
  },
  {
    id: 'quicket-nostalgia-2026', reference: true, source: 'Quicket',
    title: 'House of Nostalgia', date: '2026-12-15',
    venue: 'Defected Studios, Cape Town, South Africa', category: 'Music', theme: 'purple',
    image: '/images/events/house-of-nostalgia.webp', imageFit: 'contain',
    sourceUrl: 'https://www.quicket.co.za/events/408426-house-of-nostalgia/',
    priceLabel: 'From R120', ticketDetails: 'See the official listing for current ticket options.',
    description: 'A summer night of familiar hip-hop, R&B and house favourites in Paarden Eiland, with a programme built around nostalgic tracks.',
    tickets: [],
  },
];

export function eventVisual(event) {
  if (event.image) return { src: event.image, fit: event.imageFit || 'cover', sourcedPoster: Boolean(event.reference) };
  const stagePhoto = ['evt-1', 'evt-3', 'backend-1'].includes(event.id);
  return { src: stagePhoto ? '/images/auth-concert.jpg' : '/images/events/quicket-live-crowd.webp', fit: 'cover', sourcedPoster: false };
}
