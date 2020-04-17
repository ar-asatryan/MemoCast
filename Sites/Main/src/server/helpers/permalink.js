const convert = require('translitit-cyrillic-russian-to-latin');

const reg = /([0-9a-zа-я]+)/gi;

const permalink = str => {
    const input = (str || '');
    const match = input.match(reg);
    if (match.length > 0) {
        return match.map(item => {
            return convert(item).toLowerCase();
        }).join('-');
    } else {
        return convert(input.toLowerCase());
    }
    return (str || '').toLowerCase();
}

module.exports = permalink;