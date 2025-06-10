const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');


mongoose.connect('mongodb://127.0.0.1:27017/alphoverseDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));


// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('login');  
});

app.get('/login', (req, res) => {
  res.render('login');
});
app.use(express.urlencoded({ extended: true })); 

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { name, username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.send("Passwords do not match.");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username, // ✅ now included
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.send("User registered successfully!");
  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === 11000) {
      res.send("Username or Email already registered.");
    } else if (err.name === "ValidationError") {
      res.send("Validation error: " + err.message);
    } else {
      res.send("Error during registration.");
    }
  }
});

// Handle login form submission (basic example)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: username }, { username: username }]
    });

    if (!user) {
      return res.send('Invalid Credentials.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send('Invalid Credentials.');
    }

    res.render('index', { user });
  } catch (err) {
    console.error("Login Error:", err);
    res.send('Server error.');
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});