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
    const { width, height } = canvas
    const res = document.createElement("canvas")
    assign(res, { width, height })
    const ctx = res.getContext("2d")
    if(kwargs.flipX) {
        ctx.translate(width, 0)
        ctx.scale(-1, 1)
    }
    if(kwargs.flipY) {
        ctx.translate(height, 0)
        ctx.scale(1, -1)
    }
    ctx.drawImage(canvas, 0, 0, width, height)
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


// function newFullscreenIcon(scnGraph, kwargs) {
//     const x = (kwargs && kwargs.x) || 0
//     const y = (kwargs && kwargs.y) || 0
//     const size = (kwargs && kwargs.size) || 50
//     const icon = scnGraph.makeSprite(
//         urlAbsPath('assets/fullscreen-icon.png'),
//         x, y,
//         2, 1,
//     )
//     icon.scale = size/50
//     icon.click = () => {
//         if(!document.fullscreenElement) {
//             const wrapperEl = scnGraph.renderer.domElement.parentElement
//             wrapperEl.parentElement.requestFullscreen()
//         } else {
//             document.exitFullscreen()
//         }
//     }
//     document.addEventListener("fullscreenchange", () => {
//         icon.visible = document.fullscreenElement ? false : true
//     })
//     return icon
// }


export {
    urlAbsPath,
    newTwo,
    newPointer,
    addToLoads,
    newCanvas,
    newCanvasFromSrc,
    cloneCanvas,
    colorizeCanvas,
    checkAllLoadsDone,
    // newFullscreenIcon,
    checkHit,
}