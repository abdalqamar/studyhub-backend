import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (email: string, subject: string, htmlBody: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error("Resend email error:", error);
      throw new Error("Email could not be sent.");
    }

    return data;
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("Email could not be sent.");
  }
};

export default sendEmail;
