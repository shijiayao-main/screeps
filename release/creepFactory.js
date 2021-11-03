
const Log = require("./logUtil");

var creepFactory = {

    /**
    * 这里更完善的写法是去检查资源情况和容量，根据当前状态判断需要建造的creep的组件
    * 现在先这么写之后再完善
    * @param {String} roleWorker 
    * @param {Int16Array} workerCount
    * @param {String} roleUpgrader 
    * @param {Int16Array} upgraderCount 
    */
    run: function (roleWorker, workerCount, roleUpgrader, upgraderCount) {

        var body = [
            WORK,
            CARRY,
            MOVE
        ]
        var neededEnergy = bodyNeedEnergy(body);
        if (Game.spawns['Spawn1'].store[RESOURCE_ENERGY] < neededEnergy) {
            return
        }
        Log.d('start build!! build body need: ' + neededEnergy + ' energy');
        // todo:
        // 检查能量, 一个资源最大3个creep进行开采
        // 如果正在建造, 则直接返回
        if (workerCount <= 0) {
            buildCreep(roleWorker, body, 'harvester');
        } else if (workerCount >= 1 && upgraderCount <= 0) {
            buildCreep(roleUpgrader, body, 'upgrater');
        } else if (workerCount <= 3) {
            buildCreep(roleWorker, body, 'harvester');
        } else if (upgraderCount <= 1) {
            buildCreep(roleUpgrader, body, 'upgrater');
        }
    }
}

/**
 * 
 * @param {String[]} body 
 */
function bodyNeedEnergy(body) {
    return body.length * 100
}

/**
 * 
 * @param {String} name 
 * @param {String[]} body
 * @param {String} workType
 */
function buildCreep(name, body, workType) {
    var spawn = Game.spawns['Spawn1'];
    if (spawn == null) {
        Log.d('Spawn1 is null');
        return;
    }
    var spawning = spawn.spawnCreep;
    if (spawning != null && spawning.remainingTime > 0) {
        Log.d('Spawn is building creep, wait!!');
        return;
    }
    var newName = name + Game.time;
    Log.d('Spawning new creep: ' + newName);
    spawn.spawnCreep(
        body,
        newName,
        {
            memory: {
                role: name,
                work: workType
            }
        }
    );
}

module.exports = creepFactory;