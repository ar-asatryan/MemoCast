
var $btLike = null;
var $tabVideoLikes = null;
var $panVideoLikes = null;
var $tabVideoViewers = null;
var $panVideoViewers = null;
var videoWasLiked = false;
var videoLikePersonTemplate = null;
var playerControlBar = null;
var $btVideoSub = null;
var $btVideoUnSub = null;
var prevNext = { prev: '', next: '' };

var loadVideoViewers = function () {
    var url = '/api/video/titles/' + videoTitleID + '/viewers';
    $.ajax(url, {
        method: 'GET',
        success: function (response) {
            var users = response;
            var $div = $('#div-viewers-users-list');
            var html = '';;
            Memocast.loadTemplateByName('person', function (err, temp) {
                users.forEach(function (item) {
                    html += temp(item);
                });
                $div.html(html);
            });

            if (users.length > 0) {
                Memocast.loadTemplateByName('video-nav-watchers', function (err, temp) {
                    $tabVideoViewers.html(temp({ count : users.length }));
                    $tabVideoViewers.show();
                    $panVideoViewers.show();
                });
            } else {
                $tabVideoViewers.hide();
                $panVideoViewers.hide();
            }
        }
    });
};

var initUserVideoSubsStatus = function () {
    if (currentUserID) {
        var url = '/api/video/subs/' + videoTitleID;
        $.ajax(url, {
            method: 'GET',
            success: function (response) {
                var exists = response.length > 0;
                var $active = !exists ? $btVideoSub : $btVideoUnSub;
                var $hidden = exists ? $btVideoSub : $btVideoUnSub;
                $active.removeClass('d-none');
                if (!$hidden.hasClass('d-none')) {
                    $hidden.addClass('d-none');
                }
                console.log(response);
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
};

var initUserLikeStatus = function () {

    if (currentUserID != '') {
        var url = '/api/video/likes/' + videoTitleID + '?my=yes';
        $.ajax(url, {
            method: 'GET',
            success: function (response) {
                setLikeStatus(response.length > 0);
            },
            error: function (err) {
                setLikeStatus(false);
            },
            complete: function () {
            }
        });
    } else {
        setLikeStatus(false);
    }
}

var likeClickHandler = function (evt) {

    Memocast.ensureLogin(function () {
        var url = '/api/video/likes/' + videoTitleID;
        if (videoWasLiked) {
            $.ajax(url, {
                method: 'DELETE',
                success: function (response) {
                    loadVideoLikes();
                }
            });
        } else {
            $.ajax(url, {
                method: 'POST',
                success: function (response) {
                    loadVideoLikes();
                }
            })
        }

        setLikeStatus(!videoWasLiked);
    });

};

var setLikeStatus = function (liked) {
    videoWasLiked = liked;
    var $btLiked = $('#bt-toggle-like');
    if (liked) {
        $btLiked.addClass('btn-rose');
        $btLiked.removeClass('btn-primary');
    } else {
        $btLiked.removeClass('btn-rose');
        $btLiked.addClass('btn-primary');
    }
}

var loadVideoLikes = function () {
    var url = '/api/video/likes/' + videoTitleID;
    $.ajax(url, {
        method: 'GET',
        success: function (response) {
            var users = response.map(function (item) {
                return item.user;
            });
            Memocast.loadTemplateByName('person', function (err, temp) {
                var $div = $('#div-likes-users-list');
                var html = '';
                users.forEach(function (item) {
                    html += temp(item);
                });
                $div.html(html);
            });

            if (users.length > 0) {
                Memocast.loadTemplateByName('video-nav-likes', function (err, temp) {
                    $tabVideoLikes.html(temp({ count : users.length }));
                    $tabVideoLikes.show();
                    $panVideoLikes.show();
                });
            } else {
                $tabVideoLikes.hide();
                $panVideoLikes.hide();
            }
        }
    });
}

var loadVideoComments = function() {
    var $comments = $('#div-comments');
    var loadAll = true;
    var url = loadAll ? '/api/comment/video-title/' + videoTitleID + '?limit=100' : '/api/comment/video-item/' + videoItemID ;

    $.ajax(url, {
        method: 'GET',
        success: function(response) {
            Memocast.loadTemplateByName('comments', function (err, temp) {
                $comments.html(temp(response));
            });
        }
    })
};

var updateVideoHistory = function(time, finished) {

    var url = '/api/video/history';

    var data = {
        VideoItem: videoItemID,
        time: time,
        finished: finished
    };

    $.ajax(url, {
        method: 'POST',
        data: data,
        success: function(response) {
        }
    })

};

var applyPrevNext = function(data) {

    if (data.prev !== '') {
        $('#div-video-prev').attr('href', data.prev);
        $('#div-video-prev').show();
    } else {
        $('#div-video-prev').hide();
    }

    if (data.next !== '') {
        $('#div-video-next').attr('href', data.next);
        $('#div-video-next').show();
    } else {
        $('#div-video-next').hide();
    }

    nextVideoItemID = data.nextID !== '' ? data.nextID : '';
    nextVideoItemTitle = data.nextTitle !== '' ? data.nextTitle : '';
};

var loadPrevNext = function () {
    // load prev / next
    var url = '/api/video/items/' + videoItemID + '/prevnext';
    $.ajax(url, {
        method: 'GET',
        success: function(response) {
            prevNext = response;
            applyPrevNext(prevNext);
        }
    });
}

loadPrevNext();

var loadVideoTracks = function() {

    var $player = $('#div-video-player');
    var url = '/api/video/items/' + videoItemID + '/tracks';
    $.ajax(url, {
        method: 'GET',
        success: function(response) {

            console.log(response);

            var sources = [];
            var subtitles = response.subtitles;

            response.videos.forEach(function (item) {
                if (Memocast.LegacyPlayback) {
                    // legacy stream
                    sources.push({ http: item.http, rtmp : item.rtmp });
                } else {
                    // hls
                    sources.push({
                        type: 'application/x-mpegURL',
                        src: item.hls,
                        label: item.label,
                        res: item.size
                    });
                }
            });

            if (Memocast.playbackAvailable) {

                if (!player) {
                    console.log({ legacy : Memocast.LegacyPlayback });

                    if (!Memocast.LegacyPlayback) {
                        Memocast.loadTemplateByName('player', function (err, temp) {
                            var html = temp({ videos : sources, subtitles : subtitles });
                            $player.html(html);

                            player = videojs('video-player',
                            {
                                sourceOrder: true,
                                sources: sources,
                                plugins: {
                        			videoJsResolutionSwitcher: {
                        				default: 'low',
                        				dynamicLabel: true
                        			},
                                    chromecast: {
                                      appId: 'B68FFEDC'
                                    }
                        		},
                                techOrder: ['html5']
                            }
                        ).ready(function() {

                            this.volume(getStorageValue('memocast-player-volume', 1.0));

                            // enable hotkeys
                            this.hotkeys({
                                volumeStep: 0.1,
                                seekStep: 5,
                                enableModifiersForNumbers: false,
                                enableMute: true,
                                enableVolumeScroll: false,
                                enableFullscreen: true,
                                enableNumbers: true,
                                alwaysCaptureHotkeys: false,
                                enableInactiveFocus: true
                            });

                            // player = this;
                            var totalTime = 0;
                            var currentTime = 0;
                            var finishedTime = 0;
                            var lastUpdatedTimeStamp = 0;
                            var minUpdatedTimeStamp = 60;
                            var historyIsUpdated = false;

                            var Button = videojs.getComponent('Button');

                            playerControlBar = player.getChild('controlBar');

                            // load history
                            if (Memocast.CurrentUserID) {
                                var url = '/api/video/history/item/' + videoItemID;
                                $.ajax(url, {
                                    method: 'GET',
                                    success: function(response) {
                                        if (!response.finished) {
                                            player.currentTime(response.time);
                                        }
                                        player.play();
                                    }
                                });
                            }

                            player.on('loadedmetadata', function(evt, data) {
                                totalTime = this.duration();
                                finishedTime = totalTime * (1 - (2 / 60));
                                if ((totalTime - finishedTime) > 120) {
                                    finishedTime = totalTime - 120;
                                }
                            });

                            player.on('timeupdate', function(evt) {
                                currentTime = this.currentTime();
                                if (((currentTime - lastUpdatedTimeStamp) >= minUpdatedTimeStamp) || !historyIsUpdated ) {
                                    historyIsUpdated = true;
                                    var finished = currentTime >= finishedTime;
                                    lastUpdatedTimeStamp = currentTime;
                                    updateVideoHistory(currentTime, finished);
                                }
                            });

                            player.on('ended', function(evt) {
                                console.log('ended');
                                console.log(prevNext);
                                updateVideoHistory(totalTime, true);
                                if (prevNext.next !== '') {
                                    // location.assign(prevNext.next);
                                }
                                if (prevNext.nextID !== '') {
                                    loadVideoItemByID(prevNext.nextID);
                                    if (prevNext.nextTitle) {
                                        $('.mmc-video-item-title').text(prevNext.nextTitle);
                                    }
                                    if (window.history && window.history.pushState) {
                                        window.history.pushState(null, null, prevNext.next);
                                    }
                                }
                            });

                            player.on('volumechange', function (evt) {
                                setStorageValue('memocast-player-volume', this.volume());
                            });

                        });
                    });
                    } else {
                        player = initJWPlayer(sources);
                    } // if (!Memocast.LegacyPlayback) ... else ...
                } // if !player ...
                else {
                    if (!Memocast.LegacyPlayback) {
                        player.src(sources);
                        player.play();
                    }
                    else {
                        player = null;
                        initJWPlayer(sources);
                        // var videoItem = sources[sources.length - 1].rtmp;
                        // player.load({
                        //     file: videoItem.file,
                        //     streamer: videoItem.streamer
                        // });
                        // player.play();
                    }
                }
            }
            else {
                Memocast.loadTemplateByName('no-playback', function (err, temp) {
                    $player.html(temp({ }));
                });
            }
        }
    });

};

var initJWPlayer = function (sources) {

    var $player = $('#div-video-player');
    var memocastPlayerID = "div-video-player";
    var memocastPlayerOptions = options;

    // player = this;
    var totalTime = 0;
    var currentTime = 0;
    var finishedTime = 0;
    var lastUpdatedTimeStamp = 0;
    var minUpdatedTimeStamp = 60;
    var historyIsUpdated = false;

    var plugins = { "timeslidertooltipplugin-3": {} };

    var videoItem = sources[sources.length - 1].rtmp;
    var httpVideoItem = sources[sources.length - 1].http;

    var options = {
        flashplayer: "/jwplayer/player.5.10.swf",
        autostart: true,
        smoothing: true,
        provider: "video",
        width: $player.width(),
        height: '480',
        // aspectratio: "16:9",
        provider: videoItem.provider,
        file: videoItem.file,
        streamer: videoItem.streamer,
        events: {
            onReady: function (evt) {
                console.log('jwPlayer is ready %o', evt);
                var pl = this;
                var finishedTime = pl.getDuration();
                console.log(pl, finishedTime);
                // load history
                if (Memocast.CurrentUserID) {
                    var url = '/api/video/history/item/' + videoItemID;
                    $.ajax(url, {
                        method: 'GET',
                        success: function(response) {
                            console.log('History %o', response);
                            if (!response.finished) {
                                pl.seek(response.time);
                            }
                        }
                    });
                }
            },
            onTime: function(event) {
                currentTime = event.position;
                var pl = this;
                var finishedTime = pl.getDuration();
                if (((currentTime - lastUpdatedTimeStamp) >= minUpdatedTimeStamp) || !historyIsUpdated ) {
                    console.log('update history');
                    historyIsUpdated = true;
                    var finished = currentTime >= finishedTime;
                    lastUpdatedTimeStamp = currentTime;
                    updateVideoHistory(currentTime, finished);
                }
            },
            onComplete: function(event) {
                console.log('ended');
                console.log(prevNext);
                updateVideoHistory(0, true);
                if (prevNext.nextID !== '') {
                    loadVideoItemByID(prevNext.nextID);
                    if (prevNext.nextTitle) {
                        $('.mmc-video-item-title').text(prevNext.nextTitle);
                    }
                    if (window.history && window.history.pushState) {
                        window.history.pushState(null, null, prevNext.next);
                    }
                }
            }
        },
        plugins: plugins,

        // stretching: "bestfit",

        modes: [
            {
                type: 'flash',
                src: '/jwplayer/player.5.10.swf'
            },
            {
                type: "html5",
                config: {
                    file: httpVideoItem,
                    provider: "video"
                }
            }
        ],
    };

    memocastPlayerOptions = options;

    jwplayer(memocastPlayerID).setup(options);

    player = jwplayer(memocastPlayerID);

        // if (Modernizr.localstorage) {
        //     var position = parseInt(localStorage.getItem(movieID));
        //     console.log("position = " + position);
        //     if (position > 0) {
        //         memocastPlayerObject.seek(position);
        //     }
        // }

}

var loadVideoItemByID = function(id) {
    videoItemID = id;
    nextVideoItemID = '';
    loadPrevNext();
    loadVideoTracks();
}

$(function() {


    $btLike = $('#bt-toggle-like');
    $btLike.on('click', likeClickHandler);

    $tabVideoLikes = $('#video-nav-likes');
    $panVideoLikes = $('#video-likes');
    $tabVideoViewers = $('#video-nav-viewers');
    $panVideoViewers = $('#video-viewers');

    $btVideoSub = $('#bt-video-sub');
    $btVideoUnSub = $('#bt-video-unsub');

    $btVideoSub.click(function () {
        if (currentUserID) {
            var url = '/api/video/subs/' + videoTitleID;
            $.ajax(url, {
                method: 'POST',
                success: function (response) {
                    console.log(response);
                },
                complete: function () {
                    initUserVideoSubsStatus();
                }
            });
        }
    });

    $btVideoUnSub.click(function () {
        if (currentUserID) {
            var url = '/api/video/subs/' + videoTitleID;
            $.ajax(url, {
                method: 'DELETE',
                success: function (response) {
                    console.log(response);
                },
                complete: function () {
                    initUserVideoSubsStatus();
                }
            });
        }
    });

    loadVideoComments();

    loadVideoTracks();

    initUserLikeStatus();

    SocketEstablishedHandler = loadVideoViewers;
    // setTimeout(loadVideoViewers, 5000);
    loadVideoLikes();

    $('#bt-modal-new-comment').click(function functionName() {

        Memocast.ensureLogin(function () {
            $('#modal-new-comment').modal('show');
        });

    });

    $('#modal-new-comment').on('shown.bs.modal', function (e) {
        $('#new-comment-body').focus();
    });

    $('.memocast-comment-form').submit(function(evt) {
       evt.preventDefault();

       var $id = $(this.elements.namedItem('video-item-id'));
       var $body = $(this.elements.namedItem('body'));
       videoItemID = $id.val();
       var body = $body.val();

       var data = {
           VideoItem: videoItemID,
           body: body
       };

       if (videoItemID !== '' && body !== '') {
           var url = '/api/comment';
           $.ajax(url, {
               method: 'POST',
               data: data,
               success: function(response) {
                   $body.val('');
                   $('#modal-new-comment').modal('hide');
                   Memocast.loadTemplateByName('comments', function (err, temp) {
                       $('#div-comments').html(temp([response]) + $('#div-comments').html());
                   });
               },
               error: function(err) {
               }
           })
       }
    });

    // hides .mmc-season-index if only one element
    var seasons = $('.mmc-season-index');
    if (seasons.length > 1) {
        seasons.show();
    }

    initUserVideoSubsStatus();
});
