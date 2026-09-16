/**
 * Curated Indian Wedding Vendor Directory & Starter Database
 * Inspired by The Knot Marketplace & WeddingWire India
 */

const VENDOR_CATEGORIES = [
  'Photography',
  'Venue',
  'Makeup & Hair',
  'Decor & Design',
  'Catering',
  'Music & DJ',
  'Choreography',
  'Mehndi',
  'Pandit / Rituals',
  'Baraat & Transport',
  'Attire & Styling',
  'Invitations & Favors'
];

const HIRING_STAGES = [
  { key: 'Shortlisted', label: 'Shortlisted', icon: 'Heart', color: 'rose', description: 'Favorited & considering' },
  { key: 'Inquired', label: 'Inquired', icon: 'MessageCircle', color: 'amber', description: 'Inquiry sent via WhatsApp/Call' },
  { key: 'Evaluating', label: 'Evaluating', icon: 'Scale', color: 'blue', description: 'Reviewing quotes & portfolio' },
  { key: 'Hired', label: 'Hired & Booked', icon: 'CheckCircle2', color: 'emerald', description: 'Contract locked & advance paid' },
  { key: 'Declined', label: 'Declined', icon: 'Archive', color: 'zinc', description: 'Not proceeding' }
];

const INDIAN_CITIES = [
  'All Cities',
  'Delhi NCR',
  'Mumbai',
  'Jaipur',
  'Bengaluru',
  'Udaipur',
  'Lucknow',
  'Hyderabad',
  'Kolkata',
  'Chandigarh',
  'Goa'
];

const DEFAULT_MARKETPLACE_VENDORS = [
  // 1. Photography & Video
  {
    id: 'mkt-p1',
    vendor: 'Virasat Wedding Cinematography',
    service: 'Candid Photography & Cinematic Film (3 Days)',
    category: 'Photography',
    city: 'Delhi NCR',
    price_tier: '₹₹₹',
    typical_quote: 280000,
    rating: 4.9,
    reviews_count: 142,
    badge: 'WeddingWire Choice 2024',
    contact_person: 'Kabir Oberoi',
    phone: '+91 98712 34567',
    email: 'info@virasatcinematography.com',
    website_or_portfolio: 'https://instagram.com/virasat_weddings',
    description: 'Specialists in royal North Indian weddings, luxury cinematic films, drone footage, and raw archival footage.',
    deliverables: [
      '2 Candid Photographers + 2 Traditional Photographers',
      '2 Cinematographers + 4K Drone Coverage',
      '5-7 Min Cinematic Teaser & 45-Min Feature Film',
      '300 Fully Retouched Master Photos',
      '2 Premium Leather Coffee-Table Photo Books'
    ],
    pros: 'Extraordinary color grading and candid emotion capture. Punctual crew.',
    cons: 'Bookings require at least 5-6 months advance notice.'
  },
  {
    id: 'mkt-p2',
    vendor: 'The Yellow Frame Stories',
    service: 'Modern Candid Photo & Reel Creation',
    category: 'Photography',
    city: 'Mumbai',
    price_tier: '₹₹',
    typical_quote: 160000,
    rating: 4.8,
    reviews_count: 98,
    badge: 'Trending Pro',
    contact_person: 'Ananya Deshmukh',
    phone: '+91 98201 23456',
    email: 'hello@yellowframestories.com',
    website_or_portfolio: 'https://instagram.com/yellowframe',
    description: 'Youthful aesthetic focusing on instant Instagram reels, fun Haldi portraits, and vibrant pre-wedding shoots.',
    deliverables: [
      'Dedicated Real-Time Social Media Reel Maker',
      '2 Candid Photographers (Haldi, Sangeet & Pheras)',
      'Same-Day Edit 60-Second Reel for Instagram',
      'Online Cloud Gallery with Instant Face-Recognition AI'
    ],
    pros: 'Ultra-fast 24h reel delivery for social media. Friendly crew.',
    cons: 'Traditional documentary footage is concise.'
  },

  // 2. Venue
  {
    id: 'mkt-v1',
    vendor: 'The Rajmahal Heritage Resort & Lawns',
    service: 'Luxury Palace Lawn & AC Banquet Halls (800 Guests)',
    category: 'Venue',
    city: 'Jaipur',
    price_tier: '₹₹₹',
    typical_quote: 750000,
    rating: 5.0,
    reviews_count: 210,
    badge: 'Top Heritage Destination',
    contact_person: 'Vikram Singh Rathore',
    phone: '+91 94140 88990',
    email: 'events@rajmahaljaipur.com',
    website_or_portfolio: 'https://rajmahalheritage.com',
    description: 'Historic Rajasthani property with majestic archways, poolside Sangeet courtyards, and 45 luxury guest suites.',
    deliverables: [
      'Complete Lawn 1 & Grand Ballroom Access (2 Nights)',
      '40 Deluxe Guest Rooms with Complimentary Breakfast',
      'Mandap Setup Area on Heritage Marble Pavilion',
      'Valet Parking for 200+ Cars with Security Staff',
      'In-house Power Backup Generator & Green Rooms'
    ],
    pros: 'Spectacular royal backdrop, zero outside noise restrictions until 11 PM.',
    cons: 'Mandatory in-house catering tie-up.'
  },
  {
    id: 'mkt-v2',
    vendor: 'Golden Palms Banquet & Convention',
    service: 'Twin Central AC Ballroom & Lawn (500 Guests)',
    category: 'Venue',
    city: 'Delhi NCR',
    price_tier: '₹₹',
    typical_quote: 380000,
    rating: 4.7,
    reviews_count: 165,
    badge: 'Best Value Venue',
    contact_person: 'Manish Chawla',
    phone: '+91 98100 44556',
    email: 'banquets@goldenpalms.in',
    website_or_portfolio: 'https://goldenpalms.in',
    description: 'Spacious pillarless hall with modern chandeliers, attached open lawn, and central AC bridal prep rooms.',
    deliverables: [
      'Twin Ballrooms combined (Capacity 600)',
      '4 AC Prep Green Rooms with Mirrors and Attached Baths',
      'Basic Ambient Stage Lighting and Stage Riser',
      'Overnight Phera Timing Allowed'
    ],
    pros: 'Very accessible from highway with ample parking space.',
    cons: 'Lawn space is semi-compact.'
  },

  // 3. Makeup & Hair
  {
    id: 'mkt-m1',
    vendor: 'Glamour by Shweta Gaur',
    service: 'HD & Airbrush Bridal Makeup Package (3 Functions)',
    category: 'Makeup & Hair',
    city: 'Delhi NCR',
    price_tier: '₹₹',
    typical_quote: 65000,
    rating: 4.9,
    reviews_count: 184,
    badge: 'Celebrity Stylist',
    contact_person: 'Shweta Gaur',
    phone: '+91 99998 12345',
    email: 'contact@shwetagaur.com',
    website_or_portfolio: 'https://instagram.com/glambyshwetagaur',
    description: 'Flawless glass-skin bridal finish, premium international cosmetics (Dior, MAC, Huda Beauty), and custom floral hairstyles.',
    deliverables: [
      'Airbrush Bridal Makeup for Wedding Pheras',
      'Sangeet Contemporary Glam Look + Floral Haldi Makeup',
      'Hair Styling with Fresh Flowers / Hair Extensions',
      'Saree / Lehenga Draping and Jewelry Setting',
      'Complimentary Groom Touch-up'
    ],
    pros: 'Long-lasting water-resistant finish that stays intact through rituals.',
    cons: 'Travel charges extra for outstation destinations.'
  },

  // 4. Decor & Design
  {
    id: 'mkt-d1',
    vendor: 'Utsav Mandap & Floral Sculptors',
    service: 'Theme Mandap, Floral Entrance & Lighting Production',
    category: 'Decor & Design',
    city: 'Delhi NCR',
    price_tier: '₹₹₹',
    typical_quote: 450000,
    rating: 4.8,
    reviews_count: 112,
    badge: 'WeddingWire Choice',
    contact_person: 'Ramesh Gupta',
    phone: '+91 98111 67890',
    email: 'utsavdecor@gmail.com',
    website_or_portfolio: 'https://utsavdecors.com',
    description: 'Exquisite fresh flower mandaps, fairy-light tunnels, customized photobooths, and designer stage backdrops.',
    deliverables: [
      '360-Degree Fresh Rose & Marigold Havan Mandap',
      'Grand 50-Foot LED Floral Walkway Entrance',
      'Bride & Groom Grand Stage with Velvet Sofas',
      'Custom Personalized Hashtag Neon Photobooth',
      'Round Table Centerpieces with Pillar Candles'
    ],
    pros: 'Can turn any lawn into a fairytale venue within 6 hours.',
    cons: 'Exotic flower imported setups need 3 weeks advance booking.'
  },

  // 5. Catering
  {
    id: 'mkt-c1',
    vendor: 'Shahi Dawat Royal Caterers',
    service: 'Multi-Cuisine Royal Buffet & Live Food Theatres (500 Pax)',
    category: 'Catering',
    city: 'Delhi NCR',
    price_tier: '₹₹',
    typical_quote: 520000,
    rating: 4.9,
    reviews_count: 230,
    badge: 'Heritage Taste',
    contact_person: 'Chef Sanjeev Kapur',
    phone: '+91 98188 77665',
    email: 'shahidawat@catering.com',
    website_or_portfolio: 'https://shahidawatcaterers.com',
    description: 'Authentic Awadhi, Rajasthani, North Indian, Pan-Asian, and Italian live counters with traditional brass utensils.',
    deliverables: [
      '60+ Items Grand Dinner Menu with 6 Live Counters',
      'Old Delhi Chaat Gali & Live Jalebi-Rabdi Stalls',
      'Mocktail Bar with 8 Specialty Fusion Drinks',
      'Trained Uniformed Service Staff & Crockery / Cutlery',
      'Separate Pure Vegetarian / Jain Cooking Enclosure'
    ],
    pros: 'Food quality and piping-hot live counters are legendary.',
    cons: 'Tasting session needs to be scheduled on weekends.'
  },

  // 6. Music & DJ / Entertainment
  {
    id: 'mkt-dj1',
    vendor: 'DJ Sumit & The Punjabi Dhol Symphony',
    service: 'High-Energy Wedding DJ, Truss Lighting & 4 Live Dhols',
    category: 'Music & DJ',
    city: 'Delhi NCR',
    price_tier: '₹₹',
    typical_quote: 85000,
    rating: 4.8,
    reviews_count: 140,
    badge: 'Crowd Energizer',
    contact_person: 'Sumit Walia',
    phone: '+91 98733 44556',
    email: 'djsumit@weddingsound.in',
    website_or_portfolio: 'https://instagram.com/djsumitlive',
    description: 'Bollywood, Punjabi hits, EDM, and synchronized dhol beats that keep the dance floor packed until dawn.',
    deliverables: [
      'Console Setup with Line-Array Sound & Bass Subs',
      'Moving Heads, Laser Lights, & CO2 Cryo Jet Cannons',
      '4 Synchronized Traditional Punjabi Dhol Players for Baraat',
      'Cold Pyro & Dry Ice Low-Fog Cloud for Couple Entry'
    ],
    pros: 'Exceptional crowd engagement and song transitions.',
    cons: 'Strict volume compliance required after 10:00 PM.'
  },

  // 7. Mehndi
  {
    id: 'mkt-mh1',
    vendor: 'Kundan Bridal Mehndi Art',
    service: 'Organic Bridal Mehndi & 4 Assistant Team',
    category: 'Mehndi',
    city: 'Jaipur',
    price_tier: '₹',
    typical_quote: 25000,
    rating: 5.0,
    reviews_count: 85,
    badge: '100% Organic Henna',
    contact_person: 'Kundan Lal',
    phone: '+91 94142 33221',
    email: 'kundanmehndi@gmail.com',
    website_or_portfolio: 'https://instagram.com/kundan_mehndi',
    description: 'Intricate portrait bridal mehndi (bride & groom portraits, sacred shlokas, and skyline motifs) with deep stain guarantee.',
    deliverables: [
      'Bridal Full Arms (Elbows) and Feet (Mid-Calf)',
      'Groom Minimalist Symbolic Mehndi',
      '3 Assistants for up to 30 Female Family Relatives',
      'Special Homemade Clove Oil & Lemon-Sugar Aftercare Pack'
    ],
    pros: 'Pure Rajasthani Sojat organic henna that darkens guaranteed.',
    cons: 'Bridal session takes 4 to 5 hours.'
  },

  // 8. Pandit / Rituals
  {
    id: 'mkt-pdt1',
    vendor: 'Acharya Vidyanand Shastri',
    service: 'Vedic Wedding Priest with Mantra Recitation & Explanation',
    category: 'Pandit / Rituals',
    city: 'Delhi NCR',
    price_tier: '₹',
    typical_quote: 31000,
    rating: 5.0,
    reviews_count: 195,
    badge: 'Vedic Scholar',
    contact_person: 'Acharya Vidyanand',
    phone: '+91 98105 99887',
    email: 'vidyanand.shastri@vedicceremonies.org',
    website_or_portfolio: 'https://vedicceremonies.org',
    description: 'Eloquent Sanskrit scholars who conduct meaningful rituals with concise Hindi/English explanations for family and guests.',
    deliverables: [
      'Shubh Muhurat Consultation & Kundali Matching',
      'Complete Havan, Kanyadaan, Saptapadi (7 Pheras) & Sindoor Daan',
      'Puja Samagri Checklist & Sacred Havan Kund Guidance',
      'Official Vedic Vivah Certificate for Marriage Registry'
    ],
    pros: 'Keeps the ceremony engaging, sacred, and punctual within 90 mins.',
    cons: 'Dates book up very fast during peak wedding saaya months.'
  },

  // 9. Baraat & Transport
  {
    id: 'mkt-b1',
    vendor: 'Royal Vintage Car & White Buggy Rentals',
    service: '1947 Convertible Vintage Car & Royal White Ghodi Chariot',
    category: 'Baraat & Transport',
    city: 'Delhi NCR',
    price_tier: '₹₹',
    typical_quote: 45000,
    rating: 4.7,
    reviews_count: 76,
    badge: 'Royal Grandeur',
    contact_person: 'Sardar Gurpreet Singh',
    phone: '+91 98114 55667',
    email: 'royalvintagecars@delhibaraat.com',
    website_or_portfolio: 'https://delhibaraatvintage.com',
    description: 'Immaculate cherry-red convertible vintage car or ornate gold-plated Victorian buggy with royal umbrella chattars.',
    deliverables: [
      'Decorated 1947 Open-Top Convertible with Uniformed Chauffeur',
      '3-Hour Baraat Procession Escort',
      'Floral Car Bonnet Decoration & Satin Ribbon Work',
      'Backup Vehicle on Standby'
    ],
    pros: 'Looks sensational in drone cinematography and grand entry videos.',
    cons: 'Maximum speed is 20 km/h; best used within 2-3 km of venue.'
  }
];

module.exports = {
  VENDOR_CATEGORIES,
  HIRING_STAGES,
  INDIAN_CITIES,
  DEFAULT_MARKETPLACE_VENDORS
};
