/*
 * Copyright 2017 Apigee Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Simple VCAP utilities for Cloud Foundry applications
 * @module
 */


function parse(obj, envName) {
  obj.string = process.env[envName]
  try {
    obj.parsed = JSON.parse(obj.string)
    obj.error = false
  } catch (x) {
    obj.parsed = {}
    obj.error = true
  }
}



function Application() {
  parse(this, 'VCAP_APPLICATION')
}


function Services() {
  parse(this, 'VCAP_SERVICES')
}
Services.prototype.findCredentialsWithKeys = function() {
  const args = Array.prototype.slice.call(arguments)

  // Pluck all nested credentials
  const creds = Object.keys(this.parsed).reduce((a, serviceName) => {
    // by hoisting from hash of arrays
    return a.concat(this.parsed[serviceName].map((i) => i.credentials))
  }, [])
  .filter((c) => c)  // and discarding any undefined

  return creds.filter((c) => args.every((k) => c.hasOwnProperty(k)))
}



module.exports.application = new Application()
module.exports.services = new Services()
