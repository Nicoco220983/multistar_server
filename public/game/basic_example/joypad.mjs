import { urlAbsPath, newTwo, newPointer } from './utils.mjs'

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
  
    Joypad.controllerScns = Joypad.makeGroup()
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

  const scn = Joypad.makeGroup()

  scn.buttons = newGroup()

  addTo(scn.buttons, newArrowButton(
    WIDTH/4, HEIGHT/2, 0
  ))
  addTo(scn.buttons, newArrowButton(
    WIDTH*3/4, HEIGHT/2, 1
  ))

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
    if(!pointer.prevIsDown) {
      for(const button of scn.buttons.children) {
        if(collide(pointer, button)) {
          button.click()
        }
      }
    }
  }

  scn.update = function(time) {}
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

  scn.texts = addTo(scn, Joypad.makeGroup())
  addTo(scn.texts, Joypad.makeText("Joypad",
    WIDTH / 2, HEIGHT / 3,
    { fill: "white", alignment: "center", baseline: "top", size: 20 }
  ))

  // music.replay()

  return scn
}


function newArrowButton(x, y, dir) {
  const res = Joypad.makeSprite(
    urlAbsPath('assets/joypad_arrow.png'),
    x, y,
    1, 1,
  )
  res.scale = HEIGHT / 50
  res.click = function() {
    Joypad.sendInput({ dir })
  }
  return res
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


function collide(obj1, obj2) {
  const rect1 = obj1.getBoundingClientRect()
  const x1 = rect1.left, y1 = rect1.top, w1 = rect1.width, h1 = rect1.height
  const rect2 = obj2.getBoundingClientRect()
  const x2 = rect2.left, y2 = rect2.top, w2 = rect2.width, h2 = rect2.height
  if(x1 > x2+w2 || x2 > x1+w1) return false
  if(y1 > y2+h2 || y2 > y1+h1) return false
  return true
}


export { startJoypad }