const blockedCountries = [
    'UA',
    'RU'
]

module.exports = (req, res, next) => {

    const { userLocation } = req;
    if (!!userLocation) {
        const index = blockedCountries.indexOf(userLocation);
        const blocked = index !== -1;
        if (blocked) {
            return res.status(403).render('helpers/country-block', { layout: null });
        }
    }

    next();
}