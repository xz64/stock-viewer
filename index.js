var WebSocket = require('ws');
var request = require('request');

var wss = new WebSocket.Server({
  port: process.env.PORT || 8080
});

var stocks = ['GOOG'];

wss.on('connection', function(ws) {
  ws.send(JSON.stringify(stocks));

  ws.on('message', function(message) {
    if (message.length < 6
      && stocks.indexOf(message) === -1
      && /^[a-z0-9]+$/i.test(message)) {
      request({
        url: 'http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json',
        qs: {
          input: message
        }
      }, function(err, response, body) {
        if (!err) {
          var matchedStocks = JSON.parse(body);
          var i;

          for (i = 0; i < matchedStocks.length; i++) {
            if (matchedStocks[i].Symbol === message) {
              stocks.push(message);
              // update all clients with latest info
              wss.clients.forEach(function(client) {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(stocks));
                }
              });
              break;
            }
          }
        }
      });
    }
  });
});
