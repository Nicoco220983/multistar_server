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

    Game.playerIds = new Set()

    Game.addPlayer = function(playerId) {
      Game.playerIds.add(playerId)
      const scn = Game.getScene()
      if(scn) scn.addPlayer(playerId)
    }

    Game.rmPlayer = function(playerId) {
      Game.playerIds.delete(playerId)
      const scn = Game.getScene()
      if(scn) scn.rmPlayer(playerId)
    }

    Game.handleInput = (playerId, kwargs) => {
      Game.getScene().handleInput(playerId, kwargs)
    }
  
    Game.gameScns = newGroup()
    Game.getScene = () => Game.gameScns.children[0]
    Game.addScene = function(scn) {
      const prevScn = Game.getScene()
      if(prevScn) prevScn.remove()
      Game.gameScns.add(scn)
      for(const playerId of Game.playerIds) scn.addPlayer(playerId)
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

  scn.addPlayer = playerId => scn.addHero(playerId)
  scn.rmPlayer = playerId => scn.rmHero(playerId)

  // heros

  scn.heros = addTo(scn, newGroup())

  scn.herosById = {}
  scn.addHero = playerId => {
    const hero = scn.herosById[playerId] = addTo(scn.heros, newHero({
      x: (.25 + .5 * random()) * WIDTH,
      y: (.25 + .5 * random()) * HEIGHT,
    }))
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


function newHero(pos) {
  const hero = Game.makeRectangle(pos.x, pos.y, 30, 30)
  hero.fill = "blue"

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


function collide(obj1, obj2) {
  const rect1 = obj1.getBoundingClientRect()
  const x1 = rect1.left, y1 = rect1.top, w1 = rect1.width, h1 = rect1.height
  const rect2 = obj2.getBoundingClientRect()
  const x2 = rect2.left, y2 = rect2.top, w2 = rect2.width, h2 = rect2.height
  if(x1 > x2+w2 || x2 > x1+w1) return false
  if(y1 > y2+h2 || y2 > y1+h1) return false
  return true
}


export { startGame }