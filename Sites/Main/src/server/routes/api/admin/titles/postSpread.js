const models = require('config/models');
const vtsp = require('../../../../../../../../Common/selectors/videoTitleSearchPrepare');

module.exports = async (req, res) => {

    try {
        const { ids } = req.body;

        let spreads = [];

        for (let id of ids) {

            const spread = { id };
            spreads.push(spread);

            try {
                // get video title
                const videoTitle = await models.VideoTitle.findById(id);

                // get all categories
                const subCategories = await models.SubCategory.find({
                    'external-id': { $exists: true }
                });

                if (!videoTitle) {
                    spread.error = 'Not found';
                    continue;
                }

                // get video items
                const videoItems = await models.VideoItem.find({
                    videoTitle: id,
                    status: 'ready',
                });

                spread.items = [];

                // load likes for video title
                const likes = await models.VideoLike
                    .find({ videoTitle: videoTitle._id });
                // load subs for video title
                const subs = await models.VideoSubscription
                    .find({ videoTitle: videoTitle._id });
                // TEMP
                spread.likes = likes;
                spread.subs = subs;

                for (let videoItem of videoItems) {

                    const {
                        _id,
                        title,
                        year,
                        createDate,
                        ['external-media-id']: externalMediaId ,
                        ['external-mediachanel-id']: externalMediachanelId,
                        isPublic,
                    } = videoItem;

                    const {
                        cast,
                        description,
                        director,
                        author,
                        languages,
                        categories = [],
                        countries,
                    } = videoItem.meta || {};

                    let newDataForTitle = Object.assign({}, {
                        title,
                        year,
                        createDate,
                        'external-media-id': externalMediaId ,
                        'external-mediachanel-id': externalMediachanelId,
                        cast,
                        sinopsis: description,
                        director,
                        produced: author,
                        languages,
                        isPublic,
                        categories: categories.map(id => subCategories.find(
                            category => category['external-id'] == id
                        )).filter(item => !!item).map(category => category._id),
                        countries,
                    }, {
                        akaTitle: '',
                        searchTitle: '',
                        searchMetaText: [],
                        originalTitle: '',
                        awards: '',
                        tags: [ videoTitle.title ],
                        updateDate: new Date,
                        writer: '',
                        musicby: '',
                        producer: '',
                        duration: null,
                        titleID: null,
                        adminNotes: `SPREADED at ${new Date}`,
                        host: null,
                        guests: null,
                        'views-count': null, // Количество просмотров,
                        'likes-count': null, // Количество лайков
                        'comments-count': null, // Количество комментариев
                        'user-rating': null
                    });
                    newDataForTitle = Object.assign(newDataForTitle, vtsp(newDataForTitle));

                    // creating new video title
                    const newTitle = await models.VideoTitle.create(newDataForTitle);

                    // update video history for current video item

                    spreadVideoHistory({
                        title: videoTitle._id,
                        newTitle: newTitle._id,
                        item: videoItem._id,
                    });

                    // update comments
                    await spreadComments({
                        newTitle: newTitle._id,
                        item: videoItem._id,
                    });

                    spread.items.push({
                        item: videoItem._id,
                        title: newTitle._id,
                    });

                    // update likes, subs
                    spreadVideoObject({
                        items: likes,
                        model: models.VideoLike,
                        newTitle: newTitle._id,
                    });
                    spreadVideoObject({
                        items: subs,
                        model: models.VideoSubscription,
                        newTitle: newTitle._id,
                    });

                    // update current video item's video title
                    videoItem.videoTitle = newTitle._id;
                    await videoItem.save();
                }

                // remove video history for old title
                await models.VideoHistory.remove({ videoTitle: videoTitle._id });

                // remove likes for old title
                await models.VideoLike.remove({ videoTitle: videoTitle._id });
                // remove subs for old title
                await models.VideoSubscription.remove({ videoTitle: videoTitle._id });

                // update old video title
                Object.assign(videoTitle, {
                    isPublic: false,
                    title: `[SPREADED] ${videoTitle.title}`
                });
                await videoTitle.save();
            } catch(err) {
                spread.error = err;
            }

        } // for (let id in ids) { ...

        res.send(spreads);

    } catch (err) {
        res.error(err);
    }

}

const spreadVideoObject = async ({ items, model, newTitle }) => {
    for (let item of items) {
        await model.create({
            user: item.user,
            createDate: item.createDate,
            videoTitle: newTitle,
        });
    }
}

const spreadVideoHistory = async ({ title, newTitle, item }) => {
    // get history for current video item
    const histories = await aggregateHistory(title, item);

    // create new history items
    for (let history of histories) {
        const { user, ts } = history;
        const newHistoryItem = {
            updateDate: ts.createDate,
            videoTitle: newTitle,
            user,
            itemTimeStamps: [ ts ],
        };
        await models.VideoHistory.create(newHistoryItem);
    }
}

const spreadComments = ({ newTitle, item }) => {
    return models.Comment.update(
        { videoItem: item },
        { $set: { videoTitle: newTitle } },
        { multi: true },
    );
}

const aggregateHistory = (title, item) => {

    const query = [
        {
            $match: {
                videoTitle: title,
                'itemTimeStamps.videoItem': item,
            },
        },
        {
            $unwind: {
                path: '$itemTimeStamps',
                preserveNullAndEmptyArrays: false,
            },
        },
        {
            $match: {
                'itemTimeStamps.videoItem': item,
            },
        },
        {
            $project: { ts: '$itemTimeStamps', user: '$user' }
        }
    ];

    return models.VideoHistory.aggregate(query);
}
