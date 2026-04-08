export function newUserTemplate(email: string, createdAt: string) {
  const date = new Date(createdAt).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return {
    subject: "🎉 New user on Calendarito!",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New User</title>
</head>
<body style="margin:0;padding:0;background-color:#E8E8E8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#E8E8E8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / Nav pill -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:999px;padding:10px 20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:8px;">
                          <div style="width:28px;height:28px;background:#E8E815;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;text-align:center;line-height:28px;font-size:14px;">
                            ↑
                          </div>
                        </td>
                        <td>
                          <span style="font-family:'Arial Black',Arial,sans-serif;font-size:15px;font-weight:900;letter-spacing:-0.03em;color:#0A0A0A;">
                            Calendarito
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

              <!-- Yellow badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#E8E815;border-radius:999px;padding:6px 16px;">
                    <span style="font-size:13px;font-weight:700;color:#0A0A0A;letter-spacing:-0.01em;">New signup 🎉</span>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 8px;font-family:'Arial Black',Arial,sans-serif;font-size:28px;font-weight:900;letter-spacing:-0.04em;color:#0A0A0A;line-height:1.1;">
                Someone just joined!
              </h1>
              <p style="margin:0 0 28px;font-size:16px;color:#555555;line-height:1.6;">
                You've got a new user on Calendarito. Time to celebrate!
              </p>

              <!-- User info box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#F2F2F2;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#999999;text-transform:uppercase;">
                      Email
                    </p>
                    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#0A0A0A;">
                      ${email}
                    </p>
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#999999;text-transform:uppercase;">
                      Signed up at
                    </p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#0A0A0A;">
                      ${date}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#999999;line-height:1.6;">
                This is an automated notification from Calendarito.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#AAAAAA;">
                Calendarito · Drop in anything, get calendar events
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
