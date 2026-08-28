export const approvedEmailBody = (userData: any) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Account Approval</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h1 {
        color: #333;
        font-size: 24px;
        margin-bottom: 10px;
      }
      p {
        color: #777;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 10px;
      }
      .button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: #fff;
        text-decoration: none;
        border-radius: 5px;
        font-size: 18px;
      }
      .button:hover {
        background-color: #0056b3;
      }
      a {
        color: #007bff;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Account Successfully Approved</h1>
      <p>Dear Partner ${userData?.user?.name},</p>
      <p>
Congratulations on your successful registration! We are thrilled to inform you that your user profile is now live on our platform. This means you can start exploring and utilizing all of the features and advantages our platform has to offer you right away. We look forward to seeing you take full advantage of our services and we hope you enjoy the experience.

      </p>
      <p>
        To get started, simply click on the button below:
      </p>
      <a class="button" href="https://app.ansbackstage.com/auth/login">Log In</a>
      <p>
        If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.
        <a href="mailto:support@ansmusiclimited.com"
          >support@ansmusiclimited.com</a
        >.
      </p>
      <p>Once again, welcome to our community! We look forward to seeing your contributions and watching your profile thrive.</p>
      <p>Best regards,</p>
      <p>ANS Music Team</p>
    </div>
  </body>
</html>

`;
