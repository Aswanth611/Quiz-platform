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

    // 1. Draw Background & Elegant Borders
    // Outer border (Dark Indigo)
    doc.rect(20, 20, width - 40, height - 40)
       .lineWidth(6)
       .strokeColor('#1e1b4b') // Indigo-950
       .stroke();

    // Inner border (Gold/Bronze Accent)
    doc.rect(28, 28, width - 56, height - 56)
       .lineWidth(2)
       .strokeColor('#d97706') // Amber-600 (Gold)
       .stroke();

    // Corner decorative brackets (Gold accents)
    const drawCorner = (x, y, dx, dy) => {
      doc.moveTo(x, y + dy)
         .lineTo(x, y)
         .lineTo(x + dx, y)
         .lineWidth(4)
         .strokeColor('#d97706')
         .stroke();
    };
    drawCorner(35, 35, 30, 30);
    drawCorner(width - 35, 35, -30, 30);
    drawCorner(35, height - 35, 30, -30);
    drawCorner(width - 35, height - 35, -30, -30);

    // 2. Draw Decorative Top Logo
    doc.save();
    // Draw logo symbol (Golden Ribbon/Shield)
    doc.translate(width / 2, 85);
    doc.path('M 0 -20 L 15 -10 L 15 15 L 0 25 L -15 15 L -15 -10 Z')
       .fillColor('#d97706')
       .fill();
    doc.circle(0, 0, 7)
       .fillColor('#ffffff')
       .fill();
    doc.restore();

    // App Name Header
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor('#1e1b4b')
       .text('Q U I Z C E R T', 0, 115, { align: 'center', width: width });

    // 3. Certificate Title
    doc.font('Times-BoldItalic')
       .fontSize(36)
       .fillColor('#1e1b4b')
       .text('Certificate of Achievement', 0, 155, { align: 'center', width: width });

    // Subtitle
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('#4b5563') // Gray-600
       .text('THIS CERTIFICATE IS PROUDLY PRESENTED TO', 0, 215, { align: 'center', width: width });

    // 4. Recipient Name
    doc.font('Times-Bold')
       .fontSize(28)
       .fillColor('#d97706')
       .text(user.name.toUpperCase(), 0, 245, { align: 'center', width: width });

    // 5. Achievement Details
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#4b5563')
       .text('for successfully completing the online examination and demonstrating proficiency in', 0, 295, { align: 'center', width: width });

    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('#1e1b4b')
       .text(quiz.title, 0, 320, { align: 'center', width: width });

    // Score & Verification Box
    doc.rect(width / 2 - 175, 355, 350, 50)
       .fillColor('#f8fafc') // Slate-50
       .strokeColor('#e2e8f0') // Slate-200
       .lineWidth(1)
       .fillAndStroke();

    doc.font('Helvetica-Bold')
       .fontSize(13)
       .fillColor('#1e1b4b')
       .text(`Score Obtained: ${certificate.scorePercentage}%`, width / 2 - 170, 365, { align: 'center', width: 340 });

    doc.font('Helvetica-Oblique')
       .fontSize(9)
       .fillColor('#64748b')
       .text(`Date of Issue: ${new Date(certificate.generatedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, width / 2 - 170, 385, { align: 'center', width: 340 });

    // 6. Signatures Section
    // Left: Authorized Instructor
    doc.moveTo(150, 480)
       .lineTo(330, 480)
       .lineWidth(1)
       .strokeColor('#94a3b8')
       .stroke();
    doc.font('Times-Italic')
       .fontSize(14)
       .fillColor('#1e1b4b')
       .text('Antigravity AI', 150, 458, { align: 'center', width: 180 });
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#64748b')
       .text('Lead Evaluator, QuizCert', 150, 488, { align: 'center', width: 180 });

    // Right: Director / CEO
    doc.moveTo(width - 330, 480)
       .lineTo(width - 150, 480)
       .lineWidth(1)
       .strokeColor('#94a3b8')
       .stroke();
    doc.font('Times-Italic')
       .fontSize(14)
       .fillColor('#1e1b4b')
       .text('QuizCert Engine', width - 330, 458, { align: 'center', width: 180 });
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#64748b')
       .text('Director of Certification', width - 330, 488, { align: 'center', width: 180 });

    // 7. Footer: Certificate ID & Verification URL
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-certificate?id=${certificate.certificateId}`;
    
    doc.font('Helvetica-Bold')
       .fontSize(8)
       .fillColor('#94a3b8')
       .text(`Certificate ID: ${certificate.certificateId}`, 40, height - 35, { align: 'left' });

    doc.font('Helvetica')
       .fontSize(8)
       .fillColor('#94a3b8')
       .text(`Verify online at: ${verifyUrl}`, 0, height - 35, { align: 'right', x: width - 340, width: 300 });

    doc.end();
  });
};
