// Version 3.4.5
const version = "3.4.5";

const chalk = require("chalk");
console.log(chalk.red(`Donkzz has started!!`))
console.log(chalk.hex('#FFA500')(`If you encounter any issues, join our Discord: \nhttps://discord.gg/7A6gAdnBaw`))
console.log(chalk.yellowBright(`Your version is: ${version}`))

if (!process.version.startsWith('v20')) console.log(chalk.redBright('You are running a NodeJS version under v20. If you don\'t upgrade, you may get large lag spikes or ram overloads.'))

const {
  Webhook,
  MessageBuilder
} = require("discord-webhook-node");

var webhook;
var isOneAccPayingOut = false;
var itemsToPayout = [];

const config = process.env.config ? JSON.parse(process.env.config) : require("./config.json");
if (config.webhookLogging && config.webhook) webhook = new Webhook(config.webhook);

if (config.serverEventsDonate.enabled) console.log(chalk.redBright('ServerEvents Donate is VERY risky at the moment. Bot admins are monitoring server pools usage. You may want to turn this off.'))
if (config.commands.filter(a => a.command === 'trivia').length > 0) console.log(chalk.redBright('Trivia is VERY risky at the moment. Bot admins are monitoring trivia bots. You may want to turn this off.'))

process.on("unhandledRejection", (error) => {
  if (error.toString().includes("Cannot read properties of undefined (reading 'type')")) return;
  if (error.toString().includes("INTERACTION_TIMEOUT")) return;
  if (error.toString().includes("BUTTON_NOT_FOUND")) return;
  if (error.toString().includes("Invalid Form Body")) return;
  if (error.toString().includes("COMPONENT_VALIDATION_FAILED: Component validation failed")) return;
  if (error.toString().includes("Cannot send messages to this user")) return console.error(chalk.red("Make sure all of the users are in a server where Dank Memer is in"));
  console.log(chalk.gray("—————————————————————————————————"));
  console.log(chalk.white("["), chalk.red.bold("Anti-Crash"), chalk.white("]"), chalk.gray(" : "), chalk.white.bold("Unhandled Rejection/Catch"));
  console.log(chalk.gray("—————————————————————————————————"));

  console.error("unhandledRejection", error);
});

process.on("uncaughtException", (error) => {
  console.log(chalk.gray("—————————————————————————————————"));
  console.log(chalk.white("["), chalk.red.bold("Anti-Crash"), chalk.white("]"), chalk.gray(" : "), chalk.white.bold("Uncaught Exception/Catch"));
  console.log(chalk.gray("—————————————————————————————————"));

  console.error("uncaughtException", error);
});

process.on("multipleResolves", (type, promise, reason) => {
  console.log(chalk.gray("—————————————————————————————————"));
  console.log(chalk.white("["), chalk.red.bold("Anti-Crash"), chalk.white("]"), chalk.gray(" : "), chalk.white.bold("Multiple Resolves"));
  console.log(chalk.gray("—————————————————————————————————"));
  console.log(type, promise, reason);
});

const fs = require("fs-extra");
const axios = require("axios");
const SimplDB = require("simpl.db");
const stripAnsi = require("strip-ansi");

const db = new SimplDB();

axios.get("https://raw.githubusercontent.com/snappiee/Donkzz/main/index.js").then((res) => {
  let v = res.data.match(/Version ([0-9]*\.?)+/)[0]?.replace("Version ", "");
  if (v && v !== version) {
    console.log(chalk.bold.bgRed("There is a new version available: " + v + "\t\nPlease update by running the updater. \n" + chalk.underline("https://github.com/snappiee/Donkzz\n")));

  }
}).catch((error) => {
  console.log(error);
});

var logs = [];

const {
  Client,
  BaseSelectMenuInteraction
} = require("discord.js-selfbot-v13");
const tokens = process.env.tokens ? process.env.tokens.split("\n") : fs.readFileSync("tokens.txt", "utf-8").split("\n");
const botid = "270904126974590976";
var i = 0;

if (config.serverEventsDonate.payoutOnlyMode && config.serverEventsDonate.tokenWhichWillPayout && config.serverEventsDonate.enabled) {
  const client1 = new Client({
    checkUpdate: false
  });

  client1.on('ready', async () => {
    console.log(`${client1.user.username} is ready!`);

    const channel = await client1.channels.fetch(config.serverEventsDonate.payoutChannelID);
    if (!channel) return console.log("Invalid Channel ID for Serverevents donate - Please check config.json");
    channel.sendSlash(botid, "serverevents pool")
  })

  client1.on("messageCreate", async (message) => {
    if (message?.interaction?.commandName?.includes("serverevents payout") && message?.embeds[0]?.title?.includes("Pending Confirmation")) {
      if (!message.components[0].components[1]) return;
      await clickButton(message, message.components[0].components[1]);

      itemsToPayout.shift();
      await wait(randomInt(1500, 2000))

      if (itemsToPayout.length <= 0) return message.channel.sendSlash(botid, "serverevents pool")
      await message.channel.sendSlash(botid, "serverevents payout", config.serverEventsDonate.mainUserId, itemsToPayout[0].quantity, itemsToPayout[0].item)
    }



    if (message?.embeds[0]?.title?.includes("Server Pool")) {
      if (!config.serverEventsDonate.payout) return;

      let coins = message.embeds[0].description
        .split("\n")[4]
        .split("⏣ ")[1]
        .replaceAll(',', '');

      if (coins > 0 && config.serverEventsDonate.payout) await message.channel.sendSlash(botid, "serverevents payout", config.serverEventsDonate.mainUserId, coins);

      message.embeds[0].description.split("\n").forEach((line) => {
        if (/` +([0-9,]+)/gm.test(line)) {
          var quantity = line.match(/` +([0-9,]+)/gm)[0]?.replace("`")?.trim()?.replaceAll(',', '')?.match(/\d+/)[0];
          var item = line.match(/> .*/gm)[0]?.replace("> ", "")?.trim();
          if (!quantity || !item) return;
          console.log(`${item}: ${quantity}`)
          itemsToPayout.push({
            item: item,
            quantity: quantity
          });
        }
      });
      if (itemsToPayout.length <= 0) return console.log(`${chalk.magentaBright(client1.user.username)}: ${chalk.cyan(`Server Pool Empty`)} `)

      await message.channel.sendSlash(botid, "serverevents payout", config.serverEventsDonate.mainUserId, itemsToPayout[0].quantity, itemsToPayout[0].item)
    }
  })
  client1.login(config.serverEventsDonate.tokenWhichWillPayout);
} else {
  tokens.forEach((token) => {
    i++;
    setTimeout(() => {
      if (!token.trim().split(" ")[1]) start(token.trim().split(" ")[0]);
      else start(token.trim().split(" ")[1], token.trim().split(" ")[0]);
    }, i * config.loginDelay);
  });
};

async function start(token, channelId) {
  var onGoingCommands = [];
  var allItemsInInventory = [];
  var isBotFree = true;
  var isOnBreak = false;
  var botNotFreeCount = 0;
  var isDeadMeme = false;
  var isPlayingAdventure = false;
  var isHavingInteraction = false;
  var isHavingCaptcha = false;
  var buyShovel = false;
  var buyRifle = false;
  var wordemoji = "";
  var emoji = "";
  var words = "";
  var MolePosition = "";
  var UpcomingPosition = "";
  var UpcomingPosition2 = "";
  var MolePositionID = 0;
  var UpcomingPositionID = 0;
  var UpcomingPositionID2 = 0;
  var scratchRemaining = 0;
  var tempToken = "";

  const client = new Client({
    checkUpdate: false
  });

  var channel;

  client.on("rateLimit", (rateLimitInfo) => {
    console.log(chalk.white.bold(client.user.username + " - Rate Limited"));
    console.log(chalk.gray(rateLimitInfo));
  });

  client.on("ready", async () => {
    client.user.setStatus(config.discordStatus);

    console.log(`${chalk.green("Logged in as")} ${chalk.blue(client.user.username)}`);
    channel = await client.channels.fetch(channelId);

    if (config.autoDaily) {
      const now = Date.now();
      const gmt0 = new Date(now).setUTCHours(0, 0, 0, 0);
      var remainingTime;
      if (now > gmt0) {
        const nextGmt0 = new Date(gmt0).setUTCDate(new Date(gmt0).getUTCDate() + 1);
        remainingTime = nextGmt0 - now;
      } else remainingTime = gmt0 - now;

      if (!db.has(client.user.id + ".daily")) {

        await channel.sendSlash(botid, "daily");
        console.log(chalk.yellow(`${client.user.username} claimed daily`));

        db.set(client.user.id + ".daily", Date.now());
      }

      if (db.get(client.user.id + ".daily") && Date.now() - db.get(client.user.id + ".daily") > remainingTime) {

        await channel.sendSlash(botid, "daily").then(() => {
          db.set(client.user.id + ".daily", Date.now());
          console.log(chalk.yellow(`${client.user.username} claimed daily`));

          setInterval(async () => {
            channel.sendSlash(botid, "daily");

            db.set(client.user.id + ".daily", Date.now());
            console.log(chalk.yellow(`${client.user.username} claimed daily`));
          }, remainingTime + randomInt(10000, 60000));
        })
          .catch((e) => {
            return console.log(e);
          });
      }
    }

    if (config.serverEventsDonate.enabled) {
      await channel.sendSlash(botid, "withdraw", "max")
      await channel.sendSlash(botid, "serverevents donate", "all").catch((e) => console.log(e));
    }

    db.set(client.user.id + ".username", client.user.username);

    if (config.serverEventsDonate.enabled) return channel.sendSlash(botid, "inventory")

    if (config.autoApple) {
      if (config.RemoveAppleWhenUse) {
        await channel.sendSlash(botid, "remove", "apple");
        await wait(400);
        console.log(chalk.cyan(`${client.user.username}: Successfully removed Apple before using`));
      }
      await channel.sendSlash(botid, "use", "apple");
      console.log(chalk.cyan(`${client.user.username}: Successfully used Apple!`));
    }

    if (!db.get(client.user.id + ".horseshoe") || Date.now() - db.get(client.user.id + ".horseshoe") > 0.25 * 60 * 60 * 1000) {
      if (config.autoHorseshoe) {
        setTimeout(async () => {
          channel.sendSlash(botid, "use", "lucky horseshoe")
            .catch((e) => {
              return console.error(e);
            });
        }, randomInt(5000, 15000))
      }
    }

    if (!db.get(client.user.id + ".ammo") || Date.now() - db.get(client.user.id + ".ammo") > 1 * 60 * 60 * 1000) {
      if (config.autoAmmo) {
        setTimeout(async () => {
          channel.sendSlash(botid, "use", "ammo")
            .catch((e) => {
              return console.error(e);
            });
        }, randomInt(5000, 15000))
      }
    }

    if (!db.get(client.user.id + ".pizza") || Date.now() - db.get(client.user.id + ".ammo") > 0.5 * 60 * 60 * 1000) {
      if (config.autoPizza) {
        setTimeout(async () => {
          channel.sendSlash(botid, "use", "pizza")
            .catch((e) => {
              return console.error(e);
            });
        }, randomInt(5000, 15000))
      }
    }


    if (config.autoAdventure) {
      await channel.sendSlash(botid, "adventure");
      await wait(300);
    }
    if (config.autoWork) {
      await channel.sendSlash(botid, "work shift");
      await wait(300);
    }
    if (config.autoScratch) {
      await channel.sendSlash(botid, "scratch");
      await wait(300);
    }
    main(onGoingCommands, channel, client, isOnBreak, isHavingCaptcha);
  });

  client.on('interactionModalCreate', modal => {
    if (modal.title == "Dank Memer Shop") {
      modal.components[0].components[0].setValue("1");
      modal.reply();
      console.log(chalk.cyan(`${client.user.username}: Successfully bought an item (shovel/rifle)`));
      isHavingInteraction = false;
    }
  });

  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (newMessage?.interaction?.user !== client.user) return;
    if (newMessage?.author?.id !== botid) return;

    // =================== Dead Meme Start ===================

    if (newMessage?.embeds[0]?.description?.includes("dead meme")) {
      isDeadMeme = true;
      setTimeout(() => {
        isDeadMeme = false;
      }, 3.02 * 1000 * 60);
    }
    // =================== Dead Meme End =====================

    // =================== MoleMan Update Message ============

    if (newMessage?.embeds[0]?.description?.includes("Dodge the Worms!")) {
      playMoleMan(newMessage);
    }

    // ================== MoleMan Minigame End

    // ================== Loot Notifications

    if (newMessage?.embeds[0]?.description?.includes("Mole Man, nice catch!")) {
      console.log(chalk.cyan(`${client.user.username}: Successfully caught a Mole Man!`));

    }

    if (newMessage?.embeds[0]?.description?.includes("Dragon, nice shot!")) {
      console.log(chalk.cyan(`${client.user.username}: Successfully caught a Dragon!`));
    }

    // =================== Loot Notifications End ============

    // =================== Work Notifications Start ==========

    if (newMessage?.embeds[0]?.footer?.text?.includes("Working as")) {
      return setTimeout(() => {
        channel.sendSlash(botid, "work shift");
      }, randomInt(3600000, 3650000));
    }

    // =================== Work Notifications End ============

    // =================== Emoji Minigame Start ==============

    if (newMessage?.embeds[0]?.description?.includes("the emoji?")) {
      playEmoji(newMessage);
    }

    // =================== Emoji Minigame End ==============

    // =================== Word-Color Minigame Start ==============

    if (newMessage?.embeds[0]?.description?.includes("What color was next to")) {
      playWordColor(newMessage);
    }

    // =================== Word-Color Minigame End ==============

    // =================== Word Order Minigame Start ==============

    if (newMessage?.embeds[0]?.description?.includes("Click the buttons in correct order")) {
      playWordOrder(newMessage);
    }

    // =================== Word Order Minigame End ==============

    // =================== Scratch Prompt Start ================
    if (newMessage?.embeds[0]?.description?.includes("You can scratch")) {
      scratchRemaining = newMessage?.embeds[0]?.description?.split("**")[1];
      var m = scratchRemaining - 1;
      if (m == -1) {
        let btn = newMessage?.components[4].components[3];
        await clickButton(newMessage, btn);
        return setTimeout(() => {
          channel.sendSlash(botid, "scratch");
        }, randomInt(10800000, 11000000));
      }
      else {
        const i = randomInt(0, 2);
        let btn = newMessage.components[m].components[i];
        await clickButton(newMessage, btn);
        console.log(chalk.cyan(`${client.user.username}: Successfully scratching (Remaining: ${m}/4)`));
      }
      isBotFree = true;
    }
    // =================== Scratch Prompt End ================

    // =================== Adventure Start ===================

    autoAdventure(newMessage);


    if (newMessage?.embeds[0]?.title?.includes(client.user.username + ", choose items you want to bring along")) {
      if (newMessage.components[1]?.components[0].disabled) return (isPlayingAdventure = false);
      await clickButton(newMessage, newMessage.components[1]?.components[0]);
      setTimeout(async () => {
        isPlayingAdventure = false;
      }, 300000)
    }

    playMinigames(newMessage);

    if (config.serverEventsDonate.enabled && newMessage?.embeds[0]?.author?.name?.includes(`${client.user.username}'s inventory`)) {
      var inputString = newMessage.embeds[0].description;
      const regex = /([a-zA-Z0-9 ☭']+)\*\* ─ ([0-9,]+)/gm;

      let i = 0;
      inputString.match(regex).forEach(async (item) => {
        const itemName = item.trim().split("** ─ ")[0];
        const itemQuantity = item.trim().split("** ─ ")[1]?.replaceAll(',', '');
        if (config.serverEventsDonate.blacklist.includes(itemName)) return i++;
        if (i > 7) await clickButton(newMessage, newMessage.components[1].components[2]);
        allItemsInInventory.push({
          item: itemName,
          quantity: itemQuantity
        });
      });

      if (allItemsInInventory.length <= 0) {
        if (!isOneAccPayingOut && config.serverEventsDonate.payout && client.token.includes(config.serverEventsDonate.tokenWhichWillPayout)) {
          newMessage.channel.sendSlash(botid, "serverevents pool")
          isOneAccPayingOut = true;
        } else if (i > 7) return clickButton(newMessage, newMessage.components[1].components[2])
        return console.log(`${chalk.magentaBright(client.user.username)}: ${chalk.cyan(`Donated all items`)}`)
      }
      await newMessage.channel.sendSlash(botid, "serverevents donate", allItemsInInventory[0].quantity, allItemsInInventory[0].item)
    }
  });

  client.on("messageCreate", async (message) => {
    if (message.author.id != botid) return;

    if (message?.flags?.has("EPHEMERAL") && message?.embeds[0]?.title?.includes("You're currently banned!")) {
      console.log(chalk.redBright(`${client.user.username} is banned!`));
      fs.writeFileSync("tokensOld.txt", client.token + "\n");
      console.log(`String "${client.token}" wrote on ${"tokensOld.txt"}`);
      isHavingCaptcha = true;
    }

    if (message?.flags?.has("EPHEMERAL") && message?.embeds[0]?.description?.includes("You are unable to interact")) {
      await wait(10000);
    }

    if (message?.flags?.has("EPHEMERAL") && message?.embeds[0]?.footer?.text?.includes("Select matching item image.")) {
      console.log(chalk.redBright(`${client.user.username} is being suspicious! Solve the captcha yourself!`));
      fs.writeFileSync("tokensOld.txt", client.token + "\n");
      console.log(`String "${tempToken}" wrote on ${"tokensOld.txt"}`);
      if (config?.webhookLogging && config?.webhook) {
        webhook.send("<@" + config.mainUserId + ">" + "<@" + client.user.id + ">" + client.user.username + ": is having captcha!");
      }
      isHavingCaptcha = true;
    }

    if (message?.flags?.has("EPHEMERAL") && message?.embeds[0]?.description?.includes("You don't have a shovel") && config.autoBuy) {
      console.log(client.user.username, ", Preparing to buy a shovel");
      isHavingInteraction = true;
      buyShovel = true;
      openShop();
    }

    if (message?.flags?.has("EPHEMERAL") && message?.embeds[0]?.description?.includes("You don't have a hunting rifle") && config.autoBuy) {
      console.log(client.user.username, ", Preparing to buy a rifle");
      isHavingInteraction = true;
      buyRifle = true;
      openShop();
    }

    if (message?.flags?.has("EPHEMERAL") && message?.embeds[0]?.title?.includes("Hold tight! Maintenance in progress.")) {
      console.log(chalk.redBright(`${client.user.username} got maintenance! Stopping Donkzz; restart it later.`));
      process.exit(0);
    }

    // =================== Autoalerts Start ===================

    if (message?.embeds[0]?.title?.includes("You have an unread alert") && message?.flags?.has("EPHEMERAL")) {
      isBotFree = false;
      setTimeout(async () => {
        await message.channel.sendSlash(botid, "alert")
        isBotFree = true;
      }, config.cooldowns.commandInterval.minDelay, config.cooldowns.commandInterval.maxDelay)
    }

    // =================== Autoalerts End ===================

    // =================== Shop Coupon confirmation ==============

    if (message.embeds[0]?.description?.includes("Would you like to use your") || message.embeds[0]?.fields?.value?.includes("Would you like to use your")) {
      await clickButton(message, message.components[0].components[0]);
      console.log(client.user.username + ": Skipped using Shop Coupon");
    }

    // =================== Shop Confirmation End ==================

    // =================== Click Minigame Start ===================

    if (message.channel.id === channelId) {
      if (message?.embeds[0]?.description?.includes("F")) {
        const btn = message.components[0]?.components[0];

        if (btn?.label === "F") await clickButton(message, btn);
        else if (message.embeds[0]?.description?.includes("Attack the boss by clicking")) {
          let interval = setInterval(async () => {
            if (btn.disabled) return interval.clearInterval();
            await clickButton(message, btn);
          }, randomInt(config.cooldowns.buttonClickDelay.minDelay, config.cooldowns.buttonClickDelay.maxDelay));
        }
      }
    }

    // =================== Click Minigame End ===================

    if (message?.interaction?.user !== client?.user) return;

    // =================== Auto Upgrades Start ===================
    if (message?.embeds[0]?.description?.includes("You've eaten an apple! If you die within the next 24 hours, you won't lose any items. You will, however, still lose coins.")) {
      db.set(client.user.id + ".apple", Date.now());
      console.log(chalk.yellow(`${client.user.username} ate apple`));
    }

    if (message?.embeds[0]?.description?.includes("Lucky Horseshoe, giving you slightly better luck in a few commands")) {
      db.set(client.user.id + ".horseshoe", Date.now());
      setTimeout(() => {
        channel.sendSlash(botid, "use", "horseshoe");
      }, 900000 + randomInt(8000, 15000));
      console.log(chalk.yellow(`${client.user.username} used horseshoe`));
    }

    if (message?.embeds[0]?.description?.includes("You load ammo into your hunting rifle. For the next 60 minutes, you cannot hunt and run into nothing.")) {
      db.set(client.user.id + ".ammo", Date.now());
      setTimeout(() => {
        channel.sendSlash(botid, "use", "ammo");
      }, 3600000 + randomInt(8000, 15000));
      console.log(chalk.yellow(`${client.user.username} used ammo`));
    }

    if (message?.embeds[0]?.description?.includes("You eat the perfect slice of pizza.")) {
      db.set(client.user.id + ".pizza", Date.now());
      setTimeout(() => {
        channel.sendSlash(botid, "use", "pizza");
      }, 1800000 + randomInt(8000, 15000));
      console.log(chalk.yellow(`${client.user.username} used pizza`));
    }



    // =================== Auto Upgrades End ===================

    // =================== Stream Start ===================
    if (message?.embeds[0]?.author?.name.includes(" Stream Manager")) {
      try {
        if (message?.embeds[0]?.fields[1]?.name !== "Live Since") {
          const components = message.components[0]?.components;

          if (components[0]?.type !== "SELECT_MENU" && components[0]?.label.includes("Go Live")) {
            await message.clickButton(components[0].customId);

            setTimeout(async () => {
              if (message.components[0].components[0]?.type == "SELECT_MENU") {
                const Games = [
                  "Apex Legends",
                  "COD MW2",
                  "CS GO",
                  "Dead by Daylight",
                  "Destiny 2",
                  "Dota 2",
                  "Elden Ring",
                  "Escape from Tarkov",
                  "FIFA 22",
                  "Fortnite",
                  "Grand Theft Auto V",
                  "Hearthstone",
                  "Just Chatting",
                  "League of Legends",
                  "Lost Ark",
                  "Minecraft",
                  "PUBG Battlegrounds",
                  "Rainbox Six Siege",
                  "Rocket League",
                  "Rust",
                  "Teamfight Tactics",
                  "Valorant",
                  "Warzone 2",
                  "World of Tanks",
                  "World of Warcraft",
                ];
                const Game = (config.streamGame === '') ? Games[Math.floor(Math.random() * Games.length)] : config.streamGame;
                const GamesMenu = message.components[0].components[0]
                await message.selectMenu(GamesMenu, [Game]);
              } else return;

              setTimeout(async () => {
                const components2 = message.components[1]?.components;
                await message.clickButton(components2[0].customId);
              }, config.cooldowns.buttonClickDelay.minDelay, config.cooldowns.buttonClickDelay.maxDelay);

              setTimeout(async () => {
                const check = randomInt(0, 6);

                if (check == 0 || check == 1) {
                  await message.clickButton(message?.components[0]?.components[0]);
                  isBotFree = true;
                } else if (check == 2 || check == 3 || check == 4 || check == 5) {
                  await message.clickButton(message.components[0]?.components[1]);
                  isBotFree = true;
                } else if (check == 6) {
                  await message.clickButton(message.components[0]?.components[2]);
                  isBotFree = true;

                }
              }, config.cooldowns.buttonClickDelay.minDelay, config.cooldowns.buttonClickDelay.maxDelay);
            }, config.cooldowns.buttonClickDelay.minDelay, config.cooldowns.buttonClickDelay.maxDelay);
          }
        } else if (message.embeds[0].fields[1].name == "Live Since") {
          const check = randomInt(0, 6);

          if (check == 0 || check == 1) {
            await message.clickButton(message.components[0]?.components[0]);
            isBotFree = true;
          } else if (check == 2 || check == 3 || check == 4 || check == 5) {
            await message.clickButton(message.components[0]?.components[1]);
            isBotFree = true;
          } else if (check == 6) {
            await message.clickButton(message.components[0]?.components[2]);
            isBotFree = true;
          }
        }
      } catch (err) {
        console.error(err)
      }
    };

    // =================== Stream End ===================

    // =================== Serverevents Donate Start ===================
    if (message?.interaction?.commandName?.includes("serverevents donate") && message?.embeds[0]?.title?.includes("Pending Confirmation")) {
      if (!message.components[0].components[1]) return;
      await clickButton(message, message.components[0].components[1]);
      allItemsInInventory.shift();
      await wait(randomInt(1500, 2000))
      if (allItemsInInventory.length <= 0) return message.channel.sendSlash(botid, "inventory")
      await message.channel.sendSlash(botid, "serverevents donate", allItemsInInventory[0].quantity, allItemsInInventory[0].item)
    }

    if (message?.embeds[0]?.title?.includes("Server Pool")) {
      if (!config.serverEventsDonate.payout) return;

      var coins = message.embeds[0].description.split("\n")[4].split("⏣ ")[1].replaceAll(',', '');
      if (coins > 0 && config.serverEventsDonate.payout) await message.channel.sendSlash(botid, "serverevents payout", config.serverEventsDonate.mainUserId, coins)

      message.embeds[0].description.split("\n").forEach((line) => {
        if (/` +([0-9,]+)/gm.test(line)) {
          var quantity = line.match(/` +([0-9,]+)/gm)[0]?.replace("`")?.trim()?.replaceAll(',', '')?.match(/\d+/)[0];
          var item = line.match(/> .*/gm)[0]?.replace("> ", "")?.trim();
          if (!quantity || !item) return;
          console.log(`${item}: ${quantity}`)
          itemsToPayout.push({
            item: item,
            quantity: quantity
          });
        }
      });

      if (itemsToPayout.length <= 0) return console.log(`${chalk.magentaBright(client.user.username)}: ${chalk.cyan(`Server Pool Empty`)} `)
      await message.channel.sendSlash(botid, "serverevents payout", config.serverEventsDonate.mainUserId, itemsToPayout[0].quantity, itemsToPayout[0].item)
    }

    if (config.serverEventsDonate.enabled && message?.embeds[0]?.author?.name?.includes(`${client.user.username}'s inventory`)) {
      var inputString = message.embeds[0].description;
      const regex = /([a-zA-Z0-9 ☭']+)\*\* ─ ([0-9,]+)/gm;

      let i = 0;
      inputString.match(regex).forEach(async (item) => {
        const itemName = item.trim().split("** ─ ")[0];
        const itemQuantity = item.trim().split("** ─ ")[1]?.replaceAll(',', '');
        if (config.serverEventsDonate.blacklist.includes(itemName)) return i++;
        console.log(`${itemName}: ${itemQuantity}`)
        if (i > 7) await clickButton(message, message.components[1].components[2])
        allItemsInInventory.push({
          item: itemName,
          quantity: itemQuantity
        });
      });

      if (allItemsInInventory.length <= 0) {
        if (!isOneAccPayingOut && config.serverEventsDonate.payout && client.token.includes(config.serverEventsDonate.tokenWhichWillPayout)) {
          message.channel.sendSlash(botid, "serverevents pool")
          isOneAccPayingOut = true;
        } else if (i > 7) return clickButton(message, message.components[1].components[2])
        return console.log(`${chalk.magentaBright(client.user.username)}: ${chalk.cyan(`Donated all items`)}`)
      }

      await message.channel.sendSlash(botid, "serverevents donate", allItemsInInventory[0].quantity, allItemsInInventory[0].item)
    }
    // =================== Serverevents donate End ===================

    // =================== Autoadventure Start ===================

    if (message?.embeds[0]?.author?.name?.includes("Choose an Adventure")) {
      const PlatformMenu = message.components[0].components[0];

      await wait(randomInt(config.cooldowns.buttonClickDelay.minDelay, config.cooldowns.buttonClickDelay.maxDelay * 2));
      // const Platforms = PlatformMenu.options.map((opt) => opt.value);
      // console.log(Platforms)
      await message.selectMenu(PlatformMenu, [config.adventure]);

      if (message.components[1].components[0].disabled) {
        if (!message.embeds[0]?.description?.match(/<t:\d+:t>/)[0]) {
          isPlayingAdventure = false;
          console.log(`${chalk.magentaBright(client.user.username)}: ${chalk.cyan(": Having no tickets, queued adventure for 24 minutes later.")}`);
          return setTimeout(() => {
            channel.sendSlash(botid, "adventure")
            isPlayingAdventure = true;
          }, randomInt(1440000, 1500000));
        }
        isPlayingAdventure = false;
        const epochTimestamp = Number(message.embeds[0]?.description?.match(/<t:\d+:t>/)[0]?.replace("<t:", "")?.replace(":t>", ""));
        const remainingTime = epochTimestamp * 1000 - Date.now();
        console.log(client.user.username + ": Adventure is on cooldown for " + Math.round(remainingTime / 60000) + " minute(s)");
        isPlayingAdventure = false;
        return setTimeout(() => {
          channel.sendSlash(botid, "adventure")
          isPlayingAdventure = true;
        }, remainingTime + randomInt(8000, 15000));
      }

      await clickButton(message, message.components[1].components[0]).then(() => {
        isPlayingAdventure = true;
        setTimeout(async () => {
          isPlayingAdventure = false;
        }, 300000)
      });
    }

    autoAdventure(message);
    // =================== Autoadventure End ===================

    // =================== Crime Command Start ===================

    if (message?.embeds[0]?.description?.includes("What crime do you want to commit?")) {
      if (config.crimeLocations?.length == 0) {
        await clickRandomButton(message, 0);
        isBotFree = true;
      } else {
        const components = message.components[0]?.components;
        if (!components?.length) return;
        config.crimeLocations = config.crimeLocations?.map((location) => location.toLowerCase());

        var buttonToClick = undefined;
        for (var a = 0; a < 3; a++) {
          let btn = components[a];
          if (config.crimeLocations?.includes(btn?.label.toLowerCase())) {
            buttonToClick = btn;
            break;
          }
        }

        if (buttonToClick == undefined) {
          await clickRandomButton(message, 0);
          isBotFree = true;
        } else {
          await clickButton(message, buttonToClick);
          isBotFree = true;
        }
      }
    }

    // =================== Crime Command End ==================

    // =================== Work Applying =================

    if (message?.embeds[0]?.title?.includes("You don't currently have a job")) {
      await channel.sendSlash(botid, "work apply", "Discord Mod");
      console.log(chalk.cyan(`${client.user.username}: Successfully applied a job.`));
    }

    // =================== Giveaway Command Start =================== 

    if (message?.embeds[0]?.title?.includes("Giveaway")) {
      await clickButton(message, message.components[0].components[0]);
      console.log(chalk.cyan(`${client.user.username}: Successfully joined giveaway`));
    }

    // =================== Giveaway Command End =================== 

    // =================== Shop Command Start ====================

    if (message?.embeds[0]?.title?.includes("Dank Memer Shop")) {
      if (buyRifle == true) {
        await clickButton(message, message.components[2].components[1]);
        buyRifle = false;
      }
      if (buyShovel == true) {
        await clickButton(message, message.components[2].components[0]);
        buyShovel = false;
      }
    }

    //==================== Shop Command End ======================

    // =================== Scratch Command Start =================

    if (message?.embeds[0]?.description?.includes("You can scratch")) {
      if (!message?.flags?.has("EPHEMERAL")) {
        const i = randomInt(0, 2);
        let btn = message?.components[4].components[i];
        await clickButton(message, btn);
        console.log(chalk.cyan(`${client.user.username}: Successfully started scratching (Remaining: 3/4)`));
      } else if (message?.flags?.has("EPHEMERAL")) {
        const epochTimestamp = Number(message.embeds[0]?.description?.match(/<t:\d+:R>/)[0]?.replace("<t:", "")?.replace(":R>", ""));
        const remainingTime = epochTimestamp * 1000 - Date.now();
        console.log(client.user.username + ": Scratch is on cooldown for " + Math.round(remainingTime / 60000) + " minute(s)");
        return setTimeout(() => {
          channel.sendSlash(botid, "scratch");
        }, remainingTime + randomInt(8000, 15000));
      }
    }

    // =================== Scratch Command End ====================

    // =================== Work Command Queue =====================

    if (message?.embeds[0]?.description?.includes("You can work again at")) {
      const epochTimestamp = Number(message.embeds[0]?.description?.match(/<t:\d+:t>/)[0]?.replace("<t:", "")?.replace(":t>", ""));
      const remainingTime = epochTimestamp * 1000 - Date.now();
      console.log(client.user.username + ": Work is on cooldown for " + Math.round(remainingTime / 60000) + " minute(s)");
      return setTimeout(() => {
        channel.sendSlash(botid, "work shift");
      }, remainingTime + randomInt(8000, 15000));
    }

    // =================== Work Command Queued ====================

    // =================== Search Command Start ===================

    if (
      message?.embeds[0]?.description?.includes("Where do you want to search?")
    ) {
      if (config.searchLocations.length == 0) {
        await clickRandomButton(message, 0);
        isBotFree = true;
      } else {
        const components = message.components[0]?.components;
        if (!components?.length) return;
        config.searchLocations = config.searchLocations.map((location) => location.toLowerCase());

        var buttonToClick = undefined;
        for (var a = 0; a < 3; a++) {
          let btn = components[a];
          if (config.searchLocations?.includes(btn?.label.toLowerCase())) {
            buttonToClick = btn;
            break;
          }
        }

        if (buttonToClick == undefined) {
          await clickRandomButton(message, 0);
          isBotFree = true;
        } else {
          await clickButton(message, buttonToClick);
          isBotFree = true;
        }
      }
    }

    // =================== Search Command End ===================

    // =================== Highlow Command Start ===================

    if (message?.embeds[0]?.description?.includes(`I just chose a secret number between 1 and 100.`)) {
      var numberChosen = parseInt(message.embeds[0].description.split(" **")[1].replace("**?", "").trim());

      const components = message.components[0]?.components;
      if (!components?.length || components[numberChosen > 50 ? 0 : 2].disabled) return;
      let btn = components[numberChosen > 50 ? 0 : 2];
      await clickButton(message, btn);
      isBotFree = true;
    }

    // =================== Highlow Command End ===================



    // =================== Trivia Command Start ===================

    if (message.embeds[0]?.description?.includes(" seconds to answer*")) {
      var question = message.embeds[0].description.replace(/\*/g, "").split("\n")[0].split('"')[0];

      let answer = await findAnswer(question);
      if (answer) {
        if (Math.random() < config.triviaOdds) {
          var flag = false;
          const components = message.components[0]?.components;
          let btn;
          if (components?.length == NaN) return;
          for (var i = 0; i < components.length; i++) {
            if (components[i].label.includes(answer)) {
              btn = components[i];
              flag = true;
              await wait(randomInt(config.cooldowns.triviaCooldown.minDelay, config.cooldowns.triviaCooldown.maxDelay));
              await clickButton(message, btn);
              isBotFree = true;
            }
          }
          if (!flag || answer === undefined) {
            await wait(randomInt(config.cooldowns.triviaCooldown.minDelay, config.cooldowns.triviaCooldown.maxDelay));

            await clickRandomButton(message, 0);
            isBotFree = true;
          }
        } else {
          await wait(randomInt(config.cooldowns.triviaCooldown.minDelay, config.cooldowns.triviaCooldown.maxDelay));

          await clickRandomButton(message, 0);
          isBotFree = true;
        }
      } else {
        await wait(randomInt(config.cooldowns.triviaCooldown.minDelay, config.cooldowns.triviaCooldown.maxDelay));

        await clickRandomButton(message, 0);
        isBotFree = true;
      }
    }

    // =================== Trivia Command End ===================

    // =================== Minigame Start ===================

    playMinigames(message);

    // =================== Minigame End ===================

    // =================== PostMeme Command Start ===================

    if (message.embeds[0]?.description?.includes("Pick a meme type and a platform to post a meme on!")) {
      const PlatformMenu = message.components[0].components[0];
      const MemeTypeMenu = message.components[1].components[0];
      const Platforms = PlatformMenu.options.map((opt) => opt.value);
      const MemeTypes = MemeTypeMenu.options.map((opt) => opt.value);

      const MemeType = MemeTypes[Math.floor(Math.random() * MemeTypes.length)];
      const Platform = config.postMemesPlatforms.length > 0 ? config.postMemesPlatforms[Math.floor(Math.random() * config.postMemesPlatforms.length)] : Platforms[Math.floor(Math.random() * Platforms.length)];
      await wait(randomInt(config.cooldowns.buttonClickDelay.minDelay, config.cooldowns.buttonClickDelay.maxDelay));
      await message?.selectMenu(PlatformMenu, [Platform]);

      await wait(randomInt(config.cooldowns.buttonClickDelay.minDelay, config.cooldowns.buttonClickDelay.maxDelay));
      await message?.selectMenu(MemeTypeMenu, [MemeType]);

      await wait(randomInt(config.cooldowns.buttonClickDelay.minDelay, config.cooldowns.buttonClickDelay.maxDelay));

      await clickButton(message, message.components[2]?.components[0]);
      isBotFree = true;
    }

    // =================== PostMeme Command End ===================
  });

  client.login(token).catch((err) => {
    if (err.toString().includes("TOKEN_INVALID")) {
      console.log(`${chalk.redBright("ERROR:")} ${chalk.blueBright("The token you provided is invalid")} - ${chalk.blue(token)}`);
    }
  });

  async function playMinigames(message, newMessage) {
    let description = message?.embeds[0]?.description?.replace(/<a?(:[^:]*:)\d+>/g, "$1");
    let description2 = message?.embeds[0]?.description;
    let positions = description?.split("\n").slice(1).map((e) => e.split(":").filter((e) => e !== ""));

    if (description?.includes("Dodge the Fireball!")) {
      let fireballPostion = positions[1].length - 1;
      let safePostion = ["Left", "Middle", "Right"].filter((e, idx) => idx !== fireballPostion);

      let buttons = message.components[0]?.components;
      let btn = buttons.filter((e) => safePostion.includes(e.label))[randomInt(0, 1)];

      message.clickButton(btn);
    } else if (description?.includes("Dunk the ball!")) {
      let ballPostion = positions[0].length - 1;
      let btn = message.components[0]?.components[ballPostion];

      message.clickButton(btn)
    } else if (description?.includes("Hit the ball!")) {
      let goalkeeperPostion = positions[1].length - 1;
      let safePostion = ["Left", "Middle", "Right"].filter((e, idx) => idx !== goalkeeperPostion);

      let buttons = message.components[0]?.components;
      let btn = buttons.filter((e) => safePostion.includes(e.label))[randomInt(0, 1)];
      message.clickButton(btn);
    } else if (description2?.includes("Look at each color next to the word")) {
      isHavingInteraction = true;
      wordemoji = description2?.split("!\n")[1]; // declare var wordemoji for updated messages
    } else if (description2?.includes("Remember words order!")) {
      isHavingInteraction = true;
      words = description2?.split("!\n")[1]; // declare var words for updated messages
    } else if (description2?.includes("Look at the emoji closely!")) {
      isHavingInteraction = true;
      emoji = description2?.split("!\n")[1]; // declare var emoji for updated messages
    } else if (description2?.includes("Dodge the Worms!")) {
      console.log(client.user.username + " playing Mole Man minigame");
      playMoleMan(message);
    }
  }

  async function autoAdventure(newMessage) {
    if (!newMessage?.interaction.commandName.includes("adventure")) return;
    if (!newMessage.interaction) return;
    if (!newMessage.components[0]) return;
    if (newMessage?.embeds[0]?.title?.includes(client.user.username + ", choose items you want to bring along")) return;
    if (newMessage?.embeds[0]?.author?.name?.includes("Adventure Summary")) {
      isPlayingAdventure = false;

      let btn = newMessage.components[0].components[0];
      let btnLabel = btn.label;
      var time = btnLabel.match(/in \d+ minutes/)[0]?.replace("in ", "")?.replace(" minutes", "");

      console.log(`${client.user.username}: Finished playing adventure. Next adventure in ${time} minutes`);

      setTimeout(() => {
        channel.sendSlash(botid, "adventure")
      }, randomInt(Number(time) * 60 * 1000, Number(time) * 1.1 * 60 * 1000));
    }

    if (newMessage?.components[0]?.components[1]?.disabled) return clickButton(newMessage, newMessage.components[1].components[1]);
    if (!newMessage?.components[1]?.components[1]) return clickButton(newMessage, newMessage.components[0].components[1]);

    const database = require(`./adventures/${config.adventure}.json`).database;

    const answer = database.find((e) => e.name.includes(newMessage?.embeds[0]?.description?.split("<")[0]?.split("\n")[0]?.trim()))?.click;
    var found = false;
    if (answer) {
      for (let i = 0; i < newMessage.components.length; i++) {
        for (let j = 0; j < newMessage.components[i].components.length; j++) {
          if (newMessage?.components[i]?.components[j]?.label?.toLowerCase()?.includes(answer.toLowerCase())) {
            found = true;
            await clickButton(newMessage, newMessage.components[i].components[j]);
            await wait(200)
            if (!newMessage.components[i].components[j].disabled) await clickButton(newMessage, newMessage.components[i].components[j]);
            await clickButton(newMessage, newMessage.components[1].components[1])
            await wait(250)
            if (!newMessage.components[1].components[1].disabled) await clickButton(newMessage, newMessage.components[1].components[1])
          }
        }
      }

      if (!found) {
        await clickButton(newMessage, newMessage.components[0].components[randomInt(0, newMessage.components[0].components.length - 1)]).then(() => {
          setTimeout(async () => {
            isPlayingAdventure = false;
          }, 300000)
        });
      }
    } else {
      if (newMessage?.embeds[0]?.description?.includes("Catch one of em!")) {
        await clickButton(newMessage, newMessage.components[0].components[2]);
        await wait(randomInt(config.cooldowns.buttonClickDelay.minDelay, config.cooldowns.buttonClickDelay.maxDelay));
        await clickButton(newMessage, newMessage.components[1].components[1]);
        return;
      }

      await clickButton(newMessage, newMessage.components[0].components[randomInt(0, newMessage.components[0].components.length - 1)]);
    }
  }

  async function openShop() {
    await channel.sendSlash(botid, "withdraw", "50k");
    await wait(400);
    await channel.sendSlash(botid, "shop view");
  }

  async function playWordOrder(message) {
    for (var i = 0; i < 5; i++) {
      var attempts = i + 1;
      var word = words.split("\n")[i];
      var word2 = word.split("`")[1];
      for (var k = 0; k < 5; k++) {
        let btnz = message?.components[0]?.components[k];
        await wait(1000);
        if (word2.includes(btnz.label.toLowerCase()) && !btnz.disabled) {
          setTimeout(() => {
            clickButton(message, btnz);
          }, 2000);
          await wait(1000);
          console.log(chalk.cyan(`${client.user.username}: Successfully played the word order minigame. (${attempts}/5)`));
        }
      }
      isHavingInteraction = false;
    }
  }

  async function playWordColor(message) {
    //build color components
    const colMarine = "marine";
    const colCyan = "cyan";
    const colWhite = "white";
    const colBlack = "black";
    const colGreen = "green";
    const colYellow = "yellow";
    //build emoji components
    const emojiMarine = "<:Marine:863886248572878939>";
    const emojiCyan = "<:Cyan:863886248670265392>";
    const emojiYellow = "<:Yellow:863886248296316940>";
    const emojiGreen = "<:Green:863886248527134730>";
    const emojiBlack = "<:Black:863886248431190066>";
    const emojiWhite = "<:White:863886248689926204>";
    //parsing and responding block
    var wordAsked = message?.embeds[0]?.description.split("`")[1];
    var line = "";
    var colorAsked = "";
    for (var i = 0; i < 3; i++) {
      line = wordemoji.split("\n")[i];
      if (line.includes(wordAsked)) {
        if (line.includes(emojiMarine)) {
          colorAsked = colMarine;
        }
        if (line.includes(emojiCyan)) {
          colorAsked = colCyan;
        }
        if (line.includes(emojiWhite)) {
          colorAsked = colWhite;
        }
        if (line.includes(emojiBlack)) {
          colorAsked = colBlack;
        }
        if (line.includes(emojiGreen)) {
          colorAsked = colGreen;
        }
        if (line.includes(emojiYellow)) {
          colorAsked = colYellow;
        }
      }
    }

    for (var j = 0; j < 4; j++) {
      await wait(300);
      let btnz = message?.components[0].components[j];
      let btnLabel = btnz.label.toLowerCase();
      if (btnLabel.includes(colorAsked)) {
        await clickButton(message, btnz);
        console.log(chalk.cyan(`${client.user.username}: Successfully played the word-color matching game.`));
        isHavingInteraction = false;
      }
    }
  }

  async function playEmoji(message) {
    // build emoji components
    const laughing = "😆";
    const thinking = "🤔";
    const wink = "😉";
    const slight_smile = "🙂";
    const smile = "😄";
    const grinning = "😀";
    const relieved = "😌";
    const grin = "😁";
    const hugging = "🤗";
    const upside_down = "🙃";
    //declare clickEmoji
    var clickEmoji = "";
    //defining clickEmoji
    if (emoji.includes(laughing)) {
      clickEmoji = laughing;
    }
    if (emoji.includes(thinking)) {
      clickEmoji = thinking;
    }
    if (emoji.includes(wink)) {
      clickEmoji = wink;
    }
    if (emoji.includes(slight_smile)) {
      clickEmoji = slight_smile;
    }
    if (emoji.includes(smile)) {
      clickEmoji = smile;
    }
    if (emoji.includes(grinning)) {
      clickEmoji = grinning;
    }
    if (emoji.includes(relieved)) {
      clickEmoji = relieved;
    }
    if (emoji.includes(grin)) {
      clickEmoji = grin;
    }
    if (emoji.includes(hugging)) {
      clickEmoji = hugging;
    }
    if (emoji.includes(upside_down)) {
      clickEmoji = upside_down;
    }
    //select clicking components
    for (var m = 0; m < 2; m++) {
      for (var n = 0; n < 5; n++) {
        let btnz = message?.components[m].components[n];
        let btnEmojiName = btnz?.emoji?.name;
        let btnEmojiName2 = btnz?.emoji?.name?.toString();
        //duhhh
        await wait(200);
        if (btnEmojiName.includes(clickEmoji) || btnEmojiName2.includes(clickEmoji)) {
          await clickButton(message, btnz);
          console.log(chalk.cyan(`${client.user.username}: Successfully played the emoji minigame.`));
          isHavingInteraction = false;
        }
      }
    }
  }

  async function playMoleMan(message) {
    // defining emojiID
    const moleman_emojiID = "10229721471755264410";
    const blank_emojiID = "827651824739156030";
    const worm_emojiID = "864261394920898600";

    // defining game components
    let btnLeft = message?.components[0].components[0];
    let btnRight = message?.components[0].components[1];

    MolePosition = message?.embeds[0]?.description?.split("\n")[5];
    UpcomingPosition = message?.embeds[0]?.description?.split("\n")[4];
    UpcomingPosition2 = message?.embeds[0]?.description?.split("\n")[3];


    let findMole = MolePosition.split("><");
    let findSpace = UpcomingPosition.split("><");
    let findSpace2 = UpcomingPosition2.split("><");


    for (var i = 0; i < 3; i++) {
      if (findMole[i].includes(moleman_emojiID)) {
        MolePositionID = i;
      }
      if (findSpace[i].includes(blank_emojiID)) {
        UpcomingPositionID = i;
      }
      if (findSpace2[i].includes(worm_emojiID)) {
        if (findSpace2[i].includes(blank_emojiID)) {
          UpcomingPositionID2 = i;
        }
      }
    }
    // defining positions
    if (findSpace[0].includes(blank_emojiID) && findSpace[1].includes(blank_emojiID) && findSpace[2].includes(blank_emojiID)) {
      switch (UpcomingPositionID2) {
        case 0:
          switch (MolePositionID) {
            default:
              console.log(client.user.username + ": playing MoleMan minigame: stayed still.");
              return;
            case 1:
              await clickButton(message, btnLeft);
              console.log(client.user.username + ": playing MoleMan minigame: moved Left once.");
              return;
            case 2:
              await clickButton(message, btnLeft);
              await wait(300);
              await clickButton(message, btnLeft);
              console.log(client.user.username + ": playing MoleMan minigame: moved Left twice.");
              return;
          }
        case 1:
          switch (MolePositionID) {
            case 0:
              await clickButton(message, btnRight);
              console.log(client.user.username + ": playing MoleMan minigame: moved Right once.");
              return;
            default:
              console.log(client.user.username + ": playing MoleMan minigame: stayed still.");
              return;
            case 2:
              await clickButton(message, btnLeft);
              console.log(client.user.username + ": playing MoleMan minigame: moved Left once.");
              return;
          }
        case 2:
          switch (MolePositionID) {
            case 0:
              await clickButton(message, btnRight);
              await wait(300);
              await clickButton(message, btnRight);
              console.log(client.user.username + ": playing MoleMan minigame: moved Right twice.");
              return;
            case 1:
              await clickButton(message, btnRight);
              console.log(client.user.username + ": playing MoleMan minigame: moved Right once.");
              return;
            default:
              console.log(client.user.username + ": playing MoleMan minigame: stayed still.");
              return;
          }
        default:
          return;
      }
    }
    if (findSpace[0].includes(blank_emojiID) || findSpace[1].includes(blank_emojiID) || findSpace[2].includes(blank_emojiID)) {
      switch (UpcomingPositionID) {
        case 0:
          switch (MolePositionID) {
            default:
              console.log(client.user.username + ": playing MoleMan minigame: stayed still.");
              return;
            case 1:
              await clickButton(message, btnLeft);
              console.log(client.user.username + ": playing MoleMan minigame: moved Left once.");
              return;
            case 2:
              await clickButton(message, btnLeft);
              await wait(300);
              await clickButton(message, btnLeft);
              console.log(client.user.username + ": playing MoleMan minigame: moved Left twice.");
              return;
          }
        case 1:
          switch (MolePositionID) {
            case 0:
              await clickButton(message, btnRight);
              console.log(client.user.username + ": playing MoleMan minigame: moved Right once.");
              return;
            default:
              console.log(client.user.username + ": playing MoleMan minigame: stayed still.");
              return;
            case 2:
              await clickButton(message, btnLeft);
              console.log(client.user.username + ": playing MoleMan minigame: moved Left once.");
              return;
          }
        case 2:
          switch (MolePositionID) {
            case 0:
              await clickButton(message, btnRight);
              await wait(300);
              await clickButton(message, btnRight);
              console.log(client.user.username + ": playing MoleMan minigame: moved Right twice.");
              return;
            case 1:
              await clickButton(message, btnRight);
              console.log(client.user.username + ": playing MoleMan minigame: moved Right once.");
              return;
            default:
              console.log(client.user.username + ": playing MoleMan minigame: stayed still.");
              return;
          }
        default:
          return;
      }
    }
  }




  async function randomCommand(onGoingCommands, channel, client) {
    const commands = config.commands;
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    if (botNotFreeCount > 7) {
      botNotFreeCount = 0;
      isBotFree = true;
      await channel.sendSlash(botid, "deposit", "max");
      console.log(client.user.username + ": Deposited all coins.")
    }
    if (!isBotFree) return botNotFreeCount++;
    let command = randomCommand.command;
    if (isDeadMeme && command == "postmemes") return;
    if (onGoingCommands.includes(command)) return;

    if (isPlayingAdventure) return;
    if (isHavingInteraction) return;
    if (command === "search" || command === "crime" || command === "highlow" || command === "trivia" || command === "postmemes" || command === "stream" || command === "scratch") isBotFree = false;
    await channel.sendSlash(botid, command);
    if (config.devMode) console.log(`${chalk.magentaBright(client.user.username)}: ${chalk.blue(command)}`);
    onGoingCommands.push(command);

    setTimeout(() => {
      removeAllInstances(onGoingCommands, command);
    }, randomInt(randomCommand.cooldown * 0.9, randomCommand.cooldown * 1.1));
  }

  function removeAllInstances(arr, item) {
    for (var i = arr.length; i--;) {
      if (arr[i] === item) arr.splice(i, 1);
    }
  }

  async function main(onGoingCommands, channel, client, isOnBreak, isHavingCaptcha) {
    var commandCooldown = randomInt(config.cooldowns.commandInterval.minDelay, config.cooldowns.commandInterval.maxDelay);
    var shortBreakCooldown = randomInt(config.cooldowns.shortBreak.minDelay, config.cooldowns.shortBreak.maxDelay);

    var longBreakCooldown = randomInt(config.cooldowns.longBreak.minDelay, config.cooldowns.longBreak.maxDelay);
    if (isOnBreak) return;
    if (isHavingCaptcha) return;
    var actualDelay;
    randomCommand(onGoingCommands, channel, client);

    if (Math.random() < config.cooldowns.shortBreak.frequency) {
      actualDelay = shortBreakCooldown;
      isOnBreak = true;
      console.log(`${chalk.magentaBright(client.user.username)}: ${chalk.gray("Short break for")} ${chalk.yellowBright((shortBreakCooldown / 1000).toFixed(1))} seconds`);
    } else if (Math.random() < config.cooldowns.longBreak.frequency) {
      actualDelay = longBreakCooldown;
      isOnBreak = true;
      console.log(`${chalk.magentaBright(client.user.username)}: ${chalk.gray("Long break for")} ${chalk.yellowBright((longBreakCooldown / 1000).toFixed(1))} seconds`);
    } else {
      isOnBreak = false;
      actualDelay = commandCooldown;
    }

    setTimeout(() => {
      isOnBreak = false;
      main(onGoingCommands, channel, client, isOnBreak, isHavingCaptcha);
    }, actualDelay);
  }
}

async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function clickRandomButton(message, rows) {
  const components = message.components[randomInt(0, rows)]?.components;
  if (!components?.length) return;
  let btn = components[Math.floor(Math.random() * components?.length)];
  return message.clickButton(btn)
}

async function clickButton(message, btn) {
  setTimeout(async () => {
    await message.clickButton(btn?.customId);
  }, randomInt(config.cooldowns.buttonClickDelay.minDelay, config.cooldowns.buttonClickDelay.maxDelay));
}

async function findAnswer(question) {
  const trivia = require('./trivia.json');
  for (let i = 0; i < trivia.database.length; i++) {
    if (trivia.database[i].question.includes(question)) return trivia.database[i].correct_answer;
  }
}

function formatConsoleDate(date) {
  var hour = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  return chalk.cyanBright('[' + ((hour < 10) ? '0' + hour : hour) + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds) + '] - ')
}

var log = console.log;

console.log = function () {
  var first_parameter = arguments[0];
  var other_parameters = Array.prototype.slice.call(arguments, 1);

  const msg = stripAnsi([...arguments].join(' '));

  if (config?.webhookLogging && config?.webhook) {
    try {
      webhook.send(new MessageBuilder().setDescription(msg).setColor(`#2e3236`))
    } catch (err) {
      console.log(err)
    }
  }

  logs.push(`<p>${msg}</p>`);
  log.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};

var error = console.error;

console.error = function () {
  var first_parameter = arguments[0];
  var other_parameters = Array.prototype.slice.call(arguments, 1);

  const msg = stripAnsi([...arguments].join(' '));

  logs.push(`<p style="color:red;">${msg}</p>`);
  error.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};
