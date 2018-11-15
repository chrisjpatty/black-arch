// Import dependencies
const PS = require('python-shell')
const PythonShell = PS.PythonShell
const chalk = require('chalk')
const bonjour = require('bonjour')()
const firebase = require('firebase')
								 require("firebase/firestore");
const { blink, ledOn, ledOff, cleanupLed } = require("./led")

// Define global constants
const CONFIG = require('./config')
const NODE_MESSAGE = '@NODE';
const READ_MESSAGE = 'READ';
const STATION_ID = CONFIG.stationId

// Define global variables (mutatable)
let pyshell = null;
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
		// querySnapshot.forEach(ss => {console.log(ss.data());})
		// Start scanner instance
		startScanner()
	})
	.catch(err => {
		startScanner()
	})

// Set a reference to the scans collection
const SCANS_REF = database
	.collection("stations")
	.doc(`station_${STATION_ID}`)
	.collection("scans")

//Spawns a new python process and attaches message handlers
const startScanner = () => {
	console.log(chalk.green(`Station ${STATION_ID} scanner started`));
	ledOff()
	blink(3, 400)

	// Spawn python script
	pyshell = new PythonShell('read.py', {
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
	console.log(chalk.cyan("Entered"), id);
	if(lastSeenId !== id){
		SCANS_REF
			.add({
				in: new Date(),
				out: null
			})
			.then(doc => {
				console.log("IN: ", doc.id);
				currentScanId = doc.id
				// blink(1, 500)
			})
			.catch(err => {
				blink(5, 200)
			})
	}
	ledOn()
	lastSeenId = id
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
		.catch(err => {
			blink(5, 100)
		})
	ledOff()
}

// Handle script execution exit event
const onExitHandler = () => {
	ledOff()
	// cleanupLed()
	pyshell.end((err,code,signal) => {
	  if (err) throw err
	})
	console.log()
	console.log(chalk.red(`Scanner station ${STATION_ID} exited`));
	process.exit()
}
process.on('SIGINT', onExitHandler);

const {firebaseConfig: deleted, ...payload } = CONFIG
bonjour.publish({ name: `Station ${STATION_ID}`, type: 'http', port: 3000, txt: payload })
