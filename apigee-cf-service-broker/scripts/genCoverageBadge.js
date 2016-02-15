var badger = require('istanbul-cobertura-badger')
var path = require('path')
var log = require('bunyan').createLogger({name: 'apigee', src: true})
var opts = {
  destinationDir: path.resolve(__dirname, '..', 'test'), // REQUIRED PARAMETER!
  istanbulReportFile: path.resolve(__dirname, '..', 'coverage', 'cobertura-coverage.xml'),
  thresholds: {
    // overall percent >= excellent, green badge
    excellent: 90,
    // overall percent < excellent and >= good, yellow badge
    good: 65
    // overall percent < good, red badge
  }
}

console.log(opts)

// Load the badge for the report$
badger(opts, function parsingResults (err, badgeStatus) {
  if (err) {
    log.error({err: err}, 'Code coverage badge generate error')
  }
  else {
    log.info('Badge successfully generated at ' + badgeStatus.badgeFile.file)
  }
})
