// login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (username && password) {
      const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      if (response.status === 200) {
          sessionStorage.setItem('username', username);
          window.location.href = 'dashboard.html';
      } else {
          alert(result.message);
      }
  } else {
      alert('Please fill in both fields');
  }
});

// register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
  });

  const result = await response.json();
  if (response.status === 200) {
      window.location.href = 'index.html';
  } else {
      alert(result.message);
  }
});

// send message
document.getElementById('messageForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('messageInput').value;
  const sender = sessionStorage.getItem('username');
  const receiver = document.getElementById('chatWithUser').innerText;

  const response = await fetch('/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, receiver, message }),
  });

  if (response.status === 200) {
      // Add message to chat display
      const messageElement = document.createElement('div');
      messageElement.textContent = `${sender}: ${message}`;
      document.getElementById('messages').appendChild(messageElement);
  } else {
      alert('Message sending failed');
  }
});
