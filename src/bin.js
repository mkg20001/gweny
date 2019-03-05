#!/usr/bin/env node

const yaml = require('js-yaml')
const fs = require('fs')

const main = require('./')

const config = yaml.parse(String(fs.readFileSync(process.argv[2])))
main(config)
