const models = require('config/models');
const presentation = require('config/presentation');

module.exports = async ({
    searchString,
    limit = 6,
    skip = 0,
    needPresentation = true
}) => {

    try {

        if (!searchString || searchString == '') {
            throw new Error('Empty search string');
        }

        var r = /[\d\wа-я]+/gi
        var matches = searchString.match(r);

        if (matches.length == 0) {
            throw new Error('Empty search string');
        }

        // searching in searchTitle field firstly
        let query = {
            isPublic: true,
            searchTitle: { $regex: searchString, $options: 'gi' },
        }

        const searchInTitle = await models.VideoTitle.find(query)
            .populate('categories')
            .sort({ 'views-count': -1, year: -1, createDate: -1 })
            .limit(limit)
            .skip(skip);

        let searchInMetadata = [];

        if (searchInTitle.length < limit) {

            // search in searchMetaText if needed
            query = {
                $and: matches.map(item => {
                    let r = { searchMetaText : { $regex: item, $options: 'gi' } }
                    return r
                }) ,
                isPublic: true
            };

            if (searchInTitle.length > 0) {
                query._id = { $nin: searchInTitle.map(item => item._id) };
            }

            searchInMetadata = await models.VideoTitle.find(query)
                .populate('categories')
                .sort({ 'views-count': -1, year: -1, createDate: -1 })
                .limit(limit)
                .skip(skip);
        }

        let data = [ ...searchInTitle, ...searchInMetadata ];

        if (needPresentation) {
            data = data.map(item => presentation.VideoTitle(item));
        }

        return data;
    } catch (err) {
        console.log({ err });
        throw err;
    }

};
