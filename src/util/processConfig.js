'use strict'

module.exports.caseFix = (obj) => {
  const out = {}

  for (const key in obj) { // eslint-disable-line guard-for-in
    let outKey = key.replace(/-([a-z])/gmi, (_, firstLetter) => firstLetter.toUpperCase()) // some-var => someVar
    if (obj[key] instanceof Object && !Array.isArray(obj[key]) && typeof obj[key] === 'object') { // recursion
      out[outKey] = module.exports.caseFix(obj[key])
    } else {
      out[outKey] = obj[key]
    }
  }

  return out
}
