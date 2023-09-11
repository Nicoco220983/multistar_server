const { abs, random } = Math

import { newTwo } from './utils.mjs'

const WIDTH = 600
const HEIGHT = 400
const FPS = 60  // hardcoded in Twojs
// const ICON_SIZE = 30
const BACKGROUND_COLOR = "#111"

let Game = null


function startGame(wrapperEl, gameWs) {

    Game = newTwo(wrapperEl, WIDTH, HEIGHT, {
      backgroundColor: BACKGROUND_COLOR
    })
  
    //pauseGame(true)
  
    // const pointer = newPointer(Game)

    Game.roomId = gameWs.roomId
    Game.joypadUrl = `${window.location.href}room/${Game.roomId}`
    console.log(`Joypad URL: ${Game.joypadUrl }`)

    Game.syncPlayers = function(players) {
      this.players = players
      const scn = this.getScene()
      if(scn) scn.syncPlayers(players)
    }

    Game.handleInput = function(playerId, kwargs) {
      const scn = this.getScene()
      if(scn) scn.handleInput(playerId, kwargs)
    }
  
    Game.gameScns = newGroup()
    Game.getScene = () => Game.gameScns.children[0]
    Game.addScene = function(scn) {
      const prevScn = this.getScene()
      if(prevScn) prevScn.remove()
      this.gameScns.add(scn)
      if(this.players) scn.syncPlayers(this.players)
    }
    Game.addScene(newGameScene())
  
    // const icons = newGroup()
    // const fullscreenIcon = addTo(icons, newFullscreenIcon(Game, {
    //   x: WIDTH - ICON_SIZE*3/4,
    //   y: ICON_SIZE*3/4,
    //   size: ICON_SIZE,
    // }))
  
    // pointer.prevIsDown = false
    Game.bind("update", (frameCount, timeDelta) => {
      const time = frameCount / FPS
      const gameScn = Game.getScene()
      // if(pointer.isDown) {
      //   // pauseGame(false)
      //   if(collide(fullscreenIcon, pointer)) {
      //     if(!pointer.prevIsDown) fullscreenIcon.click()
      //   } else {
      //     gameScn.click(pointer)
      //   }
      // }
      if(!Game.paused) gameScn.update(time)
      // pointer.prevIsDown = pointer.isDown
    })
  
    // document.addEventListener("blur", () => pauseGame(true))
    
    Game.play()

    return Game
}


function newGameScene() {

  const scn = newGroup()

  scn.step = "INTRO"

  // scn.hero = newHero(scn, {
  //   x: Game.width * 0.5,
  //   y: Game.height * 0.75,
  // })
  // scn.heroShoots = addTo(scn, newGroup())
  // const heroShootFactory = every(.5, () => newHeroShoot(scn, scn.hero.translation))

  // scn.invaders = addTo(scn, newGroup())
  // const invaderFactory = every(1, () => { if(scn.invaders.children.length <= 5) newInvader(scn) })
  // scn.invaderShoots = addTo(scn, newGroup())
  // scn.invaderDeaths = addTo(scn, newGroup())

  // scn.indics = addTo(scn, newGroup())
  // newScoreIndic(scn)
  // range(3).forEach(i => newHeart(scn, i+1))

  // scn.click = function(pointer) {
  //   if(scn.step === "GAME") scn.hero.posTarget = { x:pointer.x, y:pointer.y }
  //   else if(scn.step === "GAMEOVER")
  //     if(scn.readyToRestart) newGameScene(Game)
  // }

  //   if(scn.step === "GAME") {
  //     heroShootFactory(time)
  //     invaderFactory(time)
  //     propagUpdate.call(this, time)
  //   } else if(scn.step === "GAMEOVER") {
  //     scn.afterGameOver ||= after(2, () => {
  //       newGameOverClickIndic(scn)
  //       scn.readyToRestart = true
  //     })
  //     scn.afterGameOver(time)
  //   }
  // }

  // scn.setStep = function(step) {
  //   this.step = step
  //   if(step === "GAMEOVER") {
  //     newGameOverIndic(scn)
  //   }
  // }

  // onRemove(scn, () => music.stop())

  scn.syncPlayers = function(players) {
    for(const playerId in players) if(!this.herosById[playerId]) this.addHero(playerId)
    for(const playerId in this.herosById) if(!players[playerId]) this.rmHero(playerId)
  }

  // heros

  scn.heros = addTo(scn, newGroup())

  scn.herosById = {}
  scn.addHero = playerId => {
    const hero = scn.herosById[playerId] = addTo(scn.heros, newHero(
      (.25 + .5 * random()) * WIDTH,
      (.25 + .5 * random()) * HEIGHT,
      Game.players[playerId].name,
      Game.players[playerId].color
    ))
    hero.playerId = playerId
  }
  scn.rmHero = playerId => {
    const hero = scn.herosById[playerId]
    if(!hero) return
    hero.remove()
    delete scn.herosById[playerId]
  }

  // intro test

  scn.introTexts = addTo(scn, newGroup())
  const textArgs = { size: 16, fill: "white", alignment: "center", baseline: "top" }
  addTo(scn.introTexts, Game.makeText(
    "Basic Example",
    WIDTH / 2, HEIGHT / 3,
    { ...textArgs, size: 20 }
  ))
  addTo(scn.introTexts, Game.makeText(
    "Join the game:",
    WIDTH / 2, HEIGHT / 2,
    textArgs
  ))
  addTo(scn.introTexts, Game.makeText(
    Game.joypadUrl,
    WIDTH / 2, HEIGHT / 2 + 24,
    textArgs
  ))

  // input

  scn.handleInput = (playerId, kwargs) => {
    const hero = scn.herosById[playerId]
    if(!hero) return
    hero.handleInput(kwargs)
  }

  // music.replay()

  return scn
}


function newHero(x, y, name, color) {
  const hero = newGroup()
  hero.translation.x = x
  hero.translation.y = y
  hero.width = 30
  hero.height = 30

  const rect = addTo(hero, Game.makeRectangle(0, 0, hero.width, hero.height))
  rect.fill = color

  addTo(hero, Game.makeText(
    name,
    0, 25,
    { fill: "white", size: 14 }
  ))

  hero.spdX = 100 * (random() > .5 ? 1 : -1)
  hero.spdY = 100 * (random() > .5 ? 1 : -1)

  hero.update = function(time) {
    const { x, y } = hero.translation
    const { spdX, spdY } = hero
    const w2 = hero.width / 2, h2 = hero.height / 2
    if((spdX > 0 && x > WIDTH - w2) || (spdX < 0 && x < w2)) {
      hero.spdX = -spdX
    }
    if((spdY > 0 && y > HEIGHT - h2) || (spdY < 0 && y < h2)) {
      hero.spdY = -spdY
    }
    hero.translation.x += hero.spdX / FPS
    hero.translation.y += hero.spdY/ FPS
  }

  hero.handleInput = function(input) {
    hero.spdX = abs(hero.spdX) * (input.dir === 0 ? -1 : 1)
  }

  return hero
}


// utils //////////////////////////


function addTo(group, obj) {
  group.add(obj)
  return obj
}


function propagUpdate(time) {
  this.children.forEach(s => s.update && s.update(time))
}


function newGroup() {
  const group = Game.makeGroup()
  group.update = propagUpdate
  return group
}


export { startGame }