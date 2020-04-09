# Mangarock Downloader
NOTE: THIS CODE NO LONGER WORKS! Mangarock changed their api and I currently don't have the inclination to figure out their new (and more complicated) method. I suggest looking at another manga site (mangadex is a nice choice) for the manga you want, and then using one of the several existing mangadex downloaders.

Downloads manga from https://mangarock.com

usage: (requires nodejs)

```
npm install
```

Find the link you want, such as: https://mangarock.com/manga/mrs-serie-5555555/chapter/mrs-chapter-9999999 (Just an example url)
You grab the "mrs-serie-5555555" and then in the terminal, run

`node downloader.js 5555555`
or
`node downloader.js mrs-serie-5555555`

It will be downloaded to the output folder.
