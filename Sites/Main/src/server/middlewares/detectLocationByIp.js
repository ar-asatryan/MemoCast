const { IP2Location } = require('../../../../../Common/models');

/**
 * storage for fetched ip's
 */
const ip2CountryCache = { }

/**
 * 
 * @param {String} ip client's ip address
 * @returns decimal representation of ip address
 */
const parseIpAddress = ip => {
    let [a, b, c, d] = ip.split('.');
    a = Number.parseInt(a)
    b = Number.parseInt(b)
    c = Number.parseInt(c)
    d = Number.parseInt(d)
    return (
        a * 256 * 256 * 256 +
        b * 256 * 256 +
        c * 256 +
        d
    );
}

/**
 * get user country by id
 * @param {String} ip 
 */
const getLocationById = async ip => {
    try {

        // fetching country from cache
        const cacheValue = ip2CountryCache[ip];
        if (!!cacheValue) return cacheValue;

        // fetch location from db
        const parsedIpAddress = parseIpAddress(ip);
        const item = await IP2Location.findOne({
            ipFrom: { $lte: parsedIpAddress },
            ipTo: { $gte: parsedIpAddress }
        }).lean();

        if (!!item) {
            // save to cache and return location
            ip2CountryCache[ip] = item.countryCode;
            return item.countryCode;
        } else {
            return null;
        }
    } catch (err) {
        return null;
    }

}

module.exports = async (req, res, next) => {
    const ip = req.ip
    const location = await getLocationById(ip);
    if (!!location) {
        req.userLocation = location;
    }
    next();
}