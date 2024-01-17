const { floor, random } = Math

import { join, dirname } from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import crypto from "crypto"
import { networkInterfaces } from "os"
import path from "path"

import express from "express"
import { WebSocketServer } from 'ws'

import Consts from './static/consts.mjs'

const PROD = ((process.env.MULTISTAR_ENV || "").toLowerCase() === "production") ? true : false
const PORT = process.env.MULTISTAR_PORT || (PROD ? 8080 : 3000)
const DIRNAME = dirname(fileURLToPath(import.meta.url))

const games = initGames()


class GameServer {

  constructor() {
    this.port = PORT
    this.rooms = {}
    this.initApp()
  }

  initApp() {
    this.app = express()
    this.app.use(express.static('static'))

    this.app.get("/", (req, res) => {
      res.redirect(`/r/${this.generateRoomId()}`)
    })

    this.app.get("/r/:roomId", (req, res) => {
      const { roomId } = req.params
      res.sendFile(join(DIRNAME, "static/room.html"))
    })

    this.app.get("/r/:roomId/p", (req, res) => {
      const { roomId } = req.params
      const room = this.rooms[roomId]
      if(room === undefined) return res.sendStatus(404)
      res.redirect(`/r/${roomId}/p/${room.generatePlayerId()}`)
    })

    this.app.get("/r/:roomId/p/:playerId", (req, res) => {
      const { roomId } = req.params
      if(this.rooms[roomId] === undefined) return res.sendStatus(404)
      res.sendFile(join(DIRNAME, "static/joypad.html"))
    })

    this.app.get("/games", (req, res) => {
      res.json({ games })
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
        if(key === Consts.MSG_KEYS.JOYPAD_INPUT) this.onJoypadInput(ws, body)
        else if(key === Consts.MSG_KEYS.GAME_INPUT) this.onGameInput(ws, body)
        else if(key === Consts.MSG_KEYS.GAME_STATE) this.onGameState(ws, body)
        else if(key === Consts.MSG_KEYS.IDENTIFY_GAME) this.onIdentifyGame(ws, JSON.parse(body))
        else if(key === Consts.MSG_KEYS.IDENTIFY_PLAYER) this.onIdentifyPlayer(ws, JSON.parse(body))
        else if(key === Consts.MSG_KEYS.START_GAME) this.onStartGame(ws, JSON.parse(body))
        else if(key === Consts.MSG_KEYS.DISCONNECT_PLAYER) this.onDisconnectPlayer(ws, body)
        else console.warn("Unknown websocket key", key)
      })
    
      ws.on('error', console.error)
    
      ws.on('close', () => {
        console.log(`Client '${ws.id}' disconnected`)
        this.onClientDeconnection(ws)
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

  onIdentifyGame(ws, kwargs) {
    ws.type = "game"
    const roomId = kwargs.id
    ws.room = this.rooms[roomId] = new Room(
      roomId, ws
    )
    console.log(`Room '${roomId}' created`)
  }

  onIdentifyPlayer(ws, kwargs) {
    if(!ws.room) {
      // first player connection
      ws.type = "player"
      const { roomId, id: playerId } = kwargs
      const room = this.rooms[roomId]
      if(!room || room.closed) { ws.close(); return }
      ws.room = room
      room.playerWebsockets[ws.id] = ws
      console.log(`Player '${ws.id}' connected to room '${roomId}' as '${playerId}'`)
      ws.send(Consts.MSG_KEYS.IDENTIFY_PLAYER + JSON.stringify({
        name: `Player${playerId}`,
        color: "blue"
      }))
      if(room.gameKey) {
        ws.send(Consts.MSG_KEYS.START_GAME + JSON.stringify({
          gameKey: room.gameKey
        }))
        if(room.gameState) ws.send(Consts.MSG_KEYS.GAME_STATE + room.gameState)
      }
    } else {
      // player chose its name and color
      const { room } = ws
      if(!room || room.closed) { ws.close(); return }
      if(kwargs.name) ws.name = kwargs.name
      if(kwargs.color) ws.color = kwargs.color
      const msg = Consts.MSG_KEYS.SYNC_PLAYERS + JSON.stringify(room.exportPlayers())
      room.sendToGame(msg)
      room.sendToPlayers(msg)
    }
  }

  onStartGame(ws, kwargs) {
    const { gameKey } = kwargs
    const { room } = ws
    if(!room || room.closed) { ws.close(); return }
    room.gameKey = gameKey
    room.gameState = null
    console.log(`Game of room '${room.id}' set to '${gameKey}'`)
    room.sendToPlayers(Consts.MSG_KEYS.START_GAME + JSON.stringify({
      gameKey
    }))
  }

  onClientDeconnection(ws) {
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

  onJoypadInput(ws, body) {
    const { room } = ws
    if(!room || room.closed) { ws.close(); return }
    room.sendToGame(Consts.MSG_KEYS.JOYPAD_INPUT + ws.id + ':' + body)
  }

  onGameInput(ws, body) {
    const { room } = ws
    if(!room || room.closed) { ws.close(); return }
    room.sendToPlayers(Consts.MSG_KEYS.GAME_INPUT + body)
  }

  onGameState(ws, body) {
    const { room } = ws
    if(!room || room.closed) { ws.close(); return }
    room.gameState = body
    room.sendToPlayers(Consts.MSG_KEYS.GAME_STATE + body)
  }

  onDisconnectPlayer(ws, playerId) {
    const { room } = ws
    if(!room || room.closed) { ws.close(); return }
    const playerWs = room.playerWebsockets[playerId]
    if(!playerWs) return
    playerWs.close()
  }
}


class Room {

  constructor(id, gameWs) {
    this.id = id
    this.numPlayer = 1
    this.gameWebsocket = gameWs
    this.playerWebsockets = {}
    this.gameKey = null
    this.gameState = null
  }

  generatePlayerId() {
    const res = this.numPlayer.toString()
    this.numPlayer += 1
    return res
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


function initGames() {
  const games = {}
  for(const dirent of fs.readdirSync(path.join(DIRNAME, 'static/game'), { withFileTypes: true })) {
    try {
      if(!dirent.isSymbolicLink()) continue
      const gameRelPath = path.join(dirent.path, dirent.name)
      const confPath = path.join(fs.realpathSync(gameRelPath), '../multistar.json')
      const conf = JSON.parse(fs.readFileSync(confPath))
      games[conf.key] = conf
    } catch(err) {
      console.error(err)
    }
  }
  return games
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
