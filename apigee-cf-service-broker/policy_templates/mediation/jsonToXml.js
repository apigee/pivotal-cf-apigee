var builder = require('xmlbuilder')
var random = require('../../util/random.js')

module.exports = {
  jsonToXmlTemplate: jsonToXmlTemplate,
  jsonToXmlGenTemplate: jsonToXmlGenTemplate
}

function jsonToXmlTemplate (options) {
  var aysnc = options.async || 'false'
  var continueOnError = options.continueOnError || 'false'
  var enabled = options.enabled || 'true'
  var name = options.name || 'Quota-' + random.randomText()
  var displayName = options.displayName || name
  var source = options.source || 'response'
  var outputVariable = options.outputVariable || 'response'
  var jsonToXml = builder.create('JSONToXML')
  jsonToXml.att('async', aysnc)
  jsonToXml.att('continueOnError', continueOnError)
  jsonToXml.att('enabled', enabled)
  jsonToXml.att('name', name)
  jsonToXml.ele('DisplayName', {}, displayName)
  jsonToXml.ele('Properties')
  var jsonToXmlOptions = jsonToXml.ele('Options')
  jsonToXmlOptions.ele('NullValue', 'NULL')
  jsonToXmlOptions.ele('NamespaceBlockName', '#namespaces')
  jsonToXmlOptions.ele('DefaultNamespaceNodeName', '$default')
  jsonToXmlOptions.ele('NamespaceSeparator', ':')
  jsonToXmlOptions.ele('TextNodeName', '#text')
  jsonToXmlOptions.ele('AttributeBlockName', '#attrs')
  jsonToXmlOptions.ele('AttributePrefix', '@')
  jsonToXmlOptions.ele('InvalidCharsReplacement', '_')
  jsonToXmlOptions.ele('ObjectRootElementName', 'Root')
  jsonToXmlOptions.ele('ArrayRootElementName', 'Array')
  jsonToXmlOptions.ele('ArrayItemElementName', 'Item')
  jsonToXml.ele('OutputVariable', {}, outputVariable)
  jsonToXml.ele('Source', {}, source)
  var xmlString = jsonToXml.end({ pretty: true, indent: '  ', newline: '\n' })
  return xmlString
}

function jsonToXmlGenTemplate (options, name) {
  var templateOptions = options
  templateOptions.format = options['on']
  templateOptions.outputVariable = options['on']
  templateOptions.name = name

  return jsonToXmlTemplate(templateOptions)
}
