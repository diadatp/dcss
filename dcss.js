if (!Array.prototype.last) {
	Array.prototype.last = function() {
		return this[this.length - 1];
	};
};

if (!Array.prototype.includes) {
	Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
		'use strict';
		var O = Object(this);
		var len = parseInt(O.length) || 0;
		if (len === 0) {
			return false;
		}
		var n = parseInt(arguments[1]) || 0;
		var k;
		if (n >= 0) {
			k = n;
		} else {
			k = len + n;
			if (k < 0) {
				k = 0;
			}
		}
		var currentElement;
		while (k < len) {
			currentElement = O[k];
			if (searchElement === currentElement ||
				(searchElement !== searchElement && currentElement !== currentElement)) {
				return true;
			}
			k++;
		}
		return false;
	};
}

if (!('contains' in String.prototype)) {
	String.prototype.contains = function(str, startIndex) {
		return ''.indexOf.call(this, str, startIndex) !== -1;
	};
}

var net = require('net');
var HashMap = require('hashmap');
var lowdb = require('lowdb')
var queue = require('queue');

var tthQueryQueue = queue({
	'concurrency': 1
});

var db = lowdb('db.json')
var nickIpMap = new HashMap();
var tthFilenameMap = new HashMap();

var tthNew = [];
var tthOngoing = [];
var tthResolved = new Object();

var first = 0;
var hub_ip = '10.3.14.10';
var hub_port = 500;
var search_timeout = 5000;

// var hub_ip = 'brianzaland.ex3menet.com';
// var hub_port = 443;

var client = net.connect({
	host: hub_ip,
	port: hub_port
}, function() {
	console.log('Connected to server.');
	setTimeout(function() {
		client.write('$Supports UserCommand UserIP2|$Key 011010110110010101111001|$ValidateNick johndoe|$Version 1,0091|$GetNickList|$MyINFO $ALL johndoe <++ V:0.673,M:A,H:1/0/0,S:3>$ $LAN(T3)0x31$example@example.com$26843545600$|');
		// first = 1;
	}, 1000);

	setInterval(function() {
		console.log(tthNew);
		var searchTerm = tthNew.pop();
		tthOngoing.push(searchTerm);
		client.write('$Search Hub:johndoe F?T?0?9?TTH:' + searchTerm + '|');
	}, search_timeout);
});

client.on('data', function(data) {
	data = data.toString().split('|');
	// console.log(data);
	data.forEach(function(element, index, array) {
		// console.log('e ' + element);
		var tokens = element.split(' ');
		switch (tokens[0]) {
			case '$Search':
				// console.log('s ' + tokens);
				var time = new Date().getTime();
				if (tokens[1].contains('Hub:')) {
					var nick = tokens[1].slice(4);
					var ip = '';
				} else {
					var nick = '';
					var ip = tokens[1].split(':')[0];
				}
				var isTTH = ('9' == tokens[2].charAt(6));
				if (isTTH) {
					var term = tokens[2].split('TTH:').last();
					if ((!tthNew.includes(term)) && (!tthOngoing.includes(term)) && (!tthResolved.hasOwnProperty(term))) {
						// tthQueryQueue.push(function(cb) {
						// 	setTimeout(function() {
						// 		// console.log('$ added tth to queue');
						// 		// client.write('$Search Hub:johndoe F?T?0?9?TTH:' + term + '|');
						// 		cb();
						// 	}, search_timeout);
						// });
						// tthQueryQueue.start();
						// console.log(db('searches').chain().where({
						// 	'nick': '',
						// 	'isTTH': false
						// }).take(5).value());
						console.log('damn');
						tthNew.push(term);
					}
				} else {
					var term = tokens[2].split('?').last().split('$').join(' ');
				}
				console.log(time + ' ' + nick + ' ' + ip + ' ' + isTTH + ' ' + term);
				db('searches').push({
					'time': time,
					'nick': nick,
					'ip': ip,
					'isTTH': isTTH,
					'term': term
				});
				break;
			case '$MyINFO':
				// console.log('i ' + tokens);
				var nick = element.split(' ')[2];
				client.write('$ConnectToMe ' + nick + ' 10.4.1.63:55555|');
				break;
			case '$SR':
				console.log('sr ' + tokens);
				if ((tokens.length < 5) || (!tokens.last().contains('(' + hub_ip + ':' + hub_port + ')'))) {
					break;
				}
				var filename = tokens.slice(2, -2).join(' ').split('\\').last();
				var tth = tokens.slice(1, -1).last().split('TTH:').last();
				// tthOngoing.
				tthResolved[tth] = filename;
				db('tthmap').push({
					'tth': tth,
					'filename': filename
				});
				break;
			default:
				// console.log('other ' + tokens);
				break;
		}
	});

	if (1 == first) {
		client.write("<johndoe> dsdsds|");
	}
});

function deferredLogNick(time, x) {
	// console.log(x[0].slice(4) + x[1]);
	client.write('$ConnectToMe ' + x[1].slice(4) + ' 10.4.1.63:55555|');
	if ('9' == x[2].charAt(6)) {
		// console.log('tth');
	}
}

function deferredLogIP(time, x) {
	// console.log(x[0] + x[1]);
}

function resolveTTH(tth) {
	return 'hellp';
}

var server = net.createServer(function(c) {
	c.on('data', function(data) {
		var nick = data.toString().split('|')[0].split(' ')[1];
		var ip = c.remoteAddress.split(':').last();
		if (nickIpMap.has(nick)) {
			if (nickIpMap.get(nick) != ip) {
				console.log("someone changed ip?");
			}
		}
		console.log(nick + ' - ' + ip + ' ' + resolveHostel(ip));
		// db('nicks').push({'nick': nick, 'ip': ip});
		nickIpMap.set(nick, ip);
		// console.log(db('searches').chain().where({
		// 	'nick': nick
		// }).value());
		// console.log(db('searches').chain().updateWhere({
		// 	'nick': nick
		// }, ).value());
		c.end();
	});
	c.on('error', function(e) {
		console.log('NRSC roblem with request: ' + e.message);
	});

});

server.listen(55555, function() {
	console.log('Nick resolve server bound.');
});

server.on('error', function(e) {
	console.log('NRS Problem with request: ' + e.message);
});

client.on('end', function() {
	console.log('Disconnected from server.');
	server.close();
});

function resolveHostel(ip) {
	ip = ip.split('.');
	if (4 != ip.length) {
		return 'err';
	}
	switch (ip[1]) {
		case '1':
			return 'CC';
		case '2':
			return 'LABS';
		case '3':
			switch (ip[2]) {
				case '1':
					return 'AH1';
				case '2':
					return 'TBI';
				case '3':
					return 'AH2';
				case '4':
					return 'VGH';
				case '6':
					return 'AH3';
				case '8':
					return 'AH4';
				case '9':
					return 'AH5';
				case '11':
					return 'AH6';
				case '12':
					return 'AH7';
				case '14':
					return 'AH8';
				default:
					return 'err';
			}
		case '4':
			switch (ip[2]) {
				case '1':
					return 'CH1';
				case '2':
					return 'CH1';
				case '3':
					return 'CH2';
				case '5':
					return 'CH3';
				case '9':
					return 'CH5';
				case '12':
					return 'CH4';
				case '14':
					return 'CH6+CH5';
				default:
					return 'err';
			}
		default:
			return 'err';
	}
}
