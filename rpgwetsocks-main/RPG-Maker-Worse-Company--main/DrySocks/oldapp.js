const fs = require('fs');
const WebSocket = require('ws');

const PORT = 81;
const MAXPLAYERS = 4;

// Create a new websocket server using the ws module
const wss = new WebSocket.Server({
	port: PORT
});

console.log('Bleep bloop!');

var clients = {};

var cache = [];

let Quiz;

fs.readFile('./quiz.json', 'utf8', (err, fileData) => {
	if (err) {
		console.log(`[ERROR] Could not read file from disk: ${err}`);
	} else {
		// parse JSON string to JSON object
		Quiz = JSON.parse(fileData);
	}
});

wss.on('connection', function connection(ws, req) {

	if (Object.keys(clients).length <= MAXPLAYERS) {
		let new_clientID = 1
		while (clients[new_clientID]) {
			new_clientID++
		};
		ws.id = new_clientID;
		clients[ws.id] = ws;
		clients[ws.id].send(JSON.stringify(packData('id', '', 'server', ws.id)));
		console.log(`Connection accepted: ${ws.id}`);
	} else {
		ws.close(0, "Server is full.")
		console.log(`Connection refused: Server is full.`);
	}


	ws.on('message', function incoming(message) {
		console.log(message);
		cache.push(message)
		let msgData = JSON.parse(message);
		if (msgData.to == 'server') {
			switch (msgData.type) {
				case 'quizme':
					if (clients[msgData.from]) {
						let x = Math.floor(Math.random() * 3);
						let data = packData('quiz_out', msgData.from, 'server', {
							id: Quiz.challenges[x].id,
							question: Quiz.challenges[x].question,
							answers: Quiz.challenges[x].answers
						});
						clients[msgData.from].send(JSON.stringify(data));
					} else {
						console.log('[ERROR] No \'from\' data. Cannot return to sender.');
					}
					break;
				case 'quiz_in':
					if (clients[msgData.from]) {
						let challenge = Quiz.challenges.find(chal => chal.id == msgData.content.id);
						let data;
						if (challenge) {
							if (challenge.answer_index == msgData.content.repl_index) {
								data = packData('message', msgData.from, 'server', "You did it, champ!");
							} else {
								data = packData('message', msgData.from, 'server', "Haha, loser!");
							}
							clients[msgData.from].send(JSON.stringify(data));
						}
					} else {
						console.log('[ERROR] No \'from\' data. Cannot return to sender.');
					}
					break;
				case 'location':
					if (clients[msgData.from]) {
						clients[msgData.from].x = msgData.content.x;
						clients[msgData.from].y = msgData.content.y;
						let content = {};
						Object.keys(clients).forEach(function(key, index) {
							content[key] = {
								x: clients[key].x,
								y: clients[key].y
							}
						});
						clients[msgData.from].send(JSON.stringify(packData('location', msgData.from, 'server', content)));
					} else {
						console.log('[ERROR] No \'from\' data. Cannot match clientID to sender.');
					}
					break;
				default:
					break;
			}
		} else if (msgData.to == 'host') {} else if (clients[msgData.to]) {
			clients[msgData.to].send(message)
		} else {
			broadcast(clients, message)
		}
	});

	ws.on('close', function(wsArg, req) {
		console.log(`Connection closed: ${ws.id}`);
		delete clients[ws.id];
	})
});

// setInterval(function() {
// 	let content = {};
// 	for (const client in clients) {
// 		content[client.id] = {
// 			x: client.x,
// 			y: client.y
// 		}
// 	}
// 	if (clients) {
// 		broadcast(clients, packData('location', null, 'server', content));
// 	}
// }, 16);

function broadcast(clientsList, data) {
	for (const client in clientsList) {
		clientsList[client].send(data);
	}
}

function packData(type, to, from, content) {
	return {
		type: type,
		date: parseInt(new Date().valueOf()), // Send in Epoch time
		to: to,
		from: from,
		content: content
	}
}
