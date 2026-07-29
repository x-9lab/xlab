import { isBoolean, isExecutable, isNumber } from "@x-drive/utils";
import { globalLog } from "../log";
import { get as getConf } from "../../config";
import { inspect } from "util";
import path from "path";
import fs from "fs";

declare global {
	namespace XLab {
		/**定时任务配置对象 */
		interface IConfigCronItem {
			/**定时任务执行间隔, 单位秒 */
			delay?: number;

			/**是否启用 */
			enable?: boolean;
		}

		interface IConfig {
			/**
			 * 定时任务配置, 键名为任务文件名
			 * @see `@components/cron`
			*/
			crons?: {
				/**定时任务配置 */
				[name: string]: IConfigCronItem;
			}
		}
	}
}

const logger = globalLog.getLogger("cron");

/**定时任务模块 */
interface ICronJob {
	/**定时任务 */
	(): void;

	/**定时任务 */
	default?: () => void;

	/**获取定时任务间隔时间, 单位毫秒 */
	getDelay?: () => number;

	/**获取定时任务开启状态 */
	enable?: () => boolean;
}
export type { ICronJob }

/**
 * 计时器对象
 */
var CRON_TIMERS: Record<string, ReturnType<typeof setTimeout>> = {};

/**任务执行状态, 确保同时只会有一个定时任务在执行 */
const JOB_STATUS: Record<string, boolean> = {};

/**获取任务间隔时间(毫秒): 系统配置 crons[name].delay(秒) > 模块 getDelay()(毫秒) > cron.def(秒) */
function getJobDelay(mod: ICronJob, name: string) {
	const sysConf = getConf();
	const jobConf = (sysConf.crons || {})[name] || {};
	const defTime = ((sysConf.cron && sysConf.cron.def) || 60) * 1000;

	if (isNumber(jobConf.delay) && jobConf.delay > 0) {
		return jobConf.delay * 1000;
	}

	var time = isExecutable(mod.getDelay) ? mod.getDelay() : defTime;
	// 非法或非正数的间隔一律回退默认值, 防止 0 间隔空转
	if (isNaN(time) || time <= 0) {
		logger.warn("[ %s ] Time Invalid.", name);
		time = defTime;
	}
	return time;
}

/**获取任务启用状态: 系统配置 crons[name].enable > 模块 enable() */
function isJobEnabled(mod: ICronJob, name: string) {
	const jobConf = ((getConf().crons || {})[name]) || {};
	if (isBoolean(jobConf.enable)) {
		return jobConf.enable;
	}
	return isExecutable(mod.enable) ? mod.enable() === true : true;
}

/**
 * 定时刷新函数
 * @param mod  模块对象
 * @param name 计时器名称
 * @param dont 不执行
 * @return     计时器对象
 */
function fetch(mod: ICronJob, name: string, dont?: boolean) {
	if (JOB_STATUS[name] === true) {
		return;
	}
	const time = getJobDelay(mod, name);

	if (!isJobEnabled(mod, name)) {
		return null;
	}
	if (!dont) {
		JOB_STATUS[name] = true;
		try {
			if (isExecutable(mod)) {
				mod();
			} else if (isExecutable(mod.default)) {
				mod.default();
			}
		} catch (e) {
			logger.error(inspect(e));
		}
		JOB_STATUS[name] = false;
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
	}

	// accessSync 在文件不存在的时候才会返回内容
	if (dirStat) {
		logger.info("No cron job.");
		return;
	}

	var crons = fs.readdirSync(cronPath);
	logger.info("Cron online.");
	try {
		for (const cron of crons) {
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

					logger.info("[ %s ] %s.", name, CRON_TIMERS[name] ? "running" : "disabled");
				}
			}
		}
	} catch (err) {
		logger.error(inspect(err));
	}
	console.log("");
}
export { on };

/**
 * 停止一个或所有的计时器
 * @param  name 计时器名称
 */
function kill(name?: string) {
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
