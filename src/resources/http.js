'use strict'

const fetch = require('node-fetch')
const Joi = require('joi')

module.exports = {
  function: async ({endpoint}) => {
    return {
      get: {
        function: async ({expectStatus, useHead}, generateFailure) => {
          const res = await fetch(endpoint, {method: useHead ? 'HEAD' : 'GET'})
          if (expectStatus !== res.status) {
            generateFailure('Expected status ' + expectStatus + ' but got status ' + res.status + ' (' + JSON.stringigy(res.statusText) + ')')
          }

          // TODO: extend to include stuff like content
        },
        schema: Joi.object().keys({
          expectStatus: Joi.number().min(100).max(999).required(),
          useHead: Joi.boolean()
        })
      }
    }
  },
  schema: Joi.object().keys({
    endpoint: Joi.string().required()
  })
}
