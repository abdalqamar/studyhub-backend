import nodemailer from "nodemailer";

const sendEmail = async (email, subject, htmlBody) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"StudyHub" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: htmlBody,
    });

    console.log("Email sent:", info);
    return info;
  } catch (error) {
    console.error(" Email send error:", error);
    throw new Error("Email could not be sent.");
  }
};

export default sendEmail;
