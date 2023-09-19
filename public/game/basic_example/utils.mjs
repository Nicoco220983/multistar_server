const { assign } = Object


function urlAbsPath(relPath){
  const url = new URL(relPath, import.meta.url)
  return url.pathname
}


function newTwo(wrapperEl, width, height, kwargs) {

    const backgroundColor = (kwargs && kwargs.backgroundColor) || "black"

    const parentEl = wrapperEl.parentElement

    wrapperEl.style.aspectRatio = `${width}/${height}`
    function fillSpace() {
        const fitToWidth = (width/height > parentEl.clientWidth/parentEl.clientHeight)
        wrapperEl.style.width = fitToWidth ? "100%" : "auto"
        wrapperEl.style.height = fitToWidth ? "auto" : "100%"
    }
    fillSpace()
    window.addEventListener("resize", fillSpace)

    const two = new Two({
        type: Two.Types.webgl,
        width: width,
        height: height,
    }).appendTo(wrapperEl)
    assign(two.renderer.domElement.style, {
        width: "100%",
        height: "100%",
        backgroundColor,
    })

    return two
}


function newPointer(scnGraph) {

    const pointer = {}
    const el = scnGraph.renderer.domElement

    function _getMousePos(el, evt) {
        const pos = evt.changedTouches ? evt.changedTouches[0] : evt
        const rect = el.getBoundingClientRect()
        return {
            x: (pos.clientX - rect.left) * scnGraph.width / rect.width,
            y: (pos.clientY - rect.top) * scnGraph.height / rect.height,
        }
    }

    for(const key of ["mousemove", "touchmove"]) {
        el.addEventListener(key, evt => assign(pointer, _getMousePos(el, evt)))
    }
    for(const key of ["mousedown", "touchstart"]) {
        el.addEventListener(key, evt => assign(pointer, {
        isDown: true,
        ..._getMousePos(el, evt),
        }))
    }
    for(const key of ["mouseup", "touchend"]) {
        el.addEventListener(key, () => pointer.isDown = false)
    }

    return pointer
}


const Loads = []

function addToLoads(obj) {
    Loads.push(obj)
    return obj
}

function checkAllLoadsDone() {
    for(const o of Loads)
        if(!o.loaded)
            return false
    Loads.length = 0
    return true
}

function newCanvas(width, height, color) {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    if(color) {
        const ctx = canvas.getContext("2d")
        ctx.fillStyle = color
        ctx.fillRect(0, 0, width, height)
    }
    return canvas
}

function newCanvasFromSrc(src) {
    const canvas = document.createElement("canvas")
    const img = document.createElement("img")
    img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.loaded = true
    }
    img.onerror = console.error
    img.src = src
    // _enrichCanvas(canvas)
    return canvas
}

function cloneCanvas(canvas, kwargs) {
    const flipX = (kwargs && kwargs.flipX) || false
    const flipY = (kwargs && kwargs.flipY) || false
    const scaleX = (kwargs && kwargs.scaleX) || 1
    const scaleY = (kwargs && kwargs.scaleY) || 1
    const numCol = (kwargs && kwargs.col && kwargs.col[0]) || 0
    const nbCols = (kwargs && kwargs.col && kwargs.col[1]) || 1
    const numRow = (kwargs && kwargs.row && kwargs.row[0]) || 0
    const nbRows = (kwargs && kwargs.row && kwargs.row[1]) || 1
    const width = canvas.width * scaleX / nbCols
    const height = canvas.height * scaleY / nbRows
    const res = document.createElement("canvas")
    assign(res, { width, height })
    const ctx = res.getContext("2d")
    if(flipX) {
        ctx.translate(width, 0)
        ctx.scale(-1, 1)
    }
    if(flipY) {
        ctx.translate(0, height)
        ctx.scale(1, -1)
    }
    if(numCol !== 0) ctx.translate(-width * numCol, 0)
    if(numRow !== 0) ctx.translate(0, -height * numRow)
    if(scaleX !== 1) ctx.scale(scaleX, 1)
    if(scaleY !== 1) ctx.scale(1, scaleY)
    ctx.drawImage(canvas, 0, 0)
    return res
}

function colorizeCanvas(canvas, color) {
    const { width, height } = canvas
    const colorCanvas = newCanvas(width, height, color)
    const colorCtx = colorCanvas.getContext("2d")
    colorCtx.globalCompositeOperation = "destination-in"
    colorCtx.drawImage(canvas, 0, 0, width, height)
    const ctx = canvas.getContext("2d")
    ctx.globalCompositeOperation = "color"
    ctx.drawImage(colorCanvas, 0, 0, width, height)
    ctx.globalCompositeOperation = "source-over"
}

function addCanvas(canvas, canvas2, x=0, y=0) {
    const ctx = canvas.getContext("2d")
    ctx.drawImage(canvas2, x, y)
}

function getHitBox(obj) {
    if(obj.getHitBox) return obj.getHitBox()
    if(obj.getBoundingClientRect) return obj.getBoundingClientRect()
    const { x, y, width = 0, height = 0 } = obj
    return {
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
    }
}

function checkHit(obj1, obj2) {
    const { left: l1, top: t1, width: w1, height: h1 } = getHitBox(obj1)
    const { left: l2, top: t2, width: w2, height: h2 } = getHitBox(obj2)
    return l1 < l2 + w2 && l2 < l1 + w1 && t1 < t2 + h2 && t2 < t1 + h1
}


class Group extends Two.Group {
    update(time) {
        this.children.forEach(s => s.update && s.update(time))
    }
}


class GameAudio extends Audio {
  constructor(src, kwargs) {
    super(src)
    this.preload = "auto"
    assign(this, kwargs)
    this.oncanplaythrough = () => this.loaded = true
  }
  play(kwargs) {
    this.loop = (kwargs && kwargs.loop) === true
    super.play()
  }
  replay() {
    this.pause()
    this.currentTime = 0
    this.play()
  }
}


export {
    urlAbsPath,
    newTwo,
    newPointer,
    addToLoads,
    newCanvas,
    newCanvasFromSrc,
    cloneCanvas,
    colorizeCanvas,
    addCanvas,
    checkAllLoadsDone,
    // newFullscreenIcon,
    checkHit,
    Group,
    GameAudio,
}