const getRandom = (max = 256) => {
    return Math.floor(Math.random() * max);
}

const getRandomLocalIP = () => {
    return `127.0.${getRandom()}.${getRandom()}`;
}

module.exports = getRandomLocalIP;