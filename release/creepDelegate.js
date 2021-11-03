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
            harvest(creep);
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
            var targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            // 如果没有找到工地, 则帮忙去采矿, 如果资源满了则去帮忙升级建筑
            if (targets.length > 0) {
                var target = targets[0];
                build(creep, target);
            } else {
                // 与harvester部分相同需要优化
                creep.memory.working = false;
                creep.memory.work = 'harvester';
            }
        } else {
            getResources(creep);
        }
    },
};

/**
 * 
 * 将资源运回基地或相关建筑
 * 
 * @param {Creep} creep 
 */
function harvest(creep) {
    // todo记录状态， 避免重复工作
    var targets = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });
    if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#9b59b6' } });
        }

    } else {
        var targets1 = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        // 如果没有找到工地, 则帮忙去采矿, 如果资源满了则去帮忙升级建筑
        creep.memory.working = false;
        if (targets1.length > 0) {
            creep.memory.work = 'builder';
        } else {
            creep.memory.work = 'upgrader';
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
    var sources = creep.room.find(FIND_SOURCES);
    if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#3498db' } });
    }
}

/**
 * 
 * 获取资源如果当前仓库中没有能量，则去采矿获取
 * 
 * @param {Creep} creep 
 */
function getResources(creep) {
    // 如果有资源建筑则从资源建筑中获取资源, 不去和harvester抢着采矿
    var targets = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });
    var target;
    if (targets.length > 0) {
        // STRUCTURE_EXTENSION
        target = targets[0];
    } else {
        target = creep.room.find(FIND_SOURCES)[0];
    }
    if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#1abc9c' } });
    }
}

/**
 * 
 * @param {Creep} creep 
 */
function upgrade(creep) {
    var targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    // 如果没有找到工地, 则帮忙去采矿, 如果资源满了则去帮忙升级建筑
    if (targets.length > 0 && creep.memory.role != 'upgrader') {
        creep.memory.working = false;
        creep.memory.work = 'builder';
    } else {
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
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

    var sourceTargets = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });
    if (sourceTargets.length > 0) {
        creep.memory.work = 'harvester';
        creep.memory.working = false;
    } else {
        if (creep.build(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#2ecc71' } });
        }
    }
}
module.exports = creepDelegate;