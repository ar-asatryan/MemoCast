const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// subscription schama
let subscriptionSchema = new Schema({
    createDate: { type: Date, default: Date.now },
    active: { type: Boolean },
    kind: { type: String, enum: [ 'recurring', 'onetime' ] },
    expire: { type: Date },
    notes: String,
    cybersource: Schema.Types.Mixed,
    paypal: Schema.Types.Mixed,
});

// user schama
let userSchema = new Schema({
    displayName: String,
    createDate: { type: Date, default: Date.now },
    userID: { type: String },
    email: String,
    adminNotes: String,
    phone: String,
    city: String,
    sex: { type: String, enum: ['male', 'female', 'unspecified'], default: 'unspecified' },
    birthDate: { type: Date, default: null },
    incognito: { type: Boolean, default: false },
    'external-id': Number,
    'secret-credentials': {
        secret: String
    },
    'local-credentials': {
        login: String,
        hash: String,
        salt: String
    },
    'vkontakte-credentials': Schema.Types.Mixed,
    'facebook-credentials': Schema.Types.Mixed,
    roles: { type: [String], enum: ["admin", "admin-media", "admin-users", "admin-settings"] },
    subs: { type: [subscriptionSchema] }
});
userSchema.index({ 'secret-credentials.secret' : 1 },
    { partialFilterExpression : { 'secret-credentials.secret': { $exists: true } }});
userSchema.index({ 'local-credentials.login' : 1 },
    { partialFilterExpression : { 'local-credentials.login': { $exists: true } }});
userSchema.index({ 'vkontakte-credentials.id' : 1 },
    { unique: true, partialFilterExpression : { 'vkontakte-credentials.id': { $exists: true } }});
userSchema.index({ 'facebook-credentials.id' : 1 },
    { unique: true, partialFilterExpression : { 'facebook-credentials.id': { $exists: true } }});
userSchema.index({ userID : 1 },
    { unique: true, partialFilterExpression: { userID : { $exists : true } }});
userSchema.index({ email: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ sex : 1 }, { partialFilterExpression: { sex : { $exists : true } }});
userSchema.index({ 'subs._id' : 1 },
    { partialFilterExpression : { 'subs._id': { $exists: true } }});
userSchema.index({ createDate : -1 });

// top category schema
let topCategorySchema = new Schema({
    title: String,
    order: Number,
    'external-id': Number,
    childs: [{ type: Schema.Types.ObjectId, ref: 'SubCategory' }]
});
topCategorySchema.index({ order : 1, title: 1 });
topCategorySchema.index({ 'external-id' : 1 },
    { partialFilterExpression : { 'external-id' : { $exists: true } } });
topCategorySchema.index({ childs: 1 });

// sub category schema
let subCategorySchema = new Schema({
    title: String,
    topCategory: { type: Schema.Types.ObjectId, ref: 'TopCategory' },
    order: Number,
    popular: { type : Boolean },
    public: { type : Boolean, default: true },
    kids: { type : Boolean, default: false },
    'external-id': Number,
    'external-top-category-id': Number
});
subCategorySchema.index({ public : 1, order : 1, title : 1 });
subCategorySchema.index({ topCategory : 1 });
subCategorySchema.index({ 'external-id' : 1 },
    { partialFilterExpression : { 'external-id' : { $exists: true } } });
subCategorySchema.index({ 'external-top-category-id' : 1 },
    { partialFilterExpression : { 'external-top-category-id' : { $exists: true } } });
subCategorySchema.index({ popular : 1 }, { partialFilterExpression: { popular : { $exists: true } } });

// video title schame
let videoTitleSchema = new Schema({
    title: String,
    akaTitle: String,
    searchTitle: String,
    categories: [{ type: Schema.Types.ObjectId, ref: 'SubCategory'}],
    languages: [String],
    countries: [String],
    sinopsis: String,
    createDate: { type: Date, default: Date.Now },
    isPublic: { type: Boolean, default: false },
    cast: String,
    writer: String,
    musicby: String,
    year: String,
    director: String,
    produced: String, // кем произведено, например "Мосфильм"
    producer: String,
    duration: Number,
    'external-media-id': Number,
    'external-mediachanel-id': Number,
    'external-user-id': Number,
    titleID: { type: String },
    adminNotes: String, // Заметки для внутреннего пользования
    host: String, // Ведущий
    guests: String, // Гости / Приглашенные звезды
    'views-count': Number, // Количество просмотров,
    'likes-count': Number, // Количество лайков
    'comments-count': Number, // Количество комментариев
    'user-rating': {
        rating: Number,
        votes: Number
    }
});
videoTitleSchema.index({ categories : 1 });
videoTitleSchema.index({ languages : 1 });
videoTitleSchema.index({ countries : 1 });
videoTitleSchema.index({ isPublic : 1, createDate: 1 });
videoTitleSchema.index({ year : 1 }, { partialFilterExpression : { year : { $exists : true } } });
videoTitleSchema.index({ 'external-media-id' : 1 },
    { partialFilterExpression : { 'external-media-id' : { $exists : true } } });
videoTitleSchema.index({ 'external-mediachanel-id' : 1 },
    { partialFilterExpression : { 'external-mediachanel-id' : { $exists : true } } });
videoTitleSchema.index({ 'external-user-id' : 1 },
    { partialFilterExpression : { 'external-user-id' : { $exists : true } } });
videoTitleSchema.index({ titleID : 1 },
    { partialFilterExpression : { titleID : { $exists : true } } });
videoTitleSchema.index({ 'views-count' : -1 },
    { partialFilterExpression : { 'views-count' : { $exists : true } } });
videoTitleSchema.methods.updataCommentStats = function () {
    models.VideoTitle.updateCommentStats(this._id);
}
videoTitleSchema.statics.updateCommentStats = function (id) {
    models.Comment.count({ videoTitle : id }, function (err, count) {
        let update = { $set: { 'comments-count': count } };
        models.VideoTitle.findByIdAndUpdate(id, update, { new : true }, function (err, data) {
        });
    });
};
videoTitleSchema.methods.updateLikesStats = function () {
    models.VideoTitle.updateLikesStats(this._id);
};
videoTitleSchema.statics.updateLikesStats = function (id) {
    models.VideoLike.count({ videoTitle : id }, function (err, count) {
        let update = { $set: { 'likes-count' : count } };
        models.VideoTitle.findByIdAndUpdate(id, update, { new : true }, function (err, data) {
        });
    });
};

let fileSchema = new Schema({
    path: String,
    type: {
        type: String,
        enum: ['original', 'stream']
    },
    label: String,
    size: Number,
    'media-id': Number,
    'file-id': Number,
    'media-info': Schema.Types.Mixed,
    videoItem: { type: Schema.Types.ObjectId, ref: 'VideoItem'},
    encodingPreset: { type : String, ref: 'EncodingPreset' }
});
fileSchema.index({ type: 1 });
fileSchema.index({ 'media-id' : 1 }, { partialFilterExpression : { 'media-id' : { $exists : true } } });
fileSchema.index({ 'file-id' : 1 }, { partialFilterExpression : { 'file-id' : { $exists : true } } });
fileSchema.index({ videoItem : 1 });

let airDateSchema = new Schema({
    year: Number,
    month: Number, // zero based
    day: Number,
    hour: Number,
    minute: Number
});

// video item schema
//    1	Created
//    2	Ready for encoding
//    3	Encoding
//    4	Ready
//    5	Error
//    6	Deleted
let videoItemSchema = new Schema({
    title: String,
    exportedTitle: String,
    createDate: { type: Date },
    status: {
        type: String,
        enum: ['ready', 'encoding', 'created', 'error', 'deleted']
    },
    categories: [{ type: Schema.Types.ObjectId, ref: 'SubCategory'}],
    languages: [String],
    isPublic: { type: Boolean, default: false },
    videoTitle: { type: Schema.Types.ObjectId, ref: 'VideoTitle' },
    year: String,
    seasonNumber: { type: Number, default: null }, // for public display
    seasonIndex: { type: Number, default: 1 }, // for internal usage
    seasonTitle: { type: String, default: null }, // for public display (ex. 'Bonus tracks')
    episodeNumber: { type: String, default: null }, // for public display (ex. episede 1, episodes 1-2)
    episodeIndex: { type: Number, default: 1 }, // for internal usage (ex. 1)
    episodePartNumber: { type: Number, default: null },
    airDate: Date, // actual for TV shows
    'external-media-id': Number,
    'external-mediachanel-id': Number,
    adminNotes: String, // Заметки для внутреннего пользования
    host: String, // Ведущий
    guests: String // Гости / Приглашенные звезды
});
videoItemSchema.index({ status : 1 });
videoItemSchema.index({ categories : 1 });
videoItemSchema.index({ languages : 1 });
videoItemSchema.index({ isPublic : 1 });
videoItemSchema.index({ videoTitle : 1 }, { partialFilterExpression : { videoTitle : { $exists : true } } });
videoItemSchema.index({ year : 1 }, { partialFilterExpression : { year : { $exists : true } } });
videoItemSchema.index({ seasonNumber : 1 }, { partialFilterExpression : { seasonNumber : { $exists : true } } });
videoItemSchema.index({ seasonIndex : 1 }, { partialFilterExpression : { seasonIndex : { $exists : true } } });
videoItemSchema.index({ episodeNumber : 1 }, { partialFilterExpression : { episodeNumber : { $exists : true } } });
videoItemSchema.index({ episodeIndex : 1 }, { partialFilterExpression : { episodeIndex : { $exists : true } } });
videoItemSchema.index({ 'external-media-id' : 1 },
    { partialFilterExpression : { 'external-media-id' : { $exists : true } } });
videoItemSchema.index({ 'external-mediachanel-id' : 1 },
    { partialFilterExpression : { 'external-mediachanel-id' : { $exists : true } } });

let commentSchema = new Schema({
    body: String,
    createDate: { type: Date },
    'external-user-id': Number,
    'external-media-id': Number,
    videoItem: { type: Schema.Types.ObjectId, ref: 'VideoItem' },
    videoTitle: { type: Schema.Types.ObjectId, ref: 'VideoTitle' },
    user: { type: Schema.Types.ObjectId, ref: 'User'}
});
commentSchema.index({ 'external-user-id' : 1 },
    { partialFilterExpression : { 'external-user-id' : { $exists : true } } });
commentSchema.index({ 'external-media-id' : 1 },
    { partialFilterExpression : { 'external-media-id' : { $exists : true } } });
commentSchema.index({ videoItem : 1 });
commentSchema.index({ videoTitle : 1 });
commentSchema.index({ user : 1 });
commentSchema.methods.updateVideoTitleStats = function (cb) {
    models.VideoTitle.updateCommentStats();
};

let videoHistorySchema = new Schema({
    updateDate: { type: Date },
    videoTitle: { type: Schema.Types.ObjectId, ref: 'VideoTitle' },
    user: { type: Schema.Types.ObjectId, ref: 'User'},
    itemTimeStamps: [{
        videoItem: { type: Schema.Types.ObjectId, ref: 'VideoItem' },
        finished: { type: Boolean },
        time: { type: Number },
        createDate: { type: Date }
    }]
});
videoHistorySchema.index({ videoTitle : 1 });
videoHistorySchema.index({ user: 1 });

let flashSchema = new Schema({
    createDate: { type: Date },
    title: { type: String },
    body: { type: String },
    url: { type: String },
    order: { type: Number },
    isPublic: { type: Boolean, default: false },
    img: { data: Buffer, contentType: String }
});
flashSchema.index({ isPublic : 1, order : 1 });

let imageSchema = new Schema({
    createDate: { type: Date },
    videoTitle: { type: Schema.Types.ObjectId, ref: 'VideoTitle' },
    videoItem: { type: Schema.Types.ObjectId, ref: 'VideoItem' },
    img: { data: Buffer, contentType: String }
});
imageSchema.index({ videoTitle : 1 },
    { partialFilterExpression : { videoTitle : { $exists : true } } });

let userImageSchema = new Schema({
    createDate: { type: Date },
    user: { type: Schema.Types.ObjectId, ref: 'User'},
    img: { data: Buffer, contentType: String }
});
userImageSchema.index({ user : 1 });

let personalMessageSchema = new Schema({
    createDate: { type: Date },
    body: { type: String },
    system: { type: Boolean, default: false },
    readed: { type: Boolean, default: false },
    repliable: { type: Boolean, default: true },
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    to: { type: Schema.Types.ObjectId, ref: 'User' },
    videoTitle: { type: Schema.Types.ObjectId, ref: 'VideoTitle' }
});
personalMessageSchema.index({ to : 1, from: 1 });
personalMessageSchema.index({ videoTitle : 1},
    { partialFilterExpression : { videoTitle : { $exists : true } } });

let videoLikeSchema = new Schema({
    createDate: { type: Date, default: Date.now  },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    videoTitle: { type: Schema.Types.ObjectId, ref: 'VideoTitle' }
});
videoLikeSchema.index({ user : 1 });
videoLikeSchema.index({ videoTitle : 1 });

let userFollowerSchema = new Schema({
    createDate: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    follower: { type: Schema.Types.ObjectId, ref: 'User' }
});
userFollowerSchema.index({ user : 1 });
userFollowerSchema.index({ follower : 1 });

let userVideoTitleRatingSchema = new Schema({
    createDate: { type: Date },
    rating: {
        type: Number,
        min: [0, 'Rating can be between 0 and 10 only'],
        max: [10, 'Rating can be between 0 and 10 only']
    },
    videoTitle: { type: Schema.Types.ObjectId, ref: 'VideoTitle' },
    user: { type: Schema.Types.ObjectId, ref: 'User' }
});
userVideoTitleRatingSchema.index({ rating : -1 });
userVideoTitleRatingSchema.index({ user : 1 });
userVideoTitleRatingSchema.index({ videoTitle : 1 });

let feedItemSchema = new Schema({
    createDate: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    obj: { type: Schema.Types.ObjectId },
    objType: { type: String, enum: ['comment', 'follower', 'like'] },
    comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    like: { type: Schema.Types.ObjectId, ref: 'VideoLike' },
    follower: { type: Schema.Types.ObjectId, ref: 'UserFollower' },

    videoTitle: { type: Schema.Types.ObjectId, ref: 'VideoTitle' },
    author: { type: Schema.Types.ObjectId, ref: 'User' },

    message: { type: String }
});
feedItemSchema.index({ user : 1 });
feedItemSchema.index({ obj : 1 },
    { partialFilterExpression : { obj : { $exists : true } } });
feedItemSchema.index({ objType : 1 });
feedItemSchema.index({ comment : 1 },
    { partialFilterExpression : { comment : { $exists : true } } });
feedItemSchema.index({ like : 1 },
    { partialFilterExpression : { like : { $exists : true } } });
feedItemSchema.index({ follower : 1 },
    { partialFilterExpression : { follower : { $exists : true } } });
feedItemSchema.index({ videoTitle : 1 },
    { partialFilterExpression : { videoTitle : { $exists : true } } });
feedItemSchema.index({ author : 1 },
    { partialFilterExpression : { author : { $exists : true } } });

let videoRequestSchema = new Schema({
    createDate: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    videoTitles: [ { type: Schema.Types.ObjectId, ref: 'VideoTitle' } ],
    videoItems: [ { type: Schema.Types.ObjectId, ref: 'VideoItem' } ],
    status: { type: String, enum: ['created', 'processing', 'rejected', 'complete'] },
    searchString: { type: String }, // original search string (if any)
    request: { type: String }, // user's request text
    response: { type: String } // memocast staff response (if any)
});
videoRequestSchema.index({ status : 1, createDate: -1 });

let feedbackDepartments = [
    {
        id: 'technical',
        title: 'Технические вопросы'
    },
    {
        id: 'account',
        title: 'Вопросы, связанные с учетной записью и платежами пользователей'
    }
];
let feedbackSchema = new Schema({
    createDate: { type: Date, default: Date.now },
    department: { type: String, enum: feedbackDepartments.map(function (item) {
        return item.id;
    }) },
    email: { type: String },
    body: { type: String }
});
feedbackSchema.index({ department: 1, createDate : -1 });

let cyberSourceRegionSchema = new Schema({
    code: String,
    name: String,
    country: String
});
let cyberSourceCountrySchema = new Schema({
    _id : String,
    name: String,
    top: { type: Boolean, default: false },
    default: { type: Boolean, default: false },
    regions: { type: [cyberSourceRegionSchema] }
});
cyberSourceCountrySchema.index({ top : 1, default : 1, name : 1 });

let payPalBillingPlanSchema = new Schema({
    plan: Schema.Types.Mixed,
    createDate: { type: Date, default: Date.now },
    notes: String,
    name: { type: String, enum: ['gold'] }
});
payPalBillingPlanSchema.index({ name : 1 });

let encodingPresetSchema = new Schema({
    _id: String,
    label: String,
    'ffmpeg-options': [String],
    height: Number
});
encodingPresetSchema.index({ height : 1 });

let encodingRequestSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    file: { type: Schema.Types.ObjectId, ref: 'File' },
    createDate: { type: Date, default: Date.now },
    encodingPreset: { type: String, ref: 'EncodingPreset' },
    audioTrack: Number,
    status: { type : String, enum: ['queued', 'encoding', 'error', 'complete'] },
    error: { type : Schema.Types.Mixed },
    log: { type : Schema.Types.Mixed }
});
encodingRequestSchema.index({ user : 1 });
encodingRequestSchema.index({ file : 1 });
encodingRequestSchema.index({ createDate : -1 });
encodingRequestSchema.index({ status : 1 });

// init models
let userModel = mongoose.model('User', userSchema);
let topCategoryModel = mongoose.model('TopCategory', topCategorySchema);
let subCategoryModel = mongoose.model('SubCategory', subCategorySchema);
let videoItemModel = mongoose.model('VideoItem', videoItemSchema);
let videoTitleModel = mongoose.model('VideoTitle', videoTitleSchema);
let fileModel = mongoose.model('File', fileSchema);
let deletedFileModel = mongoose.model('DeletedFile', fileSchema);
let commentModel = mongoose.model('Comment', commentSchema);
let flashModel = mongoose.model('Flash', flashSchema);
let videoHistoryModel = mongoose.model('VideoHistory', videoHistorySchema);
let userImageModel = mongoose.model('UserImage', userImageSchema);
let imageModel = mongoose.model('Image', imageSchema);
let personalMessageModel = mongoose.model('PersonalMessage', personalMessageSchema);
let userVideoTitleRatingModel = mongoose.model('UserVideoTitleRating', userVideoTitleRatingSchema);
let videoLikeModel = mongoose.model('VideoLike', videoLikeSchema);
let userFollowerModel = mongoose.model('UserFollower', userFollowerSchema);
let feedItemModel = mongoose.model('FeedItem', feedItemSchema);
let videoRequestModel = mongoose.model('VideoRequest', videoRequestSchema);
let feedbackModel = mongoose.model('Feedback', feedbackSchema);
let cyberSourceCountryModel = mongoose.model('CyberSourceCountry', cyberSourceCountrySchema);
let payPalBillingPlanModel = mongoose.model('PayPalBillingPlan', payPalBillingPlanSchema);
let encodingPresetModel = mongoose.model('EncodingPreset', encodingPresetSchema);
let encodingRequestModel = mongoose.model('EncodingRequest', encodingRequestSchema);

// wrap models in one package for module exports
let models = {
    User : userModel,
    UserImage: userImageModel,
    TopCategory: topCategoryModel,
    SubCategory: subCategoryModel,
    VideoTitle: videoTitleModel,
    VideoItem: videoItemModel,
    File: fileModel,
    DeletedFile: deletedFileModel,
    Comment: commentModel,
    Flash: flashModel,
    VideoHistory: videoHistoryModel,
    Image: imageModel,
    PersonalMessage: personalMessageModel,
    UserVideoTitleRating: userVideoTitleRatingModel,
    VideoLike: videoLikeModel,
    UserFollower: userFollowerModel,
    FeedItem: feedItemModel,
    VideoRequest: videoRequestModel,
    Feedback: feedbackModel,
    CyberSourceCountry: cyberSourceCountryModel,
    PayPalBillingPlan: payPalBillingPlanModel,
    EncodingPreset: encodingPresetModel,
    EncodingRequest: encodingRequestModel,
    Utils: {
        FeedbackDepartments: feedbackDepartments
    }
};

module.exports = models;
