const jwt = require('jsonwebtoken');
const secret = 'iIsInR5cCI6IkpMAXJ9eyJhbGciGecyAnneLICUzI1N'

const appSign = payload => jwt.sign(payload, secret, { expiresIn: 86400 })
const appVerify = token => jwt.verify(token, secret)

module.exports = {
  sign: appSign,
  verify: appVerify
}
