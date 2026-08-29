export const labelApproveEmailBody = (labelData: any) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Received</title>
    <style>
      /* CSS styles can be placed inline or in a separate stylesheet */
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      h1, p {
        margin-bottom: 20px;
      }
      .button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: #fff;
        text-decoration: none;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Dear Partner, <br> Congratulations! Your Label Has Been Approved.</h1>
      <p>Label Name: ${labelData?.labelName}</p>
      <p>If you have any questions, please don't hesitate to reach out to our support team.
  Email Us: support@ansmusiclimited.com</p>
      <p>Thanks and regards,<br>ARP Music Team</p>
    </div>
  </body>
  </html>
  `;
