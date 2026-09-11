const nodemailer = require('nodemailer');
const { generateInvitationPDF } = require('./pdfService');
const { dbGet, readJSON, isLibSQL } = require('../db');

let etherealAccount = null;

// Public Base URL helper for links in emails and PDFs
function getPublicBaseUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, '');
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  if (req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}

function getEnvEmailConfig() {
  const user = process.env.GMAIL_USER || process.env.GMAIL_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER || process.env.MAIL_USERNAME;
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.MAIL_PASSWORD;

  if (!user || !rawPass) return null;

  const cleanPass = String(rawPass).replace(/["'\s]/g, '').trim();
  const cleanUser = String(user).trim();
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT) || 587;
  const isGmail = host.includes('gmail.com') || cleanUser.includes('@gmail.com');
  const provider = isGmail ? 'gmail' : (process.env.EMAIL_PROVIDER || 'smtp');
  const senderName = process.env.EMAIL_SENDER_NAME || process.env.MAIL_FROM_NAME || 'Wedding Celebrations';

  return {
    provider,
    smtp_host: host,
    smtp_port: port,
    smtp_secure: port === 465,
    smtp_user: cleanUser,
    smtp_pass: cleanPass,
    sender_name: senderName,
    fromEnv: true
  };
}

async function getUserEmailConfig(userId) {
  let settings = null;
  if (isLibSQL()) {
    try {
      let row = await dbGet('SELECT * FROM email_settings WHERE user_id = ?', [userId]);
      if (!row) {
        // Fallback to any saved email settings in the database
        row = await dbGet('SELECT * FROM email_settings LIMIT 1');
      }
      if (row) settings = row;
    } catch (e) {
      console.warn('Error reading email_settings from DB:', e.message);
    }
  } else {
    const d = readJSON();
    if (d.email_settings) {
      settings = (userId && d.email_settings[userId]) || Object.values(d.email_settings)[0] || null;
    }
  }

  // If user has saved settings in database:
  if (settings && settings.smtp_user && settings.smtp_pass) {
    const cleanUser = String(settings.smtp_user).trim();
    const cleanPass = String(settings.smtp_pass).replace(/["'\s]/g, '').trim();
    const isGmail = settings.provider === 'gmail' || cleanUser.includes('@gmail.com');
    return {
      provider: isGmail ? 'gmail' : 'smtp',
      smtp_host: settings.smtp_host || (isGmail ? 'smtp.gmail.com' : ''),
      smtp_port: Number(settings.smtp_port) || (isGmail ? 465 : 587),
      smtp_secure: Boolean(settings.smtp_secure) || Number(settings.smtp_port) === 465,
      smtp_user: cleanUser,
      smtp_pass: cleanPass,
      sender_name: settings.sender_name || 'Wedding Celebrations',
      fromDB: true
    };
  }

  // Fallback to environment variables
  const envConfig = getEnvEmailConfig();
  if (envConfig) return envConfig;

  return null;
}

async function getEmailTransporter(userId) {
  const config = await getUserEmailConfig(userId);

  if (config) {
    let transporter;
    if (config.provider === 'gmail') {
      // Primary Gmail transporter on port 465 with explicit connection timeout and TLS options
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
    } else {
      transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
    }

    return {
      transporter,
      isConfigured: true,
      config,
      isTest: false
    };
  }

  // Ethereal Test Account (Sandbox fallback when unconfigured)
  if (!etherealAccount) {
    try {
      const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error('Ethereal setup timeout')), 3500));
      etherealAccount = await Promise.race([nodemailer.createTestAccount(), timeoutPromise]);
    } catch (e) {
      console.warn('Ethereal test account unavailable, using jsonTransport:', e.message);
    }
  }

  if (etherealAccount) {
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 6000
      }),
      isConfigured: false,
      config: null,
      isTest: true
    };
  } else {
    return {
      transporter: nodemailer.createTransport({ jsonTransport: true }),
      isConfigured: false,
      config: null,
      isTest: true
    };
  }
}

async function verifyEmailConfig({ provider, host, port, secure, user, pass }) {
  const cleanUser = String(user).trim();
  const cleanPass = String(pass).replace(/["'\s]/g, '').trim();
  let verified = false;
  let verifyError = null;

  if (provider === 'gmail') {
    // 1. Try port 465 (SSL)
    try {
      const trans465 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: cleanUser, pass: cleanPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
      await trans465.verify();
      verified = true;
    } catch (err465) {
      console.warn(`[SMTP Verify] Gmail port 465 failed (${err465.message}). Retrying via port 587 (STARTTLS)...`);
      verifyError = err465;
      // 2. Fallback to port 587 (STARTTLS)
      try {
        const trans587 = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: { user: cleanUser, pass: cleanPass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 12000,
          greetingTimeout: 12000,
          socketTimeout: 15000
        });
        await trans587.verify();
        verified = true;
      } catch (err587) {
        verifyError = err587;
      }
    }
  } else {
    try {
      const customTrans = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port: Number(port) || 587,
        secure: Boolean(secure),
        auth: { user: cleanUser, pass: cleanPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
      await customTrans.verify();
      verified = true;
    } catch (e) {
      verifyError = e;
    }
  }

  if (!verified) {
    let errorHint = verifyError ? verifyError.message : 'Unknown connection error';
    if (provider === 'gmail' && (errorHint.includes('Invalid login') || errorHint.includes('535') || errorHint.includes('Username and Password not accepted') || errorHint.includes('BadCredentials'))) {
      errorHint = 'Google rejected the login credentials. Please ensure 2-Step Verification is turned ON on your Google Account and generate a 16-character App Password at https://myaccount.google.com/apppasswords (do NOT use your normal Google account login password).';
    } else if (errorHint.includes('ETIMEDOUT') || errorHint.includes('ESOCKETTIMEDOUT')) {
      errorHint = 'Connection timed out connecting to mail server. Your hosting provider firewall may be restricting outbound SMTP connections.';
    }
    throw new Error(`Connection verification failed: ${errorHint}`);
  }

  return true;
}

async function sendInvitationEmail({ guest, customSubject, customMessage, baseUrl, userId }) {
  if (!guest.email) {
    throw new Error('Guest does not have an email address');
  }

  const effectiveBaseUrl = baseUrl || getPublicBaseUrl();
  const { transporter, isConfigured, config, isTest } = await getEmailTransporter(userId || guest.user_id);
  const pdfBuffer = await generateInvitationPDF(guest, effectiveBaseUrl);

  const subject = customSubject || `Wedding Invitation: You are cordially invited! 💍`;
  const rsvpUrl = `${effectiveBaseUrl}/rsvp/${guest.rsvp_token}`;
  const confirmUrl = `${rsvpUrl}?action=Confirmed`;
  const maybeUrl = `${rsvpUrl}?action=Maybe`;
  const declineUrl = `${rsvpUrl}?action=Declined`;

  const events = Array.isArray(guest.events) && guest.events.length > 0 
    ? guest.events.join(', ') 
    : 'Mehendi, Haldi, Wedding';

  let familyDetails = '';
  if (Array.isArray(guest.dependents) && guest.dependents.length > 0) {
    const names = guest.dependents.map(d => d.name).filter(Boolean);
    if (names.length) {
      familyDetails = `<p style="margin: 4px 0 16px; color: #4B5563; font-size: 14px;"><strong>Invited Family Members:</strong> ${names.join(', ')}</p>`;
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #F3F4F6; }
        .wrapper { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: #1B3C53; padding: 32px 24px; text-align: center; border-bottom: 4px solid #C59B27; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header p { color: #F3E5AB; margin: 8px 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 32px 28px; color: #1F2937; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px; }
        .events-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .actions { text-align: center; margin: 28px 0 20px; }
        .btn { display: inline-block; padding: 12px 22px; margin: 6px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 6px; }
        .btn-confirm { background-color: #059669; color: #ffffff !important; }
        .btn-maybe { background-color: #D97706; color: #ffffff !important; }
        .btn-decline { background-color: #DC2626; color: #ffffff !important; }
        .footer { background: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .attachment-note { background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 6px; padding: 12px; font-size: 13px; color: #92400E; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <p>✦ Wedding Invitation ✦</p>
          <h1>The Wedding Celebrations</h1>
        </div>
        <div class="content">
          <div class="greeting">Dear ${guest.name},</div>
          <p>We are filled with immense joy and gratitude to invite you and your family to join us in celebrating our auspicious wedding ceremonies!</p>
          
          ${customMessage ? `<div style="padding: 12px 16px; background: #F0F9FF; border-left: 4px solid #0284C7; font-style: italic; margin: 16px 0;">${customMessage}</div>` : ''}

          <div class="events-card">
            <p style="margin: 0 0 6px; color: #1B3C53; font-weight: bold; font-size: 14px;">Invited Ceremonies & Events:</p>
            <p style="margin: 0; color: #4B5563; font-size: 14px;">✦ ${events}</p>
          </div>

          ${familyDetails}

          <p style="margin-bottom: 8px;"><strong>Kindly confirm your attendance:</strong></p>
          <div class="actions">
            <a href="${confirmUrl}" class="btn btn-confirm">✓ Joyfully Accept</a>
            <a href="${maybeUrl}" class="btn btn-maybe">? Tentative (Maybe)</a>
            <a href="${declineUrl}" class="btn btn-decline">✕ Decline</a>
          </div>

          <div class="attachment-note">
            <strong>💌 Royal Invitation Card Attached:</strong> We have attached your personalized wedding invitation card (PDF) to this email. You can download and keep it for ceremony timings and details.
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0;">With Warm Regards & Best Compliments from the Family</p>
          <p style="margin: 4px 0 0;">Marriage Manager • Wedding Celebrations</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const fromAddress = config 
    ? (config.sender_name ? `"${config.sender_name}" <${config.smtp_user}>` : config.smtp_user)
    : (process.env.EMAIL_FROM || '"Wedding Celebrations" <invitations@weddingmanager.com>');

  const mailOptions = {
    from: fromAddress,
    to: guest.email,
    subject,
    html,
    attachments: [
      {
        filename: `Wedding_Invitation_${guest.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  let info;
  console.log(`[Email Delivery] Attempting to deliver invitation to ${guest.email} (configured: ${isConfigured}, sender: ${config?.smtp_user || 'Sandbox'})...`);

  if (isConfigured && config.provider === 'gmail') {
    // Try primary port 465 (SSL)
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (primaryErr) {
      console.warn(`[Email Delivery] Gmail send error on port 465 (${primaryErr.message}). Retrying via port 587 (STARTTLS)...`);
      // Fallback to port 587 (STARTTLS)
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: config.smtp_user, pass: config.smtp_pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
        socketTimeout: 15000
      });
      info = await fallbackTransporter.sendMail(mailOptions);
    }
  } else {
    info = await transporter.sendMail(mailOptions);
  }

  const previewUrl = isTest && nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
  if (isTest) {
    console.log(`[Email Sandbox] Ethereal preview generated for ${guest.email}: ${previewUrl}`);
  } else {
    console.log(`[Email Delivered] Real email delivered to ${guest.email} via ${config.smtp_user}. MessageId: ${info.messageId}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    pdfBuffer,
    isTest,
    isConfigured,
    senderEmail: config?.smtp_user || null
  };
}

async function sendTestEmail({ userId, recipient }) {
  const { transporter, isConfigured, config } = await getEmailTransporter(userId);
  if (!isConfigured || !config) {
    throw new Error('Please configure and save your email credentials first before sending a test.');
  }

  const fromAddress = config.sender_name 
    ? `"${config.sender_name}" <${config.smtp_user}>` 
    : config.smtp_user;

  const testMailOptions = {
    from: fromAddress,
    to: recipient,
    subject: '💍 Test Email: Wedding Invitation Delivery Verified!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 20px auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FFFFFF;">
        <div style="text-align: center; border-bottom: 2px solid #C59B27; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #1B3C53; margin: 0; font-size: 22px;">Wedding Expense Manager</h2>
          <p style="color: #C59B27; font-weight: bold; margin: 6px 0 0; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Email Delivery Verification</p>
        </div>
        <p style="color: #1F2937; font-size: 15px; line-height: 1.6;">
          Hello! This is a test email confirming that your wedding invitation email delivery has been <strong>successfully configured and verified</strong>.
        </p>
        <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 14px; margin: 18px 0; color: #065F46; font-size: 14px; line-height: 1.6;">
          ✓ <strong>Connected Sender:</strong> ${config.smtp_user}<br>
          ✓ <strong>Recipient:</strong> ${recipient}<br>
          ✓ <strong>Delivery Status:</strong> Live & Active
        </div>
        <p style="color: #4B5563; font-size: 14px; line-height: 1.5;">
          When you send invitations to your wedding guests, they will now be delivered directly to their real inbox with their personalized Royal Wedding Invitation Card (PDF) attached!
        </p>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF; text-align: center;">
          Sent automatically by Marriage Expense Manager
        </div>
      </div>
    `
  };

  let info;
  if (config.provider === 'gmail') {
    try {
      info = await transporter.sendMail(testMailOptions);
    } catch (err465) {
      console.warn(`[Test Email] Port 465 send failed (${err465.message}). Retrying via port 587 (STARTTLS)...`);
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: config.smtp_user, pass: config.smtp_pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
        socketTimeout: 15000
      });
      info = await fallbackTransporter.sendMail(testMailOptions);
    }
  } else {
    info = await transporter.sendMail(testMailOptions);
  }

  console.log(`[Email Test] Test email delivered to ${recipient}. MessageId: ${info.messageId}`);
  return info;
}

module.exports = {
  getPublicBaseUrl,
  getEnvEmailConfig,
  getUserEmailConfig,
  getEmailTransporter,
  verifyEmailConfig,
  sendInvitationEmail,
  sendTestEmail
};
