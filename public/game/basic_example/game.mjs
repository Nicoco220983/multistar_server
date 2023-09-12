const { abs, random } = Math

import * as utils from './utils.mjs'
const { urlAbsPath, addToLoads, checkAllLoadsDone, checkHit } = utils

const WIDTH = 800
const HEIGHT = 600
const FPS = 60  // hardcoded in Twojs
// const ICON_SIZE = 30
const BACKGROUND_COLOR = "#111"

let Game = null


function startGame(wrapperEl, gameWs) {

    Game = utils.newTwo(wrapperEl, WIDTH, HEIGHT, {
      backgroundColor: BACKGROUND_COLOR
    })
  
    //pauseGame(true)
  
    // const pointer = newPointer(Game)

    Game.roomId = gameWs.roomId
    Game.joypadUrl = gameWs.joypadUrl

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

  scn.setStep = function(step) {
    this.step = step
    if(step === "LOADING") {
      this.loadingTxts = addTo(this, newGroup())
      addTo(this.loadingTxts, new Two.Text(
        "LOADING...",
        WIDTH / 2, HEIGHT / 2, { fill: "white", size: 20 }
      ))
    } else if(step === "INTRO") {
      this.loadingTxts.remove()
      this.introTexts = addTo(this, newGroup())
      const textArgs = { size: 24, fill: "black", alignment: "center", baseline: "top" }
      addTo(this.introTexts, new Two.Text(
        "Basic Example",
        WIDTH / 2, HEIGHT / 3,
        { ...textArgs, size: 50 }
      ))
      addTo(this.introTexts, new Two.Text(
        "Join the game:",
        WIDTH / 2, HEIGHT / 2,
        textArgs
      ))
      addTo(this.introTexts, new Two.Text(
        Game.joypadUrl,
        WIDTH / 2, HEIGHT / 2 + 36,
        textArgs
      ))
    } else if(step === "GAME") {
      this.introTexts.remove()
    }
  }
  scn.setStep("LOADING")

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
    for(const playerId in players) if(!this.getHero(playerId)) this.addHero(playerId)
    for(const hero in this.heros.children) if(!players[hero.playerId]) this.rmHero(hero.playerId)
  }

  // background
  const background = addTo(scn, new Two.Sprite(
    urlAbsPath("assets/background.jpg"),
    WIDTH / 2, HEIGHT / 2,
  ))
  background.scale = 2.5

  // heros

  scn.heros = addTo(scn, newGroup())

  scn.addHero = function(playerId) {
    const hero = addTo(this.heros, newHero(
      playerId,
      (.25 + .5 * random()) * WIDTH,
      (.25 + .5 * random()) * HEIGHT,
      Game.players[playerId].name,
      Game.players[playerId].color
    ))
  }
  scn.getHero = function(playerId) {
    const res = this.heros.children.filter(h => h.playerId === playerId)
    return res ? res[0] : null
  }
  scn.rmHero = function(playerId) {
    const hero = this.getHero(playerId)
    if(hero) hero.remove()
  }

  scn.stars = addTo(scn, newGroup())
  scn.nextStarTime = 0

  scn.update = function(time) {
    propagUpdate.call(this, time)
    if(this.step === "LOADING") {
      if(checkAllLoadsDone()) this.setStep("INTRO")
    } else if(this.step === "GAME") {
      if(time > this.nextStarTime) {
        addTo(this.stars, newStar(random() > .5, HEIGHT * random()))
        this.nextStarTime = time + 1
      }
      for(const hero of this.heros.children) {
        for(const star of this.stars.children) {
          if(checkHit(hero, star)) {
            addTo(this, newNotif(
              (hero.score ? `${hero.score} ` : "") + "+ 1",
              star.translation.x, star.translation.y - 20
            ))
            star.remove()
            hero.score += 1
          }
        }
      }
    }
  }

  // input

  scn.handleInput = function(playerId, kwargs) {
    const hero = this.getHero(playerId)
    if(!hero) return
    hero.handleInput(kwargs)
    if(this.step === "INTRO") this.setStep("GAME")
  }

  // music.replay()

  return scn
}


const heroCanvas = {
  base: addToLoads(utils.newCanvasFromSrc(urlAbsPath("assets/hero.png"))),
  get: function(color) {
    if(!this.colored) {
      this.colored = utils.cloneCanvas(this.base)
      utils.colorizeCanvas(this.colored, color)
    }
    return this.colored
  }
}


function newHero(playerId, x, y, name, color) {
  const hero = newGroup()
  hero.playerId = playerId

  hero.translation.x = x
  hero.translation.y = y
  hero.width = 50
  hero.height = 50
  hero.spdX = 200 * (random() > .5 ? 1 : -1)
  hero.spdY = 200 * (random() > .5 ? 1 : -1)
  hero.score = 0

  const img = addTo(hero, new Two.ImageSequence([
    new Two.Texture(heroCanvas.get(color)),
  ], 0, 0))
  img.scale = 50 / 100

  addTo(hero, new Two.Text(
    name,
    0, 40,
    { fill: "black", size: 20 }
  ))

  hero.update = function(time) {
    this.translation.x += this.spdX / FPS
    this.translation.y += this.spdY/ FPS
    const { x, y } = this.translation
    const { spdX, spdY } = this
    const w2 = this.width / 2, h2 = this.height / 2
    if((spdX > 0 && x > WIDTH - w2) || (spdX < 0 && x < w2)) {
      this.spdX = -spdX
    }
    if((spdY > 0 && y > HEIGHT - h2) || (spdY < 0 && y < h2)) {
      this.spdY = -spdY
    }
  }

  hero.handleInput = function(input) {
    hero.spdX = abs(hero.spdX) * (input.dir === 0 ? -1 : 1)
  }

  return hero
}


function newStar(dir, y) {
  const star = new Two.Sprite(
    urlAbsPath("assets/star.png"),
    dir ? WIDTH + 50 : -50, y
  )
  star.width = star.height = 80
  star.scale = 80 / 100

  star.spdX = dir ? -100 : 100

  star.update = function(time) {
    this.translation.x += this.spdX / FPS
    if((this.x < -50 && this.spdX < 0) || (this.x > WIDTH + 50 && this.spdX > 0)) this.remove()
  }

  star.getHitBox = function() {
    const width = this.width * .6
    const height = this.height * .6
    return {
      left: star.translation.x - width/2,
      top: star.translation.y - height/2,
      width,
      height,
    }
  }

  return star
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


function newNotif(txt, x, y) {
  const notif = new Two.Text(
    txt, x, y,
    { size: 20 }
  )
  notif.update = function(time) {
    this.translation.y -= 50 / FPS
    this.removeTime ||= time + 1
    if(time > this.removeTime) this.remove()
  }
  return notif
}


export { startGame }