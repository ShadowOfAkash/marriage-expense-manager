const fs   = require('fs');
const path = require('path');
const { UPLOADS_DIR } = require('../config/env');
const { isLibSQL, dbGet, dbAll, dbRun, readJSON, writeJSON } = require('../db');
const { scanReceiptImage } = require('../services/geminiService');

async function scanReceipt(req, res) {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: 'Image data and mimeType are required.' });
    }

    const imgBuffer = Buffer.from(image, 'base64');
    const ext = mimeType === 'application/pdf' ? '.pdf' : '.jpg';
    const filename = `scan_${Date.now()}${ext}`;
    
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), imgBuffer);
    const receipt_url = `/uploads/${filename}`;

    const parsedData = await scanReceiptImage({ imageBase64: image, mimeType });
    res.json({ ...parsedData, receipt_url });
  } catch (e) {
    console.error('Scan error:', e);
    res.status(500).json({ error: 'Failed to scan receipt: ' + e.message });
  }
}

function uploadFile(req, res) {
  try {
    const { file, filename } = req.body;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    
    const buffer = Buffer.from(file, 'base64');
    const safeName = (filename || 'doc.bin').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const finalName = `doc_${Date.now()}_${safeName}`;

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(UPLOADS_DIR, finalName), buffer);
    res.json({ url: `/uploads/${finalName}` });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ error: e.message });
  }
}

async function listPayments(req, res) {
  try {
    if (isLibSQL()) {
      const rows = await dbAll(`
        SELECT p.*, 
               COALESCE(b.category, p.category, 'Miscellaneous') as category,
               COALESCE(p.payment_type, 'Normal') as payment_type
        FROM payments p
        LEFT JOIN bookings b ON p.booking_id = b.id
        WHERE p.user_id = ?
        ORDER BY p.date DESC, p.id DESC
      `, [req.user.uid]);
      return res.json(rows);
    }

    const d = readJSON();
    const bkMap = (d.bookings || []).reduce((acc, b) => { acc[b.id] = b; return acc; }, {});
    const items = [...(d.payments || d.expenses || [])]
      .filter(e => e.user_id === req.user.uid || !e.user_id || e.user_id === 'legacy_user')
      .map(e => ({
        ...e,
        category: (e.booking_id && bkMap[e.booking_id]?.category) || e.category || 'Miscellaneous',
        payment_type: e.payment_type || 'Normal'
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createPayment(req, res) {
  const { category, description, amount, date, status, receipt_url, booking_id, payment_type } = req.body;
  const finalStatus = status || 'approved';
  const finalPaymentType = payment_type === 'Advance' ? 'Advance' : 'Normal';
  if (!amount || !date) return res.status(400).json({ error: 'Amount and date required' });

  try {
    let resolvedCategory = category || '';
    if (isLibSQL()) {
      if (booking_id && !resolvedCategory) {
        const bk = await dbGet('SELECT category FROM bookings WHERE id = ?', [booking_id]);
        if (bk && bk.category) resolvedCategory = bk.category;
      }
      if (!resolvedCategory) resolvedCategory = 'Miscellaneous';

      const r = await dbRun(
        'INSERT INTO payments (category, description, amount, date, status, receipt_url, user_id, booking_id, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [resolvedCategory, description || '', Number(amount), date, finalStatus, receipt_url || '', req.user.uid, booking_id ? Number(booking_id) : null, finalPaymentType]
      );
      const row = await dbGet('SELECT * FROM payments WHERE id = ?', [r.lastInsertRowid]);
      return res.status(201).json(row);
    }

    const d = readJSON();
    if (booking_id && !resolvedCategory) {
      const bk = (d.bookings || []).find(b => b.id === Number(booking_id));
      if (bk && bk.category) resolvedCategory = bk.category;
    }
    if (!resolvedCategory) resolvedCategory = 'Miscellaneous';

    const payment = {
      id: d._nextPaymentId++,
      user_id: req.user.uid,
      category: resolvedCategory,
      description: description || '',
      amount: Number(amount),
      date,
      status: finalStatus,
      receipt_url: receipt_url || '',
      booking_id: booking_id ? Number(booking_id) : null,
      payment_type: finalPaymentType,
      created_at: new Date().toISOString()
    };
    d.payments.push(payment);
    writeJSON(d);
    res.status(201).json(payment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function updatePayment(req, res) {
  const id = parseInt(req.params.id);
  const { category, description, amount, date, status, receipt_url, booking_id, payment_type } = req.body;
  const finalStatus = status || 'approved';
  const finalPaymentType = payment_type === 'Advance' ? 'Advance' : 'Normal';

  try {
    let resolvedCategory = category || '';
    if (isLibSQL()) {
      if (booking_id && !resolvedCategory) {
        const bk = await dbGet('SELECT category FROM bookings WHERE id = ?', [booking_id]);
        if (bk && bk.category) resolvedCategory = bk.category;
      }
      if (!resolvedCategory) {
        const existing = await dbGet('SELECT category FROM payments WHERE id = ?', [id]);
        resolvedCategory = existing?.category || 'Miscellaneous';
      }
      await dbRun(
        'UPDATE payments SET category=?, description=?, amount=?, date=?, status=?, receipt_url=?, booking_id=?, payment_type=? WHERE id=?',
        [resolvedCategory, description || '', Number(amount), date, finalStatus, receipt_url || '', booking_id ? Number(booking_id) : null, finalPaymentType, id]
      );
      const row = await dbGet('SELECT * FROM payments WHERE id = ?', [id]);
      return res.json(row);
    }

    const d = readJSON();
    const idx = d.payments.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    if (booking_id && !resolvedCategory) {
      const bk = (d.bookings || []).find(b => b.id === Number(booking_id));
      if (bk && bk.category) resolvedCategory = bk.category;
    }
    if (!resolvedCategory) {
      resolvedCategory = d.payments[idx].category || 'Miscellaneous';
    }

    d.payments[idx] = {
      ...d.payments[idx],
      category: resolvedCategory,
      description: description || '',
      amount: Number(amount),
      date,
      status: finalStatus,
      receipt_url: receipt_url || d.payments[idx].receipt_url || '',
      booking_id: booking_id !== undefined ? (booking_id ? Number(booking_id) : null) : d.payments[idx].booking_id,
      payment_type: finalPaymentType
    };
    writeJSON(d);
    res.json(d.payments[idx]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function detachPayment(req, res) {
  const id = parseInt(req.params.id);
  try {
    if (isLibSQL()) {
      const p = await dbGet('SELECT p.*, b.category as bk_category FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id WHERE p.id = ?', [id]);
      if (!p) return res.status(404).json({ error: 'Payment not found' });
      const cat = p.category || p.bk_category || 'Miscellaneous';
      await dbRun('UPDATE payments SET booking_id = NULL, category = ? WHERE id = ?', [cat, id]);
      const updated = await dbGet('SELECT * FROM payments WHERE id = ?', [id]);
      return res.json(updated);
    }

    const d = readJSON();
    const idx = d.payments.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Payment not found' });
    const bk = (d.bookings || []).find(b => b.id === Number(d.payments[idx].booking_id));
    d.payments[idx].category = d.payments[idx].category || bk?.category || 'Miscellaneous';
    d.payments[idx].booking_id = null;
    writeJSON(d);
    res.json(d.payments[idx]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function deletePayment(req, res) {
  const id = parseInt(req.params.id);
  try {
    if (isLibSQL()) {
      await dbRun('DELETE FROM payments WHERE id = ?', [id]);
      return res.json({ success: true });
    }
    const d = readJSON();
    const idx = d.payments.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.payments.splice(idx, 1);
    writeJSON(d);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getCategories(req, res) {
  try {
    if (isLibSQL()) {
      return res.json(await dbAll(`
        SELECT COALESCE(b.category, p.category, 'Miscellaneous') as category,
               SUM(p.amount) as total,
               COUNT(*) as count
        FROM payments p
        LEFT JOIN bookings b ON p.booking_id = b.id
        WHERE p.user_id = ?
        GROUP BY COALESCE(b.category, p.category, 'Miscellaneous')
        ORDER BY total DESC
      `, [req.user.uid]));
    }

    const d = readJSON();
    const bkMap = (d.bookings || []).reduce((acc, b) => { acc[b.id] = b; return acc; }, {});
    const map = {};
    for (const e of (d.payments || d.expenses || []).filter(e => e.user_id === req.user.uid || !e.user_id || e.user_id === 'legacy_user')) {
      const cat = (e.booking_id && bkMap[e.booking_id]?.category) || e.category || 'Miscellaneous';
      if (!map[cat]) map[cat] = { category: cat, total: 0, count: 0 };
      map[cat].total += e.amount;
      map[cat].count++;
    }
    res.json(Object.values(map).sort((a, b) => b.total - a.total));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  scanReceipt,
  uploadFile,
  listPayments,
  createPayment,
  updatePayment,
  detachPayment,
  deletePayment,
  getCategories
};
