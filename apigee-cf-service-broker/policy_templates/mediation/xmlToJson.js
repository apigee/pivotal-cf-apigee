var builder = require('xmlbuilder')
var random = require('../../util/random.js')

module.exports = {
  xmlToJsonTemplate: xmlToJsonTemplate,
  xmlToJsonGenTemplate: xmlToJsonGenTemplate
}

function xmlToJsonTemplate (options) {
  var aysnc = options.async || 'false'
  var continueOnError = options.continueOnError || 'false'
  var enabled = options.enabled || 'true'
  var name = options.name || 'Quota-' + random.randomText()
  var displayName = options.displayName || name
  var format = options.format || 'yahoo'
  var source = options.source || 'response'
  var outputVariable = options.outputVariable || 'response'
  var xmlToJson = builder.create('XMLToJSON')
  xmlToJson.att('async', aysnc)
  xmlToJson.att('continueOnError', continueOnError)
  xmlToJson.att('enabled', enabled)
  xmlToJson.att('name', name)
  xmlToJson.ele('DisplayName', {}, displayName)
  xmlToJson.ele('Properties')
  xmlToJson.ele('Format', {}, format)
  xmlToJson.ele('OutputVariable', {}, outputVariable)
  xmlToJson.ele('Source', {}, source)
  var xmlString = xmlToJson.end({ pretty: true, indent: '  ', newline: '\n' })
  return xmlString
}

function xmlToJsonGenTemplate (options, name) {
  var templateOptions = options
  templateOptions.source = options['on']
  templateOptions.outputVariable = options['on']
  templateOptions.name = name
  return xmlToJsonTemplate(templateOptions)
}
