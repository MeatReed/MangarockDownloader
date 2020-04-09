const fs = require('fs');
const Manga = require('./smallMangaRock');

let id = process.argv[2];

if (!id.startsWith('mrs-serie-')) { // assume it's only numbers
	id = 'mrs-serie-' + id;
}

console.log("Story id:", id);

if (!fs.existsSync('output')) {
	fs.mkdirSync('output')
}

Manga.downloadManga(id);

// TODO: add link parsing for id
// TODO: add ability to continue download
// TODO: add ability to only download a certain page/chapter
// TODO: add ability to update story