const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Create transporter only if SMTP config exists
        this.transporter = null;
        if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT),
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS || ''
                }
            });
            console.log('Nodemailer SMTP Transporter configured successfully.');
        } else {
            console.log('No SMTP config found. Nodemailer will run in Simulator/Console logging mode.');
        }
    }

    async sendEmail({ to, subject, text, html }) {
        if (!to) {
            throw new Error('Email recipient address (to) is required.');
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || '"VetCare Pro" <noreply@vetcarepro.com>',
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br>')
        };

        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail(mailOptions);
                console.log(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
                return { success: true, messageId: info.messageId };
            } catch (err) {
                console.error(`SMTP Error sending email to ${to}:`, err);
                throw err;
            }
        } else {
            // Simulator Mode (Console Log)
            console.log('\n==================================================');
            console.log('📨 [SIMULATED EMAIL DISPATCH]');
            console.log(`TO:      ${to}`);
            console.log(`FROM:    ${mailOptions.from}`);
            console.log(`SUBJECT: ${subject}`);
            console.log('--------------------------------------------------');
            console.log(text);
            console.log('==================================================\n');
            return { success: true, simulated: true, messageId: 'sim-' + Math.random().toString(36).substring(2, 9) };
        }
    }
}

module.exports = new EmailService();
