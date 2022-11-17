const fs = require('fs');
const ytpl = require('ytpl');
const path = require('path');
const rimraf = require("rimraf");
const zip = require('zip-a-folder');
const ytdl = require('ytdl-core');
const fluentffmpeg = require('fluent-ffmpeg');

var express = require('express');
var app = express();
const port = 3000;

async function downloadPlaylist(playlistLink) {
    try {
        return await download(playlistLink);
    } catch (err) {
        console.log(err);
    }
}

async function download(playlistLink) {
    const playlist = await ytpl(playlistLink);
    const playlistTitle = playlist.title.replace(/[/\\?%*:|"<> |^\\s+]/g, '-');
    if (!fs.existsSync(playlistTitle)) {
        fs.mkdirSync(playlistTitle);
    }
    for (element of playlist.items) {
        await saveMp3(playlistTitle, element);
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
            .on('end', () => {
                console.log(element.title + " downloaded");
                resolve();
            })
            .on('err', (err) => {
                return reject(err);
            })
            .run()
    });
}

async function zipDirectory(sourceDir, outPath) {
    await zip.zip(sourceDir, `${outPath}.zip`);
    // delete folder
    rimraf.sync(sourceDir, {
        disableGlob: true
    },
        function () {
            console.log("done");
        }
    );
}


//Filestream middleware that takes in the file path as the parameter
async function streamZip(request, response, next) {
    const { linkPlaylist } = request.query;

    const pathToZip = await downloadPlaylist(linkPlaylist);

    //Create a readable stream
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

//The route that you want to hit using the front-end to get the file
//Call the middleware and pass in the path to the zip
app.get('/download', streamZip, (request, response) => {
    //Send the data to the front end by calling res
    // response;
    response
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
