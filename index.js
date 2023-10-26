const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

app.use(express.json())
app.use(cors())
app.use(express.static('build'))

const errorHandler = (error, req, res, next) => {
  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  } else if (error.code === 11000) {
    return res.status(400).json({ error: 'name must be unique' })
  } else if (error.message) {
    return res.status(400).json({ error: error.message })
  } else {
    return res.status(500).json({ error: 'something went wrong...' })
  }
  // eslint-disable-next-line no-unreachable
  next(error)
}

app.use(morgan(function (tokens, req, res) {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
    req.method === 'POST' ? JSON.stringify(req.body) : null
  ].join(' ')
}))

app.get('/api/persons', (req, res, next) => {
  Person.find({}).then(persons => {
    res.json(persons)
  }).catch(err => {
    const error = new Error(err.message)
    next(error)
  })
})

app.get('/info', (req, res, next) => {
  const date = new Date()
  Person.countDocuments({}).then(count => {
    res.status(201).send(`<p>Phonebook has info for ${count} people</p><p>${date}</p>`)
  }).catch(
    error => next(error)
  )
})

app.get('/api/persons/:id', (req, res, next) => {
  const id = req.params.id
  Person.findById(id)
    .then(person => {
      if (!person) {
        return res.status(404).send('Person not found')
      }
      res.json(person)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  const id = req.params.id
  Person.findByIdAndDelete(id).then(
    person => {
      if (person) {
        res.status(204).send('onnistui')
      }
      else {
        res.status(404).send('already deleted')
      }
    }
  ).catch(
    error => next(error)
  )
})

app.put('/api/persons/:id', (req, res, next) => {
  const id = req.params.id
  const number = req.body.number

  Person.schema.path('number').validate(function (value) {
    return /\d{2}-\d{7}/.test(value)
  }, 'Invalid phone number')

  Person.findOneAndUpdate(
    { _id: id },
    { number },
    { new: true, runValidators: true })
    .then(person => {
      res.json(person)
    })
    .catch(
      error => next(error)
    )
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body
  const name = body.name
  const number = body.number
  if (!body.name || !body.number) {
    const error = new Error('content missing')
    next(error)
  }
  const newPerson = new Person({ name, number })
  newPerson.save()
    .then(person => {
      res.json(person)
    })
    .catch(err => next(err))
})

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})