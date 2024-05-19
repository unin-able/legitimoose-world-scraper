# legitimoose-world-scraper
Node.js Mineflayer bot to scrape the `legitimoose.com` server's worlds.

## Usage

1. Run `npm install mineflayer`, `npm install prismarine-auth`, and `npm install prismarine-chat`
2. Run `node legitmoose-scraper.js`
 - (Optional) Run `node legitmoose-scraper.js true` for accurate mode (Very slow and unstable, but additionally scrapes the following: resource_pack_url, resource_pack_hash, saves_dat_files, saves_player_data, date_modified)
3. 2 files will be exported, `worlds.csv` and `worlds.json`
