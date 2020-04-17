var settings = require('./settings');

var context = require("rabbit.js").createContext(settings['rabbitmq-url']);

var svr = {
    connected: false,
    nodes: { }
};

// set all nodes status to FALSE (not connected)
for (var node in settings['rabbitmq-nodes']) {
    svr.nodes[node] = false;
}

context.on("ready", function() {

    svr.connected = true;
    console.log('RabbitMQ: initialized');

	var commentsPub = context.socket('PUSH');
    var objectRemovalPub = context.socket('PUSH');
    var newLikePub = context.socket('PUSH');
    var newFollowerPub = context.socket('PUSH');
    var deleteLikePub  = context.socket('PUSH');
    var newFeedbackPub = context.socket('PUSH');
    var newEncodingRequestPub = context.socket('PUSH');
    var newEmailPub = context.socket('PUSH');

    newEmailPub.connect(settings['rabbitmq-nodes']['new-email'], () => {
        console.log('RabbitMQ: New email socket initialized');
        svr.nodes['new-email'] = newEmailPub;
    });

	commentsPub.connect(settings['rabbitmq-nodes']['new-comment'],
        function() {
            console.log('RabbitMQ: NEW comment socket initialized');
            svr.nodes['new-comment'] = commentsPub;
    	});

    objectRemovalPub.connect(settings['rabbitmq-nodes']['delete-object'],
        function () {
            console.log('RabbitMQ: object removal socket initialized');
            svr.nodes['delete-object'] = objectRemovalPub;
        });

    newLikePub.connect(settings['rabbitmq-nodes']['new-like'], function () {
        console.log('RabbitMQ: NEW like socket initialized');
        svr.nodes['new-like'] = newLikePub;
    });

    newFollowerPub.connect(settings['rabbitmq-nodes']['new-follower'], function () {
        console.log('RabbitMQ: NEW follower socket initialized');
        svr.nodes['new-follower'] = newFollowerPub;
    });

    newFeedbackPub.connect(settings['rabbitmq-nodes']['new-feedback'], function () {
        console.log('RabbitMQ: NEW feedback socket initialized');
        svr.nodes['new-feedback'] = newFeedbackPub;
    });

    newEncodingRequestPub.connect(settings['rabbitmq-nodes']['new-encoding-request'], function () {
        console.log('RabbitMQ: NEW encoding request socket initialized');
        svr.nodes['new-encoding-request'] = newEncodingRequestPub;
    });

});

svr.sendEmail = function (mailMessage) {
    pushMessageToQueue('new-email', mailMessage);
};

svr.notifyNewFollow = function (userFollower) {
    pushMessageToQueue('new-follower', userFollower);
};

svr.notifyNewLike = function (videoLike) {
    pushMessageToQueue('new-like', videoLike);
};

svr.notifyNewComment = function (comment) {
    pushMessageToQueue('new-comment', comment);
};

svr.notifyObjectRemoval = function (obj) {
    pushMessageToQueue('delete-object', obj);
};

svr.notifyNewFeedback = function (obj) {
    pushMessageToQueue('new-feedback', obj);
};

svr.notifyNewEncodingRequest = function (obj) {
    pushMessageToQueue('new-encoding-request', obj);
}

function pushMessageToQueue(queue, obj) {
    if (svr.nodes[queue]) {
        var message = obj;
        svr.nodes[queue].write(JSON.stringify(message), 'utf8');
    }
};

module.exports = svr;
