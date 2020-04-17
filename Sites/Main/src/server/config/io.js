let srv = {
    io: null,
    users: {}
};

srv.connect = function (server) {
    srv.io = require('socket.io')(server);

    srv.io.on('connection', function (socket) {
    //   socket.emit('news', { hello: 'world' });
      socket.on('message', function (data) {
        //   socket.broadcast.emit('news', data);
        srv.io.emit('message', data);
      });
      socket.on('my other event', function (data) {
      });
      socket.on('disconnect', function () {
          var socketID = this.id;
          var found = false;
          for (var userID in srv.users) {
              var sockets = srv.users[userID];
              for (var i = 0; i < sockets.length; i++) {
                  var item = sockets[i];
                  if (item.socketID == socketID) {
                      found = true;
                      break;
                  }
              }
              if (found) {
                  sockets = sockets.filter(function (item) {
                      item.socketID != socketID;
                  });
                  srv.users[userID] = sockets;
                  break;
              }
          }
      });
    });

    srv.users = {};
}

srv.sendMessageToUser = function (user, data) {
    let sockets = srv.users[user];
    if (sockets) {
        sockets.forEach(function (item) {
            srv.io.to(item.socketID).emit('message', data);
        })
    }
}

srv.getUsersByVideoTitleID = function (videoTitleID) {

    let users = [];

    for (let userID in srv.users) {
        let found = false;
        let sockets = srv.users[userID];
        for (let i = 0; i < sockets.length; i++) {
            let item = sockets[i];
            if (item.videoTitleID == videoTitleID) {
                found = true;
                break;
            }
        }
        if (found) {
            users.push(userID);
        }
    }

    return users;
};

srv.getCurrentVideoTitleIDByUserID = function (UserID) {
    let sockets = srv.users[UserID];
    if (sockets) {
        for (let i = 0; i < sockets.length; i++) {
            let socket = sockets[i];
            if (socket.videoTitleID) {
                return socket.videoTitleID;
            }
        }
    }

    return null;
}

srv.getOnlineUsers = function () {
    let users = [];
    for (let prop in srv.users) {
        let sockets = srv.users[prop];
        if (sockets) {
             if (sockets.length > 0) {
                 users.push(prop);
             }
        }
    }
    return users;
}

srv.getCurrentMovies = function () {

    let videos = { };
    let videosList = [];

    for (let userID in srv.users) {
        let found = false;
        let sockets = srv.users[userID];
        for (let i = 0; i < sockets.length; i++) {
            let item = sockets[i];
            if (item.videoTitleID) {
                let id = item.videoTitleID.toString();
                let video = videos[id];
                if (!video) {
                    video = { count: 1, id: id };
                    videos[id] = video;
                    videosList.push(video);
                } else {
                    video.count += 1;
                }
            }
        }
    }

    videosList.sort(function (a, b) {
        return b.count - a.count;
    });

    return videosList;
};

module.exports = srv;
