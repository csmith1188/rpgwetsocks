/*:
 * @author C Smith
 * @plugindesc Formbar Plugin
 *
 * @help
 * For interfacing with a remote Formbar
 *
 * @param Remote Address
 * @type text
 * @default localhost
 * @desc The root address to the formbar
 *
 * @param Remote Port
 * @type text
 * @default 5000
 * @desc The port to the formbar
 *
 * @param Recheck Flag Switch
 * @type number
 * @default 1
 * @desc The number of the switch that tracks if damage/healing was applied recently
 *
 * @param Boss HP Variable
 * @type number
 * @default 1
 * @desc The number of the variable that tracks the Boss's remaining HP percent.
 */

(function() {

  var params = PluginManager.parameters("Formbar");

  var rAddr = params["Remote Address"];
  var rPort = params["Remote Port"];
  var rCheck = params["HP Change Flag"];
  var rBossPerc = params["Boss HP Variable"];

  Game_Action.prototype.apply = function(target) {
    var result = target.result();
    this.subject().clearResult();
    result.clear();
    result.used = this.testApply(target);
    result.missed = (result.used && Math.random() >= this.itemHit(target));
    result.evaded = (!result.missed && Math.random() < this.itemEva(target));
    result.physical = this.isPhysical();
    result.drain = this.isDrain();
    if (result.isHit()) {
      if (this.item().damage.type > 0) {
        result.critical = (Math.random() < this.itemCri(target));
        var value = this.makeDamageValue(target, result.critical);
        this.executeDamage(target, value);
      }
      this.item().effects.forEach(function(effect) {
        this.applyItemEffect(target, effect);
      }, this);
      this.applyItemUserEffect(target);
    }
    $gameSwitches.setValue(rCheck, true);
  };

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'Formbar') {
      switch (args[0]) {
        case 'perc':
          perc = $gameVariables.value(rBossPerc)
          if ((perc <= 1 && perc >= 0) || (perc <= 100 && perc >= 0)) {
            let request = new XMLHttpRequest();
            console.log("http://" + rAddr + ":" + rPort + "/perc?amount=" + perc);
            request.open("GET", "http://" + rAddr + ":" + rPort + "/perc?amount=" + perc);
            request.send();
          } else {
            console.log("Bad arguments");
          }
          break;
      }
    };
  }
})();
