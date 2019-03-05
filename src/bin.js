#!/usr/bin/env node

'use strict'

const yaml = require('js-yaml')
const fs = require('fs')

const main = require('./')

const config = yaml.safeLoad(String(fs.readFileSync(process.argv[2])))
main(config)
