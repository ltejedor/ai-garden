# 3D Visualization Project

This project consists of a Three.js frontend for 3D visualization and a Python backend for data processing.

## Project Structure

- `frontend/` - Contains the Three.js visualization code
- `backend/` - Contains the Python backend code
- `server/` - Contains the Express.js server that connects the frontend with the Python backend

## Setup Instructions

### Backend (Python)
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`

### Server (Express)
1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Start the server: `npm start`

### Frontend (Three.js)
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## Development

The frontend communicates with the Express server, which in turn communicates with the Python backend. This architecture allows for:

1. Real-time 3D visualization in the browser using Three.js
2. Data processing and computation in Python
3. Seamless communication between the two via the Express server

## API Endpoints

- `/api/data` - Get data from the Python backend
- `/api/process` - Send data to the Python backend for processing