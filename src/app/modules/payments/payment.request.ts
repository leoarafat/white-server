export const paymentRequestEmailBody = ({
  name,
  providerName,
}: {
  name: string;
  providerName: string;
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Request Received</title>
  <style>
    /* CSS styles can be placed inline or in a separate stylesheet */
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
      background-color: #fff;
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
    .footer {
      margin-top: 20px;
      border-top: 1px solid #ddd;
      padding-top: 10px;
      font-size: 0.9em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Payment Request Received</h1>
    <p>Hello Hasan,</p>
    <p>A new payment request has been submitted from ${name} and the method is ${providerName}.</p>
    <p>You can review the details of this payment request in your account.</p>
    <p>If you have any questions or need further assistance, please feel free to contact us.</p>
    <a href="https://app.ansbackstage.com" class="button">Log In to Your Account</a>
    <p>Thank you for using our services.</p>
    <div class="footer">
      <p>Best Regards,</p>
      <p>The ARP Music Team</p>
    </div>
  </div>
</body>
</html>
`;
