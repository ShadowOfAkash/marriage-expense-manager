// 12 Indian wedding vendor categories for marketplace discovery
const VENDOR_CATEGORIES = [
  {
    id: 'venues',
    name: 'Wedding Venues',
    icon: '🏛️',
    color: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    description: 'Banquet halls, farmhouses, resorts & lawns',
    searchQuery: 'wedding venue banquet hall marriage garden',
    placeTypes: ['event_venue', 'banquet_hall']
  },
  {
    id: 'photographers',
    name: 'Photographers',
    icon: '📸',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/30',
    description: 'Pre-wedding, wedding & candid photography',
    searchQuery: 'wedding photographer candid photography studio',
    placeTypes: ['photographer']
  },
  {
    id: 'videographers',
    name: 'Videographers',
    icon: '🎥',
    color: 'from-purple-500/20 to-violet-500/20',
    border: 'border-purple-500/30',
    description: 'Cinematic films, drone shoots & highlights',
    searchQuery: 'wedding videographer cinematographer',
    placeTypes: []
  },
  {
    id: 'caterers',
    name: 'Caterers',
    icon: '🍽️',
    color: 'from-red-500/20 to-rose-500/20',
    border: 'border-red-500/30',
    description: 'Catering services, chefs & food stalls',
    searchQuery: 'wedding catering service party food',
    placeTypes: ['caterer']
  },
  {
    id: 'decorators',
    name: 'Florists & Decorators',
    icon: '💐',
    color: 'from-pink-500/20 to-fuchsia-500/20',
    border: 'border-pink-500/30',
    description: 'Floral design, mandap & stage decoration',
    searchQuery: 'wedding decorator florist flower decoration event',
    placeTypes: ['florist']
  },
  {
    id: 'makeup',
    name: 'Makeup Artists',
    icon: '💄',
    color: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/30',
    description: 'Bridal makeup, mehndi & hair styling',
    searchQuery: 'bridal makeup artist beauty parlour salon',
    placeTypes: ['beauty_salon']
  },
  {
    id: 'attire',
    name: 'Bridal & Groom Wear',
    icon: '👗',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    description: 'Lehengas, sherwanis, suits & accessories',
    searchQuery: 'bridal lehenga sherwani wedding dress shop',
    placeTypes: ['clothing_store']
  },
  {
    id: 'music',
    name: 'Music & DJ',
    icon: '🎵',
    color: 'from-cyan-500/20 to-sky-500/20',
    border: 'border-cyan-500/30',
    description: 'DJs, live bands, dhol players & sound',
    searchQuery: 'wedding DJ band music sound system event',
    placeTypes: []
  },
  {
    id: 'planners',
    name: 'Event Planners',
    icon: '🎪',
    color: 'from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-500/30',
    description: 'Full wedding planning & coordination',
    searchQuery: 'wedding planner event management company',
    placeTypes: ['event_planner']
  },
  {
    id: 'transport',
    name: 'Car Rental',
    icon: '🚗',
    color: 'from-slate-500/20 to-gray-500/20',
    border: 'border-slate-500/30',
    description: 'Luxury cars, vintage rides & baraat vehicles',
    searchQuery: 'wedding car rental luxury vehicle baraat',
    placeTypes: ['car_rental']
  },
  {
    id: 'hotels',
    name: 'Hotels & Stays',
    icon: '🏨',
    color: 'from-teal-500/20 to-emerald-500/20',
    border: 'border-teal-500/30',
    description: 'Guest accommodation, resorts & homestays',
    searchQuery: 'hotel resort guest house near wedding venue',
    placeTypes: ['hotel', 'resort_hotel']
  },
  {
    id: 'invitations',
    name: 'Invitation Cards',
    icon: '✉️',
    color: 'from-orange-500/20 to-red-500/20',
    border: 'border-orange-500/30',
    description: 'Printed cards, e-invites & gift boxes',
    searchQuery: 'wedding invitation card printing design',
    placeTypes: ['print_shop']
  }
];

module.exports = { VENDOR_CATEGORIES };
