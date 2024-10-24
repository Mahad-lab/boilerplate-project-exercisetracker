const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

const exerciseSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: Date
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', (req, res) => {
  User.find({}).then(users => {
    const records = users.reduce((usersList, item) => {
      usersList.push({
        _id: item.id,
        username: item.username
      })
      return usersList
    }, [])
    // console.log(records)
    res.send(records);
  })
});

app.post('/api/users', (req, res) => {
  // console.log(req.query)
  // console.log(req.params)
  // console.log(req.body.username)
  const user = new User({
    username: req.body.username
  });
  user.save();
  // console.log(user);
  res.send(user)
})


app.post('/api/users/:_id/exercises', (req, res) => {
  // console.log(req.query)
  // console.log(req.params)
  // console.log(req.body)
  const userId = req.params._id;
  User.findById( userId ).then(user => {
    // console.log(user);
    const date = req.body.date ? new Date(req.body.date) : new Date();
    const excerciseObj = {
      description: req.body.description,
      duration: Number(req.body.duration),
      date: date.toDateString()
    }
    const exercise = new Exercise({
      userid: req.params._id,
      ...excerciseObj
    });
    exercise.save();
    // console.log(exercise)
    response = {
      _id: user._id,
      username: user.username,
      ...excerciseObj
    }
    res.send(response)
  })
})

app.get('/api/users/:_id/logs', async (req, res) => {
  // console.log(req.query)
  // console.log(req.params)
  // console.log(req.body)
  const userId = req.params._id;

  const fromDate = req.query.from ? new Date(req.query.from).toDateString() : null;
  const toDate = req.query.to ? new Date(req.query.to).toDateString() : null;
  const limit = req.query.limit ? Number(req.query.limit) : null;

  const query = { userid: userId }

  if (fromDate || toDate) {
    query.date = query.date || {}; // Initialize if undefined
  }
  if (fromDate) { query.date["$gte"] = fromDate }
  if (toDate) { query.date["$lt"] = toDate }

  // console.log(query)

  const response = {}
  response.log = []

  User.findById( userId ).then(user => {
    response._id = user._id,
    response.username = user.username
  }).catch(err => {
    res.send({ "detail": "no user found" })
  })

  exercises = await Exercise.find(query);
  
  console.log(exercises)
  response.log = (await exercises).reduce((exercisesList, item) => {
    const record = {
      description: item.description,
      duration: item.duration,
      date: new Date(item.date).toDateString(),
    }
    exercisesList.push(record)
    return exercisesList
  }, []);
  
  if (limit) {
    console.log('limit', limit)
    response.log = response.log.splice(0,limit)
    console.log('response.log', response.log)
  }

  response.count = response.log.length;

  res.send(response)
});

app.get('/api/removeall', function(req,res){
  User.deleteMany({})
    .then(result=>{
    
    })
    .catch(err=>{
      res.status(500).json(err)
    })

    Exercise.deleteMany({})
    .then(result=>{
      res.send(result)
    })
    .catch(err=>{
      res.status(500).json(err)
    })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
