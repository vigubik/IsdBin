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
  explorerNavigation: 'exp',
  navigationClientSources: 'cs',
  navigationWebClientSources: 'wcs',
  navigationRightFax: 'rf',
  navigationDashboard: 'db',
  visualStudio: 'vs',
  visualStudioClientSources: 'cs',
  visualStudioRightFax: 'rf',
  visualCode: 'vc',
  visualCodeWebClientSources: 'wcs',
  visualCodeDashboard: 'db',
  envs: 'envs',
  envsSecMgm: 'sec',
  envsTestInst: 'tst',
  envsPushUrl: 'pu',
  version: 'ver',
  disableProxy: 'proxy'
};

var pathes = {
  farPath: 'C:\\Program Files (x86)\\Far2\\Far.exe',
  sandbox: 'C:\\Projects\\CSFClientSources',
  dashboardSandbox: 'C:\\Projects\\WebGene\\web-phl',
  csfRepository: 'http://svn.isd.dp.ua/csf/trunk',
  envsBinPath: 'C:\\SCC\\Pre-deployed\\PRIMARY_0\\csfqc'
};
pathes['clientBinPath'] = path.resolve(pathes['sandbox'], 'nd_d\\bin\\csf');
pathes['clientSourcesPath'] = path.resolve(pathes['sandbox'], 'nd_src\\csf');
pathes['webClientSourcesPath'] = path.resolve(pathes['clientSourcesPath'], 'runtime\\client-web');
pathes['clientSourcesSolution'] = path.resolve(pathes['clientSourcesPath'], 'CSFMain.sln');
pathes['rightFaxPath'] = path.resolve(pathes['clientSourcesPath'], 'runtime\\server\\fax\\rightfax');
pathes['rightFaxSolution'] = path.resolve(pathes['rightFaxPath'], 'RightFax.sln');
pathes['dashboardSourcesPath'] = path.resolve(pathes['dashboardSandbox'], 'web-client');

var envs = {
  zd50: {
    enviroName: 'zd50',
    baseUrl: 'http://zd.isd.dp.ua:27679',
    suUrl: 'http://scclis:8080/SUplus-web',
    suClient: 'csfqc'
  },
  xd22: {
    enviroName: 'xd22',
    baseUrl: 'http://xd.isd.dp.ua:7703',
    suUrl: 'http://scclis:8080/SUplus-web',
    suClient: 'csf'
  },
  mt36: {
    enviroName: 'mt36',
    baseUrl: 'http://mt.isd.dp.ua:26170',
    suUrl: 'http://scclis:8080/SUplus-web',
    suClient: 'csfqc'
  },
  mt13: {
    enviroName: 'mt13',
    baseUrl: 'http://mt.isd.dp.ua:26268',
    suUrl: 'http://scclis:8080/SUplus-web',
    suClient: 'csfqc'
  },
  zd42: {
    enviroName: 'zd42',
    baseUrl: 'http://zd.isd.dp.ua:26379',
    suUrl: 'http://scclis:8080/SUplus-web',
    suClient: 'csf'
  },
  local: {
    enviroName: 'local',
    baseUrl: 'http://pc-vigu:8080',
    suUrl: 'http://scclis:8080/SUplus-web',
    suClient: 'csfqc'
  },
  mush: {
    enviroName: 'mush',
    baseUrl: 'http://pc-mush:7001',
    suUrl: 'http://scclis:8080/SUplus-web',
    suClient: 'csfqc'
  },
  pt02: {
    enviroName: 'pt02',
    baseUrl: 'http://pt.isd.dp.ua:7704',
    suUrl: 'http://scclis:8080/SUplus-web',
    suClient: 'csfqc'
  }
};

var suApps = {
  secmgm: 'SecurityManagement',
  testInstall: 'CSFTestInstallation'
};

var pushUrlsTargets = {
  setup: path.resolve(pathes['clientBinPath'], 'runtime\\setup\\Environment.config'),
  security: path.resolve(pathes['clientBinPath'], 'runtime\\security\\Environment.config'),
  lock: path.resolve(pathes['clientBinPath'], 'runtime\\lockAdmin\\Environment.config')
};

function combineExecutionArgs(currentArgs, funktionMap, key, functionArgs) {
  currentArgs = currentArgs || [];
  if (key) {
    if (funktionMap[key]) {
      console.log('recognized key ' + key);
      return currentArgs.concat(funktionMap[key](functionArgs));
    } else {
      console.log('! unrecognized key ' + key);
    }
  }
  return currentArgs.slice(0);
}

function executeAndForget(cmdArray) {
  if (cmdArray && cmdArray.length) {
    console.log(cmdArray.join(' '));
    childProcess.spawn('cmd', ['/c'].concat(cmdArray), { detached: true, stdio: 'ignore' }).unref();
  }
}

function askQuestion(question, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question(question, function(answer) {
    rl.close();
    callback && callback(answer.split(' '));
  });
}

function navigation(navigator, params) {
  var navigationMap = {};
  navigationMap[keys.navigationClientSources] = function() {
    return [pathes.clientSourcesPath];
  };
  navigationMap[keys.navigationRightFax] = function() {
    return [pathes.rightFaxPath];
  };
  navigationMap[keys.navigationDashboard] = function() {
    return [pathes.dashboardSandbox];
  };
  executeAndForget(combineExecutionArgs([navigator], navigationMap, params[0], params.slice(1)));
}

function runVisualStudio(params) {
  var solutionsMap = {};
  solutionsMap[keys.visualStudioClientSources] = function() {
    return [pathes.clientSourcesSolution];
  };
  solutionsMap[keys.visualStudioRightFax] = function() {
    return [pathes.rightFaxSolution];
  };
  executeAndForget(combineExecutionArgs(null, solutionsMap, params[0], params.slice(1)));
}

function runVisualCode(params) {
   var solutionsMap = {};
   solutionsMap[keys.visualCodeWebClientSources] = function() {
     return [pathes.webClientSourcesPath];
   };
   solutionsMap[keys.visualCodeDashboard] = function() {
      return [pathes.dashboardSourcesPath];
    };
    executeAndForget(combineExecutionArgs(["code"], solutionsMap, params[0], params.slice(1)));
 }

function launchSUApp(env, appName) {
  var appFileUrl = purl.parse(env.suUrl + '/getAppConfig');
  appFileUrl.search = querystring.stringify({
    envAppID: env.suClient + ' ' + env.enviroName + ' ' + appName
  });
  var urlString = purl.format(appFileUrl);
  console.log(urlString);
  http
    .get(urlString, function(res) {
      console.log('Got response: ' + res.statusCode);
      var file = fs.createWriteStream('C:\\Windows\\Temp\\allSUApp.scc');
      res.pipe(file);
      file.on('finish', function() {
        file.close(function() {
          executeAndForget(['C:\\Windows\\Temp\\allSUApp.scc']);
        });
      });
    })
    .on('error', function(e) {
      console.log(e.message);
    });
}

function pushBaseUrlToBin(env) {
  var pushToFile = function(file) {
    if (!fs.existsSync(file)) {
      console.log('!NOFILE: ' + file);
      return;
    }
    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        console.log(err);
        return;
      }
      var result = data.replace(/(BaseUrl=")(.+?)(")/, '$1' + env.baseUrl + '$3');
      result = result.replace(/(EnvironnmentName=")(.+?)(")/, '$1' + env.enviroName + '$3');
      result = result.replace(/(Client=")(.+?)(")/, '$1' + env.suClient + '$3');
      result = result.replace(/(SuUrl=")(.+?)(")/, '$1' + env.suUrl + '$3');
      fs.writeFile(file, result, 'utf8', function(error) {
        if (error) {
          console.log(err);
          return;
        }
        console.log('updated: ' + file);
      });
    });
  };
  for (var configFile in pushUrlsTargets) {
    pushToFile(pushUrlsTargets[configFile]);
  }
}

function envAction(evn, params) {
  var actionsMap = {};
  actionsMap[keys.envsSecMgm] = function() {
    launchSUApp(evn, suApps.secmgm);
  };
  actionsMap[keys.envsTestInst] = function() {
    launchSUApp(evn, suApps.testInstall);
  };
  actionsMap[keys.envsPushUrl] = function() {
    pushBaseUrlToBin(evn);
  };

  actionsMap[params[0]] && actionsMap[params[0]](params);
}

function confirmEnv(envName, params) {
  if (!envs[envName]) {
    console.log('unknown env');
    askQuestion('select env:\n', function(answer) {
      if (answer.length > 1) {
        params = answer.slice(1);
      }
      confirmEnv(answer[0], params);
    });
    return;
  }

  if (params && params.length) {
    envAction(envs[envName], params);
  } else {
    askQuestion('select ' + envName + ' action:\n', function(answer) {
      envAction(envs[envName], answer);
    });
  }
}

function checkEnvs(params) {
  var checkEnv = function(envName, env) {
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
  };

  if (params && params.length) {
    confirmEnv(params[0], params.slice(1));
  } else {
    for (var envName in envs) {
      checkEnv(envName, envs[envName]);
    }
    askQuestion('', function(answer) {
      confirmEnv(answer[0], answer.slice(1));
    });
  }
}

function printVersion(revision) {
  childProcess.exec(
    'svn log http://svn.isd.dp.ua/csf/tags/csf/1.0.1 -r ' + revision + ':HEAD --stop-on-copy -l 1 -v',
    function(error, stdout, stderr) {
      if (error || stderr) {
        console.log(error || stderr);
        askQuestion('');
      } else {
        console.log(stdout);
        var version = stdout.match(/\/tags\/csf\/1.0.1\/(\d+.\d+.\d+.\d+)/)[1];
        var url = 'http://se/cm/products/search?officeOptions%5B%5D=SCC^&product=340^&versionMask=' + version;
        executeAndForget(['start', url]);
      }
    }
  );
}

var disableProxyFileVisitors = [
  {
    filePatternRegEx: new RegExp('.exe.config$'),
    modifyContent: function(originalContent) {
      return originalContent.replace(/<proxy autoDetect="false"\/>/, '');
    }
  }
];

function applyVisitorOnFile(visitor, filePath) {
  var content = fs.readFileSync(filePath, { encoding: 'utf8' });
  var newContent = visitor.modifyContent(content);
  if (newContent != content) {
    fs.writeFileSync(filePath, newContent, { encoding: 'utf8' });
    console.log(filePath + ' updated');
  }
}

function modifyFilesRecursive(folder, visitors) {
  fs.readdirSync(folder).forEach(function(fileName) {
    var filePath = path.resolve(folder, fileName);
    if (fs.lstatSync(filePath).isDirectory()) {
      modifyFilesRecursive(filePath, visitors);
    } else {
      visitors.forEach(function(visitor) {
        if (visitor.filePatternRegEx.test(filePath)) {
          applyVisitorOnFile(visitor, filePath);
        }
      });
    }
  });
  return 0;
}

function disableProxy() {
  modifyFilesRecursive(pathes['clientBinPath'], disableProxyFileVisitors);
  modifyFilesRecursive(pathes['envsBinPath'], disableProxyFileVisitors);
}

var params = process.argv.slice(2);
switch (params[0]) {
  case keys.farNavigation:
    navigation(pathes.farPath, params.slice(1));
    break;
  case keys.explorerNavigation:
    navigation('explorer', params.slice(1));
    break;
  case keys.visualStudio:
    runVisualStudio(params.slice(1));
    break;
  case keys.visualCode:
    runVisualCode(params.slice(1));
    break;
  case keys.envs:
    checkEnvs(params.slice(1));
    break;
  case keys.version:
    printVersion(params.slice(1));
  case keys.disableProxy:
    disableProxy(params.slice(1));
    break;
}

exports.combineExecutionArgs = combineExecutionArgs;
