const { assign } = Object


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

    // necessary for collision detection
    pointer.getBoundingClientRect = function() {
        return {
        left: this.x,
        top: this.y,
        width: 0,
        height: 0,
        }
    }

    return pointer
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


function urlAbsPath(relPath){
  const url = new URL(relPath, import.meta.url)
  return url.pathname
}


export {
    newTwo,
    newPointer,
    // newFullscreenIcon,
    urlAbsPath,
}