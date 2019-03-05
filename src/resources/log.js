'use strict'

const readLastLines = require('read-last-lines')

const Joi = require('joi')

const generateMatcher = {
  strict: (needle) => (haystack) => haystack === needle,
  regex: (needle) => (haystack) => Boolean(haystack.match(needle))
}

module.exports = {
  function: async function Log (config) {
    const {logfile} = config

    return {
      match: {
        schema: Joi.object().keys({
          matchType: Joi.string().required(), // TODO: choice 'regex', 'strict'
          matches: Joi.string().required(), // TODO: regex if choice regex
          matchLastLines: Joi.number().required(),
          invertSuccess: Joi.boolean() // basically: match=failure
        }),
        function: async (config, generateFailure) => {
          const lastLines = await readLastLines(logfile, config.matchLastLines).split('\n')
          const matcher = generateMatcher[config.matchType](config.matches)
          const isAMatch = Boolean(lastLines.filter(matcher).length)
          if (isAMatch && config.invertSuccess) {
            generateFailure('The pattern matches, even though it shouldn\'t')
          }
          if (!isAMatch) {
            generateFailure('The pattern doesn\'t match, even though it should')
          }
        }
      }
    }
  },
  schema: Joi.object().keys({
    logfile: Joi.string().required()
  })
}
