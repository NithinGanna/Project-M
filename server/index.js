import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors'; // Import CORS middleware
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'

const app = express();
const PORT = 5000;

import dotenv from 'dotenv';
dotenv.config();

// MongoDB connection
// const DB_URL = 'mongodb://127.0.0.1:27017/projectsDB';
// const JWT_SECRET="your-secret-key";

const DB_URL = process.env.MONGODB_URL;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(DB_URL)
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });



// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  Role:{type: String ,default:"user"}
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());
// Allow requests from specific origin
const corsOptions = {
  origin: ['http://localhost:3000'],  // Change this to your frontend URL
  credentials: true
};
app.use(cookieParser());

app.use(cors(corsOptions));

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  // Extract token from cookies
  const token = req.cookies.token;
  // console.log("token please --  - - - -   ", token);
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.userId; 
    // console.log("role ",decoded);// Attach userId to request object
    req.type=decoded.role;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(username + " " + password);

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // Generate JWT
    const token = jwt.sign({ userId: newUser._id,role:newUser.Role }, JWT_SECRET, { expiresIn: '1d' }); // Change secret key and expiration as needed
    // localStorage.setItem('token', token);
    
console.log('Generated token in registration:', token);

    // Send JWT as a cookie
    res.cookie('token', token, { httpOnly: true });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("username ",username,"pasword ",password);

    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    console.log("in login ",user.Role);
    // Generate JWT
    const token = jwt.sign({ userId: user._id,role:user.Role }, 'your-secret-key', { expiresIn: '1d' }); // Change secret key and expiration as needed
// Log the token to the console
// localStorage.setItem('token', token);
console.log('Generated token in login:', token);
console.log("token = ",token);
    // Send JWT as a cookie
    res.cookie('token', token, { httpOnly: true });
    console.log("token genereated by man ",token);

    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint
app.get('/api/logout',verifyToken,(req, res) => {
  res.clearCookie('token'); // Clear JWT cookie
  res.json({ message: 'Logout successful' });
});


const domainSchema = new mongoose.Schema({
  domainName: String,
});
const {ObjectId} = mongoose.Schema.Types
const projSchema = new mongoose.Schema({
  projectName: String,
  domain: String,
  description: String,
  likes: [{ type: ObjectId, ref: "User" }],
  comments: [{
    text: String,
    time: { type: Date, default: Date.now }, // Add the time field
    postedBy: String,
  }],
});

// Middleware to sort comments array in decreasing order based on time before saving
projSchema.pre('save', function(next) {
  this.comments.sort((a, b) => b.time - a.time);
  next();
});

const Domain = mongoose.model('Domain', domainSchema);
const Proj = mongoose.model('Proj', projSchema);
app.use(bodyParser.json());

app.get('/api/isauth',verifyToken,async(req,res)=>{
  console.log("is admin ",req.type);
  if(req.type!='Admins')
  {
    res.status(400).json({message:"Unauthorized user for this route"});
  }
  else{
    res.status(200).json({message:"admins"});
  }
})
// Endpoint for submitting domain name
app.post('/api/domains',verifyToken, async (req, res) => {
  console.log("in post requests iam sorry");
  if(req.type!='Admins'){
    res.status(300).json({error:" U are not allowed to enter "});
  }
  try {
    
    const { domainName } = req.body;
    // Check if domain already exists
    const existingDomain = await Domain.findOne({ domainName });
    if (existingDomain) {
      return res.status(400).json({ error: 'Domain already exists' });
    }
    // Save domain
    const domain = new Domain({ domainName });
    await domain.save();
    res.json({ message: 'Domain submitted successfully', domain });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for fetching all domain names
app.get('/api/domains',verifyToken, async (req, res) => {
    try {
      // console.log("in get request ");
      // Fetch all domains from the database
      const domains = await Domain.find({});
      // console.log(domains+" domains list"); // Only retrieve domainName field
      res.json({ id:req.userId,domains });
    } catch (error) {
      console.log("error "+error);
      res.status(500).json({ error: error.message });
    }
  });
  

// Endpoint for adding a project
app.post('/api/project', verifyToken,async (req, res) => {
  if(req.type!="Admins"){
    res.status(300).json({error:"Unauthorized"});
  }
  try {
    const { domain, projectName, description } = req.body;
    
    // Check if project already exists for this domain
    const existingProject = await Proj.findOne({ domain, projectName });
    if (existingProject) {
      console.log('Proj already exists for this domain:', domain, projectName);
      return res.status(400).json({ error: 'Proj already exists for this domain' });
    }
    
    // Save project
    const project = new Proj({ domain, projectName, description });
    await project.save();
    
    console.log('Proj added successfully:', project);
    res.json({ message: 'Proj added successfully', project });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for fetching projects based on domain
app.get('/api/project', async (req, res) => {
    try {
      const { domain } = req.query;
      if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
      }
      const project = await Proj.find({ domain });
      res.json({ project });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  //project like

  app.put('/api/project/like', verifyToken, async (req, res) => {
    const { projectId } = req.body;
    const userId = req.userId; // Assuming user ID is stored in req.user.id after verification
  
    try {
      const project = await Proj.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Proj not found' });
      }
  
      const likedIndex = project.likes.indexOf(userId);
      if (likedIndex === -1) {
        // User has not liked the project, add user ID to likes array
        project.likes.push(userId);
      } else {
        // User has already liked the project, remove user ID from likes array
        project.likes.splice(likedIndex, 1);
      }
  
      await project.save();
      res.sendStatus(200);
    } catch (error) {
      
      console.error('Error liking project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  app.put('/api/project/Coment',verifyToken,async(req,res)=>{
    const { text, projectId } = req.body;
    const userId = req.userId;
    // console.log("userId====",userId);
    
    try {
      const project = await Proj.findById(projectId).populate('comments.postedBy', 'username');
      if (!project) {
        return res.status(404).json({ error: 'Proj not found' });
      }
      // Assuming you have a User model and can fetch the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
      
      // Check if the user already has a comment
      const existingCommentIndex = project.comments.findIndex(comment => comment.postedBy.toString() === userId);
      if (existingCommentIndex !== -1) {
        // If the user already has a comment, update it
        project.comments[existingCommentIndex].text = text;
      } else {
        // If the user doesn't have a comment, add a new one
        project.comments.push({ text, postedBy: user.username });
      }
    
      // Save the updated project
      await project.save();
      
      // Return a success response
      return res.status(200).json({ message: 'Comment updated/added successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    
  });
  
  app.get('/api/project/likes/:projectId', async (req, res) => {
    const { projectId } = req.params;
  
    try {
      const project = await Proj.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Proj not found' });
      }
      
      res.json({ likesCount: project.likes.length });
    } catch (error) {
      console.error('Error fetching likes count:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Endpoint for fetching current user details
app.get('/api/currentUser', verifyToken, async (req, res) => {
  try {
    // Get the user ID from the request
    const userId = req.userId;
    
    // Fetch the user details from the database
    const user = await User.findById(userId);
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return the user details
    res.json({ user });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for deleting a comment
app.delete('/api/project/comment/:projectId/:commentId', verifyToken, async (req, res) => {
  try {
    const { projectId, commentId } = req.params;
    const userId = req.userId;

    // Find the project
    const project = await Proj.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proj not found' });
    }

    // Find the comment index
    const commentIndex = project.comments.findIndex(comment => comment._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // console.log(userId);

    // Fetch the user details from the database
    const user = await User.findById(userId);

    // console.log(user.username);

    // Check if the user is authorized to delete the comment
    if (project.comments[commentIndex].postedBy.toString() !== user.username) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    // Remove the comment from the array
    project.comments.splice(commentIndex, 1);

    // Save the updated project
    await project.save();

    // Return a success response
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});