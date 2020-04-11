const fetch = require('node-fetch')
const axios = require('axios')
const fs = require('fs')
const sanitize = require('sanitize-filename')
const XXH  = require('xxhashjs')

async function getData(id, country="France") {
	country = encodeURIComponent(country)
  return axios.get(`https://web.mangarockhd.com/query/web450/info?oid=${id}&last=0&country=${country}`)
    .then(res => {
      return res.data.data
    })
}

async function getChapterData(oid, country="France") {
	let url = `https://api.mangarockhd.com/query/android402/pagesv2?oid=${oid}&country=${country}`
	return axios.get(`http://api.mangarockhd.com/query/android402/pagesv2?oid=${oid}&country=${country}`, {
		headers: {
			qtoken: '4'+XXH.h64(`${url}:425bd0ffd40bfaefbd184ea34e85d5042c8e74716f6e9f770cefbadba395782b`,0).toString(16)
		}
	}).then(res => {
    return res.data.data
  })
}

function decodeMRI (mriBuf) {
	var data = new Uint8Array(mriBuf.length + 15)
	var n = mriBuf.length + 7

	data[0] = 82 // R
	data[1] = 73 // I
	data[2] = 70 // F
	data[3] = 70 // F
	data[7] = n >> 24 & 255
	data[6] = n >> 16 & 255
	data[5] = n >> 8 & 255
	data[4] = 255 & n
	data[8] = 87 // W
	data[9] = 69 // E
	data[10] = 66 // B
	data[11] = 80 // P
	data[12] = 86 // V
	data[13] = 80 // P
	data[14] = 56 // 8

	for (var r = 0; r < mriBuf.length; r++) {
		data[r + 15] = 101 ^ mriBuf[r]
	}

	let buf = Buffer.from(data.buffer)

	return buf
}

function downloadManga(id) {
	return getData(id)
		.then(data => {
			return new Promise((resolve, reject) => {
        if (!fs.existsSync('output/' + sanitize(data.name))) {
          fs.mkdir('output/' + sanitize(data.name), err => {
            if (err) {
              return reject(err)
            }

            console.log("Made the folder for the download. 'output/" + sanitize(data.name) + "/'")
            
            resolve(data)
          })
        } else {
          console.log("Updated the folder for the download. 'output/" + sanitize(data.name) + "/'")
            
          resolve(data)
        }
			})
		})
		.then(async data => {
      let outDir = 'output/' + sanitize(data.name)

      if (!fs.existsSync(outDir + '/Chapiters/')) {
        fs.mkdirSync(outDir + '/Chapiters/')
      }

      if (!fs.existsSync(outDir + '/Artworks/')) {
        fs.mkdirSync(outDir + '/Artworks/')
      }
      
      fs.writeFile(outDir + '/info.json', JSON.stringify(data), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.")
            return console.log(err)
        }
     
        console.log("JSON file has been saved.")
      })

      await downloadThumbnail(data.thumbnail, outDir)
      await downloadCover(data.cover, outDir)

      for (let i = 0; i < data.artworks.length; i++) {
				await downloadArtWorks(data.artworks[i], outDir + '/Artworks', i)
				console.log("\tDone with artwork #" + i + " '" + data.artworks[i] + "' " + i + "/" + data.artworks.length)
      }
      
			for (let i = 0; i < data.chapters.length; i++) {
				await downloadChapter(data.chapters[i], outDir)
				console.log("\tDone with chapter #" + i + " '" + data.chapters[i].name + "' " + i + "/" + data.chapters.length)
      }

      console.log('\tDone download all chapiters ' + sanitize(data.name))
		}).catch(err => {
      return
    })
}

async function downloadChapter(chapter, outDir) {
	return await getChapterData(chapter.oid)
		.then(data => {
			console.log("\tStarting chapter '" + chapter.name + "'")
			return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(outDir + '/Chapiters/' + sanitize(chapter.name))) {
          fs.mkdir(outDir + '/Chapiters/' + sanitize(chapter.name), err => {
            if (err) {
              return reject(err)
            }

            console.log("\tMade the folder for the chapter download. '" + outDir + '/Chapiters/' + sanitize(chapter.name) + "/'")

            resolve(data)
          })
        } else {
          console.log("\tUpdated the folder for the chapter download. '" + outDir + '/Chapiters/' + sanitize(chapter.name) + "/'")

          resolve(data)
        }
			})
		})
		.then(async data => {
			fs.readdir(outDir + '/Chapiters/' + sanitize(chapter.name), function(error, files) {
				if (files.length === data.length) return
			})

			const outDirComplete = outDir + '/Chapiters/' + sanitize(chapter.name) + '/'

			let promises = []
			
			for (let i = 0; i < data.length; i++) {
				if (fs.existsSync(outDirComplete + sanitize((i + 1) + '.webp'))) return
				promises.push(await downloadPage(data[i].url, outDirComplete + sanitize((i + 1) + '.webp')))
			}

			return Promise.all(promises)
		})
		.catch(err => {
      console.log("No access to chapters")
			return
		})
}

async function downloadPage(pageURL, outputDir) {
  await axios.get(pageURL, {
    responseType: 'arraybuffer' 
  }).then((result) => {
    console.log("\t\tWriting To", outputDir)
    return new Promise((resolve, reject) => {
      fs.writeFile(outputDir, decodeMRI(result.data), err => {
        if (err) {
          return reject(err)
        }
        console.log("\t\tWrote ", outputDir)
        return resolve(outputDir)
      })
    })
  })
  .catch(err => {
    console.log("Sorry, we encountered an error, exiting:", err)
		process.exit(1)
  })
		
}

function downloadThumbnail(url, outputDir) {
	fetch(url)
		.then(async buffer => {
			console.log("\t\nThumbnail To", outputDir)
      const dest = fs.createWriteStream(outputDir + '/thumbnail.png')
      await buffer.body.pipe(dest)
      console.log("\t\tWrote ", outputDir)
		})
		.catch(err => {
			console.log("No access to thumbnail")
			return
		})
}

function downloadCover(url, outputDir) {
	fetch(url)
		.then(async buffer => {
			console.log("\t\nCover To", outputDir)
      const dest = fs.createWriteStream(outputDir + '/cover.png')
      await buffer.body.pipe(dest)
      console.log("\t\tWrote ", outputDir)
		})
		.catch(err => {
			console.log("No access to cover")
			return
		})
}

function downloadArtWorks(url, outputDir, number) {
	fetch(url)
		.then(async buffer => {
			console.log(`\t\nArtWorks ${number} To`, outputDir)
      const dest = fs.createWriteStream(outputDir + `/${number}.png`)
      await buffer.body.pipe(dest)
      console.log("\t\tWrote ", outputDir)
		})
		.catch(err => {
			console.log("No access to artWorks")
			return
		})
}


module.exports = {
	getData,
	getChapterData,
	decodeMRI,
	downloadPage,
	downloadChapter,
  downloadManga,
  downloadThumbnail,
  downloadArtWorks
}
