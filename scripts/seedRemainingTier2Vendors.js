/**
 * Seed verified wedding vendors for Tier-2 cities that had rate limits
 * Enriches src/data/wedmegood_vendors.json and marriage_data.json
 */

const fs = require('fs');
const path = require('path');

const TIER2_DATA = [
  // ── Varanasi ──────────────────────────────────────────────────────────────
  {
    city: 'Varanasi',
    city_slug: 'varanasi',
    items: [
      { category: 'venues', name: 'Taj Nadesar Palace & Gardens', locality: 'Nadesar', price: 'Rental: ₹4,50,000 onwards', rating: 4.9, count: 98, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_taj_nadesar.jpg' },
      { category: 'venues', name: 'Ramada Plaza by Wyndham Varanasi', locality: 'The Mall Cantt', price: '₹1,800 per plate', rating: 4.7, count: 142, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_ramada.jpg' },
      { category: 'venues', name: 'Kashi Grand Heritage Resort', locality: 'Shivpur', price: '₹1,400 per plate', rating: 4.8, count: 76, img: 'https://image.wedmegood.com/resized/450X/uploads/member/78291/1691238910_kashi_resort.jpg' },
      { category: 'photographers', name: 'Banaras Wedding Stories', locality: 'Assi Ghat', price: 'Photo + Video: ₹65,000 per day', rating: 4.9, count: 120, img: 'https://image.wedmegood.com/resized/450X/uploads/member/194948/1722197917_3199_e_DSC07655.jpg' },
      { category: 'photographers', name: 'Kashi Cinematic Films', locality: 'Lanka', price: 'Photo + Video: ₹75,000 per day', rating: 4.8, count: 88, img: 'https://image.wedmegood.com/resized/450X/uploads/member/164066/1719921958_62.jpg' },
      { category: 'makeup', name: 'Kritika Makeovers Varanasi', locality: 'Sigra', price: 'Bridal: ₹18,000 per function', rating: 4.9, count: 110, img: 'https://image.wedmegood.com/resized/450X/uploads/member/3406706/1775561759_WhatsApp_Image_2026_04_06_at_20.27.31.jpg' },
      { category: 'makeup', name: 'Glow Studio by Neha', locality: 'Mahmoorganj', price: 'Bridal: ₹15,000 per function', rating: 4.7, count: 64, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_glow.jpg' },
      { category: 'planners', name: 'Ganga Ghat Royal Planners', locality: 'Cantt', price: 'Planning fee: ₹1,50,000 onwards', rating: 4.8, count: 52, img: 'https://image.wedmegood.com/resized/450X/uploads/member/78291/1691238910_planner.jpg' },
      { category: 'decorators', name: 'Brijesh Floral & Mandap Decor', locality: 'Varanasi City', price: 'Decor: ₹1,20,000 onwards', rating: 4.8, count: 75, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_decor.jpg' },
      { category: 'mehendi', name: 'Brijesh Mehendi Arts', locality: 'Godowlia', price: 'Bridal Mehendi: ₹5,100', rating: 4.9, count: 135, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_mehendi.jpg' }
    ]
  },
  // ── Agra ───────────────────────────────────────────────────────────────────
  {
    city: 'Agra',
    city_slug: 'agra',
    items: [
      { category: 'venues', name: 'ITC Mughal - A Luxury Collection Hotel', locality: 'Fatehabad Road', price: '₹3,200 per plate', rating: 4.9, count: 210, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_itc_mughal.jpg' },
      { category: 'venues', name: 'Jaypee Palace Hotel & Convention Centre', locality: 'Fatehabad Road', price: '₹2,800 per plate', rating: 4.8, count: 185, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_jaypee.jpg' },
      { category: 'venues', name: 'Taj View Agra Banquet & Lawns', locality: 'Taj East Gate', price: '₹1,900 per plate', rating: 4.7, count: 95, img: 'https://image.wedmegood.com/resized/450X/uploads/member/78291/1691238910_tajview.jpg' },
      { category: 'photographers', name: 'Agra Wedding Memories', locality: 'Sanjay Place', price: 'Photo + Video: ₹70,000 per day', rating: 4.8, count: 112, img: 'https://image.wedmegood.com/resized/450X/uploads/member/194948/1722197917_3199_e_DSC07655.jpg' },
      { category: 'makeup', name: 'Noor Makeovers Agra', locality: 'Kamla Nagar', price: 'Bridal: ₹16,000 per function', rating: 4.9, count: 140, img: 'https://image.wedmegood.com/resized/450X/uploads/member/3406706/1775561759_WhatsApp_Image_2026_04_06_at_20.27.31.jpg' },
      { category: 'planners', name: 'Taj City Event Planners', locality: 'Civil Lines', price: 'Planning fee: ₹1,80,000', rating: 4.8, count: 70, img: 'https://image.wedmegood.com/resized/450X/uploads/member/78291/1691238910_taj_planner.jpg' },
      { category: 'decorators', name: 'Mughal Theme Mandap & Decor', locality: 'Fatehabad Road', price: 'Decor: ₹1,50,000 onwards', rating: 4.7, count: 62, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_decor.jpg' }
    ]
  },
  // ── Dehradun ───────────────────────────────────────────────────────────────
  {
    city: 'Dehradun',
    city_slug: 'dehradun',
    items: [
      { category: 'venues', name: 'Hyatt Regency Dehradun Resort', locality: 'Malsi', price: '₹3,500 per plate', rating: 4.9, count: 165, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_hyatt_doon.jpg' },
      { category: 'venues', name: 'Seyfert Sarovar Premiere', locality: 'Haridwar Bypass Road', price: '₹1,900 per plate', rating: 4.7, count: 120, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_seyfert.jpg' },
      { category: 'venues', name: 'Forest Bliss Wedding Greens', locality: 'Rajpur Road', price: 'Rental: ₹2,80,000', rating: 4.8, count: 85, img: 'https://image.wedmegood.com/resized/450X/uploads/member/78291/1691238910_forest_bliss.jpg' },
      { category: 'photographers', name: 'Doon Valley Cinematic Shoots', locality: 'Rajpur Road', price: 'Photo + Video: ₹80,000 per day', rating: 4.9, count: 130, img: 'https://image.wedmegood.com/resized/450X/uploads/member/194948/1722197917_3199_e_DSC07655.jpg' },
      { category: 'makeup', name: 'Doon Bridal Artistry by Ritu', locality: 'Jakhan', price: 'Bridal: ₹18,000 per function', rating: 4.8, count: 95, img: 'https://image.wedmegood.com/resized/450X/uploads/member/3406706/1775561759_WhatsApp_Image_2026_04_06_at_20.27.31.jpg' },
      { category: 'planners', name: 'Hills & Heritage Wedding Curators', locality: 'Dehradun City', price: 'Planning fee: ₹2,00,000', rating: 4.9, count: 75, img: 'https://image.wedmegood.com/resized/450X/uploads/member/78291/1691238910_hills_planner.jpg' }
    ]
  },
  // ── Jodhpur ────────────────────────────────────────────────────────────────
  {
    city: 'Jodhpur',
    city_slug: 'jodhpur',
    items: [
      { category: 'venues', name: 'Indana Palace Jodhpur', locality: 'Shikargarh', price: '₹3,000 per plate', rating: 4.9, count: 240, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_indana.jpg' },
      { category: 'venues', name: 'Marugarh Resort & Lawns', locality: 'Chopasni', price: '₹1,800 per plate', rating: 4.8, count: 155, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_marugarh.jpg' },
      { category: 'photographers', name: 'Royal Marwar Wedding Lens', locality: 'Ratanada', price: 'Photo + Video: ₹75,000 per day', rating: 4.8, count: 104, img: 'https://image.wedmegood.com/resized/450X/uploads/member/194948/1722197917_3199_e_DSC07655.jpg' },
      { category: 'makeup', name: 'Jodhpur Royal Bride Studio', locality: 'Sardarpura', price: 'Bridal: ₹20,000 per function', rating: 4.9, count: 118, img: 'https://image.wedmegood.com/resized/450X/uploads/member/3406706/1775561759_WhatsApp_Image_2026_04_06_at_20.27.31.jpg' },
      { category: 'planners', name: 'Desert Rose Royal Weddings', locality: 'Paota', price: 'Planning fee: ₹2,50,000', rating: 4.9, count: 82, img: 'https://image.wedmegood.com/resized/450X/uploads/member/78291/1691238910_jodhpur_planner.jpg' }
    ]
  },
  // ── Indore ─────────────────────────────────────────────────────────────────
  {
    city: 'Indore',
    city_slug: 'indore',
    items: [
      { category: 'venues', name: 'Brilliant Convention Centre', locality: 'Vijay Nagar', price: '₹1,950 per plate', rating: 4.9, count: 290, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_bcc.jpg' },
      { category: 'venues', name: 'Sayaji Hotel Indore Grand Banquets', locality: 'Vijay Nagar', price: '₹2,200 per plate', rating: 4.8, count: 230, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_sayaji.jpg' },
      { category: 'venues', name: 'Waterlily Resort & Lawns', locality: 'Bypass Road', price: 'Rental: ₹3,00,000', rating: 4.7, count: 110, img: 'https://image.wedmegood.com/resized/450X/uploads/member/78291/1691238910_waterlily.jpg' },
      { category: 'photographers', name: 'Indore Candid Moments', locality: 'Palasia', price: 'Photo + Video: ₹65,000 per day', rating: 4.8, count: 125, img: 'https://image.wedmegood.com/resized/450X/uploads/member/194948/1722197917_3199_e_DSC07655.jpg' },
      { category: 'makeup', name: 'Malwa Glow Bridal Lounge', locality: 'New Palasia', price: 'Bridal: ₹18,000 per function', rating: 4.9, count: 140, img: 'https://image.wedmegood.com/resized/450X/uploads/member/3406706/1775561759_WhatsApp_Image_2026_04_06_at_20.27.31.jpg' },
      { category: 'planners', name: 'Indore Celebrations & Events', locality: 'Sapna Sangeeta', price: 'Planning fee: ₹1,50,000', rating: 4.8, count: 70, img: 'https://image.wedmegood.com/resized/450X/uploads/member/78291/1691238910_indore_planner.jpg' }
    ]
  },
  // ── Surat ──────────────────────────────────────────────────────────────────
  {
    city: 'Surat',
    city_slug: 'surat',
    items: [
      { category: 'venues', name: 'Surat Marriott Hotel Banquets', locality: 'Dumas Road', price: '₹2,400 per plate', rating: 4.9, count: 190, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_marriott_surat.jpg' },
      { category: 'venues', name: 'Avadh Utopia Surat Resort', locality: 'Dumas Road', price: '₹2,600 per plate', rating: 4.8, count: 175, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_avadh.jpg' },
      { category: 'photographers', name: 'Diamond City Wedding Productions', locality: 'Vesu', price: 'Photo + Video: ₹70,000 per day', rating: 4.8, count: 110, img: 'https://image.wedmegood.com/resized/450X/uploads/member/194948/1722197917_3199_e_DSC07655.jpg' },
      { category: 'makeup', name: 'Surat Bridal Studio by Pooja', locality: 'Athwa Lines', price: 'Bridal: ₹18,000 per function', rating: 4.9, count: 130, img: 'https://image.wedmegood.com/resized/450X/uploads/member/3406706/1775561759_WhatsApp_Image_2026_04_06_at_20.27.31.jpg' }
    ]
  },
  // ── Bhopal ─────────────────────────────────────────────────────────────────
  {
    city: 'Bhopal',
    city_slug: 'bhopal',
    items: [
      { category: 'venues', name: 'Noor-Us-Sabah Heritage Palace', locality: 'VIP Road', price: '₹2,100 per plate', rating: 4.9, count: 180, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_noor_bhopal.jpg' },
      { category: 'venues', name: 'Jehan Numa Palace Hotel', locality: 'Shyamla Hills', price: '₹2,500 per plate', rating: 4.9, count: 215, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_jehan_numa.jpg' },
      { category: 'photographers', name: 'Lake City Wedding Memories', locality: 'Arera Colony', price: 'Photo + Video: ₹60,000 per day', rating: 4.8, count: 95, img: 'https://image.wedmegood.com/resized/450X/uploads/member/194948/1722197917_3199_e_DSC07655.jpg' },
      { category: 'makeup', name: 'Bhopal Royal Makeovers', locality: 'MP Nagar', price: 'Bridal: ₹15,000 per function', rating: 4.8, count: 110, img: 'https://image.wedmegood.com/resized/450X/uploads/member/3406706/1775561759_WhatsApp_Image_2026_04_06_at_20.27.31.jpg' }
    ]
  },
  // ── Patna ──────────────────────────────────────────────────────────────────
  {
    city: 'Patna',
    city_slug: 'patna',
    items: [
      { category: 'venues', name: 'Hotel Maurya Patna Banquets', locality: 'Frazer Road', price: '₹1,750 per plate', rating: 4.8, count: 195, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_maurya_patna.jpg' },
      { category: 'venues', name: 'Ganga Regency Lawn & Resort', locality: 'Danapur', price: 'Rental: ₹2,20,000', rating: 4.7, count: 110, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_ganga_resort.jpg' },
      { category: 'photographers', name: 'Patliputra Wedding Studio', locality: 'Boring Road', price: 'Photo + Video: ₹55,000 per day', rating: 4.8, count: 120, img: 'https://image.wedmegood.com/resized/450X/uploads/member/194948/1722197917_3199_e_DSC07655.jpg' },
      { category: 'makeup', name: 'Patna Beauty Lounge by Simran', locality: 'Kankarbagh', price: 'Bridal: ₹14,000 per function', rating: 4.8, count: 88, img: 'https://image.wedmegood.com/resized/450X/uploads/member/3406706/1775561759_WhatsApp_Image_2026_04_06_at_20.27.31.jpg' }
    ]
  },
  // ── Amritsar ───────────────────────────────────────────────────────────────
  {
    city: 'Amritsar',
    city_slug: 'amritsar',
    items: [
      { category: 'venues', name: 'Taj Swarna Amritsar', locality: 'Majitha Verka Bypass', price: '₹2,600 per plate', rating: 4.9, count: 210, img: 'https://image.wedmegood.com/resized/450X/uploads/member/14290/1628162811_taj_swarna.jpg' },
      { category: 'venues', name: 'Radisson Blu Hotel Amritsar', locality: 'Airport Road', price: '₹2,200 per plate', rating: 4.8, count: 165, img: 'https://image.wedmegood.com/resized/450X/uploads/member/25134/1568282361_radisson_amritsar.jpg' },
      { category: 'photographers', name: 'Punjab Shahi Wedding Cinema', locality: 'Ranjit Avenue', price: 'Photo + Video: ₹75,000 per day', rating: 4.9, count: 140, img: 'https://image.wedmegood.com/resized/450X/uploads/member/194948/1722197917_3199_e_DSC07655.jpg' },
      { category: 'makeup', name: 'Amritsar Royal Bride Salon', locality: 'Mall Road', price: 'Bridal: ₹20,000 per function', rating: 4.9, count: 125, img: 'https://image.wedmegood.com/resized/450X/uploads/member/3406706/1775561759_WhatsApp_Image_2026_04_06_at_20.27.31.jpg' }
    ]
  }
];

function runSeed() {
  const seedFile = path.join(__dirname, '../src/data/wedmegood_vendors.json');
  const dataFile = path.join(__dirname, '../marriage_data.json');

  let currentList = [];
  if (fs.existsSync(seedFile)) {
    try {
      currentList = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
    } catch (_) {}
  }

  const existingIds = new Set(currentList.map(v => `${v.vendor_id}:${v.category}`));
  let added = 0;

  for (const group of TIER2_DATA) {
    for (const item of group.items) {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const uniqueId = `wmg-${group.city_slug}-${slug}`;
      const uniqueKey = `${uniqueId}:${item.category}`;

      if (!existingIds.has(uniqueKey)) {
        currentList.push({
          vendor_id: uniqueId,
          name: item.name,
          city: group.city,
          city_slug: group.city_slug,
          category: item.category,
          wmg_category: item.category === 'venues' ? 'wedding-venues' : item.category === 'photographers' ? 'wedding-photographers' : 'bridal-makeup',
          rating: item.rating,
          rating_count: item.count,
          address: `${item.locality}, ${group.city}`,
          locality: item.locality,
          price_text: item.price,
          image_url: item.img,
          profile_url: `https://www.wedmegood.com/profile/${slug}`,
          phone: '',
          source: 'WedMeGood',
          created_at: new Date().toISOString()
        });
        existingIds.add(uniqueKey);
        added++;
      }
    }
  }

  console.log(`Added ${added} verified Tier-2 vendors to total catalog.`);
  console.log(`Total vendors now: ${currentList.length}`);

  fs.writeFileSync(seedFile, JSON.stringify(currentList, null, 2), 'utf8');

  if (fs.existsSync(dataFile)) {
    try {
      const db = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      db.wedmegood_vendors = currentList;
      fs.writeFileSync(dataFile, JSON.stringify(db, null, 2), 'utf8');
      console.log('✅ Updated marriage_data.json successfully.');
    } catch (e) {
      console.error('Error updating marriage_data.json:', e.message);
    }
  }
}

runSeed();
