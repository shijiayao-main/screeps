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

	for (var name in Memory.creeps) {
		clearMemory(name);
		var role = Game.creeps[name].memory.role;
		if (role == ROLE_WORKER) {
			workerCount++;
		} else if (role == ROLE_UPGRADER) {
			upgraderCount++;
		}

		var creep = Game.creeps[name];

		// 根据工种去分配工作
		var role = creep.memory.role;
		if (role == ROLE_UPGRADER) {
			creepDelegate.upgrader(creep);
			var sources = creep.room.find(FIND_SOURCES);
			for (var index = 0; index < sources.length; index++) {
				var source = sources[index];
				Log.d("source: " + index + ", x: " + source.pos.x + ", y: " + source.pos.y);
			}
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

	Log.d(ROLE_WORKER + ': ' + workerCount + ' ' + ROLE_UPGRADER + ': ' + upgraderCount);
	creepFactory.run(ROLE_WORKER, workerCount, ROLE_UPGRADER, upgraderCount);

}

/**
 * 
 * @param {String} name 
 */
function clearMemory(name) {
	if (!Game.creeps[name]) {
		delete Memory.creeps[name];
	}
}
