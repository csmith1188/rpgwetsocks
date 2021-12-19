/*:
 * @author C Smith
 * @plugindesc Websockets Bossfight Plugin
 *
 * @help
 * Creates a four-player battle systems with websockets
 *
 * @param Remote Address
 * @type text
 * @default localhost
 * @desc The root address to the formbar
 *
 * @param Remote Port
 * @type text
 * @default 81
 * @desc The port to the formbar
 *
 * @param Host
 * @type text
 * @default true
 * @desc Is this instance of the game the host?
 *
 * @param Variable Block
 * @type number
 * @default 21
 * @desc The first number of the block of 4 variables that track multiplayer information.\nXXX+0 : clientID\nXXX+1 : Number of Players\nXXX+2: X locator\nXXX+3 " Y locator"
 *
 */

(function() {

  var params = PluginManager.parameters('Wetsock');

  var wAddr = params['Remote Address'];
  var wPort = params['Remote Port'];
  var isHost = params['Host'];
  var locBloc = params['Variable Block'];

  console.log(locBloc);
  var clientID = null;

  // The update interval is 1000 divided by the desired tickrate
  // 1000ms / 60 tick (updates per second) = 16.66
  const TICKRATE = 1000 / 60;

  //Open a websocket connection to the "Remote" server
  var ws = new WebSocket(`ws://${wAddr}:${wPort}`);

  ws.onopen = function() {
    console.log('Connected to websocket repeater.');
  }

  ws.onmessage = function(message) {
    let wsdata = JSON.parse(message.data);
    console.log(JSON.stringify(wsdata));
    //$gameSwitches.setValue(2, true);
    if (wsdata.type == 'id') {
      //CLIENTSIDE
      clientID = wsdata.content;
      console.log('Got an ID: ' + clientID);
    } else if (wsdata.type == 'message') {
      //CLIENTSIDE
      $gameMessage.add(wsdata.from + ': ' + wsdata.content)
    } else if (wsdata.type == 'location') {
      //CLIENTSIDE
      $gameVariables.setValue(locBloc, clientID);
      Object.keys(wsdata.content).forEach(function(key, index) {
        $gameVariables.setValue(parseInt(locBloc) + 1, Object.keys(wsdata.content).length);
        $gameVariables.setValue(parseInt(locBloc) + 5 + (index * 4), key);
        $gameVariables.setValue(parseInt(locBloc) + 6 + (index * 4), wsdata.content[key].x);
        $gameVariables.setValue(parseInt(locBloc) + 7 + (index * 4), wsdata.content[key].y);
      });
    } else if (wsdata.type == 'quiz_out') {
      //CLIENTSIDE
      $gameMessage.add(wsdata.content.question);
      $gameMap._interpreter.setupChoices([
        [wsdata.content.answers[0], wsdata.content.answers[1], wsdata.content.answers[2], wsdata.content.answers[3]], 0
      ]);
      $gameMessage.setChoiceCallback(function(responseIndex) {
        let repl_data = packData('quiz_in', 'server', clientID, {
          id: wsdata.content.id,
          repl_index: responseIndex
        });
        ws.send(JSON.stringify(repl_data));
      });
    }
  };

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    switch (command) {
      case 'Wetsock':
        ws.send(JSON.stringify(packData(args[0], 'server', clientID, args)));
        break;
      case 'Quizme':
        ws.send(JSON.stringify(packData('quizme', 'server', clientID, {})));
        break;
      case 'wsLoc':
        if ( /*ws.readyState == 1 && clientID*/ true) {
          ws.send(JSON.stringify(packData('location', 'server', clientID, {
            x: $gamePlayer.x,
            y: $gamePlayer.y
          })));
        } else {
          console.log('no connect');
        }
        break;
      case 'findIt':
        let manokin;
        $dataMap.events.forEach((thisEvent, index) => {
          if (thisEvent) {
            if (thisEvent.name == "findIt") {
              manokin = thisEvent;
            }
          }
        })
        manokin = JSON.stringify(manokin);
        manokin = JSON.parse(manokin);
        manokin.x++;
        $dataMap.events.push(manokin);
        $gameMap.refreshTileEvents();
        console.log($dataMap.events);
      default:
        break;
    }
  }

  function packData(type, to, from, content) {
    return {
      type: type,
      date: parseInt(new Date().valueOf()),
      to: to,
      from: from,
      content: content
    }
  }

})();
