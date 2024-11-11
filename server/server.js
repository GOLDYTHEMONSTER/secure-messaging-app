const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// File Paths
const usersFilePath = path.join(__dirname, 'data', 'users.json');
const messagesFilePath = path.join(__dirname, 'data', 'messages.json');

// Utility function to read JSON data from file
function readJSONFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Utility function to write JSON data to file
function writeJSONFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Home route
app.get('/', (req, res) => {
  res.send('Messaging App Backend');
});

// Registration Route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const users = readJSONFile(usersFilePath);

  if (users[username]) {
    return res.status(400).send('User already exists');
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save new user to file with the current date
  const currentDate = new Date().toISOString();
  users[username] = {
    password: hashedPassword,
    friends: [],
    dateCreated: currentDate,
  };
  writeJSONFile(usersFilePath, users);

  // Respond with success
  res.status(200).send({ message: 'User registered successfully', username, dateCreated: currentDate });
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readJSONFile(usersFilePath);

  const user = users[username];
  if (!user) {
    return res.status(400).send('Invalid username or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).send('Invalid username or password');
  }

  res.status(200).send({ message: 'Login successful', username });
});

// Add Friend Route
app.post('/add-friend', (req, res) => {
  const { username, friendUsername } = req.body;
  const users = readJSONFile(usersFilePath);

  if (!users[friendUsername]) {
    return res.status(400).send('Friend does not exist');
  }

  users[username].friends.push(friendUsername);
  writeJSONFile(usersFilePath, users);

  res.status(200).send('Friend added');
});

// Send Message Route (Encrypts the message)
app.post('/send-message', (req, res) => {
  const { sender, receiver, message } = req.body;
  const users = readJSONFile(usersFilePath);
  const messages = readJSONFile(messagesFilePath);

  if (!users[sender] || !users[receiver]) {
    return res.status(400).send('Invalid sender or receiver');
  }

  const secretKey = crypto.randomBytes(32); // 256-bit key
  const iv = crypto.randomBytes(16); // Initialization vector

  const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
  let encryptedMessage = cipher.update(message, 'utf-8', 'hex');
  encryptedMessage += cipher.final('hex');

  // Store message with encrypted text and key
  messages.push({
    sender,
    receiver,
    message: encryptedMessage,
    iv: iv.toString('hex'),
    secretKey: secretKey.toString('hex'), // For demo purposes, store key (do not store keys in production)
    timestamp: new Date().toISOString(),
  });

  writeJSONFile(messagesFilePath, messages);
  res.status(200).send('Message sent successfully');
});

// Get Messages Route (Decrypts the message)
app.get('/messages/:username', (req, res) => {
  const { username } = req.params;
  const messages = readJSONFile(messagesFilePath);

  const userMessages = messages.filter(
    (msg) => msg.sender === username || msg.receiver === username
  );

  const decryptedMessages = userMessages.map((msg) => {
    const iv = Buffer.from(msg.iv, 'hex');
    const secretKey = Buffer.from(msg.secretKey, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv);
    let decryptedMessage = decipher.update(msg.message, 'hex', 'utf-8');
    decryptedMessage += decipher.final('utf-8');

    return { ...msg, message: decryptedMessage };
  });

  res.status(200).send(decryptedMessages);
});

// List all Users with their Key Info (name, hashed password, creation date)
app.get('/users', (req, res) => {
  const users = readJSONFile(usersFilePath);

  const userList = Object.keys(users).map((username) => ({
    username,
    password: users[username].password,
    dateCreated: users[username].dateCreated,
  }));

  res.status(200).send(userList);
});

// Server Start
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
