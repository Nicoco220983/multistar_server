// import Consts from './consts.mjs'

// let party = null

// function createParty(parentEl, gameKey) {
//     return new Promise((ok, ko) => {

//         party = {
//             gameKey
//         }

//         const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws'
//         const ws  = new WebSocket(`${socketProtocol}://${window.location.host}`)

//         ws.addEventListener('open', () => {
//             console.log('Connected to server!')
//             ws.send(Consts.MSG_KEYS.IDENTIFY + JSON.stringify({
//                 type: "party",
//                 gameKey,
//             }))
//         })

//         ws.addEventListener('message', evt => {
//             const key = evt.data.substring(0, Consts.MSG_KEY_LENGTH)
//             const data = evt.data.substring(Consts.MSG_KEY_LENGTH)
//             if(key === Consts.MSG_KEYS.IDENTIFY) handleIdentification(JSON.parse(data))
//         })

//         ws.addEventListener('close', () => location.reload())

//         ws.addEventListener('error', console.error)
//     })
// }

// function handleIdentification(kwargs) {
//     party.id = kwargs.partyId
//     console.log(`Created party '${party.id}'`)
// }

// export { createParty }