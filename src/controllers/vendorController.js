const { isLibSQL, dbGet, dbAll, dbRun, readJSON, writeJSON } = require('../db');
const { VENDOR_CATEGORIES } = require('../config/vendorCategories');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const PLACES_BASE = 'https://places.googleapis.com/v1';

// ── Helpers ──────────────────────────────────────────

function getHaversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

async function placesTextSearch(query, lat, lng, radius = 10000, sortBy = 'distance') {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured. Add it to your .env file.');
  }

  const radiusMeters = Number(radius) || 10000;
  const radiusKm = radiusMeters / 1000;

  const body = {
    textQuery: query,
    languageCode: 'en',
    maxResultCount: 20,
  };

  const centerLat = lat ? Number(lat) : null;
  const centerLng = lng ? Number(lng) : null;

  // Use locationRestriction with bounding rectangle for strict geographic bounds
  if (centerLat && centerLng) {
    const latDelta = radiusMeters / 111000;
    const lngDelta = radiusMeters / (111000 * Math.cos(centerLat * Math.PI / 180));
    body.locationRestriction = {
      rectangle: {
        low: { latitude: centerLat - latDelta, longitude: centerLng - lngDelta },
        high: { latitude: centerLat + latDelta, longitude: centerLng + lngDelta }
      }
    };
  }

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.rating',
    'places.userRatingCount',
    'places.photos',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.googleMapsUri',
    'places.businessStatus',
    'places.currentOpeningHours',
    'places.location'
  ].join(',');

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': fieldMask
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Places API error: ${res.status}`);
  }

  const data = await res.json();
  let vendors = (data.places || []).map(normalizePlaceResult);

  // Compute exact distance and filter strictly to chosen radius
  if (centerLat && centerLng) {
    vendors = vendors.map(v => {
      const dist = (v.lat && v.lng) ? getHaversineKm(centerLat, centerLng, v.lat, v.lng) : null;
      return {
        ...v,
        distanceKm: dist,
        distanceText: dist !== null ? (dist < 1 ? `${Math.round(dist * 1000)} m away` : `${dist} km away`) : null
      };
    });

    // Enforce that vendors returned are strictly within the requested radius (e.g. within 10km or 20km)
    vendors = vendors.filter(v => v.distanceKm === null || v.distanceKm <= radiusKm);

    // Sort accordingly
    if (sortBy === 'rating') {
      vendors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      vendors.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }
  }

  return vendors;
}

async function placeDetails(placeId) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured.');
  }

  const fieldMask = [
    'id',
    'displayName',
    'formattedAddress',
    'rating',
    'userRatingCount',
    'photos',
    'nationalPhoneNumber',
    'internationalPhoneNumber',
    'websiteUri',
    'googleMapsUri',
    'businessStatus',
    'currentOpeningHours',
    'location',
    'reviews',
    'editorialSummary',
    'priceLevel'
  ].join(',');

  const res = await fetch(`${PLACES_BASE}/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': fieldMask
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Place Details error: ${res.status}`);
  }

  const place = await res.json();
  return normalizePlaceResult(place);
}

function normalizePlaceResult(place) {
  // Build a photo URL via our proxy to avoid exposing the API key
  let photoUrl = null;
  if (place.photos && place.photos.length > 0) {
    const photoName = place.photos[0].name;
    photoUrl = `/api/vendors/photo?name=${encodeURIComponent(photoName)}`;
  }

  return {
    placeId: place.id,
    name: place.displayName?.text || '',
    address: place.formattedAddress || '',
    rating: place.rating || 0,
    ratingCount: place.userRatingCount || 0,
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
    website: place.websiteUri || '',
    mapsUrl: place.googleMapsUri || '',
    status: place.businessStatus || 'OPERATIONAL',
    photoUrl,
    lat: place.location?.latitude || null,
    lng: place.location?.longitude || null,
    openNow: place.currentOpeningHours?.openNow ?? null,
    weekdayHours: place.currentOpeningHours?.weekdayDescriptions || [],
    summary: place.editorialSummary?.text || '',
    priceLevel: place.priceLevel || null,
    reviews: (place.reviews || []).slice(0, 3).map(r => ({
      author: r.authorAttribution?.displayName || 'Anonymous',
      rating: r.rating || 0,
      text: r.text?.text || '',
      time: r.relativePublishTimeDescription || ''
    })),
    allPhotos: (place.photos || []).slice(0, 5).map(p => `/api/vendors/photo?name=${encodeURIComponent(p.name)}`)
  };
}

// ── Geocode a city/area name to lat/lng ──────────────
async function geocodeLocation(address) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured.');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    throw new Error(`Could not geocode "${address}". Please try a different location.`);
  }

  const result = data.results[0];
  return {
    formattedAddress: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng
  };
}

// ── Controllers ──────────────────────────────────────

async function getCategories(req, res) {
  try {
    res.json(VENDOR_CATEGORIES.map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      border: c.border,
      description: c.description
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function searchVendors(req, res) {
  try {
    const { category, lat, lng, radius, q, sortBy } = req.query;

    // If a free-text query is given, use it directly
    let searchQuery = q || '';

    if (!searchQuery && category) {
      const cat = VENDOR_CATEGORIES.find(c => c.id === category);
      if (!cat) return res.status(400).json({ error: 'Invalid category' });
      searchQuery = cat.searchQuery;
    }

    if (!searchQuery) {
      return res.status(400).json({ error: 'Provide category or q parameter' });
    }

    const vendors = await placesTextSearch(searchQuery, lat, lng, radius || 10000, sortBy);

    // Cache results in local storage
    try {
      await cacheVendors(req.user.uid, category || 'search', vendors);
    } catch (_) { /* caching is best-effort */ }

    res.json(vendors);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getVendorDetails(req, res) {
  try {
    const { placeId } = req.params;
    if (!placeId) return res.status(400).json({ error: 'Place ID required' });

    const details = await placeDetails(placeId);
    res.json(details);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getVendorPhoto(req, res) {
  try {
    const { name } = req.query;
    if (!name || !GOOGLE_MAPS_API_KEY) {
      return res.status(400).json({ error: 'Photo name required' });
    }

    const photoUrl = `${PLACES_BASE}/${name}/media?maxWidthPx=800&key=${GOOGLE_MAPS_API_KEY}`;
    const photoRes = await fetch(photoUrl);

    if (!photoRes.ok) {
      return res.status(photoRes.status).json({ error: 'Photo not found' });
    }

    const contentType = photoRes.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // cache 24h

    const buffer = await photoRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function requestQuote(req, res) {
  try {
    const { vendorName, vendorEmail, vendorPhone, userName, userEmail, userPhone, eventDate, eventType, guestCount, message } = req.body;

    if (!vendorName) return res.status(400).json({ error: 'Vendor name required' });

    // Save the quotation request locally
    const quoteRequest = {
      id: Date.now(),
      user_id: req.user.uid,
      vendor_name: vendorName,
      vendor_email: vendorEmail || '',
      vendor_phone: vendorPhone || '',
      user_name: userName || '',
      user_email: userEmail || req.user.email || '',
      user_phone: userPhone || '',
      event_date: eventDate || '',
      event_type: eventType || 'Wedding',
      guest_count: guestCount || '',
      message: message || '',
      status: 'sent',
      created_at: new Date().toISOString()
    };

    if (isLibSQL()) {
      await dbRun(
        `INSERT INTO vendor_quotes (user_id, vendor_name, vendor_email, vendor_phone, user_name, user_email, user_phone, event_date, event_type, guest_count, message, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [quoteRequest.user_id, quoteRequest.vendor_name, quoteRequest.vendor_email, quoteRequest.vendor_phone, quoteRequest.user_name, quoteRequest.user_email, quoteRequest.user_phone, quoteRequest.event_date, quoteRequest.event_type, quoteRequest.guest_count, quoteRequest.message, quoteRequest.status, quoteRequest.created_at]
      );
    } else {
      const d = readJSON();
      if (!d.vendor_quotes) d.vendor_quotes = [];
      d.vendor_quotes.push(quoteRequest);
      writeJSON(d);
    }

    // If vendor has email, try to send email via nodemailer (best-effort)
    if (vendorEmail) {
      try {
        const nodemailer = require('nodemailer');
        const d = isLibSQL() ? null : readJSON();
        let emailSettings;
        
        if (isLibSQL()) {
          const row = await dbGet("SELECT * FROM email_settings WHERE user_id = ?", [req.user.uid]);
          emailSettings = row;
        } else {
          emailSettings = d?.email_settings?.find(s => s.user_id === req.user.uid);
        }

        if (emailSettings && emailSettings.smtp_host) {
          const transporter = nodemailer.createTransport({
            host: emailSettings.smtp_host,
            port: Number(emailSettings.smtp_port) || 587,
            secure: emailSettings.smtp_secure === 'true' || emailSettings.smtp_secure === true,
            auth: {
              user: emailSettings.smtp_user,
              pass: emailSettings.smtp_pass
            }
          });

          await transporter.sendMail({
            from: `"${userName || 'Wedding Planning'}" <${emailSettings.smtp_user}>`,
            to: vendorEmail,
            subject: `Wedding Quotation Request - ${eventType || 'Wedding'} on ${eventDate || 'TBD'}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <h2 style="color:#234c6a">Quotation Request</h2>
                <p>Dear <strong>${vendorName}</strong>,</p>
                <p>I am planning my wedding and would like to request a quotation for your services.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Event Type</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${eventType || 'Wedding'}</strong></td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Event Date</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${eventDate || 'To be decided'}</strong></td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Expected Guests</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${guestCount || 'TBD'}</strong></td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Contact</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${userEmail}${userPhone ? ' / ' + userPhone : ''}</strong></td></tr>
                </table>
                ${message ? `<p><strong>Message:</strong></p><p>${message}</p>` : ''}
                <p style="color:#666;font-size:12px;margin-top:24px">Sent via Marriage Manager</p>
              </div>
            `
          });
        }
      } catch (emailErr) {
        console.warn('Quote email send failed (non-critical):', emailErr.message);
      }
    }

    res.status(201).json({ success: true, quote: quoteRequest });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function autocompleteLocations(req, res) {
  try {
    const { input } = req.query;
    if (!input || input.trim().length < 2) {
      return res.json([]);
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY is not configured.' });
    }

    const body = {
      input: input.trim(),
      languageCode: 'en'
    };

    const apiRes = await fetch(`${PLACES_BASE}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY
      },
      body: JSON.stringify(body)
    });

    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}));
      return res.status(apiRes.status).json({ error: err.error?.message || 'Autocomplete failed' });
    }

    const data = await apiRes.json();
    const suggestions = (data.suggestions || []).map(s => {
      const pred = s.placePrediction;
      return {
        placeId: pred?.placeId || '',
        description: pred?.text?.text || '',
        mainText: pred?.structuredFormat?.mainText?.text || pred?.text?.text || '',
        secondaryText: pred?.structuredFormat?.secondaryText?.text || ''
      };
    }).filter(s => s.description);

    res.json(suggestions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function saveLocation(req, res) {
  try {
    const { location, lat, lng, placeId } = req.body;
    if (!location) return res.status(400).json({ error: 'Location required' });

    // If lat/lng not provided, attempt placeId lookup or geocode
    let finalLat = lat ? Number(lat) : null;
    let finalLng = lng ? Number(lng) : null;
    let formattedAddress = location;

    if (placeId && (!finalLat || !finalLng) && GOOGLE_MAPS_API_KEY) {
      try {
        const placeRes = await fetch(`${PLACES_BASE}/places/${placeId}`, {
          headers: {
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location'
          }
        });
        if (placeRes.ok) {
          const pData = await placeRes.json();
          if (pData.location?.latitude && pData.location?.longitude) {
            finalLat = pData.location.latitude;
            finalLng = pData.location.longitude;
            formattedAddress = pData.formattedAddress || pData.displayName?.text || location;
          }
        }
      } catch (err) {
        console.warn('PlaceId resolution warning:', err.message);
      }
    }

    if (!finalLat || !finalLng) {
      const geo = await geocodeLocation(location);
      finalLat = geo.lat;
      finalLng = geo.lng;
      formattedAddress = geo.formattedAddress;
    }

    if (isLibSQL()) {
      const existing = await dbGet('SELECT * FROM vendor_locations WHERE user_id = ?', [req.user.uid]);
      if (existing) {
        await dbRun(
          'UPDATE vendor_locations SET location = ?, lat = ?, lng = ? WHERE user_id = ?',
          [formattedAddress, finalLat, finalLng, req.user.uid]
        );
      } else {
        await dbRun(
          'INSERT INTO vendor_locations (user_id, location, lat, lng) VALUES (?, ?, ?, ?)',
          [req.user.uid, formattedAddress, finalLat, finalLng]
        );
      }
    } else {
      const d = readJSON();
      if (!d.vendor_locations) d.vendor_locations = {};
      d.vendor_locations[req.user.uid] = { location: formattedAddress, lat: finalLat, lng: finalLng };
      writeJSON(d);
    }

    res.json({ location: formattedAddress, lat: finalLat, lng: finalLng });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getLocation(req, res) {
  try {
    if (isLibSQL()) {
      const row = await dbGet('SELECT * FROM vendor_locations WHERE user_id = ?', [req.user.uid]);
      if (!row) return res.json(null);
      return res.json({ location: row.location, lat: row.lat, lng: row.lng });
    }

    const d = readJSON();
    const loc = d.vendor_locations?.[req.user.uid] || null;
    res.json(loc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── Vendor Cache (best-effort, reduces API calls) ────

async function cacheVendors(userId, category, vendors) {
  if (isLibSQL()) {
    for (const v of vendors) {
      try {
        await dbRun(
          `INSERT OR REPLACE INTO vendor_cache (place_id, category, data, cached_at) VALUES (?, ?, ?, ?)`,
          [v.placeId, category, JSON.stringify(v), new Date().toISOString()]
        );
      } catch (_) {}
    }
  } else {
    const d = readJSON();
    if (!d.vendor_cache) d.vendor_cache = {};
    for (const v of vendors) {
      d.vendor_cache[v.placeId] = { ...v, category, cachedAt: new Date().toISOString() };
    }
    writeJSON(d);
  }
}

module.exports = {
  getCategories,
  searchVendors,
  getVendorDetails,
  getVendorPhoto,
  requestQuote,
  saveLocation,
  getLocation,
  autocompleteLocations
};
