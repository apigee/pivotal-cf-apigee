'use strict'
/*
 * Copyright 2016 Apigee Corporation
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
 * Changes target host/path according to Cloud Foundry "magic header".
 * 
 * @module
 */

function retarget (req, res, next) {
  const cfurl = req.headers['x-cf-forwarded-url']
  if (! cfurl) {
    next()
    return
  }

  let h = cfurl.indexOf('://')
  if (h >= 0) {
    h += 3
  }
  else {
    h = 0
  }

  let p = cfurl.indexOf('/', h)
  if (p < 0) {
    p = cfurl.length
  }

  const cfHostname = cfurl.slice(h, p)
  const cfPath = cfurl.slice(p) || '/'

  // console.log('x-cf-forwarded-url', cfurl, h, p)
  // console.log(req.targetHostname, '->', cfHostname)
  // console.log(req.targetPath, '->', cfPath)

  if (cfHostname) {
    req.targetHostname = cfHostname
  }
  req.targetPath = cfPath

  next()
}

module.exports.init = function (config, logger, stats) {
  return {
    onrequest: retarget
  }
}
