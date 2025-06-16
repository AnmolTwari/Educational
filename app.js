require('dotenv').config(); // Load environment variables

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// MongoDB connection
mongoose.connect('mongodb+srv://anmoltiwari621:DNrCgVzGOpeWDvLU@cluster0.3r8bngn.mongodb.net/myDatabase?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));
// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files & body parser
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

// Registration handler
app.post('/register', async (req, res) => {
  const { name, username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.send("Passwords do not match.");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, username, email, password: hashedPassword });
    // console.log("@@@@", newUser);
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

// Login handler
// Login handler (Updated)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: username }, { username: username }]
    });

    if (!user) {
      return res.send(`<script>alert('❌ Invalid Credentials.'); window.location.href = '/login';</script>`);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send(`<script>alert('❌ Invalid Credentials.'); window.location.href = '/login';</script>`);
    }

    // ✅ Redirect to dashboard with user name in query string
    res.redirect(`/dashboard?user=${encodeURIComponent(user.name)}`);
  } catch (err) {
    console.error("Login Error:", err);
    res.send(`<script>alert('⚠️ Server error. Please try again later.'); window.location.href = '/login';</script>`);
  }
});

// Dashboard route (NEW)
app.get('/dashboard', (req, res) => {
  const user = { name: req.query.user || "Guest" };
  res.render('index', { user });
});


// Contact form handler
app.post('/contact', async (req, res) => {
  const { fname, lname, email, message, additional } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  const mailOptions = {
    from: email,
    to: 'ialphoverse@gmail.com',
    subject: `Contact Form - ${fname} ${lname}`,
    text: `
      New contact form submission:

      Name: ${fname} ${lname}
      Email: ${email}
      Message: ${message}
      Additional Details: ${additional}
    `
  };

  transporter.verify((error, success) => {
    if (error) {
      console.error("Transporter Setup Error:", error);
    } else {
      console.log("Server is ready to take messages");
    }
  });

  try {
    await transporter.sendMail(mailOptions);
    res.send(`<script>alert('Message sent successfully!'); window.history.back();</script>`);
  } catch (error) {
    console.error("Contact form error:", error);
    res.send(`<script>alert('Failed to send message. Please try again later.'); window.history.back();</script>`);
  }
});

app.post('/submit-feedback', async (req, res) => {
  const { name, mail, additional } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  const mailOptions = {
    from: mail,
    to: 'ialphoverse@gmail.com',
    subject: `Feedback Form Submission - ${name}`,
    text: `
               New feedback form submission:

               Name: ${name}
               Email: ${mail}
               Additional Details: ${additional}
           `
  };

  try {
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error("Transporter Setup Error:", error);
          reject(error);
        } else {
          console.log("Server is ready to take messages");
          resolve(success);
        }
      });
    });

    await transporter.sendMail(mailOptions);
    res.send(`<script>alert('Message sent successfully!'); window.location.href = '/';</script>`);
    res.render('index')
  } catch (error) {
    console.error("Feedback form error:", error);
    res.status(500).send(`<script>alert('Failed to send message. Please try again later.'); window.location.href = '/';</script>`);
  }
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
