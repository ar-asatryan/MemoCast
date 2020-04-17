/**
 * 
 * @param {String} ip client's ip address
 * @returns decimal representation of ip address
 */
const parseIpAddress = ip => {
    let [a, b, c, d] = ip.replace('::ffff:', '').split('.');
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

module.exports = parseIpAddress;