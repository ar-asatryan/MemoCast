const models = require('../../../../../Common/models');

const createUserSession = async (user, req) => {
    const ip = req.realIp;
    const session = new models.UserSession({
        user: user._id,
        ip,
        createDate: new Date(),
        isActive: true
    });
    const result = await session.save();
    result.user = user;
    return result;
}

module.exports = createUserSession;