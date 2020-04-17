const appModulePath = require('app-module-path');
const path = require('path');

module.exports = () => {
    appModulePath.addPath(__dirname);
}
