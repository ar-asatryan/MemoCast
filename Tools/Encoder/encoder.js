const async = require('async');
const child_process = require("child_process");
const mongoose = require('mongoose');
const models = require('./models/models');
const config = require('./config');
const math = require('mathjs');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const newEmailRabbitMQQueueName = 'memocast.new.email';

// connect to DB
// connect to database
mongoose.connect(config.db);

// connect to rabbit mq
let context = require('rabbit.js').createContext(config['rabbitmq-url']);

context.on("ready", function() {

    console.log('RabbitMQ: initialized');

    const newEmailPub = context.socket('PUSH');

    newEmailPub.connect(newEmailRabbitMQQueueName, () => {
        console.log('RabbitMQ: New email socket initialized');
    });

    const encodingRequestsSub = context.socket("WORKER", { prefetch: 1 });
    encodingRequestsSub.connect(config['rabbitmq-nodes']['new-encoding-request']);
    encodingRequestsSub.setEncoding("utf8");
    encodingRequestsSub.on("data", function (data) {
        let obj = JSON.parse(data);
        console.log('EVENT: new encoding request');
        console.log(obj);

        let sub = this;

        async.waterfall([
            // load encoding request
            function (callback) {
                models.EncodingRequest.findById(obj._id, function (err, item) {
                    if (err) { return callback(err); }
                    if (!item) { return callback({ message : 'Encoding request not found' })}
                    callback(null, item);
                });
            },
            // populate file and encoding preset
            function (request, callback) {
                var opts = [
                    { path : 'file' },
                    { path : 'encodingPreset' }
                ];
                models.EncodingRequest.populate(request, opts, callback)
            },
            // parsing media info
            function (request, callback) {
                let preset = request.encodingPreset;
                let file = request.file;
                let info = file['media-info'];
                let width = 0;
                let height = 0;
                let aspect = '1:1';
                let resultHeight = preset.height;
                let resultWidth = 0;
                // return callback(null, { });
                if (!info) {
                    return callback({ message : 'Media info undefined' }, { request : request });
                }
                for (let i = 0; i < info.length; i++) {
                    let track = info[i];
                    if (track.type === 'Video') {
                        if (track.Height) {
                            height = parseInt(track.Height.replace(' ', '').replace('pixels', ''));
                        }
                        if (track.Width) {
                            width = parseInt(track.Width.replace(' ', '').replace('pixels', ''));
                        }
                        if (track.Display_aspect_ratio) {
                            aspect = track.Display_aspect_ratio;
                        }
                        if (height != 0) {
                            resultWidth = width * resultHeight / height;
                            resultWidth = math.floor(resultWidth / 8) * 8;
                        }
                        let encodeOptions = { width : resultWidth, height : resultHeight, aspect : aspect };
                        // console.log(track);
                        return callback(null, { request : request, options : encodeOptions });
                    }
                }
                callback({ message : 'Video track not found!'});
            },
            // update request status --> encoding
            function (data, callback) {
                let query = { _id : data.request._id };
                let update = { $set : { status : 'encoding' }};
                models.EncodingRequest.findOneAndUpdate(
                    query,
                    update,
                    { upsert : false, new : false },
                    function (err, item) {
                        callback(err, data);
                    }
                );
            },
            // update video item status CREATED --> ENCODING
            function (data, callback) {
                let query = { _id : data.request.file.videoItem, status : 'created' };
                let update = { $set : { status : 'encoding' } };
                models.VideoItem.findOneAndUpdate(
                    query,
                    update,
                    { upsert : false, new : false },
                    function (err, item) {
                        callback(err, data);
                    }
                )
            },
            // encode file
            function functionName(data, callback) {
                let preset = data.request.encodingPreset;
                let options = data.options;
                let processParams = preset['ffmpeg-options'];
                let file = data.request.file;
                let input = file.path;
                let scale = options.width.toString() + ':' + options.height.toString();
                let aspect = options.aspect;
                let audio = data.request.audioTrack.toString();
                let d = (new Date()).getTime();
                let output = path.join('.tmp', d.toString() + '.mp4');
                let newProcessParams = processParams.map(function (item) {
                    return item.replace('$input$', input)
                        .replace('$output$', output)
                        .replace('$audio$', audio)
                        .replace('$aspect$', aspect)
                        .replace('$scale$', scale);
                });

                let ffmpeg = child_process.spawn('ffmpeg', newProcessParams, { detached : true });

                ffmpeg.stdout.on('data', function (data) {
                    console.log(data.toString());
                });

                let log = [];
                ffmpeg.stderr.on('data', (data) => {
                    log.push(data.toString());
                    console.log(data.toString());
                });

                ffmpeg.on('close', function (code) {

                    console.log('Encoding done with code %s', code);

                    if (code == 0) {
                        data.newFileName = output;
                        callback(null, data);
                    } else {
                        let err = {
                            message: 'ffmpeg error',
                            code : code
                        };
                        data.log = log;
                        callback(err, data);
                    }
                });
            },
            // get new file size
            function (data, callback) {
                fs.stat(data.newFileName, function (err, stats) {
                    if (err) {
                        return callback(err, data);
                    } else {
                        data.newFileStats = stats;
                        return callback(null, data);
                    }
                });
            },
            // copy file to stream storage
            function (data, callback) {
                let ext = path.extname(data.newFileName).toLowerCase();
                let d = (new Date()).getTime();
                let newFileName = d.toString() + ext;
                newFileName = path.join(config.streams, newFileName);
                fs.copy(data.newFileName, newFileName, function (err) {

                    // handle file copy error
                    if (!!err) {
                        return callback(err, data);
                    }

                    let tempFile = data.newFileName;
                    fs.remove(tempFile, err => {
                        console.log('temporary file REMOVED', tempFile);
                    });
                    data.newFileName = newFileName;
                    return callback(null, data);

                });
            },
            // inserting new stream file to DB
            function (data, callback) {
                let f = {
                    path: data.newFileName,
                    type: 'stream',
                    label: data.request.encodingPreset.label,
                    videoItem: data.request.file.videoItem,
                    size: data.newFileStats.size,
                    encodingPreset: data.request.encodingPreset._id
                }
                models.File.create(f, function (err, item) {
                    console.log(item);
                    data.newStreamFile = item;
                    return callback(err, data);
                });
            },
            // updating encoding request to 'complete' status
            function (data, callback) {
                data.request.error = null;
                data.request.log = null;
                data.request.status = 'complete';
                data.request.save(function (err) {
                    return callback(err, data);
                });
            },
            // update video item status ENCODING --> READY
            function (data, callback) {
                let query = { _id : data.request.file.videoItem, status : 'encoding' };
                let update = { $set : { status : 'ready' } };
                models.VideoItem.findOneAndUpdate(
                    query,
                    update,
                    { upsert : false, new : false },
                    function (err, item) {
                        return callback(err, data);
                    }
                )
            },
        ], function (err, result) {
            if (err) {
                console.log(err);

                let message = 'Error during encoding';

                if (typeof err === 'String') {
                    message = err;
                } else if (!!err.message) {
                    message = err.message;
                } else if (!!err.error) {
                    message = err.error;
                }

                const host = os.hostname();
                const id = obj._id.toString();

                const mail = {
                    to: 'dbahinsky@gmail.com, bahinsky@gmail.com',
                    subject: 'Encoding Error',
                    template: 'encoding-error',
                    context: {
                        message,
                        host,
                        id,
                    }
                }

                newEmailPub.write(JSON.stringify(mail), 'utf8');

                if (result) {
                    if (result.request) {
                        let request = result.request;
                        request.status = 'error';
                        request.error = err;
                        request.log = result.log;
                        request.save(function (err) {
                            console.log('Error during saving encoding request');
                            console.log(err);
                        });
                    }
                }
                
            } else {
                console.log('done.');
            }
            sub.ack();
        });

        // this.ack();
    });

});
