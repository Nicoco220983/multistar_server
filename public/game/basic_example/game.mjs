const { abs, min, atan2, PI, random } = Math

import * as utils from './utils.mjs'
const { urlAbsPath, addToLoads, checkAllLoadsDone, checkHit } = utils

const WIDTH = 800
const HEIGHT = 600
const FPS = 60  // hardcoded in Twojs
const BACKGROUND_COLOR = "#111"

const HERO_PARALYSIS_DUR = 2
const VICTORY_SCORE = 20

let Game = null


function startGame(wrapperEl, gameWs) {

    Game = utils.newTwo(wrapperEl, WIDTH, HEIGHT, {
      backgroundColor: BACKGROUND_COLOR
    })

    Game.roomId = gameWs.roomId
    Game.joypadUrl = gameWs.joypadUrl
    Game.sendInput = gameWs.sendInput

    Game.players = {}
    Game.syncPlayers = function(players) {
      try {
        this.players = players
        this.getScene().syncPlayers()
      } catch(err) {
        console.log(err)
      }
    }

    Game.handleJoypadInput = function(playerId, kwargs) {
      try {
        this.getScene().handleJoypadInput(playerId, kwargs)
      } catch(err) {
        console.log(err)
      }
    }
  
    Game.gameScns = addTo(Game, newGroup())
    Game.getScene = () => Game.gameScns.children[0]
    Game.addScene = function(scn) {
      const prevScn = this.getScene()
      if(prevScn) prevScn.remove()
      this.gameScns.add(scn)
      if(this.players) scn.syncPlayers(this.players)
    }
    Game.addScene(newGameScene())
  
    Game.bind("update", (frameCount, timeDelta) => {
      const time = frameCount / FPS
      const gameScn = Game.getScene()
      if(!Game.paused) gameScn.update(time)
    })
    
    Game.play()

    return Game
}


function newGameScene() {

  const scn = newGroup()
  scn.notifs = addTo(scn, newGroup())

  scn.background = addTo(scn, newGroup())
  scn.stars = addTo(scn, newGroup())
  scn.monsters = addTo(scn, newGroup())
  scn.heros = addTo(scn, newGroup())
  scn.notifs = addTo(scn, newGroup())

  scn.setStep = function(step) {
    if(step === this.step) return
    this.step = step
    if(step === "LOADING") {
      this.addLoadingTexts()
    } else if(step === "INTRO") {
      this.loadingTexts.remove()
      this.addBackground()
      this.syncPlayers()
      this.addIntroTexts()
    } else if(step === "GAME") {
      this.introTexts.remove()
      this.scoresPanel = addTo(this.notifs, newScoresPanel(this.heros.children, 5))
      Game.sendInput({ step: "GAME" })
    } else if(step === "VICTORY") {
      this.addVictoryTexts()
      Game.sendInput({ step: "VICTORY" })
    }
  }

  scn.update = function(time) {
    const { step } = this
    if(step === "LOADING") {
      if(checkAllLoadsDone()) this.setStep("INTRO")
    }
    if(step === "INTRO" || step === "GAME") {
      this.monsters.update(time)
      this.stars.update(time)
      this.heros.update(time)
    }
    if(step === "GAME") {
      this.mayAddStar(time)
      this.mayAddMonster(time)
      this.checkHerosStarsHit(time)
      this.checkHerosMonstersHit(time)
      this.checkHerosHerosHit()
    }
    this.notifs.update(time)
  }

  scn.addLoadingTexts = function() {
    this.loadingTexts = addTo(this.notifs, newGroup())
    addTo(this.loadingTexts, new Two.Text(
      "LOADING...",
      WIDTH / 2, HEIGHT / 2, { fill: "white", size: 20 }
    ))
  }

  scn.addBackground = function() {
    const background = addTo(this.background, new Two.Sprite(
      urlAbsPath("assets/background.jpg"),
      WIDTH / 2, HEIGHT / 2,
    ))
    background.scale = 2.5
  }

  scn.addIntroTexts = function() {
    this.introTexts = addTo(this.notifs, newGroup())
    const textArgs = { size: 30, fill: "black", alignment: "center", baseline: "top" }
    addTo(this.introTexts, new Two.Text(
      "BASIC EXAMPLE",
      WIDTH / 2, HEIGHT / 3,
      { ...textArgs, size: 60 }
    ))
    addTo(this.introTexts, new Two.Text(
      "Join the game:",
      WIDTH / 2, HEIGHT / 2,
      { ...textArgs, size: 40 }
    ))
    addTo(this.introTexts, new Two.Text(
      Game.joypadUrl,
      WIDTH / 2, HEIGHT / 2 + 50,
      textArgs
    ))
  }

  scn.syncPlayers = function() {
    if(this.step === "LOADING") return
    for(const playerId in Game.players) if(!this.getHero(playerId)) this.addHero(playerId)
    for(const hero of this.heros.children) if(!Game.players[hero.playerId]) this.rmHero(hero.playerId)
  }
  scn.addHero = function(playerId) {
    addTo(this.heros, newHero(
      playerId,
      (.25 + .5 * random()) * WIDTH,
      (.25 + .5 * random()) * HEIGHT,
    ))
  }
  scn.getHero = function(playerId) {
    const res = this.heros.children.filter(h => h.playerId === playerId)
    return res ? res[0] : null
  }
  scn.rmHero = function(playerId) {
    this.getHero(playerId).remove()
  }

  scn.nextStarTime = 0
  scn.mayAddStar = function(time) {
    if(time > this.nextStarTime) {
      addTo(this.stars, newStar(random() > .5, HEIGHT * random()))
      this.nextStarTime = time + 1
    }
  }

  scn.nextMonsterTime = 0
  scn.mayAddMonster = function(time) {
    if(time > this.nextMonsterTime) {
      addTo(this.monsters, newMonster(random() > .5, HEIGHT * random()))
      this.nextMonsterTime = time + 5
    }
  }

  scn.checkHerosStarsHit = function(time) {
    for(const hero of this.heros.children) {
      if(!hero.isParalysed(time)) {
        for(const star of this.stars.children) {
          if(checkHit(hero, star)) {
            addTo(this.notifs, newNotif(
              (hero.score ? `${hero.score} ` : "") + "+ 1",
              star.translation.x, star.translation.y,
              { fill: "gold" }
            ))
            star.remove()
            hero.score += 1
            this.scoresPanel.syncScores()
            if(hero.score >= VICTORY_SCORE) {
              this.winnerHero = hero
              this.setStep("VICTORY")
            }
          }
        }
      }
    }
  }

  scn.checkHerosMonstersHit = function(time) {
    for(const hero of this.heros.children) {
      for(const monster of this.monsters.children) {
        if(checkHit(hero, monster)) {
          hero.onMonsterHit(time)
        }
      }
    }
  }

  scn.checkHerosHerosHit = function() {
    const heros = this.heros.children
    for(let i=0; i<heros.length; ++i) {
      for(let j=i+1; j<heros.length; ++j) {
        const hero1 = heros[i], hero2 = heros[j]
        if(checkHit(hero1, hero2)) {
          hero1.onHeroHit(hero2)
          hero2.onHeroHit(hero1)
        }
      }
    }
  }

  scn.addVictoryTexts = function() {
    const player = Game.players[this.winnerHero.playerId]
    const txtArgs = { fill: "black" }
    this.victoryTexts = addTo(this.notifs, newGroup())
    addTo(this.victoryTexts, new Two.Text(
      "VICTORY !",
      WIDTH / 2, HEIGHT / 3,
      { ...txtArgs, size: 80 }
    ))
    addTo(this.victoryTexts, new Two.Text(
      `Winner: ${player.name}`,
      WIDTH / 2, HEIGHT / 2,
      { ...txtArgs, size: 40 }
    ))
  }

  scn.handleJoypadInput = function(playerId, kwargs) {
    const hero = this.getHero(playerId)
    hero.handleJoypadInput(kwargs)
    if(kwargs.ready !== undefined) {
      if(this.step === "INTRO") this.setHeroReady(hero, kwargs.ready)
    }
    if(kwargs.restart) {
      if(this.step === "VICTORY") this.restart()
    }
  }

  scn.setHeroReady = function(hero, ready) {
    hero.ready = ready
    if(this.step === "INTRO") {
      let allReady = true
      for(const h of this.heros.children) allReady &= h.ready
      if(allReady) this.setStep("GAME")
    }
  }

  scn.restart = function() {
    Game.addScene(newGameScene())
    Game.sendInput({ restart: true })
  }

  scn.setStep("LOADING")

  return scn
}


const heroCanvas = {
  base: addToLoads(utils.newCanvasFromSrc(urlAbsPath("assets/hero.png"))),
  get: function(color) {
    const key = `trans:${color}`
    if(!this[key]) {
      this[key] = utils.cloneCanvas(this.base)
      utils.colorizeCanvas(this[key], color)
    }
    return this[key]
  }
}


function newHero(playerId, x, y) {
  const hero = newGroup()
  hero.playerId = playerId
  const player = Game.players[playerId]
  const { name, color } = player

  hero.translation.x = x
  hero.translation.y = y
  hero.width = hero.height = 80
  hero.spdX = 200 * (random() > .5 ? 1 : -1)
  hero.spdY = 200 * (random() > .5 ? 1 : -1)
  hero.score = 0
  hero.paralysisEndTime = 0

  const img = addTo(hero, new Two.ImageSequence([
    new Two.Texture(heroCanvas.get(color)),
  ], 0, 0))
  img.scale = 80 / 100

  addTo(hero, new Two.Text(
    name,
    0, 60,
    { fill: "black", size: 30 }
  ))

  hero.update = function(time) {
    if(!this.isParalysed(time)) {
      this.visible = true
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
    } else {
      this.visible = (time * 4) % 1 > .5
    }
  }

  hero.getHitBox = function() {
    const { width, height } = this
    return {
      left: this.translation.x - width/2,
      top: this.translation.y - height/2,
      width,
      height,
    }
  }

  hero.onHeroHit = function(hero2) {
    const { x: x1, y: y1 } = this.translation
    const { x: x2, y: y2 } = hero2.translation
    const hitAngle = atan2(y2 - y1, x2 - x1) / PI
    if(hitAngle >= -.25 && hitAngle <= .25) {
      this.spdX = -abs(this.spdX)
    }
    else if(hitAngle > .25 && hitAngle <= .75) {
      this.spdY = -abs(this.spdY)
    }
    else if(hitAngle >= -.75 && hitAngle < -.25) {
      this.spdY = abs(this.spdY)
    }
    else if(hitAngle > .75 || hitAngle < -.75) {
      this.spdX = abs(this.spdX)
    }
  }

  hero.onMonsterHit = function(time) {
    if(this.isParalysed()) return
    this.paralysisEndTime = time + HERO_PARALYSIS_DUR
  }

  hero.isParalysed = function(time) {
    return time < this.paralysisEndTime
  }

  hero.handleJoypadInput = function(kwargs) {
    if(kwargs.dir !== undefined) {
      hero.spdX = abs(hero.spdX) * (kwargs.dir === 0 ? -1 : 1)
    }
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
    const width = this.width * .4
    const height = this.height * .4
    return {
      left: this.translation.x - width/2,
      top: this.translation.y - height/2,
      width,
      height,
    }
  }

  return star
}

function newMonster(dir, y) {
  const monster = new Two.Sprite(
    urlAbsPath("assets/monster.png"),
    dir ? WIDTH + 50 : -50, y
  )
  monster.width = monster.height = 80
  monster.scale = 80 / 50

  monster.spdX = dir ? -100 : 100

  monster.update = function(time) {
    this.translation.x += this.spdX / FPS
    if((this.x < -50 && this.spdX < 0) || (this.x > WIDTH + 50 && this.spdX > 0)) this.remove()
  }

  monster.getHitBox = function() {
    const width = this.width * .7
    const height = this.height * .7
    return {
      left: this.translation.x - width/2,
      top: this.translation.y - height/2,
      width,
      height,
    }
  }

  return monster
}

function newScoresPanel(heros, maxNbScores) {
  const panel = newGroup()
  panel.nbScores = min(maxNbScores, heros.length)
  panel.heros = heros

  panel.translation.x = 10
  panel.translation.y = 10
  panel.width = 160
  panel.height = (panel.nbScores) * 25 + 15

  const background = addTo(panel, new Two.Rectangle(panel.width/2, panel.height/2, panel.width, panel.height))
  background.fill = 'rgba(0, 0, 0, 0.2)'

  panel.scoreTexts = addTo(panel, newGroup())
  for(let i=0; i<panel.nbScores; ++i) {
    addTo(panel.scoreTexts, new Two.Text(
      "",
      panel.width/2, 20 + i * 25,
      { fill: "black", size: 24 }
    ))
  }

  panel.syncScores = function() {
    const sortedHeros = [...this.heros]
    sortedHeros.sort((h1, h2) => {
      if(h1.score > h2.score) return -1
      if(h1.score < h2.score) return 1
      const p1 = Game.players[h1.playerId]
      const p2 = Game.players[h1.playerId]
      if(p1.name > p2.name) return -1
      if(p1.name < p2.name) return 1
      return 0
    })
    for(let i=0; i<this.nbScores; ++i) {
      let txt = ""
      if(i < sortedHeros.length) {
        const hero = sortedHeros[i]
        const player = Game.players[hero.playerId]
        txt = `${player.name}: ${hero.score}`
      }
      this.scoreTexts.children[i].value = txt
    }
  }
  panel.syncScores()

  return panel
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
  const group = new Two.Group()
  group.update = propagUpdate
  return group
}


function newNotif(txt, x, y, textKwargs) {
  const notif = new Two.Text(
    txt, x, y,
    { size: 30, ...textKwargs }
  )
  notif.update = function(time) {
    this.translation.y -= 50 / FPS
    this.removeTime ||= time + 1
    if(time > this.removeTime) this.remove()
  }
  return notif
}


export { startGame }