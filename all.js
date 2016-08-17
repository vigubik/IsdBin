'use strict';
var path = require('path');
var childProcess = require('child_process');
var fs = require('fs');
var http = require('http');
var readline = require('readline');
var purl = require('url');
var querystring = require('querystring');

var keys = {
	farNavigation: 'far',
	farNavigationClientSources: 'cs',
	visualStudio: 'vs',
	visualStudioClientSources: 'cs',
	visualStudioRightFax: 'rf',
	envs: 'envs',
	envsSecMgm: 'sec',
	envsTestInst: 'tst',
	envsPushUrl: 'pu'
}

var pathes = {
	farPath: 'C:\\Program Files (x86)\\Far2\\Far.exe',
	sandbox: 'D:\\Projects\\CSF\\CSFClientSources',
};
pathes['clientBinPath'] = path.resolve(pathes['sandbox'], 'nd_d\\bin\\csf');
pathes['clientSourcesPath'] = path.resolve(pathes['sandbox'], 'nd_src\\csf');
pathes['clientSourcesSolution'] = path.resolve(pathes['clientSourcesPath'], 'CSFMain.sln');
pathes['rightFaxPath'] = path.resolve(pathes['clientSourcesPath'], 'runtime\\server\\fax\\rightfax');
pathes['rightFaxSolution'] = path.resolve(pathes['rightFaxPath'], 'RightFax.sln');

var envs = {
	zd50: {enviroName: 'zd50', baseUrl:'http://zd.isd.dp.ua:27679', suUrl:'http://scclis:8080/SUplus-web', suClient: 'csfqc'},
	mt36: {enviroName: 'mt36', baseUrl:'http://mt.isd.dp.ua:26170', suUrl:'http://scclis:8080/SUplus-web', suClient: 'csfqc'},
	mt13: {enviroName: 'mt13', baseUrl:'http://mt.isd.dp.ua:26268', suUrl:'http://scclis:8080/SUplus-web', suClient: 'csfqc'},
	zd42: {enviroName: 'zd42', baseUrl:'http://zd.isd.dp.ua:26379', suUrl:'http://scclis:8080/SUplus-web', suClient: 'csf'},
}

var suApps = {
	secmgm: 'SecurityManagement',
	testInstall: 'CSFTestInstallation'
}

var pushUrlsTargets = {
	setup: path.resolve(pathes['clientBinPath'], 'runtime\\setup\\Environment.config'),
	security: path.resolve(pathes['clientBinPath'], 'runtime\\security\\Environment.config'),
	lock: path.resolve(pathes['clientBinPath'], 'cslck\\Environment.config')
}

function combineExecutionArgs(currentArgs, funktionMap, key, functionArgs ){
	currentArgs = currentArgs || [];
	if (key){
		if (funktionMap[key]) {
			console.log('recognized key ' + key);
			return currentArgs.concat(funktionMap[key](functionArgs));
		} else {
			console.log('! unrecognized key ' + key);
		}
	}
	return currentArgs.slice(0);
}

function executeAndForget(cmdArray){
	if (cmdArray && cmdArray.length){
		console.log(cmdArray.join(' '));
		childProcess.spawn('cmd', ['/c'].concat(cmdArray), {detached: true, stdio: 'ignore'}).unref();
	}
}

function askQuestion(question, callback){
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question(question, function(answer){			
		rl.close();			
		callback && callback(answer.split(' '));
	});
}

function navigation(params){	
	var farMap = {}
	farMap[keys.farNavigationClientSources] = function() { return [pathes.clientSourcesPath]; }		
	executeAndForget(combineExecutionArgs([pathes.farPath], farMap, params[0], params.slice(1)));
}

function runVisualStudio(params){
	var solutionsMap = {};
	solutionsMap[keys.visualStudioClientSources] = function() { return [pathes.clientSourcesSolution]; }
	solutionsMap[keys.visualStudioRightFax] = function() { return [pathes.rightFaxSolution]; }
	executeAndForget(combineExecutionArgs(null, solutionsMap, params[0], params.slice(1)));
}

function launchSUApp(env, appName){
	var appFileUrl = purl.parse(env.suUrl + '/getAppConfig');
	appFileUrl.search = querystring.stringify({
	  'envAppID' : env.suClient + ' ' + env.enviroName + ' ' + appName
	});
	var urlString = purl.format(appFileUrl);
	console.log(urlString);
	http.get(urlString, function(res) {
		console.log("Got response: " + res.statusCode);
		var file = fs.createWriteStream('C:\\Windows\\Temp\\allSUApp.scc');
		res.pipe(file);
		file.on('finish', function() {
			file.close(function() {
				executeAndForget(['C:\\Windows\\Temp\\allSUApp.scc']);
			});
		});
	}).on('error', function(e) {
	  console.log(e.message);
	});
	
	//askQuestion('');
}

function pushBaseUrlToBin(env){
	var pushToFile = function(file){
		if (!fs.existsSync(file)){
			console.log('!NOFILE: ' + file);
			return;
		}
		fs.readFile(file, 'utf8', function (err,data) {
			if (err) {
				return console.log(err);
			}
			var result = data.replace(/(BaseUrl=")(.+?)(")/, '$1'+env.baseUrl+'$3');
			result = result.replace(/(EnvironnmentName=")(.+?)(")/, '$1'+env.enviroName+'$3');
			result = result.replace(/(Client=")(.+?)(")/, '$1'+env.suClient+'$3');
			result = result.replace(/(SuUrl=")(.+?)(")/, '$1'+env.suUrl+'$3');
			fs.writeFile(file, result, 'utf8', function (err) {
				if (err) return console.log(err);
				console.log('updated: ' + file);
			});
		});
	}
	for (var configFile in pushUrlsTargets) {
		pushToFile(pushUrlsTargets[configFile]);
	}
}

function envAction(evn, params){
	var actionsMap = {};
	actionsMap[keys.envsSecMgm] = function() { launchSUApp(evn, suApps.secmgm); }
	actionsMap[keys.envsTestInst] = function() { launchSUApp(evn, suApps.testInstall); }
	actionsMap[keys.envsPushUrl] = function(params) { pushBaseUrlToBin(evn); }
	
	actionsMap[params[0]] && actionsMap[params[0]](params);
}

function confirmEnv(envName, params){
	if (!envs[envName]){
		console.log('unknown env');
		askQuestion('select env:\n', function(answer){
			if (answer.length > 1) {
				params = answer.slice(1);
			}
			confirmEnv(answer[0], params);
		})
		return;
	}
	
	if (params && params.length){
		envAction(envs[envName], params)
	} else {
		askQuestion('select ' + envName + ' action:\n', function(answer){
			envAction(envs[envName], answer)
		})
	}
}

function checkEnvs(params){
	var checkEnv = function(envName, env){
		var url = purl.parse(env.baseUrl);
		var postData = JSON.stringify({ terminalName: 'A', system: 'SECMGM' });
		var options = {
			hostname: url.hostname,
			port: url.port,
			path: '/csf/web-sws/rest/params',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': postData.length
			}
		};
		var req = http.request(options, function(res) {
			console.log('ENV: ' + envName + '	STATUS: ' + res.statusCode);
		});
		req.on('error', function(e) {
			console.log('ENV: ' + envName + '	' + e.message);
		});
		
		req.write(postData);
		req.end();
	}
	
	if (params && params.length){
		confirmEnv(params[0], params.slice(1));
	} else {
		for(var envName in envs){
			checkEnv(envName, envs[envName])
		}
		askQuestion('', function(answer){
			confirmEnv(answer[0], answer.slice(1));
		});
	}
}

var params = process.argv.slice(2);
switch(params[0]){
	case keys.farNavigation:
		navigation(params.slice(1));
	break;
	case keys.visualStudio:
		runVisualStudio(params.slice(1));
	break;
	case keys.envs:
		checkEnvs(params.slice(1));
	break;
}
