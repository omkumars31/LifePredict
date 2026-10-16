const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendVerificationEmail = async ({
  email,
  fullName,
  verificationToken,
}) => {
  const verificationLink =
    `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"LifePredict" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify your LifePredict account",

    text: `
Hello ${fullName},

Welcome to LifePredict.

Please verify your email address by clicking the link below:

${verificationLink}

This verification link will expire in 24 hours.

If you did not create a LifePredict account, you can safely ignore this email.

Regards,
LifePredict Team
`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 24px;
        color: #164e52;
        background: #ffffff;
      ">

        <h2 style="margin-bottom: 8px;">
          Welcome to LifePredict
        </h2>

        <p style="color: #526b6d;">
          Hello ${fullName},
        </p>

        <p style="color: #526b6d; line-height: 1.6;">
          Thanks for creating your LifePredict account.
          Please verify your email address to continue.
        </p>

        <div style="margin: 32px 0;">
          <a
            href="${verificationLink}"
            style="
              display: inline-block;
              padding: 12px 22px;
              background: #147d7e;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
            "
          >
            Verify My Email
          </a>
        </div>

        <p style="color: #789194; font-size: 13px; line-height: 1.5;">
          This verification link will expire in 24 hours.
        </p>

        <p style="color: #789194; font-size: 13px; line-height: 1.5;">
          If you did not create a LifePredict account,
          you can safely ignore this email.
        </p>

        <hr style="
          border: none;
          border-top: 1px solid #e5eeee;
          margin: 32px 0;
        " />

        <p style="
          color: #9aabad;
          font-size: 12px;
        ">
          LifePredict — Understand your health. Improve your lifestyle.
        </p>

      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("Verification email sent:", info.messageId);

  return info;
};

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection failed:", error);
  } else {
    console.log("SMTP connection successful. Email service is ready.");
  }
});

const sendPasswordResetEmail = async ({
  email,
  fullName,
  resetToken,
}) => {
  const resetLink =
    `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"LifePredict" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your LifePredict password",

    text: `Hello ${fullName},

We received a request to reset your LifePredict password.

Click the link below to create a new password:

${resetLink}

This password reset link will expire in 1 hour.

If you did not request a password reset, you can safely ignore this email.

Regards,
LifePredict Team
`,

    html: `
      <!DOCTYPE html>
      <html>
        <body style="
          margin: 0;
          padding: 0;
          background: #f4f8f8;
          font-family: Arial, sans-serif;
          color: #164e52;
        ">

          <div style="
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            border: 1px solid #dceaea;
          ">

            <div style="
              background: #10595d;
              padding: 30px;
              text-align: center;
            ">
              <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 28px;
              ">
                LifePredict
              </h1>
            </div>

            <div style="padding: 40px 35px;">

              <h2 style="
                margin-top: 0;
                color: #164e52;
              ">
                Reset your password
              </h2>

              <p style="
                color: #607f82;
                line-height: 1.6;
              ">
                Hello ${fullName},
              </p>

              <p style="
                color: #607f82;
                line-height: 1.6;
              ">
                We received a request to reset your LifePredict
                account password.
              </p>

              <div style="text-align: center; margin: 32px 0;">

                <a
                  href="${resetLink}"
                  style="
                    display: inline-block;
                    padding: 14px 28px;
                    background: #18a3a0;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                  "
                >
                  Reset My Password
                </a>

              </div>

              <p style="
                color: #789194;
                font-size: 13px;
                line-height: 1.6;
              ">
                This link will expire in 1 hour.
              </p>

              <p style="
                color: #789194;
                font-size: 13px;
                line-height: 1.6;
              ">
                If you did not request a password reset,
                you can safely ignore this email.
              </p>

            </div>

          </div>

        </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("Password reset email sent:", info.messageId);

  return info;
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};