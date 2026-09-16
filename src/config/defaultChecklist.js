/**
 * Curated 10-Stage Indian Wedding Checklist Roadmap
 * Standard template derived from Indian wedding traditions & WeddingWire India best practices.
 */

const TIMELINE_STAGES = [
  '9 to 12 Months Before',
  '6 to 8 Months Before',
  '4 to 5 Months Before',
  '3 Months Before',
  '2 Months Before',
  '1 Month Before',
  '2 to 3 Weeks Before',
  '1 Week Before',
  'Day of Wedding',
  'Post-Wedding'
];

const CHECKLIST_CATEGORIES = [
  'Budget & Planning',
  'Venues',
  'Photography & Video',
  'Decor & Design',
  'Attire & Beauty',
  'Ceremonies & Music',
  'Catering & Food',
  'Invitations & Guests',
  'Logistics & Gifts'
];

const DEFAULT_INDIAN_WEDDING_TASKS = [
  // --- Stage 1: 9 to 12 Months Before ---
  {
    title: 'Discuss and finalize total wedding budget with both families',
    category: 'Budget & Planning',
    timeline_stage: '9 to 12 Months Before',
    priority: 'High',
    assigned_to: 'Parents & Couple',
    notes: 'Agree on overall financial contribution and allocate to primary categories in the Budget tool.'
  },
  {
    title: 'Shortlist auspicious wedding dates (Mahurat) and consult family Pandit',
    category: 'Budget & Planning',
    timeline_stage: '9 to 12 Months Before',
    priority: 'High',
    assigned_to: 'Parents',
    notes: 'Pick 2-3 alternative dates to check venue availability during high-demand Saaya season.'
  },
  {
    title: 'Decide on wedding style and destination (Local, Palace, Beach, Resort)',
    category: 'Venues',
    timeline_stage: '9 to 12 Months Before',
    priority: 'High',
    assigned_to: 'Couple',
    notes: 'Decide whether celebrations will be in hometown or destination venue.'
  },
  {
    title: 'Prepare initial master guest list count for capacity estimates',
    category: 'Invitations & Guests',
    timeline_stage: '9 to 12 Months Before',
    priority: 'High',
    assigned_to: 'Couple & Family',
    notes: 'Crucial for determining banquet hall capacities and hotel room block bookings.'
  },
  {
    title: 'Decide if hiring a professional Wedding Planner or Family Committee',
    category: 'Budget & Planning',
    timeline_stage: '9 to 12 Months Before',
    priority: 'Medium',
    assigned_to: 'Couple',
    notes: 'For destination or large-scale (500+ guests) weddings, early planner booking is critical.'
  },
  {
    title: 'Start venue reconnaissance tours and compare banquet packages',
    category: 'Venues',
    timeline_stage: '9 to 12 Months Before',
    priority: 'High',
    assigned_to: 'Groom & Bride',
    notes: 'Check lawn size, banquet ceiling heights, bridal suite amenities, and catering options.'
  },

  // --- Stage 2: 6 to 8 Months Before ---
  {
    title: 'Finalize and book primary wedding venue & reserve room blocks',
    category: 'Venues',
    timeline_stage: '6 to 8 Months Before',
    priority: 'High',
    assigned_to: 'Family',
    notes: 'Sign contract, confirm advance deposit in Bookings module, and freeze dates.'
  },
  {
    title: 'Book primary Wedding Photographer & Cinematographer',
    category: 'Photography & Video',
    timeline_stage: '6 to 8 Months Before',
    priority: 'High',
    assigned_to: 'Couple',
    notes: 'Top wedding photographers get booked 6-8 months in advance for peak wedding dates.'
  },
  {
    title: 'Book Bridal Makeup Artist (HMU) & Hair Stylist for all events',
    category: 'Attire & Beauty',
    timeline_stage: '6 to 8 Months Before',
    priority: 'High',
    assigned_to: 'Bride',
    notes: 'Book bridal package covering Mehendi, Sangeet, Wedding, and Reception.'
  },
  {
    title: 'Finalize Wedding Decorator & review theme mood boards',
    category: 'Decor & Design',
    timeline_stage: '6 to 8 Months Before',
    priority: 'High',
    assigned_to: 'Couple & Family',
    notes: 'Establish floral themes, entrance arches, mandap styling, and stage backdrops.'
  },
  {
    title: 'Finalize catering contract (if venue requires independent caterer)',
    category: 'Catering & Food',
    timeline_stage: '6 to 8 Months Before',
    priority: 'High',
    assigned_to: 'Parents',
    notes: 'Review per-plate cost, live food counters, and regional cuisine specialties.'
  },
  {
    title: 'Begin bridal lehenga and groom sherwani designer consultations',
    category: 'Attire & Beauty',
    timeline_stage: '6 to 8 Months Before',
    priority: 'High',
    assigned_to: 'Couple',
    notes: 'Custom bridal lehengas and bespoke sherwanis require 3-4 months for crafting and trials.'
  },

  // --- Stage 3: 4 to 5 Months Before ---
  {
    title: 'Plan and conduct pre-wedding photo/video shoot',
    category: 'Photography & Video',
    timeline_stage: '4 to 5 Months Before',
    priority: 'Medium',
    assigned_to: 'Couple',
    notes: 'Finalize location, pre-wedding shoot outfits, and creative teaser themes.'
  },
  {
    title: 'Book professional Mehendi artist for bride and family members',
    category: 'Ceremonies & Music',
    timeline_stage: '4 to 5 Months Before',
    priority: 'High',
    assigned_to: 'Bride',
    notes: 'Confirm bridal mehendi design style (Marwari, Arabic, Portrait, Floral).'
  },
  {
    title: 'Hire wedding invitation designer for digital e-invites and cards',
    category: 'Invitations & Guests',
    timeline_stage: '4 to 5 Months Before',
    priority: 'High',
    assigned_to: 'Couple',
    notes: 'Design auspicious wedding monogram, PDF royal invitation cards, and digital videos.'
  },
  {
    title: 'Confirm availability of Family Pandit / Officiant for ceremonies',
    category: 'Ceremonies & Music',
    timeline_stage: '4 to 5 Months Before',
    priority: 'High',
    assigned_to: 'Parents',
    notes: 'Verify exact Mahurat timings for Mandap, Saat Phere, and Kanyadaan rituals.'
  },
  {
    title: 'Book wedding DJ, Sound & Light system, and folk band / Dhol team',
    category: 'Ceremonies & Music',
    timeline_stage: '4 to 5 Months Before',
    priority: 'High',
    assigned_to: 'Groom & Friends',
    notes: 'Confirm equipment, truss lighting, wireless mics, and late-night sound permissions.'
  },
  {
    title: 'Send digital "Save the Date" announcement to close family & friends',
    category: 'Invitations & Guests',
    timeline_stage: '4 to 5 Months Before',
    priority: 'Medium',
    assigned_to: 'Couple',
    notes: 'Help outstation guests block their travel dates and book flight/train tickets early.'
  },

  // --- Stage 4: 3 Months Before ---
  {
    title: 'Finalize detailed food & beverage menus for all ceremonies',
    category: 'Catering & Food',
    timeline_stage: '3 Months Before',
    priority: 'High',
    assigned_to: 'Parents & Couple',
    notes: 'Curate unique menus for Mehendi, Sangeet, Haldi, Wedding Feast, and Reception.'
  },
  {
    title: 'Dispatch official Wedding Invitations with RSVP links',
    category: 'Invitations & Guests',
    timeline_stage: '3 Months Before',
    priority: 'High',
    assigned_to: 'Couple & Family',
    notes: 'Send via Telegram & Email using portal, and courier boxed invitations to elders.'
  },
  {
    title: 'Shop for bridal jewelry, gold ornaments, and ceremonial puja items',
    category: 'Attire & Beauty',
    timeline_stage: '3 Months Before',
    priority: 'High',
    assigned_to: 'Bride & Parents',
    notes: 'Purchase necklace, maang tikka, nath, bangles, payal, and sacred puja silver.'
  },
  {
    title: 'Hire choreographer for Sangeet couple & family dance performances',
    category: 'Ceremonies & Music',
    timeline_stage: '3 Months Before',
    priority: 'Medium',
    assigned_to: 'Siblings & Friends',
    notes: 'Start weekly weekend group dance rehearsals for bride, groom, and cousins.'
  },
  {
    title: 'Establish detailed wedding event itinerary and share with vendors',
    category: 'Budget & Planning',
    timeline_stage: '3 Months Before',
    priority: 'Medium',
    assigned_to: 'Couple & Planner',
    notes: 'Define start and end times for Haldi, Mehendi, Baraat entry, Varmala, and Dinner.'
  },

  // --- Stage 5: 2 Months Before ---
  {
    title: 'Create curated song playlists for DJ and entrance sequences',
    category: 'Ceremonies & Music',
    timeline_stage: '2 Months Before',
    priority: 'Medium',
    assigned_to: 'Couple & Friends',
    notes: 'Curate Baraat entry tracks, Bridal entry song, Varmala background music, and Haldi playlist.'
  },
  {
    title: 'Order wedding favors, return gifts, and luxury dry fruit boxes',
    category: 'Logistics & Gifts',
    timeline_stage: '2 Months Before',
    priority: 'High',
    assigned_to: 'Parents',
    notes: 'Order gift hampers for Milni, Shagun boxes, and welcome favors for hotel rooms.'
  },
  {
    title: 'Book guest transportation, airport pick-up cabs, and local buses',
    category: 'Logistics & Gifts',
    timeline_stage: '2 Months Before',
    priority: 'High',
    assigned_to: 'Groom & Family',
    notes: 'Reserve Innovas/Travellers for shuttling relatives from station/airport to venue.'
  },
  {
    title: 'Order traditional Safas / Turbans, Badges, and Milni Malas',
    category: 'Ceremonies & Music',
    timeline_stage: '2 Months Before',
    priority: 'Medium',
    assigned_to: 'Groom Family',
    notes: 'Order matching barati pagris, floral brooches, and welcome garlands.'
  },
  {
    title: 'Begin pre-bridal and groom skincare/wellness salon regimens',
    category: 'Attire & Beauty',
    timeline_stage: '2 Months Before',
    priority: 'Medium',
    assigned_to: 'Couple',
    notes: 'Schedule regular hydrating facials, spa sessions, and healthy diet.'
  },

  // --- Stage 6: 1 Month Before ---
  {
    title: 'Freeze final RSVP attendance in Guest Manager',
    category: 'Invitations & Guests',
    timeline_stage: '1 Month Before',
    priority: 'High',
    assigned_to: 'Couple',
    notes: 'Check confirmed counts on Guest dashboard and share final plate numbers with caterer.'
  },
  {
    title: 'Finalize hotel room allotment matrix for outstation relatives',
    category: 'Logistics & Gifts',
    timeline_stage: '1 Month Before',
    priority: 'High',
    assigned_to: 'Family Logistics Lead',
    notes: 'Assign family suites, tag room numbers, and coordinate check-in batches.'
  },
  {
    title: 'Conduct final on-site decor walkthrough at venue',
    category: 'Decor & Design',
    timeline_stage: '1 Month Before',
    priority: 'High',
    assigned_to: 'Couple & Decorator',
    notes: 'Verify stage height, Mandap photogenic lighting, selfie booths, and power backup.'
  },
  {
    title: 'Share must-have shot list and family group schedule with photographer',
    category: 'Photography & Video',
    timeline_stage: '1 Month Before',
    priority: 'Medium',
    assigned_to: 'Couple',
    notes: 'List essential family portraits, candid moments, and drone coverage requirements.'
  },
  {
    title: 'Complete final outfit trials and tailoring alterations',
    category: 'Attire & Beauty',
    timeline_stage: '1 Month Before',
    priority: 'High',
    assigned_to: 'Couple',
    notes: 'Trial lehenga with bridal footwear, sherwani fit, dupatta drape, and accessories.'
  },
  {
    title: 'Order wedding cakes and special live dessert / paan counters',
    category: 'Catering & Food',
    timeline_stage: '1 Month Before',
    priority: 'Medium',
    assigned_to: 'Couple',
    notes: 'Finalize tiered wedding cake flavor and live counters (e.g. nitrogen ice cream, paan).'
  },

  // --- Stage 7: 2 to 3 Weeks Before ---
  {
    title: 'Professional cleaning and bank locker check for heirloom jewelry',
    category: 'Attire & Beauty',
    timeline_stage: '2 to 3 Weeks Before',
    priority: 'High',
    assigned_to: 'Parents',
    notes: 'Ensure heirloom ornaments are sparkling clean and safely stored.'
  },
  {
    title: 'Conduct final full-dress Sangeet rehearsal with all performers',
    category: 'Ceremonies & Music',
    timeline_stage: '2 to 3 Weeks Before',
    priority: 'Medium',
    assigned_to: 'Siblings & Friends',
    notes: 'Confirm music tracks sequence with DJ and test stage floor space.'
  },
  {
    title: 'Prepare speeches, vows, or thank-you toasts (if applicable)',
    category: 'Ceremonies & Music',
    timeline_stage: '2 to 3 Weeks Before',
    priority: 'Low',
    assigned_to: 'Couple',
    notes: 'Write warm words of gratitude for parents, mentors, and partners.'
  },
  {
    title: 'Re-confirm vendor arrival timelines and on-day contact persons',
    category: 'Budget & Planning',
    timeline_stage: '2 to 3 Weeks Before',
    priority: 'High',
    assigned_to: 'Coordinator / Sibling',
    notes: 'Create vendor coordinator contact sheet with phone numbers and setup slots.'
  },

  // --- Stage 8: 1 Week Before ---
  {
    title: 'Steam all ceremony outfits and pack ceremony-wise in labeled garment bags',
    category: 'Attire & Beauty',
    timeline_stage: '1 Week Before',
    priority: 'High',
    assigned_to: 'Couple & Siblings',
    notes: 'Tag each bag: Haldi, Mehendi, Sangeet, Wedding, Reception with matching accessories.'
  },
  {
    title: 'Complete bridal trousseau packing and gift presentation wrapping',
    category: 'Logistics & Gifts',
    timeline_stage: '1 Week Before',
    priority: 'High',
    assigned_to: 'Family',
    notes: 'Organize trousseau trays, gift ribbons, and shagun envelopes.'
  },
  {
    title: 'Prepare cash envelopes (Lifafas) for tips, pandit dakshina, and vendor balances',
    category: 'Budget & Planning',
    timeline_stage: '1 Week Before',
    priority: 'High',
    assigned_to: 'Parents / Cash Custodian',
    notes: 'Label envelopes with exact cash amounts for driver, pandit, servers, and musicians.'
  },
  {
    title: 'Pack emergency bridal & groom survival kits',
    category: 'Attire & Beauty',
    timeline_stage: '1 Week Before',
    priority: 'High',
    assigned_to: 'Maid of Honor / Best Friend',
    notes: 'Safety pins, bobby pins, fabric tape, stain wipes, mints, pain relievers, mini perfume.'
  },
  {
    title: 'Finalize check-in welcome desk and luggage assistance at hotel venue',
    category: 'Logistics & Gifts',
    timeline_stage: '1 Week Before',
    priority: 'Medium',
    assigned_to: 'Family Logistics Team',
    notes: 'Set up welcome drink station, key card distribution, and event itinerary handouts.'
  },

  // --- Stage 9: Day of the Wedding ---
  {
    title: 'Ensure breakfast and refreshments are delivered to bridal and groom suites',
    category: 'Catering & Food',
    timeline_stage: 'Day of Wedding',
    priority: 'High',
    assigned_to: 'Siblings',
    notes: 'Keep couple well-hydrated and nourished throughout hair and makeup sessions.'
  },
  {
    title: 'Hand over vendor balance envelopes to designated financial custodian',
    category: 'Budget & Planning',
    timeline_stage: 'Day of Wedding',
    priority: 'High',
    assigned_to: 'Parents',
    notes: 'Relieves couple from handling payments during sacred rituals.'
  },
  {
    title: 'Verify Mandap floral setup, fresh Varmala garlands, and puja samagri',
    category: 'Decor & Design',
    timeline_stage: 'Day of Wedding',
    priority: 'High',
    assigned_to: 'Family Elder / Planner',
    notes: 'Check holy fire havan samagri, gangajal, sweets, and varmalas in cold storage.'
  },
  {
    title: 'Take deep breaths, smile, and immerse in the joy of the holy matrimony!',
    category: 'Ceremonies & Music',
    timeline_stage: 'Day of Wedding',
    priority: 'High',
    assigned_to: 'Bride & Groom',
    notes: 'Enjoy every second of this once-in-a-lifetime celebration with loved ones.'
  },

  // --- Stage 10: Post-Wedding ---
  {
    title: 'Settle final venue incidental charges and room checkout balances',
    category: 'Budget & Planning',
    timeline_stage: 'Post-Wedding',
    priority: 'High',
    assigned_to: 'Family',
    notes: 'Inspect room checkouts, verify mini-bar/laundry bills, and close venue contract.'
  },
  {
    title: 'Send thank-you messages and photo gallery links to attending guests',
    category: 'Invitations & Guests',
    timeline_stage: 'Post-Wedding',
    priority: 'Medium',
    assigned_to: 'Couple',
    notes: 'Express heartfelt gratitude to family and friends for blessing the marriage.'
  },
  {
    title: 'Professional dry cleaning and archival preservation of wedding attires',
    category: 'Attire & Beauty',
    timeline_stage: 'Post-Wedding',
    priority: 'Medium',
    assigned_to: 'Couple',
    notes: 'Preserve bridal lehenga and groom sherwani in acid-free preservation boxes.'
  },
  {
    title: 'Collect and backup RAW photo/cinematography hard drives from photographer',
    category: 'Photography & Video',
    timeline_stage: 'Post-Wedding',
    priority: 'High',
    assigned_to: 'Couple',
    notes: 'Safeguard all high-resolution footage and wedding video timelines.'
  }
];

module.exports = {
  TIMELINE_STAGES,
  CHECKLIST_CATEGORIES,
  DEFAULT_INDIAN_WEDDING_TASKS
};
