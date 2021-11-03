const Log = require("./logUtil");

var creepDelegate = {
    /**
     * 
     * @param {Creep} creep 
     */
    harvester: function (creep) {
        if (!creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = true;
            creep.say('collect');
        }

        if (creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = false;
            creep.say('harvest');
        }


        if (creep.memory.working) {
            collect(creep);
        } else {
            var needBuildTargets = getNeedBuildTargets(creep);

            // 如果存在没有被填满的资源建筑, 自动去采集, 优先判断是不是要去build
            var sourceTargets = getNeedHarvestTargets(creep);
            var needRepairTargets = getNeedRepairTargets(creep);

            if (creep.memory.role == 'harvester') {
                if (sourceTargets.length > 0) {
                    harvest(creep, sourceTargets);
                }
            } else {
                if (sourceTargets.length > 0 && isNeedEnergyToBuild()) {
                    harvest(creep, sourceTargets);
                } else if (needBuildTargets.length > 0 || needRepairTargets.length > 0) {
                    creep.memory.working = false;
                    creep.memory.work = 'builder';
                } else {
                    creep.memory.working = false;
                    creep.memory.work = 'upgrader';
                }
            }

        }
    },
    /**
     * 
     * @param {Creep} creep 
     */
    upgrader: function (creep) {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = false;
            creep.say('🔄 getResource');
        }

        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
            creep.say('🚧 update');
        }

        if (creep.memory.working) {
            upgrade(creep);
        } else {
            getResources(creep);
        }
    },
    /**
     * 
     * @param {Creep} creep 
     */
    builder: function (creep) {

        if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = false;
            creep.say('🔄 getResource');
        }

        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
            creep.say('🚧 build');
        }

        if (creep.memory.working) {
            // 优先建造, 因为需要建造的建筑是有限的
            var needRepairTargets = getNeedRepairTargets(creep);

            needRepairTargets.sort((a, b) => a.hits - b.hits);

            var needBuildTargets = getNeedBuildTargets(creep);
            // 如果没有找到工地, 则帮忙去采矿, 如果资源满了则去帮忙升级建筑
            if (isNeedEnergyToBuild()) {
                // 与harvester部分相同需要优化
                creep.memory.working = false;
                creep.memory.work = 'harvester';
            } else {
                if (needBuildTargets.length > 0) {
                    var target = needBuildTargets[0];
                    build(creep, target);
                } else if (needRepairTargets.length > 0) {
                    var target = needRepairTargets[0];
                    repair(creep, target)
                } else {
                    // 与harvester部分相同需要优化
                    creep.memory.working = false;
                    creep.memory.work = 'harvester';
                }
            }
        } else {
            getResources(creep);
        }
    },
};


/**
 * 去修复建筑
 * 
 * @param {Creep} creep
 */
function repair(creep, target) {
    Log.i('repair');
    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
        creepMoveToWithStroke(creep, target);
    }
}


/**
 * 
 * 将资源运回基地或相关建筑
 * 
 * @param {Creep} creep 
 */
function harvest(creep, targets) {
    Log.i('harvest');
    if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creepMoveToWithStroke(creep, targets[0]);
        }

    }
}

/**
 * 
 * 采集资源
 * 
 * @param {Creep} creep 
 */
function collect(creep) {
    Log.i('collect');
    var sources = creep.room.find(FIND_SOURCES);
    if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
        creepMoveToWithStroke(creep, sources[0]);
    }
}

/** 
 * 是否正在建造creep
*/
function isNeedEnergyToBuild() {
    return Game.spawns['Spawn1'].memory.neededEnergyToBuild;
}

/**
 * 
 * 获取资源如果当前仓库中没有能量，则去采矿获取
 * 
 * @param {Creep} creep 
 */
function getResources(creep) {
    // 如果有资源建筑则从资源建筑中获取资源, 不去和harvester抢着采矿
    var haveSourceTargets = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            // STRUCTURE_STORAGE
            return (
                structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_STORAGE
            ) && (structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) && !isNeedEnergyToBuild();
        }
    });
    if (haveSourceTargets.length > 0) {
        // 从资源建筑中获取资源
        var target = haveSourceTargets[0];
        if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creepMoveToWithStroke(creep, target);
        }
    } else {
        var target = creep.room.find(FIND_SOURCES)[0];
        if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
            creepMoveToWithStroke(creep, target);
        }
    }
}

function getNeedBuildTargets(creep) {
    return creep.room.find(FIND_MY_CONSTRUCTION_SITES);
}

function getNeedRepairTargets(creep) {
    var needRepairTargets = creep.room.find(FIND_STRUCTURES, {
        filter: struct => {

            var type = struct.structureType;
            if (
                type != STRUCTURE_WALL &&
                type != STRUCTURE_CONTROLLER &&
                type != STRUCTURE_KEEPER_LAIR &&
                type != STRUCTURE_EXTENSION &&
                type != STRUCTURE_ROAD &&
                type != STRUCTURE_STORAGE && 
                type != STRUCTURE_CONTAINER
            ) {
                try {
                    if (struct.memory.needRepair && struct.hits < struct.hitsMax * 0.8) {
                        return true;
                    } else if (struct.memory.needRepair && struct.hits >= struct.hitsMax * 0.8) {
                        struct.memory.needRepair = false;
                        return false;
                    } else if (!struct.memory.needRepair && struct.hits < struct.hitsMax * 0.4) {
                        struct.memory.needRepair = true;
                        return true;
                    } else if (struct.memory.needRepair) {
                        return true;
                    } else {
                        return false;
                    }
                } catch (error) {
                    Log.e('getNeedRepairTargets: error: ' + error + ', struct: ' + struct);
                    return false;
                }
            } else if (type == STRUCTURE_WALL) {
                if (struct.hits < (struct.hitsMax * 0.008)) {
                    return true;
                }
            } else if (type == STRUCTURE_ROAD) {
                if (struct.hits < (struct.hitsMax * 0.4)) {
                    return true;
                }
            } else if (type == STRUCTURE_STORAGE || type == STRUCTURE_CONTAINER) {
                if (struct.hits < struct.hitsMax) {
                    return true;
                }
            }
            return false;
        }
    });
    Log.d('getNeedRepairTargets: length： ' + needRepairTargets.length);

    return needRepairTargets;
}

function getNeedHarvestTargets(creep) {
    var targets = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            var type = structure.structureType;
            return (
                type == STRUCTURE_EXTENSION ||
                type == STRUCTURE_SPAWN ||
                type == STRUCTURE_TOWER ||
                type == STRUCTURE_CONTAINER ||
                type == STRUCTURE_STORAGE
            ) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });
    return targets;
}

/**
 * 
 * @param {Creep} creep 
 */
function upgrade(creep) {
    Log.i('upgrade');
    var needBuildTargets = getNeedBuildTargets(creep);
    var needRepairTargets = getNeedRepairTargets(creep);
    // 如果没有找到工地, 则帮忙去采矿, 如果资源满了则去帮忙升级建筑
    if (
        (
            needBuildTargets.length > 0 ||
            needRepairTargets.length > 0
        ) && creep.memory.role != 'upgrader'
    ) {
        creep.memory.working = false;
        creep.memory.work = 'builder';
    } else {
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creepMoveToWithStroke(creep, creep.room.controller);
        }
    }
}

/**
 * 
 * 建造建筑
 * 
 * @param {Creep} creep 
 * @param {BuildableStructureConstant} target
 */
function build(creep, target) {
    Log.i('build');
    if (creep.build(target) == ERR_NOT_IN_RANGE) {
        creepMoveToWithStroke(creep, target);
    }
}

function creepMoveToWithStroke(creep, target) {
    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff4757' } });
}
module.exports = creepDelegate;