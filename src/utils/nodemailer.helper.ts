import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import { EnvironmentHelper } from './environment.helper'

export const NodeMailerHelper = {
  transporter: () => {
    return nodemailer.createTransport({
      host: EnvironmentHelper.getEmailHost(),
      port: EnvironmentHelper.getEmailPort(),
      secure: false,
      auth: {
        user: EnvironmentHelper.getEmailUser(),
        pass: EnvironmentHelper.getEmailPass(),
      },
    } as nodemailer.TransportOptions)
  },
  sendEmail: async (config: Mail.Options) => {
    const mailOptions: Mail.Options = {
      ...config,
      from: config.from ?? '',
      to: config.to ?? 'vinhng210500@gmail.com',
      subject: config.subject ?? 'Email Title',
      text: config.text ?? 'Default',
      html: config.html ?? 'Default',
    }
    return await NodeMailerHelper.transporter().sendMail(mailOptions)
  },
  contactUs: async ({ email, name, message }: { email: string; name: string; message: string }) => {
    const mailOptions: Mail.Options = {
      from: email,
      to: EnvironmentHelper.getEmailTo(),
      subject: 'Water Quality Data Request',
      text: 'Contact Us',
      html: `Name: ${name} <br/> Message: ${message}`,
    }
    return await NodeMailerHelper.sendEmail(mailOptions)
  },
}
