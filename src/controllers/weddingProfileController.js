const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR } = require('../config/env');
const { isLibSQL, dbGet, dbRun, readJSON, writeJSON } = require('../db');

/**
 * GET /api/wedding/profile
 * Retrieves the wedding profile and onboarding status for the logged in user.
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.uid;

    if (isLibSQL()) {
      const row = await dbGet('SELECT * FROM wedding_profiles WHERE user_id = ?', [userId]);
      return res.json(row || null);
    }

    const d = readJSON();
    const profile = d.wedding_profiles?.[userId] || null;
    return res.json(profile);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/wedding/profile
 * Saves or updates wedding profile fields.
 */
async function saveProfile(req, res) {
  try {
    const userId = req.user.uid;
    const {
      user_role,
      groom_name,
      bride_name,
      wedding_date,
      wedding_location,
      wedding_lat,
      wedding_lng,
      planning_side,
      estimated_budget,
      estimated_guests,
      story_title,
      cover_photo_url,
      groom_photo_url,
      bride_photo_url,
      onboarding_completed
    } = req.body;

    const now = new Date().toISOString();

    if (isLibSQL()) {
      const existing = await dbGet('SELECT * FROM wedding_profiles WHERE user_id = ?', [userId]);
      if (existing) {
        await dbRun(
          `UPDATE wedding_profiles SET
            user_role = COALESCE(?, user_role),
            groom_name = COALESCE(?, groom_name),
            bride_name = COALESCE(?, bride_name),
            wedding_date = COALESCE(?, wedding_date),
            wedding_location = COALESCE(?, wedding_location),
            wedding_lat = COALESCE(?, wedding_lat),
            wedding_lng = COALESCE(?, wedding_lng),
            planning_side = COALESCE(?, planning_side),
            estimated_budget = COALESCE(?, estimated_budget),
            estimated_guests = COALESCE(?, estimated_guests),
            story_title = COALESCE(?, story_title),
            cover_photo_url = COALESCE(?, cover_photo_url),
            groom_photo_url = COALESCE(?, groom_photo_url),
            bride_photo_url = COALESCE(?, bride_photo_url),
            onboarding_completed = COALESCE(?, onboarding_completed),
            updated_at = ?
          WHERE user_id = ?`,
          [
            user_role, groom_name, bride_name, wedding_date,
            wedding_location, wedding_lat, wedding_lng, planning_side,
            estimated_budget, estimated_guests, story_title,
            cover_photo_url, groom_photo_url, bride_photo_url,
            onboarding_completed, now, userId
          ]
        );
      } else {
        await dbRun(
          `INSERT INTO wedding_profiles (
            user_id, user_role, groom_name, bride_name, wedding_date,
            wedding_location, wedding_lat, wedding_lng, planning_side,
            estimated_budget, estimated_guests, story_title, cover_photo_url,
            groom_photo_url, bride_photo_url,
            onboarding_completed, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            user_role || 'Groom',
            groom_name || '',
            bride_name || '',
            wedding_date || '',
            wedding_location || '',
            wedding_lat || 0,
            wedding_lng || 0,
            planning_side || 'Both',
            Number(estimated_budget) || 0,
            Number(estimated_guests) || 0,
            story_title || '',
            cover_photo_url || '',
            groom_photo_url || '',
            bride_photo_url || '',
            onboarding_completed ? 1 : 0,
            now,
            now
          ]
        );
      }

      const updated = await dbGet('SELECT * FROM wedding_profiles WHERE user_id = ?', [userId]);
      return res.json(updated);
    }

    // JSON DB fallback
    const d = readJSON();
    if (!d.wedding_profiles) d.wedding_profiles = {};
    const prev = d.wedding_profiles[userId] || {};

    const updated = {
      ...prev,
      user_id: userId,
      user_role: user_role !== undefined ? user_role : (prev.user_role || 'Groom'),
      groom_name: groom_name !== undefined ? groom_name : (prev.groom_name || ''),
      bride_name: bride_name !== undefined ? bride_name : (prev.bride_name || ''),
      wedding_date: wedding_date !== undefined ? wedding_date : (prev.wedding_date || ''),
      wedding_location: wedding_location !== undefined ? wedding_location : (prev.wedding_location || ''),
      wedding_lat: wedding_lat !== undefined ? Number(wedding_lat) : (prev.wedding_lat || 0),
      wedding_lng: wedding_lng !== undefined ? Number(wedding_lng) : (prev.wedding_lng || 0),
      planning_side: planning_side !== undefined ? planning_side : (prev.planning_side || 'Both'),
      estimated_budget: estimated_budget !== undefined ? Number(estimated_budget) : (prev.estimated_budget || 0),
      estimated_guests: estimated_guests !== undefined ? Number(estimated_guests) : (prev.estimated_guests || 0),
      story_title: story_title !== undefined ? story_title : (prev.story_title || ''),
      cover_photo_url: cover_photo_url !== undefined ? cover_photo_url : (prev.cover_photo_url || ''),
      groom_photo_url: groom_photo_url !== undefined ? groom_photo_url : (prev.groom_photo_url || ''),
      bride_photo_url: bride_photo_url !== undefined ? bride_photo_url : (prev.bride_photo_url || ''),
      onboarding_completed: onboarding_completed !== undefined ? (onboarding_completed ? 1 : 0) : (prev.onboarding_completed || 0),
      updated_at: now,
      created_at: prev.created_at || now
    };

    d.wedding_profiles[userId] = updated;
    writeJSON(d);
    return res.json(updated);
  } catch (err) {
    console.error('saveProfile error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/wedding/onboard
 * Completes the onboarding flow: saves profile, sets onboarding_completed = 1,
 * and seamlessly synchronizes budget and location across the system.
 */
async function completeOnboarding(req, res) {
  try {
    const userId = req.user.uid;
    const {
      user_role,
      groom_name,
      bride_name,
      wedding_date,
      wedding_location,
      wedding_lat,
      wedding_lng,
      planning_side,
      estimated_budget,
      estimated_guests,
      story_title
    } = req.body;

    const budgetNum = Number(estimated_budget) || 0;
    const guestsNum = Number(estimated_guests) || 0;
    const roleVal = user_role || 'Groom';
    const sideVal = planning_side || (roleVal === 'Groom' ? 'Groom' : roleVal === 'Bride' ? 'Bride' : 'Both');

    // Auto-generate story title if empty (e.g. "Akash & Priya's Wedding")
    const gName = groom_name ? groom_name.trim() : '';
    const bName = bride_name ? bride_name.trim() : '';
    const autoTitle = (gName && bName)
      ? `${gName} & ${bName}'s Wedding`
      : (gName ? `${gName}'s Wedding` : (bName ? `${bName}'s Wedding` : 'Our Wedding Celebration'));

    const finalTitle = story_title && story_title.trim() ? story_title.trim() : autoTitle;
    const now = new Date().toISOString();

    if (isLibSQL()) {
      // 1. Upsert wedding profile
      await dbRun(
        `INSERT OR REPLACE INTO wedding_profiles (
          user_id, user_role, groom_name, bride_name, wedding_date,
          wedding_location, wedding_lat, wedding_lng, planning_side,
          estimated_budget, estimated_guests, story_title,
          onboarding_completed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          userId, roleVal, gName, bName, wedding_date || '',
          wedding_location || '', Number(wedding_lat) || 0, Number(wedding_lng) || 0, sideVal,
          budgetNum, guestsNum, finalTitle, now, now
        ]
      );

      // 2. Sync estimated budget into user_budget table
      if (budgetNum > 0) {
        await dbRun(
          `INSERT OR REPLACE INTO user_budget (user_id, amount, updated_at) VALUES (?, ?, ?)`,
          [userId, budgetNum, now]
        );
      }

      // 3. Sync wedding location into vendor_locations table for instant search
      if (wedding_location) {
        await dbRun(
          `INSERT OR REPLACE INTO vendor_locations (user_id, location, lat, lng, updated_at) VALUES (?, ?, ?, ?, ?)`,
          [userId, wedding_location, Number(wedding_lat) || 0, Number(wedding_lng) || 0, now]
        );
      }

      const profile = await dbGet('SELECT * FROM wedding_profiles WHERE user_id = ?', [userId]);
      return res.status(201).json({ success: true, profile });
    }

    // JSON fallback
    const d = readJSON();
    if (!d.wedding_profiles) d.wedding_profiles = {};
    if (!d.user_budget) d.user_budget = {};
    if (!d.vendor_locations) d.vendor_locations = {};

    const profile = {
      user_id: userId,
      user_role: roleVal,
      groom_name: gName,
      bride_name: bName,
      wedding_date: wedding_date || '',
      wedding_location: wedding_location || '',
      wedding_lat: Number(wedding_lat) || 0,
      wedding_lng: Number(wedding_lng) || 0,
      planning_side: sideVal,
      estimated_budget: budgetNum,
      estimated_guests: guestsNum,
      story_title: finalTitle,
      cover_photo_url: '',
      onboarding_completed: 1,
      created_at: d.wedding_profiles[userId]?.created_at || now,
      updated_at: now
    };

    d.wedding_profiles[userId] = profile;

    if (budgetNum > 0) {
      if (!d.user_budgets) d.user_budgets = {};
      if (!d.user_budgets[userId]) d.user_budgets[userId] = {};
      d.user_budgets[userId].amount = budgetNum;
      if (d.budget) d.budget.amount = budgetNum;
    }

    if (wedding_location) {
      d.vendor_locations[userId] = {
        location: wedding_location,
        lat: Number(wedding_lat) || 0,
        lng: Number(wedding_lng) || 0
      };
    }

    writeJSON(d);
    return res.status(201).json({ success: true, profile });
  } catch (err) {
    console.error('completeOnboarding error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/wedding/upload-photo
 * Handles base64 photo uploads for bride, groom, or wedding cover.
 */
async function uploadWeddingPhoto(req, res) {
  try {
    const { file, filename, type } = req.body;
    if (!file) return res.status(400).json({ error: 'No image data provided' });

    // Clean base64 string if data URL prefix is included
    const base64Data = file.includes(',') ? file.split(',')[1] : file;
    const buffer = Buffer.from(base64Data, 'base64');
    
    const safeType = type === 'bride' ? 'bride' : type === 'groom' ? 'groom' : type === 'cover' ? 'cover' : 'photo';
    const ext = filename && filename.includes('.') ? path.extname(filename) : '.jpg';
    const finalName = `couple_${safeType}_${Date.now()}${ext}`;

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(UPLOADS_DIR, finalName), buffer);
    const photoUrl = `/uploads/${finalName}`;

    res.json({ success: true, url: photoUrl });
  } catch (e) {
    console.error('Photo upload error:', e);
    res.status(500).json({ error: 'Failed to upload photo: ' + e.message });
  }
}

module.exports = {
  getProfile,
  saveProfile,
  completeOnboarding,
  uploadWeddingPhoto
};
