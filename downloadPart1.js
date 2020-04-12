const fs = require('fs');
const Manga = require('./smallMangaRock');
const axios = require('axios')

if (!fs.existsSync('output')) {
	fs.mkdirSync('output')
}

if (!fs.existsSync('skip.json')) {
	fs.writeFileSync('skip.json', JSON.stringify({"mangaSkip": []}))
}

const arg = process.argv[2]

axios
  .post(
    `https://web.mangarockhd.com/query/web450/mrs_filter?country=France`,
    {
      status: 'all',
      genres: {},
      rank: 'all',
      order: 'rank',
    }
  )
  .then(async (oidsResponse) => {
    let skipFile = JSON.parse(fs.readFileSync("skip.json"))
    for (let i = 0; i < oidsResponse.data.data.slice(0, oidsResponse.data.data.length / 2).length; i++) {
      if (arg === '--skip') {
        skipFile.mangaSkip.forEach(function (data, index, array) {
          if (oidsResponse.data.data[i] !== data) {
              return;
          }
          oidsResponse.data.data.splice(oidsResponse.data.data.indexOf(data), 1)
        })
      }
      await Manga.downloadManga(oidsResponse.data.data[i])
      console.log(`\tDone oid: ${oidsResponse.data.data[i]}`)
      skipFile.mangaSkip.push(oidsResponse.data.data[i])
      fs.writeFileSync('skip.json', JSON.stringify(skipFile))
    }
    console.log('Done !!')
  })
