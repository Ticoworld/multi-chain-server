const express = require('express')
const app = express()
const cors  = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const saltRounds = 10; 
app.use(cors())
app.use(express.json())
dotenv.config()
const User = require('./models/user.model')

const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI);

app.post('/api/register', async (req, res) => {
  console.log(req.body);
  try {
    const { firstname, lastname, username, email, phone, country, password, confirmpassword } = req.body;

    const minPasswordLength = 8; 

    if (password.length < minPasswordLength) {
      return res.status(400).json({ status: 'error', message: `Password must be at least ${minPasswordLength} characters long.` });
    }

    if (password !== confirmpassword) {
      return res.status(400).json({ status: 'error', message: 'Confirm password must be the same as password.' });
    }

  
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await User.create({
      firstname,
      lastname,
      username,
      email,
      phone,
      country,
      password: hashedPassword,
      funded: 0,
      investment: [],
      transaction: [],
      withdraw: [],
      periodicProfit: 0,
      deposit: [],
    });

    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(400).json({ status: 'error', error: 'Duplicate Email' });
    }

    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
});

app.post('/api/login', async (req, res) => {
    console.log(req.body);

    const user = await User.findOne({
        email: req.body.email,
    });

    if (user) {
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);

        if (isPasswordValid) {
            const token = jwt.sign({
                username: user.username,
                email: user.email,
            }, 'secret123');

            return res.json({ status: 'ok', user: token });
        } else {
            return res.json({ status: 'error', user: false });
        }
    } else {
        return res.json({ status: 'error', user: false });
    }
});


app.get('/api/getData', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret123')
    const email = decode.email
    const user = await User.findOne({ email: email })
    res.json({
      status: 'ok',
      firstname: user.firstname,
      lastname: user.lastname,
      username:user.username,
      email: user.email,
      funded: user.funded,
      invest: user.investment,
      transaction: user.transaction,
      withdraw: user.withdraw,
      deposit: user.deposit,
    })
  } catch (error) {
    res.json({ status: 'error' })
  }
})

app.post('/api/fundwallet', async (req, res) => {
  try {
    const email = req.body.email;
    const incomingAmount = req.body.depositAmount;

    // Find the user by email
    const user = await User.findOne({ email: email });

    // Update user's funded, capital, and totaldeposit fields
    await User.updateOne(
      { email: email },
      {
        $set: {
          funded: incomingAmount + user.funded,
          capital: user.capital + incomingAmount,
          totaldeposit: user.totaldeposit + incomingAmount,
        },
      }
    );

    // Add a new entry to the deposit array
    await User.updateOne(
      { email: email },
      {
        $push: {
          deposit: {
            id: 1,
            date: new Date().toLocaleString(),
            amount: incomingAmount,
            balance: incomingAmount + user.funded,
          },
        },
      }
    );

    // Add a new entry to the transaction array for the deposit
    await User.updateOne(
      { email: email },
      {
        $push: {
          transaction: {
            type: 'Deposit',
            amount: incomingAmount,
            date: new Date().toLocaleString(),
            balance: incomingAmount + user.funded,
          },
        },
      }
    );

    // Send a JSON response indicating success
    res.json({
      status: 'ok',
      funded: req.body.amount,
      name: user.firstname,
      email: user.email,
      message: `Your account has been credited with $${incomingAmount} USD. You can proceed to choosing your preferred investment plan to start earning. Thanks.`,
      subject: 'Deposit Successful',
      // ... other response details
    });
  } catch (error) {
    // Handle errors and send an error response
    console.log(error);
    res.json({ status: 'error' });
  }
});


const port = process.env.PORT


app.listen(port, ()=>{
    console.log(`listening on port ${port}`);
})

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
  });
  
  // Listen for the 'error' event
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
  
  // Listen for the 'disconnected' event
  mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
  });
  
  // Gracefully close the MongoDB connection on application termination
  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed due to application termination');
      process.exit(0);
    });
  });