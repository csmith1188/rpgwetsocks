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

  var params = PluginManager.parameters('worseplugin');

  var wAddr = params['Remote Address'];
  var wPort = params['Remote Port'];
  var isHost = params['Host'];
  var locBloc = params['Variable Block'];

  //Open a websocket connection to the "Remote" server
  var ws = new WebSocket(`ws://${wAddr}:${wPort}`);

  ws.onopen = function() {
    console.log('Connected to websocket repeater.');
    ws.send("I love slothesssesss");

  }

  ws.onmessage = function(message) {
    console.log(message);
  }

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    switch (command) {
      case 'Wetsock':
        ws.send("I love slothesssesss");
        break;
        case 'sendDylan':
        $gameMessage.setBackground(1)
        $gameMessage.add('Dylan has been received');
        $gameParty.gainItem($dataItems[5], 4);
        break;
        case 'testMessageA':
        ws.send("If you can read this, Riley is cringelord 100");
        ws.onmessage = function(message) {
          $gameMessage.add('if you can read this, riley is cringelord 100000000000')
        }
        break;
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
