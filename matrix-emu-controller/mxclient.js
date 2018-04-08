var sdk = require('matrix-js-sdk');
var exec = require('child_process').exec;

windowID = exec('xdotool search --name ' + 'PokemonRed', function(error, stdout) {
            windowID = stdout.trim();
            // console.log(key, windowID);
        });

var defaultKeyMap = {
      'up':'Up',
      'left':'Left',
      'down':'Down',
      'right':'Right',
      'a':'a','b':'b',
      'x':'x','y':'y',
      'start':'s','select':'e'
};

var homeserverURL = "http://matrixplaystwitch.com:8008";
var userID = "@emuwatcher:matrixplaystwitch.com";
var accessToken = "MDAyM2xvY2F0aW9uIG1hdHJpeHBsYXlzdHdpdGNoLmNvbQowMDEzaWRlbnRpZmllciBrZXkKMDAxMGNpZCBnZW4gPSAxCjAwMzRjaWQgdXNlcl9pZCA9IEBlbXV3YXRjaGVyOm1hdHJpeHBsYXlzdHdpdGNoLmNvbQowMDE2Y2lkIHR5cGUgPSBhY2Nlc3MKMDAyMWNpZCBub25jZSA9IDJ6SWRjT0k0akhITndTQEMKMDAyZnNpZ25hdHVyZSC-nRojR2kp2QtA7pqdY5mIv7VKBLX_x_cG9NSyxAouMgo"

var matrixClient = sdk.createClient({
    baseUrl: homeserverURL,
    accessToken: accessToken,
    userId: userID
});

matrixClient.on("Room.timeline", function(event, room, toStartOfTimeline) {
    if (toStartOfTimeline) {
        return; // don't print paginated results
    }
    if (event.getType() !== "m.room.message") {
        return; // only print messages
    }
    /*
     * Add delay processing here
     */
    parseCommands(event.getContent().body);
    console.log(
        // the room name will update with m.room.name events automatically
        "(%s) %s :: %s", room.name, event.getSender(), event.getContent().body
    );
});

matrixClient.startClient();

function parseCommands(text) {
  console.log("parsing " + text + " ...");

  key = defaultKeyMap[text];
  console.log("DA KEY IS: " + key);
  console.log(windowID);
  exec('xdotool windowactivate ' + windowID + ' && xdotool key ' + key)
}
