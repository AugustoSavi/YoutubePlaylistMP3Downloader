const cors = require('cors')
const fs = require('fs');
const ytpl = require('ytpl');
const path = require('path');
const rimraf = require('rimraf');
const zip = require('zip-a-folder');
const ytdl = require('ytdl-core');
const fluentffmpeg = require('fluent-ffmpeg');

var express = require('express');
var app = express();
const port = 5000;
app.use(cors());

async function download(playlistLink) {
    const playlist = await ytpl(playlistLink);
    const playlistTitle = playlist.title.replace(/[/\\?%*:|"<> |^\\s+]/g, '-');
    if (!fs.existsSync(playlistTitle)) {
        fs.mkdirSync(playlistTitle);
    }
    for (element of playlist.items) {
        await saveMp3(playlistTitle, element).catch(() => {});
    }

    await zipDirectory(playlistTitle, playlistTitle);

    return playlistTitle;
}

function saveMp3(playlistTitle, element) {
    return new Promise((resolve, reject) => {
        var filename = path.join(
            playlistTitle,
            element.title.replace(/[/\\?%*:|"<>]/g, '-') + '.mp3'
        );
        if (fs.existsSync(filename)) {
            console.log("Skipped " + element.title + "as it already exists.");
            return resolve();
        }

        fluentffmpeg(ytdl(element.url, { 'filter': 'audioonly' }))
            .audioCodec('libmp3lame')
            .save(filename)
            .on('error', (err) => {
                reject();
            })
            .on('end', () => {
                resolve();
            })
            .run()
    });
}

async function zipDirectory(sourceDir, outPath) {
    await zip.zip(sourceDir, `${outPath}.zip`);
    rimraf.sync(sourceDir, {
        disableGlob: true
    },
        function () {
            console.log("done");
        }
    );
}


async function streamPlaylistYoutube(request, response, next) {
    const { linkPlaylist } = request.query;

    const pathToZip = await download(linkPlaylist);
    const readableStream = fs.createReadStream(`${pathToZip}.zip`);

    response.writeHead(200, {
        'Content-Type': 'application/zip'
    });

    //Pipe it into the HTTP response
    readableStream.pipe(response);
    readableStream.on('end', function () {
        rimraf.sync(`${pathToZip}.zip`, {
            disableGlob: true
        },
            function () {
                console.log("done");
            });
    })

    next();
};


app.get('/api/download', streamPlaylistYoutube, (request, response) => {
    response
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
