export default Object.freeze({

  SERVER_UPDATE_RATE: 30,
  CLIENT_FRAME_RATE: 60,  // hardcoded in two.js

  WIDTH: 500,
  HEIGHT: 800,

  ICON_SIZE: 50,

  BACKGROUND_COLOR: "#eee",

  MSG_KEY_LENGTH: 3,
  MSG_KEYS: {
    IDENTIFY_GAME: 'IDG',
    IDENTIFY_JOYPAD: 'IDJ',
    SET_GAME: 'SGM',
    SYNC_PLAYERS: "PLA",
    INPUT: 'INP',
  },
})
