const fetch = require('node-fetch');
const fs = require('fs');
const sanitize = require('sanitize-filename');

async function getData (id, country="United States") {
	country = encodeURIComponent(country);
	let res = await fetch(`https://api.mangarockhd.com/query/web400/info?oid=mrs-serie-${id}&last=0&country=${country}`);

	return (await res.json()).data;
}

async function getChapterData (oid, country="United States") {
	country = encodeURIComponent(country);
	let res = await fetch(`https://api.mangarockhd.com/query/web400/pages?oid=${oid}&country=${country}`);

	return (await res.json()).data; // arr
}

function decodeMRI (mriBuf) {
	var data = new Uint8Array(mriBuf.length + 15);
	var n = mriBuf.length + 7;

	data[0] = 82; // R
	data[1] = 73; // I
	data[2] = 70; // F
	data[3] = 70; // F
	data[7] = n >> 24 & 255;
	data[6] = n >> 16 & 255;
	data[5] = n >> 8 & 255;
	data[4] = 255 & n;
	data[8] = 87; // W
	data[9] = 69; // E
	data[10] = 66; // B
	data[11] = 80; // P
	data[12] = 86; // V
	data[13] = 80; // P
	data[14] = 56; // 8

	for (var r = 0; r < mriBuf.length; r++) {
		data[r + 15] = 101 ^ mriBuf[r];
	}

	let buf = Buffer.from(data.buffer);
	//fs.writeFileSync('temp/test.webp', buf);

	return buf;
}

function downloadManga (id) {
	return getData(id)
		.then(data => {
			return new Promise((resolve, reject) => {
				fs.mkdir('output/' + sanitize(data.name), err => {
					if (err) {
						return reject(err);
					}

					console.log("Made the folder for the download. 'output/" + sanitize(data.name) + "/'");
					
					resolve(data);
				});
			});
		})
		.then(async data => {
			let outDir = 'output/' + sanitize(data.name);

			for (let i = 0; i < data.chapters.length; i++) {
				await downloadChapter(data.chapters[i], outDir);
				console.log("\tDone with chapter #" + i + " '" + data.chapters[i].name + "' " + i + "/" + data.chapters.length);
			}
			/*
			let prev = new Promise(resolve => resolve());
			data.chapters.forEach((chapter, index) => {
				prev.then(() => downloadChapter(chapter, outDir))
				.then(() => {
					done++;
					console.log("\tDone with chapter #" + index + "'" + chapter.name + "' " + done + "/" + data.chapters.length);
				})
			});*/
		})
}

function downloadChapter (chapter, outDir) {
	return getChapterData(chapter.oid)
		.then(data => {
			console.log("\tStarting chapter '" + chapter.name + "'")
			return new Promise((resolve, reject) => {
				fs.mkdir(outDir + '/' + sanitize(chapter.name), err => {
					if (err) {
						return reject(err);
					}

					console.log("\tMade the folder for the chapter download. '" + outDir + '/' + sanitize(chapter.name) + "/'");

					resolve(data);
				});
			})
		})
		.then(async data => {
			const outDirComplete = outDir + '/' + sanitize(chapter.name) + '/';

			let promises = [];
			
			for (let i = 0; i < data.length; i++) {
				promises.push(downloadPage(data[i], outDirComplete + sanitize((i + 1) + '.webp')));
			}

			return Promise.all(promises);
			/*
			data.forEach((page, index) => {
				downloadPage(page, outDirComplete + sanitize(index + '.webp'))
					.then(() => {
						done++;
						console.log("\t\tDone with page #" + index + ", " + done + "/" + data.length);
					});
			});*/
		})
		.catch(err => {
			console.log("Sorry we encountered an error, exiting:", err);
			process.exit(1);
		})
}

function downloadPage (pageURL, outputDir) {
	return fetch(pageURL)
		.then(response => response.buffer())
		.then(buffer => {
			console.log("\t\tWriting To", outputDir);

			return new Promise((resolve, reject) => {
				fs.writeFile(outputDir, decodeMRI(buffer), err => {
					if (err) {
						return reject(err);
					}

					return resolve(outputDir);
				});
			});
		})
		.then(outDir => {
			console.log("\t\tWrote ", outputDir);
		})
		.catch(err => {
			console.log("Sorry, we encountered an error, exiting:", err);
			process.exit(1);
		});
}


module.exports = {
	getData,
	getChapterData,
	decodeMRI,
	downloadPage,
	downloadChapter,
	downloadManga,
};