const { floor, random } = Math

import { join, dirname } from "path"
import { fileURLToPath } from "url"
import crypto from "crypto"
import { networkInterfaces } from "os"

import express from "express"
import { WebSocketServer } from 'ws'

import Consts from './public/consts.mjs'
// import { Game } from './public/game.mjs'

const PROD = process.env.PROD ? true : false
const PORT = process.env.PORT || PROD ? 80 : 3000
const DIRNAME = dirname(fileURLToPath(import.meta.url))


const games = {
  "basic_example": {
    title: "Basic Example"
  }
}


class GameServer {

  constructor() {
    this.port = PORT
    this.rooms = {}
    this.initApp()
  }

  initApp() {
    this.app = express()
    this.app.use(express.static('public'))

    this.app.get("/games", (req, res) => {
      res.json({ games })
    })

    this.app.get("/room/:roomId", (req, res) => {
      const { roomId } = req.params
      if(this.rooms[roomId] === undefined) {
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
        if(key === Consts.MSG_KEYS.JOYPAD_INPUT) this.handleJoypadInput(ws, body)
        else if(key === Consts.MSG_KEYS.GAME_INPUT) this.handleGameInput(ws, body)
        else if(key === Consts.MSG_KEYS.IDENTIFY_GAME) this.handleIdentifyGame(ws)
        else if(key === Consts.MSG_KEYS.IDENTIFY_PLAYER) this.handleIdentifyPlayer(ws, JSON.parse(body))
        else if(key === Consts.MSG_KEYS.START_GAME) this.handleStartGame(ws, JSON.parse(body))
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

  generateRoomId() {
    let it = 1
    while(true) {
      const roomId = PROD ? floor(random() * 1000).toString() : it.toString()
      if(this.rooms[roomId] === undefined) return roomId
      it++
    }
  }

  handleIdentifyGame(ws) {
    ws.type = "game"
    const roomId = this.generateRoomId()
    ws.room = this.rooms[roomId] = new Room(
      roomId, ws
    )
    console.log(`Room '${roomId}' created`)
    ws.send(Consts.MSG_KEYS.IDENTIFY_GAME + JSON.stringify({
      roomId
    }))
  }

  handleIdentifyPlayer(ws, kwargs) {
    if(!ws.room) {
      ws.type = "player"
      const { roomId } = kwargs
      const room = this.rooms[roomId]
      if(!room || room.closed) { ws.close(); return }
      ws.room = room
      room.playerWebsockets[ws.id] = ws
      console.log(`Player '${ws.id}' connected to room '${roomId}'`)
      room.numPlayer += 1
      ws.send(Consts.MSG_KEYS.IDENTIFY_PLAYER + JSON.stringify({
        name: `Player${room.numPlayer}`,
        color: "blue"
      }))
      if(room.gameKey) {
        ws.send(Consts.MSG_KEYS.START_GAME + JSON.stringify({
          gameKey: room.gameKey
        }))
      }
    } else {
      const { room } = ws
      if(!room || room.closed) { ws.close(); return }
      if(kwargs.name) ws.name = kwargs.name
      if(kwargs.color) ws.color = kwargs.color
      const msg = Consts.MSG_KEYS.SYNC_PLAYERS + JSON.stringify(room.exportPlayers())
      room.sendToGame(msg)
      room.sendToPlayers(msg)
    }
  }

  handleStartGame(ws, kwargs) {
    const { gameKey } = kwargs
    const { room } = ws
    if(!room || room.closed) { ws.close(); return }
    room.gameKey = gameKey
    console.log(`Game of room '${room.id}' set to '${gameKey}'`)
    room.sendToPlayers(Consts.MSG_KEYS.START_GAME + JSON.stringify({
      gameKey
    }))
  }

  handleClientDeconnection(ws) {
    const { room } = ws
    if(!room || room.closed) { ws.close(); return }
    if(ws.type === "game") {
      room.closed = true
      for(let ws of Object.values(room.playerWebsockets)) ws.close()
      delete this.rooms[room.id]
      console.log(`Room '${room.id}' closed`)
    } else if(ws.type === "player") {
      delete room.playerWebsockets[ws.id]
      console.log(`Player '${ws.id}' left the room '${room.id}'`)
      const msg = Consts.MSG_KEYS.SYNC_PLAYERS + JSON.stringify(room.exportPlayers())
      room.sendToGame(msg)
      room.sendToPlayers(msg)
    }
  }

  handleJoypadInput(ws, body) {
    const { room } = ws
    if(!room || room.closed) { ws.close(); return }
    room.sendToGame(Consts.MSG_KEYS.JOYPAD_INPUT + ws.id + ':' + body)
  }

  handleGameInput(ws, body) {
    const { room } = ws
    if(!room || room.closed) { ws.close(); return }
    room.sendToPlayers(Consts.MSG_KEYS.GAME_INPUT + body)
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


class Room {

  constructor(id, gameWs) {
    this.id = id
    this.numPlayer = 0
    this.gameWebsocket = gameWs
    this.playerWebsockets = {}
  }

  sendToGame(msg) {
    this.gameWebsocket.send(msg)
  }

  sendToPlayers(msg) {
    for(const jpws of Object.values(this.playerWebsockets)) {
      jpws.send(msg)
    }
  }

  exportPlayers() {
    const res = {}
    const { playerWebsockets } = this
    for(const jpWs of Object.values(playerWebsockets)) {
      const { name, color } = jpWs
      if(!name) continue
      res[jpWs.id] = { name, color }
    }
    return res
  }
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
