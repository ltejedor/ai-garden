const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PythonShell } = require('python-shell');
const path = require('path');
// Ensure Python can locate the smolagents-ref library
const SMOLAGENTS_PATH = path.join(__dirname, '../smolagents-ref/src');
const pythonEnv = { ...process.env, PYTHONPATH: SMOLAGENTS_PATH };

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// API endpoint to get data from Python backend
app.get('/api/data', (req, res) => {
  const options = {
    // Path to Python script and interpreter
    scriptPath: path.join(__dirname, '../backend'),
    pythonPath: 'python',          // or specify the path to your Python executable
    pythonOptions: ['-u'],         // unbuffered stdout/stderr
    mode: 'text',                  // raw text output
    env: pythonEnv,                // include smolagents library in PYTHONPATH
  };
  // Run Python script and handle output via promise
  PythonShell.run('main.py', options)
    .then((results) => {
      try {
        // Assuming the Python script returns JSON in the first line
        const data = JSON.parse(results[0]);
        console.log("called 3");
        console.log(data);
        res.json(data);
      } catch (error) {
        console.error('Error parsing Python output:', error);
        res.status(500).json({ error: 'Failed to parse data from Python backend' });
      }
    })
    .catch((err) => {
      console.error('Error running Python script:', err);
      res.status(500).json({ error: 'Failed to get data from Python backend' });
    });
});

// API endpoint to process data with Python backend
app.post('/api/process', (req, res) => {
  const data = req.body;
  
  const options = {
    scriptPath: path.join(__dirname, '../backend'),
    pythonPath: 'python',       // or specify the path to your Python executable
    args: ['--process-data'],
    mode: 'json',
    pythonOptions: ['-u'],      // unbuffered output
    stdin: true,
    env: pythonEnv,             // include smolagents library in PYTHONPATH
  };

  const pyshell = new PythonShell('main.py', options);
  
  pyshell.send(JSON.stringify(data));
  
  // Handle the JSON output from Python; mode='json' parses it for us
  pyshell.on('message', function (message) {
    // 'message' is already a JS object when mode='json'
    res.json(message);
  });
  
  pyshell.end(function (err) {
    if (err) {
      console.error('Error running Python script:', err);
      return res.status(500).json({ error: 'Failed to process data with Python backend' });
    }
  });
});

// …top‑of‑file requires stay the same …

// POST /api/chat  – send { message: "…", stream: false } in body
app.post('/api/chat', (req, res) => {
  const { message, stream = false } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'No message in body' });
  }

  const options = {
    scriptPath: path.join(__dirname, '../backend'),
    pythonPath: 'python',
    pythonOptions: ['-u'],          // unbuffered
    args: ['--prompt', message].concat(stream ? ['--stream'] : []),
    env: pythonEnv,                 // include smolagents library in PYTHONPATH
    mode: 'json'                    // auto‑parse each line as JSON
  };

  const py = new PythonShell('main.py', options);

  if (stream) {
    // ---- Server‑Sent Events ----
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    // Send only valid JSON 'stream' messages, ignore banner/log lines
    py.on('message', msg => {
      try {
        const data = JSON.parse(msg);
        res.write(`data: ${JSON.stringify(data.stream)}\n\n`);
      } catch (err) {
        // ignore non-JSON lines (banners, logs)
      }
    });
    py.end(() => res.end());
  } else {
    // ---- one‑shot JSON reply ----
    let replied = false;
    py.on('message', msg => {
      if (replied) return;
      // msg is already a JS object parsed from JSON
      res.json(msg);
      replied = true;
    });
  }

  py.on('error', err => {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Python failure' });
  });
});


// Catch-all handler for client-side routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

