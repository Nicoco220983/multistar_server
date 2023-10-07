#!/usr/bin/env node
const { join, dirname } = require("path")
const fs = require("fs")
const child_process = require("child_process")

function main() { 
    if (process.argv.length === 2) console.error('Expected at least one argument!') && process.exit(1)
    const pkgSpec = process.argv[2]
    installGame(pkgSpec)
}

function installGame(pkgSpec) {
    const pkgName = getPkgName(pkgSpec)
    installPkg(pkgSpec)
    const gameKey = getGameKey(pkgName)
    forceSymlinkSync(
        join(dirname(require.resolve(pkgName)), "public"),
        join(__dirname, "../public/game", gameKey)
    )
    console.log(`\nGame '${gameKey}' installed !`)
}

function getPkgName(pkgSpec) {
    const child = child_process.spawnSync("npm", ["view", "-json", pkgSpec])
    return JSON.parse(child.stdout).name
}

function installPkg(pkgSpec) {
    child_process.spawnSync("npm", ["install", "--no-save", pkgSpec], {
        stdio: ["pipe", process.stdout, process.stderr]
    })
}

function getGameKey(pkgName) {
    const gameCfgPath = require.resolve(pkgName)
    return JSON.parse(fs.readFileSync(gameCfgPath)).key
}

function forceSymlinkSync(target, path) {
    try {
        fs.unlinkSync(path)
    } catch(err) {
        if(err.code !== 'ENOENT') throw err
    } 
    fs.symlinkSync(target, path)
}


if (require.main === module) main()
