export const EditRequestEmailBody = (channelData: any) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Channel Edit Request Approved</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      /* Reset styles */
      body, table, td, a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table, td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
      }
      /* Responsive Styles */
      @media screen and (max-width: 600px) {
        .responsive-table {
          width: 100% !important;
        }
        .padding {
          padding: 10px 5% 15px 5% !important;
        }
        .mobile-center {
          text-align: center !important;
        }
        .button {
          width: 100% !important;
          display: block !important;
        }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <!-- Header -->
      <tr>
        <td bgcolor="#3f51b5" align="center">
          <table border="0" cellpadding="0" cellspacing="0" width="600" class="responsive-table">
            <tr>
              <td align="center" valign="top" style="padding: 40px 0 30px 0;">
                <a href="https://www.ansmusiclimited.com" target="_blank">
                  <img src="https://res.cloudinary.com/arafatleo/image/upload/v1732420546/ans_music_logo_cslzpg.png" alt="ARP Music Limited Logo" width="200" style="display: block;" border="0" />
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td bgcolor="#f4f4f4" align="center" style="padding: 20px 10px 20px 10px;">
          <table border="0" cellpadding="0" cellspacing="0" width="600" class="responsive-table">
            <!-- Email Content -->
            <tr>
              <td bgcolor="#ffffff" align="center" style="padding: 40px 30px 40px 30px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <!-- Channel Name -->
                  <tr>
                    <td align="center" style="color:#153643; font-family: Arial, sans-serif; font-size:24px;">
                      <b>Channel Edit Approved!</b>
                    </td>
                  </tr>
                  <!-- Spacer -->
                  <tr>
                    <td style="padding: 20px 0 30px 0;">
                      <hr style="border: none; border-top: 1px solid #eeeeee;" />
                    </td>
                  </tr>
                  <!-- Channel Details -->
                  <tr>
                    <td align="center" style="color:#153643; font-family: Arial, sans-serif; font-size:16px; line-height:24px;">
                      <p>Dear Partner,</p>
                      <p>We are pleased to inform you that your channel edit request has been approved. Below are the details of your channel:</p>
                      <!-- Avatar and Channel Name -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <img src="${channelData.avatar}" alt="${channelData.channelName} Avatar" width="150" height="150" style="border-radius: 50%; display: block;" border="0" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="color:#153643; font-family: Arial, sans-serif; font-size:20px;">
                            <b>${channelData.channelName}</b>
                          </td>
                        </tr>
                      </table>
                      <p>Feel free to reach out to our support team if you have any questions or need further assistance.</p>
                      <p>Email Us: <a href="mailto:support@ansmusiclimited.com" style="color:#3f51b5; text-decoration:underline;">support@ansmusiclimited.com</a></p>
                      <p>Thank you for being a valued partner!</p>
                      <p>Best Regards,<br/>ARP Music Team</p>
                    </td>
                  </tr>
                  

                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Spacer -->
            <tr>
              <td style="padding: 20px 0 30px 0;">
                <hr style="border: none; border-top: 1px solid #eeeeee;" />
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td bgcolor="#f4f4f4" align="center" style="padding: 20px 10px 20px 10px;">
          <table border="0" cellpadding="0" cellspacing="0" width="600" class="responsive-table">
            <tr>
              <td align="center" style="font-family: Arial, sans-serif; font-size:12px; color:#888888;">
                &copy; ${new Date().getFullYear()} ARP Music Limited. All rights reserved.<br/>
                <a href="mailto:support@ansmusiclimited.com" target="_blank" style="color:#3f51b5; text-decoration:underline;">Contact Support</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
