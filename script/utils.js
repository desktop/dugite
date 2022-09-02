const https = require('https')

/** Quick-and-dirty async https (only) GET request */
const get = url => {
  const options = {
    headers: { 'User-Agent': 'dugite' },
    secureProtocol: 'TLSv1_2_method'
  }

  return new Promise((resolve, reject) => {
    https.get(url, options).on('response', res => {
      if ([301, 302].includes(res.statusCode)) {
        get(res.headers.location).then(resolve, reject)
      } else if (res.statusCode !== 200) {
        reject(new Error(`Got ${res.statusCode} from ${url}`))
      } else {
        const chunks = []
        res.on('data', chunk => chunks.push(chunk))
        res.on('end', () => {
          resolve(Buffer.concat(chunks).toString('utf8'))
        })
      }
    })
  })
}

module.exports = { get }
