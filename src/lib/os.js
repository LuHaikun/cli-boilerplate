const os = require('os')

const getIpAddress = () => {
  const interFaces = os.networkInterfaces()
  let ipAddress = 'localhost'
  for (const k in interFaces) {
    const item = interFaces[k]
    for (let i = 0; i < item.length; i++) {
      const interFace = item[i]
      if (interFace.address === '127.0.0.1' || interFace.family !== 'IPv4') continue
      ipAddress = interFace.address
    }
  }

  return ipAddress
}

const getHostName = () => {
  return os.hostname()
}

const isWindows = () => {
  return os.type() === 'Windows_NT'
}

module.exports = {
  isWindows,
  getHostName,
  getIpAddress
}
