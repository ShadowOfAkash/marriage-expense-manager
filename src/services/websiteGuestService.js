const { dbAll, dbRun, isLibSQL, readJSON, writeJSON, generateRsvpToken } = require('../db');
const { LEGACY_ADMIN_EMAIL, LEGACY_ADMIN_UID } = require('../middleware/auth');

const eventNames = { haldi: 'Haldi', mehndi: 'Mehendi', wedding: 'Wedding' };

function getWebsiteGuestOwnerEmail() {
  return process.env.WEDDING_SITE_ADMIN_EMAIL?.trim().toLowerCase() || LEGACY_ADMIN_EMAIL;
}

function getWebsiteGuestOwner() {
  const email = getWebsiteGuestOwnerEmail();
  if (email === LEGACY_ADMIN_EMAIL) return LEGACY_ADMIN_UID;
  return process.env.WEDDING_SITE_ADMIN_UID?.trim() || undefined;
}

function toGuest(response, owner) {
  return {
    guest_id: 'WEB-' + response.id,
    user_id: owner,
    name: response.name,
    side: response.side ?? 'Both',
    relationship_category: response.relationship ?? 'Other',
    phone: response.phone ?? '',
    email: response.email ?? '',
    food_preference: response.food ?? '',
    stay_preference: response.stay ?? 'No need of stay',
    special_requirements: response.requirements ?? '',
    relationship_detail: 'Wedding website RSVP',
    guest_type: response.guests > 1 ? 'Group' : 'Individual',
    rsvp_status: response.attendance === 'yes' ? 'Confirmed' : 'Declined',
    expected_adults: response.adults ?? response.guests,
    expected_children: response.children ?? 0,
    expected_attendees: response.guests,
    actual_attendance: 'Pending',
    tags: ['Website RSVP'],
    events: response.events.map(event => eventNames[event]),
    rsvp_token: generateRsvpToken(),
    created_at: response.receivedAt,
    updated_at: response.receivedAt,
  };
}

function appendJsonGuest(data, guest) {
  if (data.guests.some(existing => existing.guest_id === guest.guest_id)) return false;
  const id = data._nextGuestId++;
  data.guests.push({ ...guest, id });
  return true;
}

async function insertSqlGuest(guest) {
  await dbRun(
    `INSERT INTO guests (guest_id, user_id, name, side, relationship_category,
      relationship_detail, guest_type, rsvp_status, expected_adults, expected_children,
      expected_attendees, tags, events, rsvp_token, created_at, updated_at,
      phone, email, food_preference, stay_preference, special_requirements)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(guest_id) DO NOTHING`,
    [guest.guest_id, guest.user_id, guest.name, guest.side, guest.relationship_category,
      guest.relationship_detail, guest.guest_type, guest.rsvp_status, guest.expected_adults,
      guest.expected_children, guest.expected_attendees, JSON.stringify(guest.tags),
      JSON.stringify(guest.events), guest.rsvp_token, guest.created_at, guest.updated_at,
      guest.phone, guest.email, guest.food_preference, guest.stay_preference, guest.special_requirements]
  );
}

async function saveWebsiteGuest(response, owner) {
  const guest = toGuest(response, owner);
  if (isLibSQL()) {
    await insertSqlGuest(guest);
  } else {
    const data = readJSON();
    if (appendJsonGuest(data, guest)) writeJSON(data);
  }
}

async function migrateWebsiteGuests(user) {
  const owner = getWebsiteGuestOwner();
  if (!owner || user.uid !== owner || user.email_verified !== true) return;

  if (isLibSQL()) {
    const rows = await dbAll('SELECT id, response FROM wedding_site_rsvps ORDER BY received_at');
    for (const row of rows) {
      await insertSqlGuest(toGuest(JSON.parse(row.response), owner));
      await dbRun('DELETE FROM wedding_site_rsvps WHERE id = ?', [row.id]);
    }
  } else {
    const data = readJSON();
    const responses = Object.values(data.weddingSiteRsvps || {});
    if (responses.length === 0) return;
    for (const response of responses) appendJsonGuest(data, toGuest(response, owner));
    delete data.weddingSiteRsvps;
    writeJSON(data);
  }
}

module.exports = { getWebsiteGuestOwnerEmail, getWebsiteGuestOwner, saveWebsiteGuest, migrateWebsiteGuests };
