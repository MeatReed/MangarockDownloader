const fs = require('fs');
const Manga = require('./smallMangaRock');
const axios = require('axios')

if (!fs.existsSync('output')) {
	fs.mkdirSync('output')
}

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
    for (let i = 0; i < oidsResponse.data.data.length; i++) {
      await Manga.downloadManga(oidsResponse.data.data[i])
      console.log(`\tDone oid: ${oidsResponse.data.data[i]}`)
    }
  })
