/* retrieve variable saved from cf-header and assign target.url */
var cfurl = context.getVariable('cf-url')
context.setVariable('target.url', cfurl)
