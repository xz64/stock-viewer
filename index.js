var WebSocket = require('ws');
var request = require('request');

var wss = new WebSocket.Server({
  port: process.env.PORT || 8080
});

var messageTypes = {
  REMOVE: 'REMOVE',
  ADD: 'ADD'
};

var stocks = ['GOOG'];

wss.on('connection', function(ws) {
  ws.send(JSON.stringify(stocks));

  ws.on('message', function(message) {
    var messageObj = JSON.parse(message);
    var symbol = messageObj.symbol;
    if (messageObj.type === messageTypes.REMOVE) {
      var index = stocks.indexOf(messageObj.symbol);
      if (index > -1) {
        stocks.splice(index, 1);
        // update all clients with latest info
        wss.clients.forEach(function(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(stocks));
          }
        });
      }
    } else if (messageObj.type === messageTypes.ADD) {
      if (symbol.length < 6
        && stocks.indexOf(symbol) === -1
        && /^[a-z0-9]+$/i.test(symbol)) {
        request({
          url: 'http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json',
          qs: {
            input: symbol
          }
        }, function(err, response, body) {
          if (!err) {
            var matchedStocks = JSON.parse(body);
            var i;

            for (i = 0; i < matchedStocks.length; i++) {
              if (matchedStocks[i].Symbol === symbol) {
                stocks.push(symbol);
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
    }
  });
});
