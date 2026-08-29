export const paymentReceivedEmailBody = (data: {
  name: string;
  transactionId: string;
  amount: string;
  enterDate: string;
  method: string;
}) => `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Your payment request is approved</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style type="text/css">
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
  a{color:#1c1c1c;}
  @media only screen and (max-width:620px){
    .om-card{width:100% !important;}
    .om-pad{padding-left:22px !important;padding-right:22px !important;}
    .om-outer{padding:20px 12px !important;}
    .om-h1{font-size:23px !important;line-height:30px !important;}
  }
</style>
</head>
<body>
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;mso-hide:all;">Your payment request is approved and sent to your bank account.</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background-color:#f4f4f2;">
<tbody><tr><td align="center" class="om-outer" style="padding:44px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="om-card" style="width:600px;max-width:600px;border-collapse:collapse;background-color:#ffffff;border:1px solid #e3e3de;">
  <tbody><tr><td class="om-pad" style="padding:26px 32px 22px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">
      <tbody><tr>
        <td align="left" style="font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:15px;line-height:18px;mso-line-height-rule:exactly;letter-spacing:3.4px;font-weight:bold;color:#1c1c1c;text-transform:uppercase;">ANS<span style="font-weight:normal;color:#6f6f6b;">MUSIC</span></td>
        <td align="right" style="font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:10px;line-height:14px;mso-line-height-rule:exactly;letter-spacing:1.4px;text-transform:uppercase;color:#6f6f6b;">Payment</td>
      </tr>
    </tbody></table>
  </td></tr>
<tr><td style="padding:0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;"><tbody><tr><td height="1" style="height:1px;line-height:1px;font-size:0;background-color:#e3e3de;">&nbsp;</td></tr></tbody></table></td></tr>
<tr><td height="34" style="height:34px;line-height:34px;font-size:0;">&nbsp;</td></tr>
  <tr><td class="om-pad om-h1" style="padding:0 32px;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:26px;line-height:34px;mso-line-height-rule:exactly;letter-spacing:-0.4px;font-weight:bold;color:#1c1c1c;">Your payment request<br>is approved and sent.</td></tr>
<tr><td height="18" style="height:18px;line-height:18px;font-size:0;">&nbsp;</td></tr>
<tr><td class="om-pad" style="padding:0 32px;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:15px;line-height:24px;mso-line-height-rule:exactly;color:#1c1c1c;">Hello ${data.name},<br><br>A payment has been released to you by the ARP Music financial team. Bank settlement usually takes 3–5 business days.</td></tr>
<tr><td height="26" style="height:26px;line-height:26px;font-size:0;">&nbsp;</td></tr>
<tr><td class="om-pad" style="padding:0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;border:1px solid #e3e3de;background-color:#fbfbfa;">
<tbody><tr><td style="padding:14px 18px;border-top:0;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:11px;line-height:14px;mso-line-height-rule:exactly;letter-spacing:1.2px;text-transform:uppercase;color:#6f6f6b;width:42%;" width="42%">Amount received</td><td style="padding:14px 18px;border-top:0;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:15px;line-height:20px;mso-line-height-rule:exactly;color:#1c1c1c;font-weight:bold;" width="58%">$${data.amount}</td></tr>
<tr><td style="padding:14px 18px;border-top:1px solid #e3e3de;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:11px;line-height:14px;mso-line-height-rule:exactly;letter-spacing:1.2px;text-transform:uppercase;color:#6f6f6b;width:42%;" width="42%">Payment method</td><td style="padding:14px 18px;border-top:1px solid #e3e3de;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:15px;line-height:20px;mso-line-height-rule:exactly;color:#1c1c1c;font-weight:bold;" width="58%">${data.method}</td></tr>
<tr><td style="padding:14px 18px;border-top:1px solid #e3e3de;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:11px;line-height:14px;mso-line-height-rule:exactly;letter-spacing:1.2px;text-transform:uppercase;color:#6f6f6b;width:42%;" width="42%">Payment date</td><td style="padding:14px 18px;border-top:1px solid #e3e3de;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:15px;line-height:20px;mso-line-height-rule:exactly;color:#1c1c1c;font-weight:bold;" width="58%">${data.enterDate}</td></tr>
<tr><td style="padding:14px 18px;border-top:1px solid #e3e3de;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:11px;line-height:14px;mso-line-height-rule:exactly;letter-spacing:1.2px;text-transform:uppercase;color:#6f6f6b;width:42%;" width="42%">Transaction ID</td><td style="padding:14px 18px;border-top:1px solid #e3e3de;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:15px;line-height:20px;mso-line-height-rule:exactly;color:#1c1c1c;font-weight:bold;" width="58%">${data.transactionId}</td></tr>
</tbody></table></td></tr>
<tr><td height="28" style="height:28px;line-height:28px;font-size:0;">&nbsp;</td></tr>
<tr><td class="om-pad" style="padding:0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tbody><tr><td align="center" bgcolor="#1c1c1c" style="border-radius:3px;" width="268"><a href="https://app.ansbackstage.com/transaction-history" style="display:block;width:268px;padding:15px 0;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:13px;line-height:16px;mso-line-height-rule:exactly;letter-spacing:1.4px;text-transform:uppercase;font-weight:bold;color:#ffffff;text-decoration:none;text-align:center;">View transaction history</a></td></tr></tbody></table></td></tr>
<tr><td height="26" style="height:26px;line-height:26px;font-size:0;">&nbsp;</td></tr>
<tr><td class="om-pad" style="padding:0 32px;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:15px;line-height:24px;mso-line-height-rule:exactly;color:#1c1c1c;color:#6f6f6b;font-size:14px;line-height:22px;">Questions? Reply to this email or write to <a href="mailto:support@ansmusic.io" style="color:#1c1c1c;text-decoration:underline;">support@ansmusic.io</a>.</td></tr>
<tr><td height="22" style="height:22px;line-height:22px;font-size:0;">&nbsp;</td></tr>
<tr><td class="om-pad" style="padding:0 32px;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:15px;line-height:24px;mso-line-height-rule:exactly;color:#1c1c1c;">Thanks and regards,<br><span style="color:#6f6f6b;">ARP Music Team</span></td></tr>
<tr><td height="36" style="height:36px;line-height:36px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;"><tbody><tr><td height="1" style="height:1px;line-height:1px;font-size:0;background-color:#e3e3de;">&nbsp;</td></tr></tbody></table></td></tr>
  <tr><td class="om-pad" style="padding:22px 32px 26px 32px;font-family:Helvetica, Arial, 'Helvetica Neue', sans-serif;font-size:12px;line-height:19px;mso-line-height-rule:exactly;color:#6f6f6b;">
    ARP Music · <a href="mailto:support@ansmusic.io" style="color:#6f6f6b;text-decoration:underline;">support@ansmusic.io</a><br>
    30 N Gould St Ste R, Sheridan, WY 82801, USA<br>
    <a href="https://app.ansbackstage.com/preferences" style="color:#6f6f6b;text-decoration:underline;">Email preferences</a> · <a href="https://app.ansbackstage.com/unsubscribe" style="color:#6f6f6b;text-decoration:underline;">Unsubscribe</a>
  </td></tr>
</tbody></table>
</td></tr>
</tbody></table>
</body></html>`;
