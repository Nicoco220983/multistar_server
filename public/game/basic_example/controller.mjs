import { newTwo, newPointer } from './utils.mjs'

const WIDTH = 600
const HEIGHT = 400
const FPS = 60  // hardcoded in Twojs
// const ICON_SIZE = 50
const BACKGROUND_COLOR = "#111"

let Controller = null


function startController(wrapperEl, sendInput) {

    Controller = newTwo(wrapperEl, WIDTH, HEIGHT, {
      backgroundColor: BACKGROUND_COLOR
    })
  
    //pauseGame(true)
  
    const pointer = newPointer(Controller)
  
    Controller.controllerScns = Controller.makeGroup()
    Controller.getScene = () => Controller.controllerScns.children[0]
    Controller.addScene = function(scn) {
      const prevScn = Controller.getScene()
      if(prevScn) prevScn.remove()
      Controller.controllerScns.add(scn)
    }
    Controller.addScene(newControllerScene())
  
    // const icons = Controller.makeGroup()
    // const fullscreenIcon = addTo(icons, newFullscreenIcon(Controller, {
    //   x: WIDTH - ICON_SIZE*3/4,
    //   y: ICON_SIZE*3/4,
    //   size: ICON_SIZE,
    // }))
  
    pointer.prevIsDown = false
    Controller.bind("update", (frameCount, timeDelta) => {
      const time = frameCount / FPS
      const ctrlScn = Controller.getScene()
      if(pointer.isDown) {
        // if(collide(fullscreenIcon, pointer)) {
        //   if(!pointer.prevIsDown) fullscreenIcon.click()
        // } else {
            ctrlScn.click(pointer)
        // }
      }
      if(!Controller.paused) ctrlScn.update(time)
      pointer.prevIsDown = pointer.isDown
    })

    Controller.sendInput = sendInput
  
    // document.addEventListener("blur", () => pauseGame(true))
    
    Controller.play()
}


function newControllerScene() {

  const scn = Controller.makeGroup()

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
        Controller.sendInput({
            clicked: true
        })
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

  scn.texts = addTo(scn, Controller.makeGroup())
  addTo(scn.texts, Controller.makeText("Controller",
    WIDTH / 2, HEIGHT / 3,
    { fill: "white", alignment: "center", baseline: "top", size: 20 }
  ))

  // music.replay()

  return scn
}


function newHero(pos) {
  const hero = Controller.makeRectangle(pos.x, pos.y, 30, 30)
  hero.fill = "blue"
  return hero
}


// utils //////////////////////////


function addTo(group, obj) {
  group.add(obj)
  return obj
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


export { startController }