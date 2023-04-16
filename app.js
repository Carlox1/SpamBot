const fs = require("fs");
const mineflayer = require("mineflayer");
let bot;

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

function getRandomMessage() {
  return " " + config.messages[Math.floor(Math.random() * config.messages.length)];
}

function isInLobby() {
  if (!bot || !bot.game || bot.game.difficulty != "hard") {
    return true;
  } else {
    return false;
  }
}

const main = () => {
  let forceStop = false;
  bot = mineflayer.createBot({
    host: "anarchy.6b6t.org",
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

  bot.on("messagestr", (message) => {
    console.log(message);
  });

  bot.on("kicked", (err) => {
    console.log(err);
    bot.end();
  });

  bot.on("end", () => {
    bot.removeAllListeners();
    forceStop = true;
    setTimeout(main, 5000);
  });
};

main();