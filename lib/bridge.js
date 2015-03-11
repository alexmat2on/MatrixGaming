"use strict";
var q = require("q");

var getMatrixUser = function(server, nick) {

};

var getMatrixRoom = function(server, channel) {

};

var getIrcUser = function(userId) {

};

var getIrcRoom = function(roomId) {

};

module.exports.hooks = {
    matrix: {
        onInvite: function(event) {
            // if this is for a virtual user:
            //  - join the room as the virtual user
            //  - if member list is just the virtual user and the inviter:
            //      - Clobber the PM room with the invited room ID
            //      - Store the PM room (IRC user / Matrix user tuple) forever
            //  - else:
            //      - whine that you don't do group chats and leave.
        },
        onJoin: function(event) {
            // if this is another Matrix user joining a PM room:
            //  - Whine that you don't do group chats and leave (virtual user)
        },
        onMessage: function(event) {
            // if message is in a tracked room, echo to IRC room.
            // if message is in a PM room, PM IRC user (from Matrix user)
            // else complain and send an error back (could be a stale PM room)
            
            // getIrcUser/getIrcRoom creates if necessary.
            // var ircUser = getIrcUser(event.user_id)
            // var ircRoom = getIrcRoom(event.room_id)
            // var ircMsg = getIrcMessage(event) (maps emotes/notices/etc, msg.type, msg.text)
            // ircUser.send(ircRoom, ircMsg)
        },
        onAliasQuery: function(roomAlias) {
            // if alias maps to a valid IRC server and channel:
            //  - create a matrix room
            //  - join the irc server (if haven't already)
            //  - join the channel
            //  - STORE THE NEW DYNAMIC MAPPING FOREVERMORE (so if you get
            //    restarted, you know to track this room)
            //  - respond OK
            return q.reject({});
        },
        onUserQuery: function(userId) {
            // if user ID maps to a valid IRC server and nick:
            //  - register the virtual user ID
            //  - Set display name / IRC-icon
            //  - respond OK
            return q.reject({});
        }
    },
    irc: {
        onMessage: function(server, from, to, msg) {
            console.log("onMessage: svr=%s from=%s to=%s msg=%s",
                server, from, to, msg);
            // if message is a PM to a Matrix user, send message in PM room,
            // creating one if need be.
            
            // getMatrixUser / getMatrixRoom creates if necessary
            // var matrixUser = getMatrixUser(server, from)
            // var matrixRoom = getMatrixRoom(server, to)
            // var matrixMsg = getMatrixMessage(msg)  (maps to m.emote/m.text, msg.type, msg.text)
            // matrixUser.send(matrixRoom, matrixMsg);
        }
    }
};