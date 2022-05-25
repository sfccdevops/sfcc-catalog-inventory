#!/usr/bin/env node

const path = require('path')
const yargs = require('yargs')

const argv = yargs
  .usage('Usage: sfcc-catalog-inventory -i [input] -o [output]')
  .describe('i', 'Input File ( Catalog XML )')
  .describe('o', 'Output File ( Generated XML )')
  .describe('n', 'Inventory Name')
  .alias('i', 'input')
  .alias('o', 'output')
  .alias('n', 'name')
  .demandOption(['i'])
  .example('sfcc-catalog-inventory -i catalog.xml', 'Basic Example')
  .help()
  .version().argv

require(path.join(__dirname, '../lib/index.js'))(argv)
