class GamesMenu extends HTMLElement {

    connectedCallback() {
        this.initContent()
        this.fetchGames()
    }

    initContent() {
        this.innerHTML = `
            <template class="gametmpl">
                <div class="game">
                    <p class="title"></p>
                    <p class="description"></p>
                    <img class="icon">
                </div>
            </template>
            <div class="games"></div>
        `
        this.gameTmpl = this.querySelector(".gametmpl")
        this.gamesEl = this.querySelector(".games")
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
        gameEl.querySelector(".icon").src = `/games/${gameKey}/icon.jpg`
        gameEl.querySelector(".game").onclick = () => this.onSelect(gameKey, game)
        return gameEl
    }

    onSelect() {}
}
customElements.define("games-menu", GamesMenu)  