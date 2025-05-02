import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';

function App() {
  const mountRef = useRef(null);
  // Chat state
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! This is a test chat. Type a message and press Send.' }
  ]);
  const [input, setInput] = useState('');
  
  useEffect(() => {
    // Scene setupf
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Example geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // Fetch data from backend
    // const fetchData = async () => {
    //   try {
    //     const response = await axios.get('/api/data');
    //     console.log('Data from backend:', response.data);
    //     // Update visualization based on data
    //     // This is where you would process the data from your Python backend
    //   } catch (error) {
    //     console.error('Error fetching data:', error);
    //   }
    // };
    
    // fetchData();
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);
  
  // Handle chat form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInput('');
    try {

        const { data } = await axios.post('/api/chat', { message: text }); // <‑‑ new path
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]); // <‑‑ new shape
  
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Error: failed to send message' }]);
    }
  };
  
  return (
    <div>
      <div id="info">
        3D Visualization with Three.js and Python Backend
      </div>
      <div ref={mountRef}></div>
      {/* Chat interface */}
      <div className="chat-interface">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
