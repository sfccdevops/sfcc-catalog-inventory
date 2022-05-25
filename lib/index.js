const chalk = require('chalk')
const forEach = require('lodash/forEach')
const fs = require('fs')
const ora = require('ora')
const xml2js = require('xml2js')

const slug = require('./slug')

module.exports = async (options) => {
  // Start CLI Spinner
  const spinner = ora(chalk.bold(`Processing ...`).concat(' [Ctrl-C to Cancel]')).start()

  // Exit if we are missing required input option
  if (!options || !options.input) {
    spinner.text = 'Error: Missing Required Input'
    spinner.fail()
    process.exit()
  }

  // Update Spinner
  spinner.text = chalk.bold(`Processing ${options.input} ...`).concat(' [Ctrl-C to Cancel]')
  spinner.render()

  // Read Catalog XML File
  fs.readFile(options.input, (xmlError, xmlString) => {
    // Exit if we could not read from file
    if (xmlError) {
      spinner.text = `Error: ${xmlError.message}`
      spinner.fail()
      process.exit()
    }

    // Parse Catalog XML Text
    xml2js.parseString(xmlString, (parseErr, xmlObject) => {
      // Exit if we could not read from file
      if (parseErr) {
        spinner.text = `Error: ${parseErr.message}`
        spinner.fail()
        process.exit()
      }

      // Create Default Inventory List ID
      let listId = 'inventory'

      // Update List ID if Catalog ID exists
      if (
        xmlObject.catalog &&
        typeof xmlObject.catalog['$'] !== 'undefined' &&
        typeof xmlObject.catalog['$']['catalog-id'] !== 'undefined'
      ) {
        listId = `${xmlObject.catalog['$']['catalog-id']}-inventory`
      }

      // Check if Output Filename Defined
      if (options.name) {
        // Add inventory suffix to list ID if not already present
        listId = `${slug(options.name.replace(/-inventory$/, ''))}-inventory`
      }

      // Create Inventory Object
      let inventory = {
        $: {
          xmlns: 'http://www.demandware.com/xml/impex/inventory/2007-05-31',
        },
        'inventory-list': {
          header: {
            $: {
              'list-id': listId,
            },
            'default-instock': false,
            description: 'Product Inventory',
            'use-bundle-inventory-only': false,
            'on-order': false,
          },
          records: {
            record: [],
          },
        },
      }

      // Loop through Catalog Products
      forEach(xmlObject.catalog.product, (product) => {
        // Check that we have a Product with an ID
        if (product && typeof product['$'] !== 'undefined' && typeof product['$']['product-id'] !== 'undefined') {
          // Save Product to Inventory List
          inventory['inventory-list'].records.record.push({
            $: {
              'product-id': product['$']['product-id'],
            },
            allocation: 500,
            perpetual: true,
            'preorder-backorder-handling': 'none',
            ats: 0,
            'on-order': 0,
            turnover: 0,
          })
        }
      })

      // Create XML Builder
      const builder = new xml2js.Builder({
        mergeAttrs: true,
        rootName: 'inventory',
        xmldec: {
          version: '1.0',
          encoding: 'UTF-8',
        },
      })

      // Build XML String from Object
      const inventoryXML = builder.buildObject(inventory)

      // Create File Name from Catalog ID
      let outputFile = `${listId}.xml`

      // Check if Output Filename Defined
      if (options.output) {
        // Not sure if user has XML added as extension, so let's make sure
        outputFile = `${slug(options.output.replace(/\.xml$/, ''))}.xml`
      }

      // Write XML Output to File
      fs.writeFile(outputFile, inventoryXML, (writeErr) => {
        if (writeErr) {
          spinner.text = `Error: ${writeErr}`
          spinner.fail()
        } else {
          spinner.text = chalk.bold(`Processing Complete`).concat(` ( Created: ${outputFile} )`)
          spinner.succeed()
        }

        // Terminate Process
        process.exit()
      })
    })
  })
}
