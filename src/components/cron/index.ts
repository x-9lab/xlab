import { isFunction } from "@x-drive/utils";
import path from "path";
import fs from "fs";

const logger = log.getLogger("cron");
const config = getSysConfig("cron") || {
	"def": 60
};

/**定时任务模块 */
interface ICronJob {
	/**定时任务 */
	(): void;

	/**获取定时任务间隔时间 */
	getDelay?: () => number;

	/**获取定时任务开启状态 */
	enable?: () => boolean;
}
export type { ICronJob }

/**
 * 默认间隔时间
 */
const DEF_TIME = config.def * 1000;

/**
 * 计时器对象
 */
var CRON_TIMERS: Record<string, ReturnType<typeof setTimeout>> = {};

/**
 * 定时刷新函数
 * @param mod  模块对象
 * @param name 计时器名称
 * @param dont 不执行
 * @return     计时器对象
 */
function fetch(mod: ICronJob, name: string, dont?: boolean) {
	var time = isFunction(mod.getDelay) ? mod.getDelay() : DEF_TIME;

	if (isNaN(time)) {
		logger.warn("[ %s ] Time Invalid.", name);
		time = DEF_TIME;
	}

	var enable = isFunction(mod.enable) ? mod.enable() === true : true;
	if (!enable) {
		return null;
	}

	if (!dont) {
		mod();
	}

	return setTimeout(function () {
		CRON_TIMERS[name] = fetch(mod, name, dont);
	}, time);
}

/**
 * 停止一个计时器
 * @param  name 计时器名称
 * @return      无返回值
 */
function killSomeone(name: string) {
	if (CRON_TIMERS[name]) {
		logger.info("Stop crontab job ", name);
		clearTimeout(CRON_TIMERS[name]);
		CRON_TIMERS[name] = null;
	}
}

/**
 * 启动指定目录下的所有计时任务
 * @param  dirPath 任务目录
 * @return         无返回值
 */
function on(dirPath: string) {
	var cronPath = path.resolve(dirPath || "./cron");
	var dirStat;
	try {
		dirStat = fs.accessSync(cronPath, fs.constants.F_OK);
	} catch (e) {
		dirStat = true;
		logger.warn(e);
	}

	// accessSync 在文件不存在的时候才会返回内容
	if (dirStat) {
		logger.info("No cron job.");
		return;
	}

	var crons = fs.readdirSync(cronPath);
	logger.info("Cron online.");
	try {
		crons.forEach(function (cron) {
			if (cron.charAt(0) !== ".") {
				var tmpPath = cronPath + "/" + cron;
				var stats = fs.statSync(tmpPath);

				if (stats.isFile()) {
					var name = cron.replace(".js", "");

					CRON_TIMERS[name] = fetch(
						require(
							path.resolve(tmpPath)
						)
						, name
					);

					logger.info("\t>>> [ %s ] %s.", name, CRON_TIMERS[name] ? "running" : "disabled");
				}
			}
		});
	} catch (err) {
		logger.error(err);
	}
	console.log("");
}
export { on };

/**
 * 停止一个或所有的计时器
 * @param  name 计时器名称
 */
function kill(name: string) {
	if (name && CRON_TIMERS[name]) {
		killSomeone(name);
	} else {
		Object.keys(CRON_TIMERS).forEach(function (key) {
			if (CRON_TIMERS[key]) {
				killSomeone(key);
			}
		});
	}
}
export { kill }
