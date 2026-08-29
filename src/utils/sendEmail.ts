/* eslint-disable @typescript-eslint/ban-ts-comment */

//@ts-ignore
import SibApiV3Sdk from 'sib-api-v3-sdk';
import { IEmailOptions } from '../app/modules/user/user.interface';
import config from '../config';
import { logger } from '../shared/logger';

const sendEmail = async (options: IEmailOptions): Promise<void> => {
  const { email, subject, html, attachments } = options;

  // Configure API key
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = config.brevo.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  type IAttachment = {
    content: Buffer;
    filename: string;
  };

  type ISendSmtpEmail = {
    to: { email: string }[];
    sender: { name: string; email: string };
    subject: string;
    htmlContent: string;
    replyTo?: { email: string };
    attachment?: { content: string; name: string }[];
  };

  const sendSmtpEmail: ISendSmtpEmail = {
    to: [{ email }],
    sender: {
      name: config.smtp.NAME || 'ARP Music Limited',
      email: config.brevo.SENDER_EMAIL || 'info@ans.digital',
    },
    replyTo: {
      email: 'support@ansmusiclimited.com',
    },
    subject,
    htmlContent: html,
    attachment: attachments?.map((att: IAttachment) => ({
      content: att.content.toString('base64'),
      name: att.filename,
    })),
  };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

export default sendEmail;
