const creepFactory = require("./creepFactory");
const creepDelegate = require("./creepDelegate");

const Log = require("./logUtil");

/**
 * upgrader用于避免降级, 一直固定一个creep
 * 其他的只有worker用于资源采集和建造建筑
 * worker: 最基础的工人, 用于采矿的建造建筑
 * upgrader: 用于升级基地
 */
module.exports.loop = function () {

	var ROLE_WORKER = 'worker';
	var ROLE_UPGRADER = 'upgrader';
	var ROLE_HARVESTER = 'harvester';

	var WORK_HARVESTER = "harvester";
	var WORK_UPGRADER = 'upgrader';
	var WORK_BUILDER = "builder";

	// 划分creep功能
	// antibody：用于对付入侵者
	// claw: 用于去攻击别人
	// harvester: 用于采集资源
	// upgrader: 用于建筑升级
	// builder: 用于建造建筑

	var workerCount = 0;
	var upgraderCount = 0;
	var harvesterCount = 0;


	var creepName = '';
	// 先对内存进行清洗, 将过期的creep删除避免影响后续使用
	for (var name in Memory.creeps) {
		if (!Game.creeps[name]) {
			delete Memory.creeps[name];
		} else {
			creepName = name;
		}
	}

	// 取出一个creep获取当前状态
	var creep = Game.creeps[creepName];
	if (creep != null) {
		refreshLocalState(creep);
	}

	for (var name in Memory.creeps) {
		var role = Game.creeps[name].memory.role;
		if (role == ROLE_WORKER) {
			workerCount++;
		} else if (role == ROLE_UPGRADER) {
			upgraderCount++;
		} else if (role == ROLE_HARVESTER) {
			harvesterCount++;
		}

		var creep = Game.creeps[name];

		// 根据工种去分配工作
		var role = creep.memory.role;
		if (role == ROLE_UPGRADER) {
			creepDelegate.upgrader(creep);
			// var sources = creep.room.find(FIND_SOURCES);
			// for (var index = 0; index < sources.length; index++) {
			// 	var source = sources[index];
			// 	Log.d("source: " + index + ", x: " + source.pos.x + ", y: " + source.pos.y);
			// }
		} else if (role == ROLE_HARVESTER) {
			creepDelegate.harvester(creep);
		} else if (role == ROLE_WORKER) {
			var work = creep.memory.work;
			if (work == WORK_HARVESTER) {
				creepDelegate.harvester(creep);
			} else if (work == WORK_UPGRADER) {
				creepDelegate.upgrader(creep);
			} else if (work == WORK_BUILDER) {
				creepDelegate.builder(creep);
			}
		}

	}

	Log.d(ROLE_WORKER + ': ' + workerCount + ' ' + ROLE_UPGRADER + ': ' + upgraderCount + ' ' + ROLE_HARVESTER + ': ' + harvesterCount);
	creepFactory.run(ROLE_WORKER, workerCount, ROLE_UPGRADER, upgraderCount, ROLE_HARVESTER, harvesterCount);
}

/** 
 * 通过一个creep去获取当前建筑状态, 之后将建筑id存入Memory, 以便Delegate中使用
 * 数据格式暂定为:
 * {
 * "need_build_structure_ids": [
 * {Long},
 * ],
 * "need_harvest_structure_ids": [
 * {Long}
 * ]
 * },
 * "need_build_structure_count": {Int},
 * "need_harvest_structure_count": {Int}
 * 
 * @param {Creep} creep
 * 
*/
function refreshLocalState(creep) {
	var needBuildTargets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
	var allStructures = creep.room.find(FIND_STRUCTURES, {
		filter: struct => {
			var id = struct.id;
			Log.d("refreshLocalState: struct: " + struct);
			return true;
		}
	});


	var myStructures = creep.room.find(FIND_MY_STRUCTURES, {
		filter: struct => {
			return true;
		}
	});

	Log.d("refreshLocalState: -----needBuildTargets: " + needBuildTargets + ", allStructures: " + allStructures + ", myStructures: " + myStructures);

	var needRepairTargetCount = getNeedRepairTargets(creep);
	var getNeedHarvestTargetsCount = getNeedHarvestTargets(creep);
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