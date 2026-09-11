const { isLibSQL, dbRun, readJSON, writeJSON } = require('../db');
const {
  getUserEmailConfig,
  verifyEmailConfig,
  sendTestEmail
} = require('../services/emailService');

async function getEmailSettings(req, res) {
  try {
    const config = await getUserEmailConfig(req.user.uid);
    if (!config) {
      return res.json({
        configured: false,
        provider: 'gmail',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_secure: false,
        smtp_user: '',
        sender_name: '',
        hasPassword: false
      });
    }

    res.json({
      configured: true,
      provider: config.provider,
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_secure: config.smtp_secure,
      smtp_user: config.smtp_user,
      sender_name: config.sender_name,
      hasPassword: Boolean(config.smtp_pass)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function saveEmailSettings(req, res) {
  try {
    const { provider, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, sender_name } = req.body || {};
    if (!smtp_user || !String(smtp_user).trim()) {
      return res.status(400).json({ error: 'Email / Username is required' });
    }

    const cleanUser = String(smtp_user).trim();
    const existing = await getUserEmailConfig(req.user.uid);
    let passToUse = (smtp_pass && String(smtp_pass).trim()) ? String(smtp_pass).trim() : (existing ? existing.smtp_pass : '');
    // Clean spaces and quotes from password (very common when copying 16-character Google App Passwords)
    passToUse = passToUse ? passToUse.replace(/["'\s]/g, '') : '';

    if (!passToUse) {
      return res.status(400).json({ error: 'Password or Google App Password is required' });
    }

    const providerToUse = provider || (cleanUser.includes('@gmail.com') ? 'gmail' : 'smtp');
    const hostToUse = (smtp_host && String(smtp_host).trim()) ? String(smtp_host).trim() : 'smtp.gmail.com';
    const portToUse = Number(smtp_port) || (providerToUse === 'gmail' ? 465 : 587);
    const secureToUse = Boolean(smtp_secure) || portToUse === 465;
    const senderNameToUse = sender_name && String(sender_name).trim() ? String(sender_name).trim() : 'Wedding Celebrations';

    // Verify SMTP connection before saving (dual-port check for cloud hosting reliability)
    try {
      await verifyEmailConfig({
        provider: providerToUse,
        host: hostToUse,
        port: portToUse,
        secure: secureToUse,
        user: cleanUser,
        pass: passToUse
      });
    } catch (verifyErr) {
      return res.status(400).json({ error: verifyErr.message });
    }

    // Save to Database / JSON
    if (isLibSQL()) {
      await dbRun(`
        INSERT INTO email_settings (user_id, provider, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, sender_name, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          provider = excluded.provider,
          smtp_host = excluded.smtp_host,
          smtp_port = excluded.smtp_port,
          smtp_secure = excluded.smtp_secure,
          smtp_user = excluded.smtp_user,
          smtp_pass = excluded.smtp_pass,
          sender_name = excluded.sender_name,
          updated_at = datetime('now')
      `, [req.user.uid, providerToUse, hostToUse, portToUse, secureToUse ? 1 : 0, cleanUser, passToUse, senderNameToUse]);
    } else {
      const d = readJSON();
      if (!d.email_settings) d.email_settings = {};
      d.email_settings[req.user.uid] = {
        provider: providerToUse,
        smtp_host: hostToUse,
        smtp_port: portToUse,
        smtp_secure: secureToUse,
        smtp_user: cleanUser,
        smtp_pass: passToUse,
        sender_name: senderNameToUse,
        updated_at: new Date().toISOString()
      };
      writeJSON(d);
    }

    console.log(`[Email Settings] Connected email delivery for ${req.user.uid} (${cleanUser})`);
    res.json({
      success: true,
      message: 'Email delivery credentials verified and saved successfully!',
      configured: true,
      sender_email: cleanUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function testEmail(req, res) {
  try {
    const { toEmail } = req.body || {};
    const recipient = (toEmail && String(toEmail).trim()) ? String(toEmail).trim() : req.user.email;
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient email address is required for test email.' });
    }

    const info = await sendTestEmail({ userId: req.user.uid, recipient });
    res.json({
      success: true,
      message: `Test email successfully delivered to ${recipient}! Check your inbox.`,
      messageId: info.messageId
    });
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ error: `Failed to send test email: ${err.message}` });
  }
}

async function disconnectEmailSettings(req, res) {
  try {
    if (isLibSQL()) {
      await dbRun('DELETE FROM email_settings WHERE user_id = ?', [req.user.uid]);
    } else {
      const d = readJSON();
      if (d.email_settings) {
        delete d.email_settings[req.user.uid];
        writeJSON(d);
      }
    }
    res.json({ success: true, message: 'Email settings disconnected. Reverted to default.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getEmailSettings,
  saveEmailSettings,
  testEmail,
  disconnectEmailSettings
};
