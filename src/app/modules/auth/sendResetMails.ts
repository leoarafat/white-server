/* eslint-disable @typescript-eslint/ban-ts-comment */

//@ts-ignore
import SibApiV3Sdk from 'sib-api-v3-sdk';
import config from '../../../config';
import { logger } from '../../../shared/logger';

export async function sendEmail(to: string, html: string) {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = config.brevo.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = {
    to: [{ email: to }],
    sender: {
      name: config.smtp.NAME || 'ANS Music',
      email: config.brevo.SENDER_EMAIL || 'no-reply@ans.digital',
    },
    subject: 'Reset Password Link',
    htmlContent: html,
  };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info(`Password reset email sent to ${to}`);
  } catch (error: any) {
    logger.error('Brevo API Error:', {
      status: error.response?.status,
      code: error.response?.body?.code,
      message: error.response?.body?.message,
    });

    // Specific error for unauthorized IP
    if (error.response?.body?.code === 'unauthorized') {
      throw new Error(
        `Brevo API: Unauthorized IP. Please whitelist this IP: ${error.response.body.message}`,
      );
    }

    throw new Error('Failed to send reset password email');
  }
}
