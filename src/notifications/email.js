'use strict'

const log = require('pino')('gweny:notification:email')
const nodemailer = require('nodemailer')
const Joi = require('joi')

module.exports = {
  function: async ({mail, content}) => {
    const transporter = nodemailer.createTransport(mail)

    return {
      minBackoff: 1000,
      notify: async (dest, notify) => { // dest is given as array
        const mailOptions = {
          from: content.from, // sender address
          to: dest.join(', '), // list of receivers
          subject: 'Hello ✔', // Subject line
          text: 'Hello world?', // plain text body
          html: '<b>Hello world?</b>' // html body
        }

        // send mail with defined transport object
        const info = await transporter.sendMail(mailOptions)

        log.info(info, 'Sent mail')
      }
    }
  },
  schema: Joi.object().keys({
    mail: Joi.object().keys({
      host: Joi.string().required(),
      port: Joi.number().required(),
      secure: Joi.boolean().required(),
      auth: Joi.object().keys({
        user: Joi.string().required(),
        pass: Joi.string().required()
      })
    }),
    content: Joi.object().keys({
      from: Joi.string().required(),
      subject: Joi.string(),
      content: Joi.string()
    })
  })
}
