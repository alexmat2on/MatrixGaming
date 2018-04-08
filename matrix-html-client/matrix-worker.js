var timeout = 200; // In milliseconds

var server;
var nextBatch;
var accessToken;

onmessage = function(e) {
    server = e.data[0];
    nextBatch = e.data[1];
    accessToken = e.data[2];

    liveSync();
}

function liveSync() {
    var url = server + "/_matrix/client/r0/sync?since=" + nextBatch + "&access_token=" + accessToken + "&timeout=" + timeout;
    url += "&full_state=true";
    ajax(url, null, function(data) {
        var jdata = JSON.parse(data);
        nextBatch = jdata.next_batch;
        postMessage(jdata);
    }, 'GET');
    setTimeout("liveSync()", timeout);
}

// AJAX Function
var ajax = function(url, data, callback, type) {
  var data_array, data_string, idx, req, value;
  if (data == null) {
    data = {};
  }
  if (callback == null) {
    callback = function() {};
  }
  if (type == null) {
    //default to a GET request
    type = 'GET';
  }
  data_array = [];
  for (idx in data) {
    value = data[idx];
    data_array.push("" + idx + "=" + value);
  }
  data_string = data_array.join("&");
  req = new XMLHttpRequest();
  req.open(type, url, false);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onreadystatechange = function() {
    if (req.readyState === 4 && req.status === 200) {
      return callback(req.responseText);
    }
  };
  req.send(data_string);
  return req;
};
