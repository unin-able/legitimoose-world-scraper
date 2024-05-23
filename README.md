# legitimoose-world-scraper
Node.js Mineflayer bot to scrape the `legitimoose.com` server's worlds.

#### Note
This current repository does not include data scraped from the server, view my [legitimoose-world-data](https://github.com/unin-able/legitimoose-world-data) repository for non-accurate mode data.
## About
- Uses a script to scrape the server using a Mineflayer bot, and exports a `.csv` and `.json` file with the date in a folder named `world_data`
- Data exported includes:
  - UUID
  - World Name as a string JSON and as a string without formatting
  - Description as a string JSON and as a string without formatting
  - Item used for the icon
  - Owner as a string JSON and a string without formatting
  - Visits
  - Votes
  - Date created in Unix time
  - Resource pack enabled?
  - Player count (-1 if offline)
- With accurate mode enabled:
  - Resource pack URL
  - Resource pack hash
  - Saves `.dat` files?
  - Saves player data?
  - Date modified in Unix time (currently always `-1` due to a server bug)

## Usage
1. Run `npm install mineflayer`, `npm install prismarine-auth`, and `npm install prismarine-chat`
2. Run `node legitmoose-scraper.js`
 - (Optional) Run `node legitmoose-scraper.js true` for accurate mode (Very slow and unstable, but additionally scrapes the following: resource_pack_url, resource_pack_hash, saves_dat_files, saves_player_data, date_modified)
3. `YYYY-MM-DD-HH.csv` and `YYYY-MM-DD-HH.json` will be exported into the  `world_data` folder
