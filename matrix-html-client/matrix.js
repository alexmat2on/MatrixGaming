var user = "";
var pass = "";
var server = "http://matrixplaystwitch.com:8008";

var enableIntro = true;
var ralias = "#random:matrixplaystwitch.com";

var accessToken;
accessToken = localStorage.accesstoken;

var userID;
userID = localStorage.userID;

var rid;

var memberList;

var syncData;
var delSyncData;

var syncWorker;

$(document).ready(function() {
    if (!accessToken && enableIntro) {
        var introText = "Welcome! You are about to connect to the chatroom <b>" + ralias;
        introText += "</b> on the <a href='https://matrix.org'>Matrix</a> network.";
        introText += "<br><br>Enter <em><code>/connect xyz</code></em> to join the chatroom with the displayname 'xyz'"
        // introText += "<br>But, it looks like you're new here. To get started, ";
        // introText += "simply enter <code>/connect</code> to join the room as a guest user.";
        // introText += "<br><br>Alternatively, you can type <code>/register yourusername yourpassword</code> ";
        // introText += "to create a permanent Matrix account. A permanent Matrix account comes with several advantages: ";
        // introText += "<ul><li>You'll be able to use the same credentials to log into any Matrix-compatible app. ";
        // introText += "One great example of such an app is <a href='https://riot.im/app'>Riot.im</a>.</li>";
        // introText += "<li>You'll be able to join other public chatrooms in the network about ";
        // introText += "almost any topic imaginable</li>";
        // introText += "<li>You can use Matrix not just for public rooms, but for private group or 1-1 conversations as well</li>";
        // introText += "<li>Matrix has a bunch more features, like voice and ";
        // introText += "video chat, end-to-end encryption, bots, bridges to ";
        // introText += "other messaging services, and more!</li></ul>";
        // introText += "<br>Finally, if you already have a permanent Matrix ";
        // introText += "account, you may log into it by typing <code>/login username password</code>";
        $(".intro").html(introText)
    }

    $(document).bind('keydown',function(e){
        var enterChar = 13;
        if(e.keyCode == enterChar) {
            var message = document.getElementById("msg-prompt");
            console.log(message.value);

            if (message.value[0] == '/') {
                var cmdargs = message.value.split(" ");
                var result = execute(cmdargs[0], cmdargs);
                $(".command-output").html(result);
            } else {
                sendMessage(message.value);
            }
            message.value = "";
        }
    });
});

function login(user, pass) {
    return new Promise ((resolve, reject) => {
        $.ajax({
            url: server + "/_matrix/clienfalset/api/v1/login",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ user: user, password: pass, type: "m.login.password" }),
            dataType: "json",
            success: function(data) {
                if(!accessToken) {
                    accessToken = data.access_token;
                    localStorage.accesstoken = data.access_token;

                    userID = data.user_id;
                    localStorage.userID = data.user_id;
                }
                resolve(data);
                console.log(data);
            },
            error: function(err) {
                reject(err);
                console.log(err);
            }
        });
    })
}

function register(user, pass) {
    return new Promise ((resolve, reject) => {
        var payload = {};
        var acctType;
        if (user == undefined || pass == undefined) {
            acctType = "guest";
        } else {
            acctType = "user";
            payload = {
                "username" : user,
                "password" : pass
            }
        }
        $.ajax({
            url: server + "/_matrix/client/r0/register?kind=" + acctType,
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(payload),
            dataType: "json",
            success: function(data) {
                if(!accessToken) {
                    accessToken = data.access_token;
                    localStorage.accesstoken = data.access_token;

                    userID = data.user_id;
                    localStorage.userID = data.user_id;
                }
                resolve(data);
                console.log(data);
            },
            error: function(err) {
                reject(err);
                console.log(err);
            }
        });
    })
}

function setNick(nick) {
    return new Promise ((resolve, reject) => {
        var mxid = userID.split(":");
        var sendUrl = server + "/_matrix/client/r0/profile/%40" + mxid[0].substring(1) + "%3A" + mxid[1] + "/displayname";
        sendUrl += "?access_token=" + accessToken;
        console.log(sendUrl);
        $.ajax({
            url: sendUrl,
            type: "PUT",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                "displayname" : nick,
            }),
            dataType: "json",
            success: function(data) {
                resolve(data);
                sync().then((syncData) => {
                    getMemberDisplaynames((dnames) => {
                        memberList = dnames;
                    });
                })
                console.log(data);
            },
            error: function(err) {
                reject(err);
                console.log("ERROR: ")
                console.log(err);
            }
        });
    })
}

function sendMessage(msg) {
    var roomId = rid.substring(1);
    var sendUrl = server + "/_matrix/client/r0/rooms/%21" + roomId + "/send/m.room.message?access_token=" + accessToken;
    console.log("URL SENDMSG IS: " + sendUrl);
    $.ajax({
        url: sendUrl,
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            "msgtype" : "m.text",
            "body" : msg
        }),
        dataType: "json",
        success: function(data) {
            console.log(data);
        },
        error: function(err) {
            console.log("ERROR: " + err);
        }
    });
}

function getMemberDisplaynames(stateData) {
    return new Promise ((resolve, reject) => {
        if (syncData != undefined) {
            var roomState = stateData.rooms.join[rid].state.events;
            var displayNames = {};
            console.log(roomState);
            for (var i=0; i < roomState.length; i++) {
                if (roomState[i].type == "m.room.member") {
                    var dName = roomState[i].content.displayname;
                    if (dName) {
                        displayNames[roomState[i].sender] = roomState[i].content.displayname;
                    }
                }
            }
            resolve(displayNames);
        } else {
            reject("No sync data");
        }
    })
}

function getMessages(roomid, prevBatch) {
    return new Promise ((resolve, reject) => {
        var sendUrl = server + "/_matrix/client/r0/rooms/" + rid + "/messages";
        sendUrl += "?access_token=" + accessToken;
        sendUrl += "&start=" + prevBatch;
        sendUrl += "&dir=b";
        sendUrl += "&limit=25";
        console.log(sendUrl);
        $.ajax({
            url: sendUrl,
            type: "GET",
            success: function(data) {
                var messages = data;
                resolve(data);
                console.log(data);
            },
            error: function(err) {
                reject(err);
                console.log("ERROR: ")
                console.log(err);
            }
        });
    })
}

function joinRoom(roomAlias) {
    return new Promise ((resolve, reject) => {
        $.ajax({
            url: server + "/_matrix/client/r0/join/%23" + roomAlias.substring(1) + "?access_token=" + accessToken,
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ }),
            dataType: "json",
            success: function(data) {
                rid = data.room_id;
                resolve(data);
                // console.log(data);
            },
            error: function(err) {
                reject(err);
                console.log(err);
            }
        });
    })
}

function sync() {
    return new Promise ((resolve, reject) => {
        var sendUrl = server + "/_matrix/client/r0/sync?access_token=" + accessToken;
        sendUrl += "&full_state=true";
        $.ajax({
            url: sendUrl,
            type: "GET",
            success: function(data) {
                syncData = data;
                //displayMessages(data.rooms.join[rid].timeline.events);
                resolve(data);
                // console.log(data);
            },
            error: function(err) {
                // console.log(err);
            }
        });
    })
}

function displayMessages(timeline) {
    for (var i=0; i < timeline.length; i++) {
        if (timeline[i].type == "m.room.message") {
            // Create a new table row
            var tableRow = "<tr>";

            // Format date to display
            var msgTime = new Date(timeline[i].origin_server_ts);
            var displayTime = msgTime.getHours() + ":";
            displayTime += msgTime.getMinutes() + ":";
            displayTime += msgTime.getSeconds();

            // Format sender type
            var senderName = timeline[i].sender;
            if (memberList) {
                for (var mxid in memberList) {
                    if (senderName == mxid) {
                        senderName = memberList[mxid];
                    }
                }
            }

            // Row format: time, sender, message
            tableRow += "<td>" + displayTime + "</td>";
            tableRow += "<td>" + senderName + "</td>";
            tableRow += "<td>" + timeline[i].content.body + "</td>";

            // Add row to the table
            tableRow += "</tr>";
            $(".timeline").append(tableRow);
        }
    }
}

function logout() {
    return new Promise ((resolve, reject) => {
        var sendUrl = server + "/_matrix/client/r0/logout?access_token=" + accessToken;
        $.ajax({
            url: sendUrl,
            type: "POST",
            success: function(data) {
                resolve(data);
                console.log(data);
            },
            error: function(err) {
                console.log(err);
            }
        });
    })
}

function startWorker() {
    syncWorker = new Worker("matrix-worker.js");
    syncWorker.postMessage([server, syncData.next_batch, accessToken]);

    syncWorker.onmessage = function(e) {
        delSyncData = e.data;
        console.log(e.data);
        var newMessages = e.data.rooms.join[rid];
        if (newMessages) {
            getMemberDisplaynames(delSyncData).then((names) => {
                memberList = names;
                displayMessages(newMessages.timeline.events);
            });
        }
        console.log('Message received from matrix');
    }
}

function stopWorker() {
    if (syncWorker) {
        syncWorker.terminate();
        syncWorker = undefined;
    }
}

function execute(cmd, args) {
    var output;
    switch(cmd) {
        case "/register":
        register();
        output = "<br>registered as guest";
        break;

        case "/login":
        login(args[1], args[2]).then((ldata) => {
            connect();
        });
        output = "<br>logging in as: " + args[1];
        break;

        case "/connect":
        if (accessToken == undefined) {
            register().then((rdata) => {
                if (args[1]) {
                  setNick(args[1]);
                }
                connect();
            });
        } else {
            connect();
        }
        $(".intro").html("");
        output = "<br>connected to: " + ralias;
        break;

        case "/nick":
        setNick(args[1]);
        output ="<br>changed nick to: " + args[1];
        break;

        case "/exit":
        stopWorker();
        logout();
        localStorage.clear();
        userID = "";
        accessToken = "";
        output = "<br>no longer receiving updates to: " + ralias;
        break;

        default:
        output = "<br>Invalid command";
    }
    return output;
}

function connect() {
    joinRoom(ralias).then((jrdata) => {
        console.log("JOINROOM");
        console.log(jrdata);
        sync().then((sdata) => {
            console.log("SYNC");
            console.log(sdata);
            getMemberDisplaynames(syncData).then((names) => {
                memberList = names;
            });
            var pBatch = sdata.rooms.join[rid].timeline.prev_batch;
            getMessages(rid, pBatch).then((messages) => {
                displayMessages(messages.chunk.reverse());
                startWorker();
            })
        })
    });
}
