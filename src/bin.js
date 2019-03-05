#!/usr/bin/env node

/* eslint-disable no-console */

'use strict'

const yaml = require('js-yaml')
const fs = require('fs')

const main = require('./')

const config = yaml.safeLoad(String(fs.readFileSync(process.argv[2])))

function err (err) {
  console.error(err.stack)
  process.exit(2)
}

main(config).then((server) => {
  server.start().then(() => {}).catch(err)
}).catch(err)
