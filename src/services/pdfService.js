const PDFDocument = require('pdfkit');
const crypto = require('crypto');

function generateRsvpToken(id) {
  return 'rsvp_' + crypto.randomBytes(8).toString('hex') + (id ? ('_' + id) : '');
}

function drawDiamond(doc, x, y, size = 3, color = '#C59B27') {
  doc.save();
  doc.fillColor(color);
  doc.moveTo(x, y - size)
     .lineTo(x + size, y)
     .lineTo(x, y + size)
     .lineTo(x - size, y)
     .closePath()
     .fill();
  doc.restore();
}

function generateInvitationPDF(guest, baseUrl = 'http://localhost:3000') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A5',
        layout: 'landscape',
        margin: 0,
        info: {
          Title: `Wedding Invitation - ${guest.name}`,
          Author: 'Marriage Manager',
          Subject: 'Wedding Invitation Card'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const width = 595.28;
      const height = 419.53;

      // 1. Background (Soft Pearl / Cream)
      doc.rect(0, 0, width, height).fill('#FCFBF7');

      // 2. Outer Gold Decorative Border
      doc.rect(16, 16, width - 32, height - 32)
         .lineWidth(2.5)
         .strokeColor('#C59B27')
         .stroke();

      // 3. Inner Navy Border
      doc.rect(22, 22, width - 44, height - 44)
         .lineWidth(0.8)
         .strokeColor('#1B3C53')
         .stroke();

      // Corner flourishes
      const corners = [
        [22, 22],
        [width - 22, 22],
        [22, height - 22],
        [width - 22, height - 22]
      ];
      corners.forEach(([cx, cy]) => {
        doc.rect(cx - 3, cy - 3, 6, 6).fill('#C59B27');
      });

      // 4. Top Header Emblem & Title
      doc.fillColor('#C59B27')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('WEDDING CELEBRATION', 0, 42, { align: 'center', width });

      drawDiamond(doc, width / 2 - 85, 47, 3, '#C59B27');
      drawDiamond(doc, width / 2 + 85, 47, 3, '#C59B27');

      doc.fillColor('#71717A')
         .fontSize(9)
         .font('Helvetica')
         .text('Together with their families, cordially invite you to celebrate', 0, 60, { align: 'center', width });

      // 5. Couple / Wedding Headline
      doc.fillColor('#1B3C53')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('The Wedding Celebrations', 0, 80, { align: 'center', width });

      // Gold divider line with central diamond
      doc.moveTo(width / 2 - 80, 110)
         .lineTo(width / 2 + 80, 110)
         .lineWidth(1)
         .strokeColor('#C59B27')
         .stroke();
      drawDiamond(doc, width / 2, 110, 3.5, '#C59B27');

      // 6. Guest Dedication Box
      doc.rect(50, 122, width - 100, 80)
         .fillColor('#FFFFFF')
         .fillOpacity(0.9)
         .fill();
      
      doc.rect(50, 122, width - 100, 80)
         .lineWidth(0.8)
         .strokeColor('#E4E4E7')
         .stroke();

      doc.fillOpacity(1);

      doc.fillColor('#71717A')
         .fontSize(8.5)
         .font('Helvetica-Bold')
         .text('HONORED GUEST', 60, 132, { align: 'center', width: width - 120 });

      doc.fillColor('#1B3C53')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(guest.name, 60, 146, { align: 'center', width: width - 120 });

      // Dependents / Family subtitle
      let depText = '';
      if (Array.isArray(guest.dependents) && guest.dependents.length > 0) {
        const names = guest.dependents.map(d => d.name).filter(Boolean);
        if (names.length > 0) {
          depText = `Accompanied by: ${names.join(', ')}`;
        }
      } else if (guest.plus_one_allowed) {
        depText = `Including Plus-One${guest.plus_one_name ? ` (${guest.plus_one_name})` : ''}`;
      } else if (guest.guest_type === 'Family') {
        depText = 'Invited with Family';
      }

      if (depText) {
        doc.fillColor('#C59B27')
           .fontSize(9.5)
           .font('Helvetica-Bold')
           .text(depText, 60, 172, { align: 'center', width: width - 120 });
      }

      // 7. Assigned Ceremonies & Events
      doc.fillColor('#1B3C53')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('INVITED CEREMONIES & EVENTS', 0, 218, { align: 'center', width });

      const events = Array.isArray(guest.events) && guest.events.length > 0 
        ? guest.events 
        : ['Mehendi', 'Haldi', 'Wedding'];
      
      const eventsStr = events.join('   •   ');
      doc.fillColor('#234C6A')
         .fontSize(10)
         .font('Helvetica')
         .text(eventsStr, 0, 235, { align: 'center', width });

      // 8. RSVP Section Card
      const rsvpBoxY = 265;
      doc.rect(70, rsvpBoxY, width - 140, 75)
         .fillColor('#1B3C53')
         .fill();

      doc.fillColor('#F3E5AB')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('KINDLY CONFIRM ATTENDANCE ONLINE', 70, rsvpBoxY + 12, { align: 'center', width: width - 140 });

      const rsvpUrl = `${baseUrl}/rsvp/${guest.rsvp_token || 'invitation'}`;
      doc.fillColor('#FFFFFF')
         .fontSize(9)
         .font('Helvetica')
         .text(`Scan or visit link to confirm attendance:`, 70, rsvpBoxY + 28, { align: 'center', width: width - 140 });

      doc.fillColor('#FDE047')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(rsvpUrl, 70, rsvpBoxY + 44, { align: 'center', width: width - 140, underline: true });

      const totalHeadcount = guest.expected_attendees || (Number(guest.expected_adults||1) + Number(guest.expected_children||0));
      doc.fillColor('#94A3B8')
         .fontSize(8)
         .font('Helvetica')
         .text(`Expected Attendees: ${totalHeadcount} (${guest.expected_adults || 1} Adults${Number(guest.expected_children) > 0 ? `, ${guest.expected_children} Children` : ''})`, 70, rsvpBoxY + 58, { align: 'center', width: width - 140 });

      // 9. Footer warm closing
      doc.fillColor('#71717A')
         .fontSize(8.5)
         .font('Helvetica-Oblique')
         .text('Your gracious presence and blessings are our greatest gift.', 0, 360, { align: 'center', width });

      doc.fillColor('#C59B27')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Auspicious Moments & Warm Regards', 0, 376, { align: 'center', width });

      drawDiamond(doc, width / 2 - 120, 381, 2.5, '#C59B27');
      drawDiamond(doc, width / 2 + 120, 381, 2.5, '#C59B27');

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  generateInvitationPDF,
  drawDiamond,
  generateRsvpToken
};
