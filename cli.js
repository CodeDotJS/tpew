#!/usr/bin/env node

'use strict';

const os = require('os');
const fs = require('fs');
const dns = require('dns');
const fse = require('fs-extra');
const got = require('got');
const chalk = require('chalk');
const jsonfile = require('jsonfile');
const ora = require('ora');
const logUpdate = require('log-update');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({pkg}).notify();

const spinner = ora();
const tseries = 'https://www.youtube.com/user/tseries/about';
const pew = 'https://www.youtube.com/user/PewDiePie/about';

const arg = process.argv[2];
const inf = process.argv[3];
const end = process.exit;
const log = console.log; // eslint-disable-line prefer-destructuring
const time = new Date().toLocaleTimeString();
const locale = new Date().toJSON().slice(0, 10).replace(/-/g, '/');
const dir = `${os.homedir()}/.battle/stats.json`;
const arrow = chalk.bold.green('›');

if (!arg || arg === '-h' || arg === '--help') {
	log(`
  ${chalk.cyan('Usage')}: tpew <command> [option]

  ${chalk.cyan('Commands')}:
   -n, ${chalk.dim('--now')}      Show the current stats.
   -s, ${chalk.dim('--stat')}     Compare between current and previous stats.
   -h, ${chalk.dim('--help')}     Show help

  ${chalk.cyan('Option')}:
   --offline      Display saved stats when offline!

  ${chalk.cyan('Help')}:
   ${chalk.keyword('yellow')('$')} ${chalk.blue('pew')} ${chalk.white('-s')} ${chalk.cyan('--offline')}\n`);
	end(1);
}

const parseFunc = base => {
	return parseInt(base.replace(/\,/g, ''), 10); // eslint-disable-line  no-useless-escape
};

const template = (p, t, x, y, z, v) => {
	return p > t ? `${v} ${chalk.blue(x)} ${z} ${chalk.bold(p - t)} subscribers ahead of ${chalk.red(y)}` : `${chalk.red(y)} ${z} ${chalk.bold(t - p)} subscribers ahead of ${chalk.blue(x)}`;
};

const logData = () => {
	if (!fs.existsSync(dir)) {
		return `${arrow} Stats cached successfully!`;
	}
	return `${arrow} ${chalk.bold('Stats available!')} Run command ${chalk.white('$ tpew -s')} for more.`;
};

if (arg === '-n' || arg === '--now') {
	dns.lookup('youtube.com', err => {
		if (err) {
			logUpdate(`\n ${chalk.bold.red('›')} Please check your internet connection! \n`);
			end(1);
		} else {
			logUpdate();
			spinner.text = 'Please Wait...';
			spinner.start();
		}
	});

	got(tseries).then(res => {
		const seriesData = res.body;
		const seriesCount = seriesData.split('subscribers">')[1].split('</span>')[0];

		logUpdate();
		spinner.text = `Fetching ${chalk.red('T-Series\'s')} and ${chalk.blue('PewDiePie\'s')} subscribers count!`;

		got(pew).then(res => {
			const pieData = res.body;
			const pieCount = pieData.split('subscribers">')[1].split('</span>')[0];

			const data = {
				stat: {
					PewDiePie: [{
						lastRecordedTime: time,
						lastRecordedDate: new Date().toString().substr(4, 11),
						dateFormat: locale,
						followersCount: pieCount
					}],
					'T-Series': [{
						followersCount: seriesCount
					}]
				}
			};

			fse.ensureFile(dir, err => {
				if (err) {
					console.log(err);
				}
				jsonfile.writeFile(dir, data, {spaces: 2}, err => {
					if (err) {
						logUpdate(err);
						end(1);
					}
				});
			});
			logUpdate(`
 ${arrow} ${chalk.keyword('orange')('T-Series')}   :  ${chalk.bold(seriesCount)}

 ${arrow} ${chalk.keyword('teal')('PewDiePie')}  :  ${chalk.bold(pieCount)}

 ${arrow} ${template(parseFunc(pieCount), parseFunc(seriesCount), 'PewDiePie', 'T-Series!', 'is', chalk.white('Currently'))}

 ${logData()}
				`);
			spinner.stop();
		});
	}).catch(error => {
		if (error) {
			logUpdate(error);
			end(1);
		}
	});
}

const userStatus = (remote, local, username) => {
	return remote > local ? `${chalk.white(username)} gained ${chalk.keyword('yellow')(remote - local)} subscribers!` : `${chalk.white(username)} lost ${chalk.keyword('yellow')(local - remote)} subscribers!`;
};

if (arg === '-s' || arg === '--stat') {
	dns.lookup('youtube.com', err => {
		if (!fs.existsSync(dir) && err) {
			logUpdate(`\n ${chalk.bold.red('›')} Connection Error! \n\n ${chalk.bold.red('›')} Old data unavailable.  \n`);
			end(1);
		} else if ((err && fs.existsSync(dir)) || inf === '--offline') {
			jsonfile.readFile(dir, (err, obj) => {
				if (err) {
					logUpdate(`\n ${arrow} Locally saved data unavailable! \n`);
					end(1);
				}

				const lastRecord = obj.stat.PewDiePie[0].lastRecordedTime;
				const lastDate = obj.stat.PewDiePie[0].lastRecordedDate;
				const pewdCount = obj.stat.PewDiePie[0].followersCount;
				const seriesCount = obj.stat['T-Series'][0].followersCount;

				logUpdate(`
 ${arrow} ${chalk.white('PewDiePie')}   :   ${chalk.keyword('orange')(pewdCount)} subscribers

 ${arrow} ${chalk.white('T-Series')}    :   ${chalk.keyword('orange')(seriesCount)} subscribers

 ${arrow} ${chalk.white('Checked on')}  :   ${chalk.keyword('orange')(lastDate)} at ${chalk.keyword('yellow')(lastRecord)}

 ${arrow} ${chalk.white('Status')}      :  ${template(parseFunc(pewdCount), parseFunc(seriesCount), 'PewDiePie', 'T-Series!', 'was', '')}
					`);
			});
		} else {
			logUpdate();
			spinner.text = 'Gathering data...';
			spinner.start();
			got(pew).then(res => {
				const px = parseFunc(`${res.body.split('subscribers">')[1].split('</span>')[0]}`);
				logUpdate();
				spinner.text = `Comparing ${chalk.yellow('T-Series\'s')} and ${chalk.yellow('PewDiePie\'s')} subscribers count`;
				got(tseries).then(res => {
					const sx = parseFunc(res.body.split('subscribers">')[1].split('</span>')[0]);

					jsonfile.readFile(dir, (err, obj) => {
						if (err) {
							end(1);
						}

						const pY = obj.stat.PewDiePie[0].followersCount;
						const sY = obj.stat['T-Series'][0].followersCount;

						const pInt = parseFunc(pY);
						const sInt = parseFunc(sY);

						logUpdate(`
 ${arrow} Since the last check which was done ~

 ${arrow} on ${chalk.white(obj.stat.PewDiePie[0].lastRecordedDate)} at ${chalk.white(obj.stat.PewDiePie[0].lastRecordedTime)}

 ${arrow} ${userStatus(px, pInt, 'PewDiePie')}

 ${arrow} ${userStatus(sx, sInt, 'T-Series')}

 ${arrow} ${template(px, sx, 'PewDiePie', 'T-Series!', 'is', chalk.white('Currently'))}
					`);
						spinner.stop();
					});
				});
			});
		}
	});
}
