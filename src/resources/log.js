'use strict'

const joi = require('joi')
const fs = require('fs')

module.exports = async function Log (config) {
  const {logfile} = config
}
module.exports.schema = Joi.object().keys({
  logfile: Joi.string().required()
})
