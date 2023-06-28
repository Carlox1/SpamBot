const fs = require("fs");
const mineflayer = require("mineflayer");
let lobbyF = false
let bot;

console.clear()
console.log("6b6t chat spammer by Carlox\nhttps://github.com/CarloxCoC/SpamBot\nv1.1\n")

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

function getRandomMessage() {
  return " " + config.messages[Math.floor(Math.random() * config.messages.length)];
}

function isInLobby() {
  if (!bot || !bot.game || bot.game.difficulty != "hard") {
    if (!lobbyF) leaveLobby()
    return true;
  } else {
    return false;
  }
}

//leave the lobby
async function leaveLobby() {
  lobbyF = true

  bot.controlState.forward = true
  await bot.waitForTicks(40)
  bot.controlState.forward = false

  while (bot?.game?.difficulty != "hard") {
    bot.controlState.back = true
    await bot.waitForTicks(20)
    bot.controlState.back = false

    bot.controlState.forward = true
    await bot.waitForTicks(30)
    bot.controlState.forward = false
  }

  lobbyF = false
}

const main = () => {
  let forceStop = false;
  bot = mineflayer.createBot({
    host: "6b6t.org",
    username: config.username,
    version: "1.18.1",
    skipValidation: true,
  });

  bot.once("spawn", async () => {
    let lobbyCount = 0;
    while (!forceStop) {
      await bot.waitForTicks(20);
      if (lobbyCount > 30) {
        bot.end();
        break;
      }
      if (!bot.entity) continue;
      if (!bot.entity.position) continue;
      if (isInLobby()) lobbyCount++;
    }
  });

  bot.once("login", async () => {
    await bot.waitForTicks(100);
    bot.chat("/register " + config.password);
    await bot.waitForTicks(100);
    bot.chat("/login " + config.password);
    while (!forceStop) {
      if (!isInLobby()) {
        for (player in bot.players) {
          const targetUsername = bot.players[player].username;
          if (config.blacklist.includes(targetUsername.toLowerCase()) || bot.entity.username == targetUsername) continue;
          if (forceStop) return;
          bot.chat("/msg " + targetUsername + getRandomMessage());
          await bot.waitForTicks(20);
        }
      }
      await bot.waitForTicks(2);
    }
  });

  bot.on("error", (err) => {
    console.log(err);
    bot.end();
  });

  bot.on("messagestr", (message, pos) => {
    if (pos != "chat" || !message.startsWith("You whisper to ")) return
    console.log(message);
  });

  bot.on("kicked", (err) => {
    console.log(err);
    bot.end();
  });

  bot.on("end", () => {
    bot.removeAllListeners();
    bot = null;
    forceStop = true;
    setTimeout(main, 5000);
  });
};

main();