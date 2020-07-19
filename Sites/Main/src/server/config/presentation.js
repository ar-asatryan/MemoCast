const mongoose = require('mongoose');
const math = require('mathjs');
const settings = require('./settings');

let User = function(user) {
    if (!user) {
        return null;
    }

    if (mongoose.Types.ObjectId.isValid(user)) {
        return user;
    }

    let usr = {
        id: user['_id']
    };

    usr.displayName = user.displayName;

    if (user['local-credentials']) {
        if (!(usr.displayName !== '')) {
            usr.displayName = user['local-credentials']['login'];
        }
        usr.photo = 'http://lorempixel.com/100/100/people/';
    }

    if (user['vkontakte-credentials']) {
        let obj = user['vkontakte-credentials'];
        if (obj.displayName && !usr.displayName) {
            usr.displayName = obj.displayName;
        }
        usr.photo = obj.photo;
    }

    if (user['facebook-credentials']) {
        let obj = user['facebook-credentials'];
        if (obj.displayName && !usr.displayName) {
            usr.displayName = obj.displayName;
        }
        usr.photo = 'http://graph.facebook.com/v2.8/' + obj.id +  '/picture?height=100';
    }

    usr.photo = '/images/user/' + user['_id'] + '?width=120&height=120';
    usr.city = user.city;

    usr.url = '/people/' + user['_id'];
    if (user.userID !== '' && user.userID) {
        usr.url = '/people/' + user.userID;
        usr.userID = user.userID;
    }

    usr.sex = user['sex'];
    let bd = user['birthDate'];
    if (bd) {
        bd = new Date(bd.toString());
    }
    usr.age = bd ? calculateAge(bd.getMonth(), bd.getDate(), bd.getFullYear()) : null;

    usr.shortInfo = [usr.age, usr.city].reduce(function (prev, item, ind, arr) {
        if (item && item != '') {
            return prev == '' ? item.toString() : prev + ', ' + item.toString();
        } else {
            return prev;
        }
    }, '');

    usr.messagesUrl = usr.url + '?mode=messages';
    usr.incognito = user.incognito;

    return usr;
};

let Comment = function(comment) {

    if (!comment) {
        return null;
    }

    let cmt = { };

    cmt.videoTitle = VideoTitle(comment.videoTitle);
    cmt.videoItem = VideoItem(comment.videoItem);
    cmt.user = User(comment.user);

    cmt.id = comment['_id'];
    cmt.body = comment['body'];
    let date = comment['createDate'];
    if (date) {
        cmt.date = date.toISOString();
    } else {
        cmt.date = '';
    }

    return cmt;
};

let VideoTitle = function(videoTitle) {

    if (!videoTitle) {
        return null;
    }

    if (mongoose.Types.ObjectId.isValid(videoTitle)) {
        return videoTitle;
    }

    let item = {
        id: videoTitle['_id'],
        title: videoTitle.title,
        akaTitle: videoTitle.akaTitle,
        originalTitle: videoTitle.originalTitle,
        year: videoTitle.year,
        url: '/video/' + videoTitle['_id'],
        countries: videoTitle.countries,
        stats: {
            comments: videoTitle['comments-count'],
            likes: videoTitle['likes-count']
        },
        cast: videoTitle.cast,
        director: videoTitle.director,
        musicby: videoTitle.musicby,
        produced: videoTitle.produced,
        writer: videoTitle.writer,
        duration: videoTitle.duration,
        poster: settings['images-server'] + 'video-title/' + videoTitle['_id'],
        tags: videoTitle.tags && videoTitle.tags.length > 0 ?
            videoTitle.tags.filter(tag => tag !== '')
            : null,
        awards: videoTitle.awards
    };

    item.yearAndCountries = item.countries ? item.countries : [];
    if (item.year && item.year !== '') {
        item.yearAndCountries = [item.year, ...item.yearAndCountries];
    }

    if (item.duration) {
        item.duration = math.round(item.duration / 60 / 1000, 0);
    }

    let titles = item.title.split('/');
    if (titles.length > 0) {
        item.title = titles[titles.length - 1];
    }


    let TitleID = videoTitle['titleID'];
    if (TitleID && TitleID != '') {
        item.url = '/video/' + TitleID;
    }

    if (videoTitle.sinopsis) {
        item.sinopsis = videoTitle.sinopsis;
    }

    if (videoTitle.categories) {
        item.categories = videoTitle.categories.map(function(item) {
            return Category(item);
        });
    }

    return item;
};

let VideoItem = function(videoItem) {
    if (!videoItem || typeof videoItem === 'undefined') { return null; }
    if (typeof videoItem.permalink === 'undefined' || videoItem.permalink === '') {
        videoItem.permalink = `${videoItem.videoTitle}/${videoItem._id}`;
    }
    return videoItem;
};

let File = function(file) {

    // let streamServer = 'video.memocast.com';
    // let streamServer = 'kbahinsky.memocast.com:4433';
    // let streamServer = '38.126.119.138:443';
    let streamServer = 'booster.memocast.com:443';

    let filePath = file.path.replace('\\\\memocast.com\\stream\\', '');
    filePath = filePath.replace('/Users/bkv/Temp/streams/', '');
    filePath = filePath.replace(/\\/g, '/');

    // let httpPath = 'https://www.memocast.com' + file.path
    //     .replace('\\\\memocast.com\\stream\\', '/legacy/stream/')
    //     .replace(/\\/g, '/');
    let httpPath = 'https://stream3.memocast.com' + file.path
        .replace('\\\\memocast.com\\stream\\', '/legacystream/')
        .replace(/\\/g, '/');

    let rokuPath = 'http://38.111.148.167' + file.path
      .replace('\\\\memocast.com\\stream\\', '/legacystream/')
      .replace(/\\/g, '/');


    let adobeHDSPath = file.path
        .replace('\\\\memocast.com\\stream\\', '')
        .replace(/\\/g, '/')

    let item = {
        size: file['size'],
        label: file['label'],
        hls: 'https://' + streamServer + '/memocast/_definst_/mp4:' + filePath + '/playlist.m3u8',
        rtmp: {
            file: filePath, // rtmp link
            streamer: 'rtmp://booster.memocast.com:1935/memocast/',
            provider: 'rtmp'
        },
        http: httpPath,
        rokuPath,
    };

    return item;

};

let VideoTitles = function(videoTitles) {

    if (!videoTitles) {
        return [];
    }

    return videoTitles.map(function(item) {
        return VideoTitle(item);
    });

};

let VideoHistory = function(historyItems) {

    if (!historyItems) {
        return [];
    }

    return historyItems.map(function(item) {
        let historyItem = {
            updateDate: item.updateDate,
            videoTitle: VideoTitle(item.videoTitle)
        };
        return historyItem;
    });

};

let Category = function(categoryItem) {

    if (categoryItem['_id']) {

        let item = {
            id: categoryItem['_id'],
            title: categoryItem['title'],
            permalink: categoryItem['permalink'],
        };

        return item;

    } else {
        return { id: categoryItem }
    }
}

let PersonalMessage = function(personalMessage) {
    if (!personalMessage) {
        return null;
    }
    let msg = {
        id: personalMessage['_id'],
        createDate: personalMessage['createDate'],
        body: personalMessage['body'],
        system: personalMessage['system'],
        readed: personalMessage['readed'],
        repliable: personalMessage['repliable'],
        from: User(personalMessage['from']),
        to: User(personalMessage['to']),
        videoTitle: VideoTitle(personalMessage['videoTitle'])
    };

    if (msg.createDate) {
        msg.createDate = msg.createDate.toISOString();
    }

    return msg;
}

let VideoLike = function (videoLike) {

    if (!videoLike) {
        return null;
    }

    let lk = { id: videoLike['_id'] };
    if (videoLike.user) {
        lk.user = User(videoLike.user);
    }
    if (videoLike.videoTitle) {
        lk.video = VideoTitle(videoLike.videoTitle);
    }
    lk.createDate = videoLike['createDate'];

    return lk;
}

let UserFollower = function (userFollower) {
    if (!userFollower) {
        return null;
    }

    let obj = { createDate: userFollower.createDate };

    obj.id = userFollower._id;
    obj.user = User(userFollower.user);
    obj.follower = User(userFollower.follower);

    return obj;
};

let FeedItem = function (feedItem) {

    if (!feedItem) {
        return null;
    }

    let obj = {
        id: feedItem._id,
        createDate: feedItem.createDate,
        objType: feedItem.objType,
        author: User(feedItem.author),
        videoTitle: VideoTitle(feedItem.videoTitle),
        comment: Comment(feedItem.comment)
    };

    return obj;
};

let TopCategory = function (cat) {

    if (!cat) { return null; }

    let obj = {
        id : cat['_id'],
        title: cat['title'],
        order: cat['order']
    };

    if (cat.childs) {
        obj.childs = cat.childs.map(function (item) {
            return SubCategory(item);
        });
    }

    return obj;
}

let SubCategory = function (cat) {

    if (!cat) { return null; }

    let obj = { };

    if (!!cat['_id']) {
        obj.id = cat['_id'];
        obj.title = cat['title'];
        obj.order = cat['order'];
        obj.permalink = cat['permalink'];
        obj.meta = cat['meta'];
    } else {
        obj.id = cat;
    }

    return obj;
}

let VideoRequest = function (item) {
    if (!item) { return null; }
    var obj = {
        id: item._id,
        createDate: item.createDate,
        user: User(item.user),
        status: item.status,
        searchString: item.searchString,
        request: item.request,
        response: item.response
    };

    if (item.videoTitles) {
        obj.videoTitles = item.videoTitles.map(function (video) {
            return VideoTitle(video);
        });
    }

    if (item.videoItems) {
        obj.videoItems = item.videoItems.map(function (video) {
            return VideoItem(video);
        });
    }

    return obj;
}

module.exports = {
    User: User,
    Comment: Comment,
    VideoTitle: VideoTitle,
    VideoTitles: VideoTitles,
    VideoItem: VideoItem,
    File: File,
    VideoHistory: VideoHistory,
    PersonalMessage: PersonalMessage,
    VideoLike: VideoLike,
    VideoSubscription: VideoLike,
    UserFollower: UserFollower,
    FeedItem: FeedItem,
    TopCategory: TopCategory,
    SubCategory: SubCategory,
    VideoRequest: VideoRequest
};

function calculateAge(birthMonth, birthDay, birthYear)
{
  todayDate = new Date();
  todayYear = todayDate.getFullYear();
  todayMonth = todayDate.getMonth();
  todayDay = todayDate.getDate();
  age = todayYear - birthYear;

  if (todayMonth < birthMonth - 1)
  {
    age--;
  }

  if (birthMonth - 1 == todayMonth && todayDay < birthDay)
  {
    age--;
  }
  return age;
}
