const express = require ('express')
const app = express()
const bodyparser = require ('body-parser')
const mongoose = require("mongoose")
const routes = require('./route/route.js')

mongoose.set('strictQuery', true)


app.use (bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true }))

mongoose.connect("mongodb+srv://viHAan:vihaan@project4ofroom15.ayqmkoo.mongodb.net/group15Database",{useNewUrlParser: true})

.then(()=>console.log("MongoDb connected"))
.catch((err)=>console.log(err))

app.use('/',routes)

app.listen(3000,function (){
    console.log('Express app running on port'+' '+ 3000)
  });

