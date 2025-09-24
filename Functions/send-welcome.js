import fs from "fs";
import path from "path";

export async function handler(event) {
  try {
    // Netlify sends form submission data as JSON
    const body = JSON.parse(event.body);
    const email = body.payload.data.email; // email submitted in form

    // Load the welcome-email.html template
    const templatePath = path.resolve("emails/welcome.html");
    const html = fs.readFileSync(templatePath, "utf8");

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cryptich <no-reply@cryptich.com>",
        to: [email],
        subject: "Welcome to Cryptich — you’re early",
        html: html,
      }),
    });

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
}
