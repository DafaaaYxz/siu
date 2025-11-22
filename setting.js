const chalk = require("chalk");
const fs = require("fs");

global.pairingNumber = "6285739115205"

global.owner = "6285736486023"
global.botname = "CentralGPT"
global.telegram = "https://t.me/LasmXx"
global.linkgroup = "https://t.me/LasmXx"

global.jedaPushkontak = 5000
global.jedaJpm = 4000

global.dana = "085736486023"
global.ovo = "Tidak tersedia"
global.gopay = "Tidak tersedia"
global.qris = "Tidak tersedia"

let file = require.resolve(__filename) 
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.white("• Update"), chalk.white(`${__filename}\n`))
delete require.cache[file]
require(file)
})
