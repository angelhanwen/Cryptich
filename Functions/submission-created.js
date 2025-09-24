const fs = require("fs");
const path = require("path");

// Fallback fetch polyfill if your runtime doesn't provide it
const _fetch = (global.fetch
  ? global.fetch
  : (...args) => import("node-fetch").then(({ default: f }) => f(...args)));

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const email = body?.payload?.data?.email;
    const formName = body?.payload?.form_name;
    console.log("[submission-created] received", { formName, email });

    if (!email) {
      console.error("[submission-created] No email in payload:", body?.payload?.data);
      return { statusCode: 400, body: "No email field in submission." };
    }

    // Try to read template that we included via netlify.toml
    const templatePath = path.join(process.cwd(), "emails", "welcome.html");
    let html;
    try {
      html = fs.readFileSync(templatePath, "utf8");
      console.log("[submission-created] Loaded template:", templatePath);
    } catch (e) {
      console.warn("[submission-created] Could not read template, using fallback. Error:", e.message);
      html = `
        <!doctype html><meta charset="utf-8">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#111">
          <h1 style="font-size:22px;margin:0 0 12px">Welcome to Cryptich</h1>
          <p>Thanks for joining the waitlist. You’re now part of the first group to hear what we’re building.</p>
          <p>Cryptich is a new kind of credit — unlock the value of your crypto and use it like cash, without selling.</p>
          <p style="margin:24px 0 0">— Angel Ye, Founder</p>
        </div>`;
    }

    const resp = await _fetch("https://api.resend.com/emails", {
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

    const text = await resp.text();
    console.log("[submission-created] Resend response status:", resp.status, "body:", text);

    if (!resp.ok) {
      return { statusCode: resp.status, body: text || "Resend error" };
    }

    return { statusCode: 200, body: "Email sent" };
  } catch (err) {
    console.error("[submission-created] Fatal error:", err);
    return { statusCode: 500, body: err.stack || String(err) };
  }
};
