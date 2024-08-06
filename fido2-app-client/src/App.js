import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [currentUsers, setCurrentUsers] = useState([]);

  const handleRegisterRequest = async () => {
    try {
      const response = await axios.post('http://localhost:3001/register-request', { username }, { withCredentials: true });
      const options = response.data;
      options.challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));
      options.user.id = Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0));

      const credential = await navigator.credentials.create({ publicKey: options });
      const attestationResponse = {
        id: credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        response: {
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
          attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
        },
        type: credential.type,
      };

      const result = await axios.post('http://localhost:3001/register', { username, attestationResponse }, { withCredentials: true });
      setMessage(result.data);
    } catch (error) {
      setMessage(`Error registering: ${error.response ? error.response.data : error.message}`);
    }
  };

  const handleLoginRequest = async () => {
    try {
      const response = await axios.post('http://localhost:3001/login-request', { username }, { withCredentials: true });
      const options = response.data;
      options.challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));
      options.allowCredentials = options.allowCredentials.map(cred => {
        return { ...cred, id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)) };
      });

      const assertion = await navigator.credentials.get({ publicKey: options });
      const assertionResponse = {
        id: assertion.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
        response: {
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
          signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature))),
          userHandle: assertion.response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(assertion.response.userHandle))) : null,
        },
        type: assertion.type,
      };

      const result = await axios.post('http://localhost:3001/login', { username, assertionResponse }, { withCredentials: true });
      setMessage(result.data);
    } catch (error) {
      setMessage(`Error logging in: ${error.response ? error.response.data : error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await axios.post('http://localhost:3001/logout', { username }, { withCredentials: true });
      setMessage(response.data);
    } catch (error) {
      setMessage(`Error logging out: ${error.response ? error.response.data : error.message}`);
    }
  };

  const fetchCurrentUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/current-users', { withCredentials: true });
      setCurrentUsers(response.data);
    } catch (error) {
      setMessage(`Error fetching current users: ${error.response ? error.response.data : error.message}`);
    }
  };

  return (
    <div>
      <h1>FIDO2 Authentication</h1>
      <input
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="Username"
      />
      <button onClick={handleRegisterRequest}>Register</button>
      <button onClick={handleLoginRequest}>Sign In</button>
      <button onClick={handleLogout}>Sign Out</button>
      <button onClick={fetchCurrentUsers}>Fetch Current Users</button>
      <div>{message}</div>
      <ul>
        {currentUsers.map(user => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
