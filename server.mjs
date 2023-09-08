const { floor, random } = Math

import { join, dirname } from "path"
import { fileURLToPath } from "url"
import crypto from "crypto"
import { networkInterfaces } from "os"

import express from "express"
import { WebSocketServer } from 'ws'

import Consts from './public/consts.mjs'
// import { Game } from './public/game.mjs'

const PORT = process.env.PORT || 3000
const DIRNAME = dirname(fileURLToPath(import.meta.url))


const games = {
  "basic_example": {
    title: "Basic Example"
  }
}


class GameServer {

  constructor() {
    this.port = PORT
    this.parties = {}
    this.initApp()
  }

  initApp() {
    this.app = express()
    this.app.use(express.static('public'))

    this.app.get("/games", (req, res) => {
      res.json({ games })
    })

    this.app.get("/party/:partyId", (req, res) => {
      const { partyId } = req.params
      if(this.parties[partyId] === undefined) {
        return res.sendStatus(404)
      }
      res.sendFile(join(DIRNAME, "public/joypad.html"))
    })
  }

  serve() {
    this.server = this.app.listen(this.port)
    this.startWebocketServer()
  }

  startWebocketServer() {

    this.websocketServer = new WebSocketServer({ server: this.server })

    this.websocketServer.on('connection', ws => {

      ws.id = this.generateClientId()
      console.log(`Client '${ws.id}' connected`)
    
      ws.on('message', (data, isBinary) => {
        const msg = isBinary ? data : data.toString()
        const key = msg.substring(0, Consts.MSG_KEY_LENGTH)
        const body = msg.substring(Consts.MSG_KEY_LENGTH)
        if(key === Consts.MSG_KEYS.IDENTIFY_CLIENT) this.handleIdentifyClient(ws, JSON.parse(body))
        else if(key === Consts.MSG_KEYS.SET_GAME) this.handleSetGame(ws, JSON.parse(body))
        else if(key === Consts.MSG_KEYS.INPUT) this.handleJoypadInput(ws, body)
        else console.warn("Unknown websocket key", key)
      })
    
      ws.on('error', console.error)
    
      ws.on('close', () => {
        console.log(`Client '${ws.id}' disconnected`)
        this.handleClientDeconnection(ws)
      })
    })
  }

  generateClientId() {
    return crypto.randomBytes(8).toString("hex")
  }

  generatePartyId() {
    return floor(random() * 1000).toString()
  }

  handleIdentifyClient(ws, kwargs) {
    ws.type = kwargs.type
    if(ws.type === "party") {
      const partyId = this.generatePartyId()
      ws.party = this.parties[partyId] = {
        id: partyId,
        partyWebsocket: ws,
        joypadWebsockets: {},
      }
      console.log(`Party '${partyId}' created`)
      ws.send(Consts.MSG_KEYS.IDENTIFY_PARTY + JSON.stringify({
        partyId
      }))
    } else if(ws.type === "joypad") {
      const { partyId } = kwargs
      const party = this.parties[partyId]
      if(!party) {
        console.warn(`Joypad '${ws.id}' try to connect to non-existant party '${partyId}'`)
        return
      }
      ws.party = party
      party.joypadWebsockets[ws.id] = ws
      console.log(`Joypad '${ws.id}' connected to party '${partyId}'`)
      if(party.gameKey) {
        ws.send(Consts.MSG_KEYS.SET_GAME + JSON.stringify({
          gameKey: party.gameKey
        }))
      }
      ws.party.partyWebsocket.send(Consts.MSG_KEYS.ADD_PLAYER + JSON.stringify({
        id: ws.id
      }))
    } else console.warn("Unknown client type", ws.type)
  }

  handleSetGame(ws, kwargs) {
    const { gameKey } = kwargs
    const { party } = ws
    party.gameKey = gameKey
    console.log(`Game of party '${party.id}' set to '${gameKey}'`)
    for(const jpws of Object.values(ws.party.joypadWebsockets)) {
      jpws.send(Consts.MSG_KEYS.SET_GAME + JSON.stringify({
        gameKey
      }))
    }
  }

  handleClientDeconnection(ws) {
    const { party } = ws
    if(!party) return
    if(ws.type === "party") {
      for(let ws of Object.values(party.joypadWebsockets)) ws.close()
      delete this.parties[party.id]
      console.log(`Party '${party.id}' closed`)
    } else if(ws.type === "joypad") {
      delete party.joypadWebsockets[ws.id]
      console.log(`Joypad '${ws.id}' left the party '${party.id}'`)
      party.partyWebsocket.send(Consts.MSG_KEYS.RM_PLAYER + JSON.stringify({
        id: ws.id
      }))
    }
  }

  handleJoypadInput(ws, body) {
    const { party } = ws
    const { partyWebsocket } = party
    partyWebsocket.send(Consts.MSG_KEYS.INPUT + ws.id + ':' + body)
  }

  // startGame(key) {
  //   const game = new Game({
  //     name,
  //     isClient: false
  //   })
  //   game.websockets = {}

  //   game.loopId = setInterval(() => {
  //     game.update(1 / Consts.SERVER_UPDATE_RATE)
  //     this.sendGameUpdates(game)
  //   }, 1000 / Consts.SERVER_UPDATE_RATE)

  //   return game
  // }

  // addPlayerToGame(ws, kwargs) {
  //   const { playerName, gameName } = kwargs
  //   let game = this.games[gameName]
  //   if(!game) {
  //     console.log(`Create game '${gameName}'`)
  //     game = this.games[gameName] = this.startGame(gameName)
  //   }
  //   console.log(`Add player '${ws.id}' with name '${playerName}' to game '${gameName}'`)
  //   ws.game = game
  //   game.websockets[ws.id] = ws
  //   game.addPlayer(ws.id, playerName)
  //   ws.send(Consts.MSG_KEYS.ASSIGN_PLAYER + ws.id)
  // }

  // rmPlayerFromGame(ws) {
  //   console.log(`Remove player '${ws.id}' from game '${ws.game.name}'`)
  //   ws.game.rmPlayer(ws.id)
  //   delete ws.game.websockets[ws.id]
  //   if(Object.keys(ws.game.websockets).length === 0) {
  //     console.log(`Delete game '${ws.game.name}'`)
  //     this.stopGame(ws.game)
  //   }
  // }

  // stopGame(game) {
  //   delete this.games[game.name]
  //   clearInterval(game.loopId)
  // }

  // handlePlayerInput(ws, data) {
  //   ws.game.onInput(ws.id, data)
  // }

  // sendGameUpdates(game) {
  //   const state = game.toState()
  //   Object.keys(game.websockets).forEach(id => {
  //     const socket = game.websockets[id]
  //     socket.send(Consts.MSG_KEYS.GAME_UPDATE + JSON.stringify(state))
  //   })
  // }
}

function getLocalIps() {
  const nets = networkInterfaces();
  const res = {}

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            if (!res[name]) {
              res[name] = [];
            }
            res[name].push(net.address);
        }
    }
  }
  return res
}

const gameServer = new GameServer()
gameServer.serve()
const localIp = Object.values(getLocalIps())[0]
console.log(`Server started at: http://${localIp}:${PORT}`)

// const app = express()
// app.use(express.static('public'))

// const port = process.env.PORT || 3000
// const server = app.listen(port)
// console.log(`Server listening on port ${port}`)

// const wss = new WebSocketServer({ server })
// const Sockets = {}

// wss.on('connection', ws => {
//   onConnect(ws)

//   ws.on('message', (data, isBinary) => {
//     const msg = isBinary ? data : data.toString()
//     const key = msg.substring(0, Consts.MSG_KEY_LENGTH)
//     const body = msg.substring(Consts.MSG_KEY_LENGTH)
//     if(key === Consts.MSG_KEYS.JOIN_GAME) joinGame(ws, body)
//     else if(key === Consts.MSG_KEYS.INPUT) handleInput(ws, body)
//     else console.warn("Unknown websocket key", key)
//   })

//   ws.on('error', console.error)

//   ws.on('close', () => onDisconnect(ws))
// })

// const game = new Game({
//   isClient: false
// })

// function joinGame(ws, username) {
//   game.addPlayer(ws.id, username)
// }

// function handleInput(ws, data) {
//   game.onInput(ws.id, JSON.parse(data))
// }

// function onConnect(ws) {
//   ws.id = crypto.randomBytes(16).toString("hex")
//   console.log('Player connected!', ws.id)
//   Sockets[ws.id] = ws
// }

// function onDisconnect(ws) {
//   console.log('Player disconnected!', ws.id)
//   delete Sockets[ws.id]
//   game.rmPlayer(ws.id)
// }

// function sendUpdates() {
//   const state = game.toState()
//   Object.keys(Sockets).forEach(id => {
//     const socket = Sockets[id]
//     const player = game.players.items[id]
//     socket.send(Consts.MSG_KEYS.GAME_UPDATE + JSON.stringify(state))
//   })
// }

// setInterval(() => {
//   game.update(1 / Consts.SERVER_UPDATE_RATE)
//   sendUpdates()
// }, 1000 / Consts.SERVER_UPDATE_RATE)
