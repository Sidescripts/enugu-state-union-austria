const transporter = require("../../utils/nodemailer");

function EmailService() {
  return {
    sendPasswordResetEmail: async function(email, resetLink) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset Request - Vitron-trade',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>You requested to reset your password. Click the link below to reset it:</p>
              <a href="${resetLink}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
                 Reset Password
              </a>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <hr>
              <p>© ${new Date().getFullYear()} Vitron-trade. All rights reserved.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
        
      } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send email');
      }
    }
  };
}

module.exports = EmailService();