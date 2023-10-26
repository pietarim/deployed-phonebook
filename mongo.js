const mongoose = require('mongoose')
require('dotenv').config()

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
  },
  number: String,
})
const Person = mongoose.model('Person', personSchema)
const mongoUrl = process.env.MONGODB_URI
mongoose.set('strictQuery', false)
const connectionUrl = mongoUrl.replace('<password>', password)
mongoose.connect(connectionUrl)


if (process.argv.length === 3) {
  Person.find({}).then(result => {
    console.log('phonebook:')
    result.forEach(person => {
      console.log(`${person.name} ${person.number}`)
    })
    mongoose.connection.close()
  })
}

else if (process.argv.length === 5) {
  const name = process.argv[3]
  const number = process.argv[4]
  const person = new Person({
    name: name,
    number: number,
  })
  person.save().then(() => {
    console.log(`added ${person.name} number ${person.number} to phonebook`)
    mongoose.connection.close()
  })
}


