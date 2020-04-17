const models = require('config/models');

const getTopTags = ({ limit = 6 }) => {
    return models.VideoTitle.aggregate([
        {
            $match: {
                isPublic: true,
                tags: { $exists: true, $not: { $size: 0 } },
            },
        },
        {
            $project: {
                tags: 1,
                'views-count': 1
            },
        },
        // {
        //     $sort: { 'views-count': -1 },
        // },
        {
            $unwind: {
                path: '$tags',
                preserveNullAndEmptyArrays: false,
            },
        },
        {
            $match: { tags: { $ne: '' } },
        },
        {
            $group: {
                _id: '$tags',
                titles: {
                    $push: { id: '$_id', views: '$views-count' },
                },
                views: { $sum: '$views-count' },
            },
        },
        {
            $sort: { views: -1 },
        },
        {
            $limit: limit,
        }
    ]);
}

module.exports = {
    getTopTags,
};
