const { min } = Math

import * as utils from './utils.mjs'
const { urlAbsPath, addToLoads, checkAllLoadsDone, checkHit } = utils

const WIDTH = 800
const HEIGHT = 450
const FPS = 60  // hardcoded in Twojs
// const ICON_SIZE = 50
const BACKGROUND_COLOR = "#111"

let Joypad = null


function startJoypad(wrapperEl, playerWs) {

    Joypad = utils.newTwo(wrapperEl, WIDTH, HEIGHT, {
      backgroundColor: BACKGROUND_COLOR
    })

    Joypad.handleGameInput = function(kwargs) {
      const scn = this.getScene()
      if(scn) scn.handleGameInput(kwargs)
    }

    Joypad.player = playerWs.player
    Joypad.sendInput = playerWs.sendInput
  
    //pauseGame(true)
  
    const pointer = utils.newPointer(Joypad)
  
    Joypad.controllerScns = newGroup()
    Joypad.getScene = () => Joypad.controllerScns.children[0]
    Joypad.addScene = function(scn) {
      const prevScn = Joypad.getScene()
      if(prevScn) prevScn.remove()
      Joypad.controllerScns.add(scn)
    }
    Joypad.addScene(newJoypadScene())
  
    // const icons = Joypad.makeGroup()
    // const fullscreenIcon = addTo(icons, newFullscreenIcon(Joypad, {
    //   x: WIDTH - ICON_SIZE*3/4,
    //   y: ICON_SIZE*3/4,
    //   size: ICON_SIZE,
    // }))
  
    pointer.prevIsDown = false
    Joypad.bind("update", (frameCount, timeDelta) => {
      const time = frameCount / FPS
      const scn = Joypad.getScene()
      if(pointer.isDown) {
        // if(collide(fullscreenIcon, pointer)) {
        //   if(!pointer.prevIsDown) fullscreenIcon.click()
        // } else {
          scn.click(pointer)
        // }
      }
      if(!Joypad.paused) scn.update(time)
      pointer.prevIsDown = pointer.isDown
    })
  
    // document.addEventListener("blur", () => pauseGame(true))
    
    Joypad.play()

    return Joypad
}


function newJoypadScene() {

  const scn = newGroup()

  scn.setStep = function(step) {
    if(step === this.step) return console.warning(`Step is already '${step}'`)
    this.step = step
    if(step === "LOADING") {
      this.loadingTxts = addTo(this, newGroup())
      addTo(this.loadingTxts, Joypad.makeText(
        "LOADING...",
        WIDTH / 2, HEIGHT / 2, { fill: "white", size: 20 }
      ))
    } else if(step === "INTRO") {
      this.loadingTxts.remove()
      this.arrowButtons = addTo(this, newGroup())
      addTo(this.arrowButtons, newArrowButton(0))
      addTo(this.arrowButtons, newArrowButton(1))
      this.readyButton = addTo(this, newReadyButton(WIDTH/2, 75))
    } else if(step === "JOYPAD") {
      this.readyButton.remove()
    }
  }
  scn.setStep("LOADING")

  // scn.step = "GAME"

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

  scn.click = function(pointer) {
    if(this.step === "INTRO") {
      if(checkHit(pointer, this.readyButton)) {
        this.readyButton.click(pointer)
        return
      }
    }
    if(this.step === "INTRO" || this.step === "JOYPAD") {
      for(const button of this.arrowButtons.children) {
        if(checkHit(pointer, button)) button.click(pointer)
      }
    }
  }

  scn.update = function(time) {
    propagUpdate.call(this, time)
    if(this.step === "LOADING") {
      if(checkAllLoadsDone()) this.setStep("INTRO")
    }
  }
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

  // music.replay()

  scn.handleGameInput = function(kwargs) {
    if(kwargs.step === "GAME") {
      this.setStep("JOYPAD")
    }
  }

  return scn
}


const arrowCanvas = {
  base: addToLoads(utils.newCanvasFromSrc(urlAbsPath("assets/joypad_arrow.png"))),
  baseClicked: addToLoads(utils.newCanvasFromSrc(urlAbsPath("assets/joypad_arrow_clicked.png"))),
  get: function(dir, clicked, color) {
    const key = `trans:${dir},${clicked}`
    if(!this[key]) {
      const base = clicked ? this.baseClicked : this.base
      this[key] = utils.cloneCanvas(base, { flipX: (dir === 1)})
      if(color) utils.colorizeCanvas(this[key], color)
    }
    return this[key]
  }
}


function newArrowButton(dir) {
  const res = newGroup()
  res.translation.x = WIDTH / 4 * (dir ? 3 : 1)
  res.translation.y = HEIGHT / 2
  const img = addTo(res, Joypad.makeImageSequence([
    new Two.Texture(arrowCanvas.get(dir, false, Joypad.player.color)),
    new Two.Texture(arrowCanvas.get(dir, true, Joypad.player.color)),
  ], 0, 0))
  img.scale = min(WIDTH / 2, HEIGHT) / 200 * .8
  res.lastClickTime = -1
  res.update = function(time) {
    this.time = time
    img.index = this.time > this.lastClickTime + .1 ? 0 : 1
  }
  res.getHitBox = function() {
    return {
      left: dir ? WIDTH / 2 : 0,
      top: 0,
      width: WIDTH / 2,
      height: HEIGHT,
    }
  }
  res.click = function(pointer) {
    this.lastClickTime = this.time
    if(!pointer.prevIsDown) Joypad.sendInput({ dir })
  }
  return res
}


function newReadyButton(x, y) {
  const button = new Two.Sprite(
    urlAbsPath("assets/ready_buttons.png"),
    x, y,
    2, 1,
  )
  button.scale = 250 / 250
  button.ready = false
  button.click = function(pointer) {
    if(!pointer.prevIsDown) {
      this.ready = !this.ready
      this.index = this.ready ? 1 : 0
      Joypad.sendInput({ ready: this.ready })
    }
  }
  return button
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
  const group = Joypad.makeGroup()
  group.update = propagUpdate
  return group
}


export { startJoypad }