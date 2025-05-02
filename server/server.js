const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PythonShell } = require('python-shell');
const path = require('path');

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
  console.log("called")
  const options = {
    // Path to Python script and interpreter
    scriptPath: path.join(__dirname, '../backend'),
    pythonPath: 'python', // or specify the path to your Python executable
    pythonOptions: ['-u'],   // unbuffered stdout/stderr
    args: ['--get-data']
  };

  console.log("called 2")

  // Run Python script and handle output via promise
  PythonShell.run('main.py', options)
    .then((results) => {
      console.log("called 2.5");
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
    pythonPath: 'python', // or specify the path to your Python executable
    args: ['--process-data'],
    mode: 'json',
    pythonOptions: ['-u'], // unbuffered output
    stdin: true
  };

  const pyshell = new PythonShell('main.py', options);
  
  pyshell.send(JSON.stringify(data));
  
  pyshell.on('message', function (message) {
    try {
      const result = JSON.parse(message);
      res.json(result);
    } catch (error) {
      console.error('Error parsing Python output:', error);
      res.status(500).json({ error: 'Failed to parse result from Python backend' });
    }
  });
  
  pyshell.end(function (err) {
    if (err) {
      console.error('Error running Python script:', err);
      return res.status(500).json({ error: 'Failed to process data with Python backend' });
    }
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
