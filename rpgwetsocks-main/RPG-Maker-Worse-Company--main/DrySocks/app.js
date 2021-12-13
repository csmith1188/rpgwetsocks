const fs = require('fs');
const WebSocket = require('ws');

const PORT = 81;
const MAXPLAYERS = 30;

// Create a new websocket server using the ws module
const wss = new WebSocket.Server({
	port: PORT
});

console.log('Bleep bloop!');

var clients = {};

var cache = [];

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

	function broadcast(clientsList, data) {
		for (const client in clientsList) {
			clientsList[client].send(data);
		}
	}
	ws.onmessage = function(message){
		broadcast(clients, message)
	}

	ws.on('message', function incoming(message) {
		console.log(message);
		broadcast(clients, message)
	});

	ws.on('close', function(wsArg, req) {
		console.log(`Connection closed: ${ws.id}`);
		delete clients[ws.id];
	})


ws.send(`Hey there ${ws.id}`)
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



function packData(type, to, from, content) {
	return {
		type: type,
		date: parseInt(new Date().valueOf()), // Send in Epoch time
		to: to,
		from: from,
		content: content
	}
}
