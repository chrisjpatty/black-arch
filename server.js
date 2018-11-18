const express = require('express')
const chalk = require('chalk')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const shell = require('shelljs');
const CONFIG = require('./config')

module.exports.registerExpressServer = bonjourServer => {
  app.use(bodyParser.json());

  app.get('/', (req, res) => res.json({
    stationId: CONFIG.stationId
  }))

  app.get('/config', (req, res) => res.json(CONFIG))

  app.post('/config', (req, res) => {
    const payload = req.body;
    console.log(payload);
    res.json(payload)
  })

  app.get('/reboot', (req, res) => {
    bonjourServer.stop(() => {
      res.json(true)
      shell.exec('sudo reboot')
    })
  })

  app.get('/shutdown', (req, res) => {
    bonjourServer.stop(() => {
      res.json(true)
      shell.exec('sudo halt')
    })
  })

  app.listen(port, () => console.log(chalk.blue(`Express server listening on port ${port}!`)))
}

module.exports.expressPort = port
