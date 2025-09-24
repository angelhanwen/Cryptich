const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  try {
    // Netlify form event payload
    const body = JSON.parse(event.body);
    const email = body?.payload?.data?.email;

    if (!email) {
      return { statusCode: 400, body: "No email in submission payload." };
    }

    // Load the HTML email template
    const templatePath = path.join(process.cwd(), "emails", "welcome.html");
    const html = fs.readFileSync(templatePath, "utf8");

    // Send via Resend
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cryptich <no-reply@cryptich.com>",
        to: [email],
        subject: "Welcome to Cryptich — you’re early",
        html,
      }),
    });

    // Bubble up non-2xx so Netlify logs show failures
    const text = await resp.text();
    if (!resp.ok) {
      return { statusCode: resp.status, body: text || "Resend error" };
    }

    return { statusCode: 200, body: "Email sent" };
  } catch (err) {
    return { statusCode: 500, body: err.stack || String(err) };
  }
};
