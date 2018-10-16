const PS = require('python-shell')
const chalk = require('chalk')
const PythonShell = PS.PythonShell

const NODE_MESSAGE = '@NODE';
const READ_MESSAGE = 'READ';
let exitTimeout = null;
let entered = false;
let lastSeenId = null;

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

const onEntered = id => {
	lastSeenId = id
	console.log(chalk.cyan("Entered"), id);
}

const onExited = () => {
	const exitedId = lastSeenId;
	entered = false;
	console.log(chalk.magenta("Exited"), exitedId);
}

const onExitHandler = () => {
	pyshell.end((err,code,signal) => {
	  if (err) throw err
	  console.log('The exit code was: ' + code)
	  console.log('The exit signal was: ' + signal)
	  console.log('finished')
	})
	console.log(chalk.red("Scanner station #1 exited"));
}

// Attach exit handler
process.on('exit', onExitHandler.bind(null,{cleanup:true}))
