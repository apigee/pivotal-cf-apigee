'use strict'
var nconf = require('nconf')
var apigee = require('apigee-access')

// arguments, environment vars, then file
nconf.argv()
  .env()
  .file({file: 'config.json'})

// THIS ENTIRE BLOCK IS NOT NECESSARY in PCF
//   // populate mgmt api user
// if (apigee.getMode() === apigee.APIGEE_MODE) {
//   var vaultname = nconf.get('apigee_edge').authvault
//   var vault = apigee.getVault(vaultname)
//   vault.get('username', function (err, value) {
//     if (err) {
//       throw new Error('Unable to retrieve admin credentials. Check vault.')
//     } else {
//       nconf.set('apigee_edge:username', value)
//       vault.get('password', function (err, value) {
//         if (err) {
//           throw new Error('Unable to retrieve admin credentials. Check vault.')
//         } else {
//           nconf.set('apigee_edge:password', value)
//           console.log('set user/pass for edge mgmt api.')
//         }
//       })
//     }
//   })
// } else {
//   // TODO: fix this - temporary just to validate
//   // get auth from cf environment
// //  var creds = JSON.parse(process.env.apigee_credentials)
// //  nconf.set('apigee_edge:username', creds.user)
// //  nconf.set('apigee_edge:password', creds.pass)
// }

module.exports = nconf
