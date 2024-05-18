/* init */;
const fs = require('fs');
const mineflayer = require('mineflayer');
const {Authflow} = require('prismarine-auth');

var allWorldData = [];
var worldData = {};
var accurateMode = process.argv[2] === "true";

if(accurateMode) console.log("Accurate mode is enabled! (CAUTION: Very slow!) To disable, remove the \"true\" as an argument in your terminal.")
else console.log("Accurate mode is disabled! (The following data will not be scraped: resource_pack_url, resource_pack_hash, saves_dat_files, saves_player_data, date_modified)");
createBot();

/* functions */;
async function createBot() {
  console.log("Creating bot...");
  const authFlow = await new Authflow("legitmoose_scraper", "./");
  const sessionToken = await authFlow.getMinecraftJavaToken();
  const bot = mineflayer.createBot({
    host: 'legitimoose.com',
    port: 25565,
    auth: "microsoft",
    clientToken: sessionToken.token,
    version: "1.20.4"
  });
  const JsonText = require('prismarine-chat')(bot.registry);

  console.log("Created! Joining server...");
  bot.once('spawn', async () => {
    console.log('Bot spawned in successfully!');

    var window = await new Promise(async (resolve) => {
      bot.once("windowOpen", (_window) => {
        _window.once("updateSlot:26", () => {
          resolve(bot.currentWindow);
        });
      });
      bot.chat("/worlds");
    });
    await sleep(1000); // Prevent "Slow down!"
    var inventory = window.slots;
    const max = parseInt(window.title.value.match(/\d+/g)[1]);
    for(let page = -1; page <= max; page){
      page = parseInt(window.title.value.match(/\d+/g)[0]);
      inventory = window.slots;

      for (const [i, world] of inventory.slice(0, 27).entries()) {
        if(page === max && world === null) break; // if last world in menu, stop
        let nbt = world.nbt.value;
        let lore = nbt.display.value.Lore.value.value;

        worldData = {};
        worldData.uuid = lore.slice(-2)[0].slice(44, 80); // gets the UUID line, then slices the text to the UUID
        worldData.name = nbt.display.value.Name.value;
        worldData.name_plain = new JsonText(JSON.parse(worldData.name)).toString();
        worldData.description = lore.slice(-1)[0];
        worldData.description_plain = new JsonText(JSON.parse(worldData.description)).toString();
        worldData.item = world.name; // id of the world item 
        worldData.owner = lore[0].replace('by ', ''); // JSON text without the "by"
        worldData.owner_plain = new JsonText(JSON.parse(worldData.owner)).toString();
        [worldData.visits, worldData.votes] = lore[2].match(/\d+/g).map(num => parseInt(num, 10)); // gets both numbers in string, then parses both as ints
        worldData.date_created = Date.parse(lore[3].split(/Created |"}/)[1])/1000; // gets string between 'Created ' and '"}', then parses into unix time
        worldData.has_resource_pack = lore[4].includes("Resource pack included!");
        worldData.player_count = lore[1].includes("World offline") ? -1 : parseInt(lore[1].match(/\d+/)[0], 10);
        worldData.resource_pack_url = null;
        worldData.resource_pack_hash = null;
        worldData.saves_dat_files = null;
        worldData.saves_player_data = null;
        worldData.date_modified = null;
        
        if(accurateMode){ //resource_pack_url, resource_pack_hash, saves_dat_files, saves_player_data, date_modified
          await collectWorldInfo(worldData.uuid);
          await sleep(1000);
        }

        //console.log(worldData);
        allWorldData.push(worldData);
        console.log(` | Progress:`);
        console.log(` |   Page (${page}/${max})`); 
        console.log(` |   World (${page*(i+1)}/~${max*27}) (${((page * (i + 1)) / (max * 27) * 100).toFixed(2)}%)\n`);
      }
      if(page === max){
        break;
      }
      else{
        window = await new Promise(async (resolve) => {
          if(page === max - 1){
            bot.once("windowOpen", async (_window) => {
              console.log("On last page, waiting 5 seconds for all worlds to load"); // no event for when all worlds load, so just wait 5 seconds
              await sleep(5000);
              resolve(_window);
            });
            bot.simpleClick.leftMouse(32);
          }
          else{
            let handleMessage = async (message) => {
              if(message.json.text === "Slow down!"){
                console.log("Waiting 1 second...");
                await sleep(1000);
                bot.simpleClick.leftMouse(32);
              }
            };
            bot.on("message", handleMessage);
            bot.once("windowOpen", (_window) => {
              _window.once("updateSlot:26", async (_, newItem) => {
                bot.removeListener("message", handleMessage);
                resolve(_window);
              });
            });
        
            bot.simpleClick.leftMouse(32);
          }
        });
      }
    }
    console.log("Exporting JSON file...");
    fs.writeFileSync("./worlds.json", JSON.stringify(allWorldData));
    console.log("Exporting CSV file...");
    fs.writeFileSync("./worlds.csv", convertToCSV(allWorldData));
    console.log("Finished! Quitting...");
    bot.quit();
    process.exit();
  });
  function collectWorldInfo(uuid) {
    return new Promise((resolve) => {
      let handleMessage = async (message) => {
        if(message.json.text === "Slow down!"){
          await sleep(5000);
          bot.chat(`/worldinfo ${uuid} true`);
        }
        else if(message.json.extra && (message.json.translate != "%s" || message.json.extra[0].text != "[")){ // if actual world info message
          var json = message.json;

          if(json.text === "Resource Pack Url: "){
            worldData.resource_pack_url = json.extra[0].text === 'null' ? null : json.extra[0].text;
          }
          else if(json.text === "Resource Pack Hash: "){
            worldData.resource_pack_hash = json.extra[0].text === 'null' ? null : json.extra[0].text;
          }
          else if(json.text === "Save Dat Files/Player Data: "){
           [worldData.saves_dat_files, worldData.saves_player_data] = json.extra[0].text.split(', ').map(bool => bool === "true");
          }
          else if(json.text === "Player Count: "){
            worldData.player_count = parseInt(json.extra[0].text, 10);
          }
          else if(json.text === "Date Modified: "){    
            worldData.date_modified = "?"; // command returns nonsense, so set to "?" for now
            bot.removeListener('message', handleMessage);
            resolve();
          }
        }
      };
      bot.on('message', handleMessage);
      bot.chat(`/worldinfo ${uuid} true`);
    });
  }
  bot.on('message',  async (message) => {
    if(message.json.text === "Slow down!") console.error("\x1b[31mSlow down!\x1b[0m");
  });
  bot.on('error', (error) => {console.error(`Bot encountered an error: ${error}`);});
  bot.on('end', (error) => {console.error(`Bot disconnected from the server: ${error}`);});

  return bot;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function convertToCSV(object) {
  const headers = Object.keys(object[0]);
  const csv = object.map(row => headers.map(fieldName =>
    typeof row[fieldName] === 'string' 
    ? `"${row[fieldName].replace(/"/g, '""')}"` 
    : row[fieldName] === null ? "" : row[fieldName]
  ).join(','));
  csv.unshift(headers.join(','));
  return csv.join('\n');
}
