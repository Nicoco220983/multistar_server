class GamesMenu extends HTMLElement {

    connectedCallback() {
        this.initContent()
        this.fetchGames()
    }

    initContent() {
        const shdw = this.attachShadow({ mode: "open" })
        shdw.innerHTML = `
            <style>
                #games {
                    display: inline-flex;
                    flex-direction: row;
                    gap: 1em;
                }
                .game {
                    display: flex;
                    flex-direction: column;
                    gap: .5em;
                    padding: .5em;
                    width: 10em;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 10px lightgrey;
                    cursor: pointer;
                }
                .game:hover {
                    box-shadow: 0 0 15px grey;
                }
                .title {
                    font-weight: bold;
                }
                .icon {
                    width: 8em;
                    height: 8em;
                }
            </style>
            <div id="games">
                <template id="gametmpl">
                    <div class="game">
                        <div class="title"></div>
                        <img class="icon">
                        <div class="description"></div>
                    </div>
                </template>
            </div>
        `
        this.gameTmpl = shdw.getElementById("gametmpl")
        this.gamesEl = shdw.getElementById("games")
    }

    fetchGames() {
        fetch("/games")
            .then(res => res.json())
            .then(res => {
                this.gamesEl.innerHTML = ""
                for(const [gameKey, game] of Object.entries(res.games)) {
                    this.gamesEl.appendChild(this.newGameEl(gameKey, game))
                }
            })
    }

    newGameEl(gameKey, game) {
        const gameEl = this.gameTmpl.content.cloneNode(true)
        gameEl.querySelector(".title").textContent = game.title
        gameEl.querySelector(".description").textContent = game.description
        const iconEl = gameEl.querySelector(".icon")
        iconEl.src = `/game/${gameKey}/icon.jpg`
        iconEl.onerror = () => iconEl.src='/default_game_icon.jpg'
        gameEl.querySelector(".game").onclick = () => this.onSelect(gameKey, game)
        return gameEl
    }

    onSelect() {}
}
customElements.define("games-menu", GamesMenu)  