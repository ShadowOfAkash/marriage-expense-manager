/**
 * WedMeGood Vendor Data Scraper
 * Scrapes verified wedding vendors across major (Tier 1) and Tier 2 cities in India.
 * Extracts structured JSON-LD data + pricing details.
 * Persists results to src/data/wedmegood_vendors.json and updates the active database.
 */

const fs = require('fs');
const path = require('path');

// ── Target Cities ────────────────────────────────────────────────────────────
const CITIES = [
  // Major Metros (Tier 1)
  { slug: 'delhi-ncr', name: 'Delhi NCR', isMetro: true, aliases: ['delhi', 'noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad'] },
  { slug: 'mumbai', name: 'Mumbai', isMetro: true, aliases: ['bombay', 'navi mumbai', 'thane'] },
  { slug: 'bangalore', name: 'Bangalore', isMetro: true, aliases: ['bengaluru'] },
  { slug: 'hyderabad', name: 'Hyderabad', isMetro: true, aliases: ['secunderabad'] },
  { slug: 'chennai', name: 'Chennai', isMetro: true, aliases: ['madras'] },
  { slug: 'kolkata', name: 'Kolkata', isMetro: true, aliases: ['calcutta'] },
  { slug: 'pune', name: 'Pune', isMetro: true, aliases: ['poona'] },
  { slug: 'ahmedabad', name: 'Ahmedabad', isMetro: true, aliases: ['amdavad'] },
  { slug: 'jaipur', name: 'Jaipur', isMetro: true, aliases: ['pink city'] },
  { slug: 'lucknow', name: 'Lucknow', isMetro: true, aliases: ['nawabs'] },
  { slug: 'chandigarh', name: 'Chandigarh', isMetro: true, aliases: ['mohali', 'panchkula'] },
  { slug: 'goa', name: 'Goa', isMetro: true, aliases: ['north goa', 'south goa', 'panaji'] },

  // Tier 2 & Heritage Wedding Hubs
  { slug: 'udaipur', name: 'Udaipur', isMetro: false, aliases: ['lake city'] },
  { slug: 'kanpur', name: 'Kanpur', isMetro: false, aliases: ['cawnpore'] },
  { slug: 'indore', name: 'Indore', isMetro: false, aliases: [] },
  { slug: 'surat', name: 'Surat', isMetro: false, aliases: [] },
  { slug: 'nagpur', name: 'Nagpur', isMetro: false, aliases: [] },
  { slug: 'vadodara', name: 'Vadodara', isMetro: false, aliases: ['baroda'] },
  { slug: 'bhopal', name: 'Bhopal', isMetro: false, aliases: [] },
  { slug: 'patna', name: 'Patna', isMetro: false, aliases: [] },
  { slug: 'ludhiana', name: 'Ludhiana', isMetro: false, aliases: [] },
  { slug: 'agra', name: 'Agra', isMetro: false, aliases: [] },
  { slug: 'nashik', name: 'Nashik', isMetro: false, aliases: ['nasik'] },
  { slug: 'varanasi', name: 'Varanasi', isMetro: false, aliases: ['banaras', 'kashi'] },
  { slug: 'amritsar', name: 'Amritsar', isMetro: false, aliases: [] },
  { slug: 'dehradun', name: 'Dehradun', isMetro: false, aliases: ['doon', 'mussoorie'] },
  { slug: 'jodhpur', name: 'Jodhpur', isMetro: false, aliases: ['sun city'] },
  { slug: 'coimbatore', name: 'Coimbatore', isMetro: false, aliases: [] },
  { slug: 'visakhapatnam', name: 'Visakhapatnam', isMetro: false, aliases: ['vizag'] },
  { slug: 'kochi', name: 'Kochi', isMetro: false, aliases: ['cochin'] },
  { slug: 'guwahati', name: 'Guwahati', isMetro: false, aliases: [] }
];

// ── Target Categories ────────────────────────────────────────────────────────
const CATEGORY_MAP = [
  { platformId: 'venues', name: 'Wedding Venues', wmgSlug: 'wedding-venues' },
  { platformId: 'photographers', name: 'Photographers', wmgSlug: 'wedding-photographers' },
  { platformId: 'videographers', name: 'Videographers', wmgSlug: 'wedding-photographers' },
  { platformId: 'caterers', name: 'Caterers', wmgSlug: 'wedding-catering' },
  { platformId: 'decorators', name: 'Florists & Decorators', wmgSlug: 'wedding-decorators' },
  { platformId: 'makeup', name: 'Makeup Artists', wmgSlug: 'bridal-makeup' },
  { platformId: 'mehendi', name: 'Mehendi Artists', wmgSlug: 'mehendi-artists' },
  { platformId: 'attire', name: 'Bridal & Groom Wear', wmgSlug: 'bridal-wear' },
  { platformId: 'music', name: 'Music & DJ', wmgSlug: 'wedding-entertainment' },
  { platformId: 'planners', name: 'Event Planners', wmgSlug: 'wedding-planners' },
  { platformId: 'invitations', name: 'Invitation Cards', wmgSlug: 'wedding-cards' }
];

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Fetch and parse single page ──────────────────────────────────────────────
async function scrapePage(citySlug, cityName, categoryObj, page = 1) {
  const url = `https://www.wedmegood.com/vendors/${citySlug}/${categoryObj.wmgSlug}/${page > 1 ? `?page=${page}` : ''}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();

    // 1. Extract ItemList JSON-LD
    let items = [];
    const ldMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const m of ldMatches) {
      const raw = m.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        const parsed = JSON.parse(raw);
        if (parsed['@type'] === 'ItemList' && Array.isArray(parsed.itemListElement)) {
          items = parsed.itemListElement.map(el => el.item).filter(Boolean);
          break;
        }
      } catch (_) {}
    }

    if (!items.length) return [];

    // 2. Parse price and metadata for each item
    const vendors = [];
    for (const item of items) {
      if (!item.name) continue;

      const profileUrl = item.url || '';
      const urlSlug = profileUrl.replace('https://www.wedmegood.com/profile/', '').replace('/profile/', '').split('?')[0];
      const vendorId = urlSlug || item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Extract price from card snippet if available
      let priceText = '';
      if (urlSlug) {
        const pos = html.indexOf(urlSlug);
        if (pos !== -1) {
          const snippet = html.slice(pos, pos + 3000);
          const labelMatch = snippet.match(/<p class="text-secondary[^>]*>([^<]+)<\/p>/i);
          const amtMatch = snippet.match(/₹\s*<\/span>\s*<span[^>]*>([\d,]+)<\/span>(?:\s*<\/p>\s*<p[^>]*>([^<]+)<\/p>)?/i) ||
                           snippet.match(/₹\s*([\d,]+)\s*(?:<\/span>)?(?:\s*<p[^>]*>([^<]+)<\/p>)?/i);
          if (amtMatch) {
            const label = labelMatch ? labelMatch[1].trim() + ': ' : '';
            const amt = '₹' + amtMatch[1].trim();
            const unit = amtMatch[2] ? ' ' + amtMatch[2].trim() : '';
            priceText = `${label}${amt}${unit}`;
          }
        }
      }

      const rating = parseFloat(item.aggregateRating?.ratingValue || 0);
      const ratingCount = parseInt(item.aggregateRating?.ratingCount || 0);
      const locality = item.address?.addressLocality || '';
      const street = item.address?.streetAddress || '';
      const address = street || (locality ? `${locality}, ${cityName}` : cityName);

      vendors.push({
        vendor_id: vendorId,
        name: item.name,
        city: cityName,
        city_slug: citySlug,
        category: categoryObj.platformId,
        wmg_category: categoryObj.wmgSlug,
        rating: isNaN(rating) ? 0 : rating,
        rating_count: isNaN(ratingCount) ? 0 : ratingCount,
        address: address.trim(),
        locality: locality.trim(),
        price_text: priceText,
        image_url: item.image || '',
        profile_url: profileUrl,
        phone: '',
        source: 'WedMeGood',
        created_at: new Date().toISOString()
      });
    }

    return vendors;
  } catch (err) {
    console.warn(`  ⚠️ Error scraping ${citySlug} - ${categoryObj.wmgSlug} (p${page}):`, err.message);
    return [];
  }
}

// ── Run full scraping queue ──────────────────────────────────────────────────
async function run() {
  console.log('🚀 Starting WedMeGood Vendor Scraper...');
  console.log(`📍 Cities: ${CITIES.length} | 🏷️ Categories: ${CATEGORY_MAP.length}`);

  // Build task list: avoid duplicate (citySlug, wmgSlug) combinations
  const tasks = [];
  const visitedCombos = new Set();

  for (const city of CITIES) {
    for (const cat of CATEGORY_MAP) {
      const key = `${city.slug}:${cat.wmgSlug}`;
      if (visitedCombos.has(key)) {
        // Just duplicate for secondary platform categories (e.g. videographers mapping to wedding-photographers)
        tasks.push({ city, cat, aliasOnly: true, sourceKey: key });
      } else {
        visitedCombos.add(key);
        tasks.push({ city, cat, aliasOnly: false, page: 1 });
        // For major metros, also fetch page 2 to provide 40 top vendors!
        if (city.isMetro) {
          tasks.push({ city, cat, aliasOnly: false, page: 2 });
        }
      }
    }
  }

  console.log(`📋 Total scraping tasks to execute: ${tasks.length}`);

  const allVendorsMap = new Map(); // vendor_id + category -> vendor object
  const primaryResults = new Map(); // key -> vendors[]

  // Concurrency pool of 3 workers
  const CONCURRENCY = 3;
  let currentIndex = 0;
  let completed = 0;

  async function worker() {
    while (currentIndex < tasks.length) {
      const idx = currentIndex++;
      const task = tasks[idx];

      if (task.aliasOnly) {
        // Reuse results from primary task with adjusted category
        const cached = primaryResults.get(task.sourceKey) || [];
        for (const v of cached) {
          const clone = { ...v, category: task.cat.platformId };
          const uniqueKey = `${clone.vendor_id}:${clone.category}`;
          allVendorsMap.set(uniqueKey, clone);
        }
        completed++;
        continue;
      }

      const results = await scrapePage(task.city.slug, task.city.name, task.cat, task.page || 1);
      
      const key = `${task.city.slug}:${task.cat.wmgSlug}`;
      if (!primaryResults.has(key)) {
        primaryResults.set(key, results);
      } else {
        primaryResults.get(key).push(...results);
      }

      for (const v of results) {
        const uniqueKey = `${v.vendor_id}:${v.category}`;
        allVendorsMap.set(uniqueKey, v);
      }

      completed++;
      if (completed % 10 === 0 || completed === tasks.length) {
        console.log(`⏳ Progress: ${completed}/${tasks.length} tasks completed (${allVendorsMap.size} unique vendors collected)`);
      }

      // Polite pause
      await sleep(250);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const vendorList = Array.from(allVendorsMap.values());
  console.log(`\n🎉 Scraping finished! Total unique vendors: ${vendorList.length}`);

  // Summary per city
  const cityCounts = {};
  for (const v of vendorList) {
    cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
  }
  console.log('\n📊 Vendor count summary by city:');
  Object.entries(cityCounts).forEach(([city, count]) => {
    console.log(`  - ${city}: ${count} vendors`);
  });

  // ── Save to src/data/wedmegood_vendors.json ─────────────────────────────────
  const dataDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const jsonPath = path.join(dataDir, 'wedmegood_vendors.json');
  fs.writeFileSync(jsonPath, JSON.stringify(vendorList, null, 2), 'utf8');
  console.log(`\n💾 Saved seed file: ${jsonPath} (${(fs.statSync(jsonPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // ── Seed into marriage_data.json ───────────────────────────────────────────
  const marriageDataFile = path.join(__dirname, '../marriage_data.json');
  if (fs.existsSync(marriageDataFile)) {
    try {
      const db = JSON.parse(fs.readFileSync(marriageDataFile, 'utf8'));
      db.wedmegood_vendors = vendorList;
      fs.writeFileSync(marriageDataFile, JSON.stringify(db, null, 2), 'utf8');
      console.log(`💾 Updated marriage_data.json with ${vendorList.length} WedMeGood vendors.`);
    } catch (err) {
      console.error('Failed to update marriage_data.json:', err.message);
    }
  }

  // ── Seed into LibSQL if active ─────────────────────────────────────────────
  try {
    const { initLibSQL, isLibSQL, dbRun } = require('../src/db');
    await initLibSQL();
    if (isLibSQL()) {
      console.log('🔄 Seeding into LibSQL (Turso) database...');
      let inserted = 0;
      for (const v of vendorList) {
        try {
          await dbRun(
            `INSERT OR REPLACE INTO wedmegood_vendors 
             (vendor_id, city, city_slug, category, wmg_category, name, rating, rating_count, address, locality, price_text, image_url, profile_url, phone, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [v.vendor_id, v.city, v.city_slug, v.category, v.wmg_category, v.name, v.rating, v.rating_count, v.address, v.locality, v.price_text, v.image_url, v.profile_url, v.phone, v.source]
          );
          inserted++;
        } catch (_) {}
      }
      console.log(`✅ LibSQL seeded: ${inserted} vendors.`);
    }
  } catch (err) {
    console.warn('LibSQL seed skipped or failed (expected if local JSON mode):', err.message);
  }

  console.log('✨ All operations completed successfully!');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Fatal error running scraper:', err);
    process.exit(1);
  });
}

module.exports = { run, CITIES, CATEGORY_MAP };
