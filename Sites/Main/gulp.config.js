module.exports = function() {

    var client = './src/client/';
    
    var config = {
        // js files for vet
        'alljs': [
                './src/**/*.js', 
                './*.js'
            ],
        // LESS files to compile
//        'less-src': client + 'css/less/**/*.less',
        'less-src': client + 'css/less/bootswatch.less',
        // LESS destination folder
        'less-dest': './src/client/css',
        // TEMP folder
        'tmp': './.tmp/'
    };
    
    return config;
};