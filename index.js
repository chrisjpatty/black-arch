// Import dependencies
const PS = require('python-shell')
const PythonShell = PS.PythonShell
const chalk = require('chalk')
const bonjour = require('bonjour')()
const firebase = require('firebase')
								 require("firebase/firestore");

// Define global constants
const CONFIG = require('./config')
const NODE_MESSAGE = '@NODE';
const READ_MESSAGE = 'READ';
const STATION_ID = CONFIG.stationId

// Define global variables (mutatable)
let exitTimeout = null;
let entered = false;
let lastSeenId = null;
let currentScanId = null;

// Initialize Firebase app
const app = firebase.initializeApp(CONFIG.firebaseConfig);
const database = firebase.firestore();
database.settings({
  timestampsInSnapshots: true
})

// Fetch station configuration to avoid initalization delay
database
	.collection('stations')
	.where('id', '==', STATION_ID)
	.get()
	.then(querySnapshot => {
		// Start scanner instance
		startScanner()
	})

// Set a reference to the scans collection
const SCANS_REF = database
	.collection("stations")
	.doc(`station_${STATION_ID}`)
	.collection("scans")

//Spawns a new python process and attaches message handlers
const startScanner = () => {
	console.log(chalk.green("Station #1 scanner started"));

	// Spawn python script
	let pyshell = new PythonShell('read.py', {
		mode: 'text',
		pythonPath: '/usr/bin/python',
		pythonOptions: ['-u'],
		scriptPath: __dirname,
		args: ['message']
	})

	// Attach python message handler
	pyshell.on('message', function (message) {
	  if(message.includes(NODE_MESSAGE)){
			const params = message.split(':')
			if(params[1] === READ_MESSAGE)
			onRead(params[2])
		};
	})
}

// Handle read events
const onRead = id => {
	if(entered === false){
		entered = true;
		onEntered(id)
	}
	if(exitTimeout){
		clearTimeout(exitTimeout)
	}
	exitTimeout = setTimeout(onExited, 1000)
}

// Handle enter events
const onEntered = id => {
	lastSeenId = id
	console.log(chalk.cyan("Entered"), id);
	SCANS_REF
		.add({
			in: new Date(),
			out: null
		})
		.then(doc => {
			console.log("IN: ", doc.id);
			currentScanId = doc.id
		})
}

// Handle exit events
const onExited = () => {
	const exitedId = lastSeenId;
	const cachedCurrentScanId = currentScanId
	entered = false;
	console.log(chalk.magenta("Exited"), exitedId);
	SCANS_REF
		.doc(cachedCurrentScanId)
		.update({
			out: new Date()
		})
		.then(() => {
			console.log("OUT: ", cachedCurrentScanId);
		})
}

// Handle script execution exit event
const onExitHandler = () => {
	pyshell.end((err,code,signal) => {
	  if (err) throw err
	})
	console.log(chalk.red("Scanner station #1 exited"));
}

// Attach exit handler
process.on('exit', onExitHandler.bind(null,{cleanup:true}))

bonjour.publish({ name: 'My Web Server', type: 'http', port: 3000 })
