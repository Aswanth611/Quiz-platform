const PDFDocument = require('pdfkit');

/**
 * Generates a professional PDF certificate in memory.
 * @param {Object} certificate Mongoose certificate document
 * @param {Object} user Mongoose user document
 * @param {Object} quiz Mongoose quiz document
 * @returns {Promise<Buffer>} Promise resolving to the PDF Buffer
 */
exports.generateCertificatePDF = (certificate, user, quiz) => {
  return new Promise((resolve, reject) => {
    // Landscape A4: 841.89 x 595.28 points
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', (err) => {
      reject(err);
    });

    const width = doc.page.width;
    const height = doc.page.height;

    // 1. Draw Dark Theme Background
    doc.rect(0, 0, width, height)
       .fillColor('#030712') // Dark Slate-950
       .fill();

    // 2. Draw Rounded Outer Border
    doc.roundedRect(25, 25, width - 50, height - 50, 16)
       .lineWidth(2)
       .strokeColor('#111827') // Dark Gray border
       .stroke();

    // 3. Draw Corner Gold L-Brackets
    const drawCorner = (x, y, dx, dy) => {
      doc.moveTo(x, y + dy)
         .lineTo(x, y)
         .lineTo(x + dx, y)
         .lineWidth(3.5)
         .strokeColor('#f59e0b') // Bright Amber/Gold
         .stroke();
    };

    // Draw square-angle corners inset slightly from border
    drawCorner(45, 45, 30, 30);       // Top-Left
    drawCorner(width - 45, 45, -30, 30);  // Top-Right
    drawCorner(45, height - 45, 30, -30);  // Bottom-Left
    drawCorner(width - 45, height - 45, -30, -30); // Bottom-Right

    // 4. Draw Header Branding (Text & Vector Badge)
    // Spaced app name
    doc.font('Helvetica-Bold')
       .fontSize(11)
       .fillColor('#94a3b8') // Slate-400
       .text('Q U I Z C E R T', 0, 75, { align: 'center', width: width });

    // Vector Ribbon Badge
    doc.save();
    doc.translate(width / 2, 115);
    // Ribbon tails
    doc.moveTo(-5, 5).lineTo(-7, 14).lineTo(-2, 12).lineTo(0, 14).lineTo(0, 5).fillColor('#d97706').fill();
    doc.moveTo(0, 5).lineTo(0, 14).lineTo(2, 12).lineTo(7, 14).lineTo(5, 5).fillColor('#d97706').fill();
    // Circular gold base
    doc.circle(0, 0, 11).fillColor('#f59e0b').fill();
    // Inner white detail
    doc.circle(0, 0, 7.5).fillColor('#ffffff').fill();
    doc.circle(0, 0, 5.5).fillColor('#f59e0b').fill();
    doc.restore();

    // 5. Draw Certificate Title
    doc.font('Times-BoldItalic')
       .fontSize(34)
       .fillColor('#ffffff') // White
       .text('Certificate of Achievement', 0, 155, { align: 'center', width: width });

    // Presented To subtitle
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor('#64748b') // Slate-500
       .text('THIS IS PROUDLY PRESENTED TO', 0, 205, { align: 'center', width: width });

    // 6. Recipient Name
    doc.font('Helvetica-Bold')
       .fontSize(28)
       .fillColor('#f59e0b') // Gold
       .text(user.name.toUpperCase(), 0, 230, { align: 'center', width: width });

    // 7. Achievement Details (Multi-line centered chain-styling)
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#94a3b8')
       .text('for successfully completing the online examination and demonstrating proficiency in', 60, 285, { align: 'center', width: width - 120 });

    const scorePercentage = certificate.scorePercentage;
    doc.font('Helvetica-Bold')
       .fontSize(15)
       .fillColor('#ffffff')
       .text(quiz.title, 60, 310, { align: 'center', width: width - 120, continued: true })
       .fillColor('#94a3b8')
       .font('Helvetica')
       .text(' with a score of ', { continued: true })
       .fillColor('#f59e0b')
       .font('Helvetica-Bold')
       .text(`${scorePercentage}%.`);

    // 8. Divider Line
    doc.moveTo(80, 370)
       .lineTo(width - 80, 370)
       .lineWidth(1)
       .strokeColor('#111827')
       .stroke();

    // 9. Footer: Metadata details & Verification badge
    // Left: ID & Date
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#4b5563')
       .text('CERTIFICATE ID: ', 80, 395, { continued: true })
       .font('Helvetica').text(certificate.certificateId);
    
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#4b5563')
       .text('DATE: ', 80, 412, { continued: true })
       .font('Helvetica').text(new Date(certificate.generatedDate).toLocaleDateString('en-GB'));

    // Right: Verification Stamp
    doc.font('Times-Italic')
       .fontSize(11)
       .fillColor('#94a3b8')
       .text('QuizCert Engine Verified', width - 260, 402, { align: 'right', width: 180 });

    doc.end();
  });
};
