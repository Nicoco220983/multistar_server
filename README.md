# MultiStar Server

<p align="center">
  <img src="./static/logo.jpg" alt="MultiStar"/>
</p>

__MultiStar__ is a webserver, written in node, hosting local multiplayer games.

"Local multiplayer" means that all the players of a game play on the same screen in a same room, each with their own joypad. I believe that this "old-school" way of playing multiplayer games is more funny and friendly.

The joypads can be nothing more than a smartphone, connected to the game joypad webpage. Thus, no specific hardware is required, as almost everybody today has a smartphone.

## How to

### Install the server

```
npm install
```

### Install a game

Here we install a [Basic Example Game](https://github.com/Nicoco220983/multistar_basic_example_game) from GitHub.

This command can accept any kind of argument accepted by `npm install` (NPM package, GitHub link, local directory...).

```
npm run install_game -- https://github.com/Nicoco220983/multistar_basic_example_game
```

### Start the server

```
npm start
```
