const nodemailer = require('nodemailer');

let transporter = null;

// Initialize Transporter
const getTransporter = async () => {
  if (transporter) return transporter;

  // Check if SMTP details are defined in environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('Using configured SMTP provider.');
  } else {
    // Generate test SMTP service account from ethereal.email for local dev/demo
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('Initialized Ethereal mock SMTP client.');
      console.log(`Mock SMTP User: ${testAccount.user}`);
    } catch (err) {
      console.error('Failed to create Ethereal SMTP test client. Email notifications will be printed to console only.', err.message);
      // Fallback transporter that logs
      transporter = {
        sendMail: async (options) => {
          console.log('\n--- Mock Email Sent ---');
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`HTML Body:\n${options.html}`);
          console.log('-----------------------\n');
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
    }
  }

  return transporter;
};

/**
 * Sends a certificate generation confirmation email
 * @param {string} email Recipient email address
 * @param {string} userName Recipient name
 * @param {string} quizTitle Name of the quiz
 * @param {number} scorePercentage Score obtained
 * @param {string} certificateId Certificate ID
 * @param {string} downloadUrl Direct download URL
 */
exports.sendCertificateEmail = async (email, userName, quizTitle, scorePercentage, certificateId, downloadUrl) => {
  try {
    const client = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"QuizCert Platform" <noreply@quizcert.com>',
      to: email,
      subject: `🏆 Congratulations! Your Certificate for ${quizTitle} is Ready`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e1b4b; text-align: center;">Certificate of Achievement</h2>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
          <p>Dear <strong>${userName}</strong>,</p>
          <p>Congratulations on completing the <strong>${quizTitle}</strong> quiz! You achieved a score of <strong>${scorePercentage}%</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #d97706; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Certificate Details:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Certificate ID:</strong> ${certificateId}</p>
            <p style="margin: 3px 0 0 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p style="text-align: center; margin-top: 30px;">
            <a href="${downloadUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Download PDF Certificate
            </a>
          </p>

          <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">
            You can verify the validity of this certificate by visiting our verification portal and entering your Certificate ID.
          </p>
          <p style="font-size: 12px; color: #64748b; text-align: center;">
            QuizCert Platform. All rights reserved.
          </p>
        </div>
      `
    };

    const info = await client.sendMail(mailOptions);
    console.log(`Email notification dispatched. Message ID: ${info.messageId}`);
    
    // Log ethereal preview URL if applicable
    if (nodemailer.getTestMessageUrl && typeof nodemailer.getTestMessageUrl === 'function' && info.messageId && !info.messageId.startsWith('mock-id-')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`\n📬 Ethereal Email Preview Link: ${previewUrl}`);
      return previewUrl;
    }
  } catch (err) {
    console.error('Failed to dispatch certificate email notification:', err.message);
  }
};
