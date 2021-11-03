
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
    run: function (roleWorker, workerCount, roleUpgrader, upgraderCount, roleHarvester, harvesterCount) {

        Game.spawns['Spawn1'].memory.neededEnergyToBuild = true;

        var couldUseEnergyNum = Game.spawns['Spawn1'].room.energyAvailable;
        var body = buildBody(workerCount, harvesterCount);
        var neededEnergy = bodyNeedEnergy(body);

        if (couldUseEnergyNum < neededEnergy) {
            Log.d('fuck i need energy!! need: ' + neededEnergy + ', coule use: ' + couldUseEnergyNum)
            return
        }
        Log.d('start build!! build body need: ' + neededEnergy + ' energy');
        // todo:
        // 检查能量, 一个资源最大3个creep进行开采
        // 如果正在建造, 则直接返回
        if (harvesterCount <= 0) {
            buildCreep(roleHarvester, body, 'harvester');
        } else if (harvesterCount >= 1 && upgraderCount <= 0) {
            buildCreep(roleUpgrader, body, 'upgrater');
        } else if (harvesterCount < 2) {
            buildCreep(roleHarvester, body, 'harvester');
        } else if (upgraderCount < 2) {
            buildCreep(roleUpgrader, body, 'upgrater');
        } else if (harvesterCount < 3) {
        // } else if (harvesterCount < 4) {
            buildCreep(roleHarvester, body, 'harvester');
        } else if (workerCount < 2) {
        // } else if (workerCount < 5) {
            buildCreep(roleWorker, body, 'harvester');
        } else {
            Game.spawns['Spawn1'].memory.neededEnergyToBuild = false;
        }
    }
}

/**
 * 后期添加根据角色创建不同的body的能力，这部分代码需要优化
 * 
 * @param {Int16Array} workerCount 
 * @param {Int16Array} harvesterCount 
 * @returns 
 */
function buildBody(workerCount, harvesterCount) {
    var allEnergyNum = Game.spawns['Spawn1'].room.energyCapacityAvailable;
    var body = [
        WORK,
        CARRY,
        MOVE
    ]
    // if (allEnergyNum <= 300 || (workerCount + harvesterCount) < 6) {
    if (allEnergyNum <= 300 || (workerCount + harvesterCount) < 4) {
        body = [
            WORK,
            CARRY,
            MOVE
        ];
    } else if (allEnergyNum >= 400 && allEnergyNum < 600) {
        body = [
            WORK,
            WORK,
            CARRY,
            MOVE,
        ];
    } else if (allEnergyNum >= 600 && allEnergyNum < 700) {
        body = [
            WORK,
            WORK,
            CARRY,
            CARRY,
            MOVE,
            MOVE
        ];
    } else if (allEnergyNum >= 700 && allEnergyNum < 1000) {
        body = [
            WORK,
            WORK,
            WORK,
            CARRY,
            CARRY,
            MOVE,
            MOVE
        ];
    } else if (allEnergyNum >= 1000) {
        body = [
            WORK,
            WORK,
            WORK,
            WORK,
            CARRY,
            CARRY,
            CARRY,
            MOVE,
            MOVE,
            MOVE
        ];
    }
    Log.i('all energy num: ' + allEnergyNum);
    return body;
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