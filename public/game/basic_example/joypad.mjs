const { min } = Math

import { urlAbsPath, newTwo, newPointer, addToLoads, checkAllLoadsDone, newCanvas, newCanvasFromSrc, checkHit } from './utils.mjs'

const WIDTH = 800
const HEIGHT = 450
const FPS = 60  // hardcoded in Twojs
// const ICON_SIZE = 50
const BACKGROUND_COLOR = "#111"

let Joypad = null


function startJoypad(wrapperEl, sendInput) {

    Joypad = newTwo(wrapperEl, WIDTH, HEIGHT, {
      backgroundColor: BACKGROUND_COLOR
    })
  
    //pauseGame(true)
  
    const pointer = newPointer(Joypad)
  
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

    Joypad.sendInput = sendInput
  
    // document.addEventListener("blur", () => pauseGame(true))
    
    Joypad.play()
}


function newJoypadScene() {

  const scn = newGroup()

  scn.setStep = function(step) {
    this.step = step
    if(step === "LOADING") {
      this.loadingTxts = addTo(this, newGroup())
      addTo(this.loadingTxts, Joypad.makeText(
        "LOADING...",
        WIDTH / 2, HEIGHT / 2, { fill: "white", size: 20 }
      ))
    } else if(step === "JOYPAD") {
      this.loadingTxts.remove()
      this.buttons = addTo(this, newGroup())
      addTo(this.buttons, newArrowButton(0))
      addTo(this.buttons, newArrowButton(1))
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
    if(this.step === "JOYPAD" && !pointer.prevIsDown) {
      for(const button of this.buttons.children) {
        if(checkHit(pointer, button)) button.click()
      }
    }
  }

  scn.update = function(time) {
    if(this.step === "LOADING") {
      if(checkAllLoadsDone()) this.setStep("JOYPAD")
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

  return scn
}


// const canvas = document.createElement('canvas')
// canvas.width = canvas.height = 200
// const ctx = canvas.getContext("2d")
// ctx.fillStyle = "blue"
// ctx.fillRect(0, 0, canvas.width, canvas.height)
const arrowCanvas = addToLoads(newCanvasFromSrc(urlAbsPath("assets/joypad_arrow.png")))


function newArrowButton(dir) {
  const res = newGroup()
  res.translation.x = WIDTH / 4 * (dir ? 3 : 1)
  res.translation.y = HEIGHT / 2
  const img = addTo(res, Joypad.makeSprite(
    buildArrowImage(dir, "red"),
    0, 0,
  ))
  img.scale = min(WIDTH / 2, HEIGHT) / 200 * .8
  res.getHitBox = function() {
    return {
      left: dir ? WIDTH / 2 : 0,
      top: 0,
      width: WIDTH / 2,
      height: HEIGHT,
    }
  }
  res.click = function() {
    Joypad.sendInput({ dir })
  }
  return res
}

function buildArrowImage(dir, color) {
  const { width, height } = arrowCanvas
  const res = newCanvas(width, height)
  const ctx = res.getContext("2d")
  // flip x (if nedded)
  if(dir) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(arrowCanvas, 0, 0, width, height)
  // colorize
  const colorCanvas = newCanvas(width, height, color)
  const colorCtx = colorCanvas.getContext("2d")
  colorCtx.globalCompositeOperation = "destination-in"
  colorCtx.drawImage(res, 0, 0, width, height)
  ctx.globalCompositeOperation = "color"
  ctx.drawImage(colorCanvas, 0, 0, width, height)
  return new Two.Texture(res)
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