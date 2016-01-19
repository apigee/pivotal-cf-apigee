/*
 retrieve forwarded url from header,
 save for use in target flow to set target url.
 additionally parse url into components and set
 request.uri to allow path/queryparam variable
 references to work as expected
*/
var cfurl = context.getVariable('request.header.X-Cf-Forwarded-Url')
// TODO: update this if/when route services change made on CF side
// var cfurl = context.getVariable('proxy.pathsuffix')
// cfurl = decodeURIComponent(cfurl.slice(1))
// TODO: Update zip file

context.setVariable('cf-url', cfurl)

var r = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/
var parts = r.exec(cfurl)
context.setVariable('cf-path', parts[5])
if (parts[6]) {
    context.setVariable('cf-querystring', parts[6])
    context.setVariable('request.uri', parts[5] + parts[6])
} else {
    context.setVariable('request.uri', parts[5])
}
