const alibay = require('./alibay')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.use(bodyParser.raw({type: "*/*"}))

let serverState ={
    user: {},
    items: {}
}

let sessionInfo = {}


app.post('/login', (req,res) => {
    let parsed = JSON.parse(req.body.toString())
    let username = parsed.username
    let password = parsed.password
    let sessionId = "" + Math.floor(Math.random()* 10000)
    sessionInfo[username] = sessionId
    if(username === "bob" && password === "pwd123") {
        res.send(JSON.stringify({success: true,sessionId: 234234}))
    } else {
        res.send(JSON.stringify({success: false, reason: "invalid username or password"}))

    }
})

app.post('/createAccount', (req,res) => {
    let parsed = JSON.parse(req.body.toString())
    //let username = parsed.username
    //username = "bob"
    let password = parsed.password 
    let confirmedPassword = "pwd123"
   
    if(password === confirmedPassword) {
    //serverState.user[username] = password
    res.send(JSON.stringify({success: true, response: "account created"}))
    } else {
        res.send(JSON.stringify({success: false, response: "password didn't match"}))
    }
})

app.post('/logout', (req,res) => {
    let parsed = JSON.parse(req.body.toString())
    //if (sessionInfo[username] === parsed.sessionId) {
      //  delete sessionInfo.username
      //  res.send(JSON.stringify({success: true}))
    //} else {
        res.send(JSON.stringify({success: true}))})//, reason: "no sessionId"}))
    

app.post('/buyItem', (req,res) => {
    let parsed = JSON.parse(req.body.toString())
    if(parsed.itemId && parsed.sessionId && parsed.userId) {
        res.send(JSON.stringify({success:true}))
    } else {
        res.send(JSON.stringify({success: false, reason: "item not available"}))
    }
})

app.post('/sellItem', (req,res) => {
    let parsed = JSON.parse(req.body.toString())
    if(parsed.itemId && parsed.sessionId && parsed.userId){
        res.send(JSON.stringify({success:true}))
    } else {
        res.send(JSON.stringify({succes: false, reason: "item not available"}))
    }
})

app.post('/itemDetails', (req, res) => {
    let parsed = JSON.parse(req.body.toString())
    if(parsed.itemId) {
        res.send(JSON.stringify({success: true, item: {
            itemId: "g1234",
            sellerId: "m123",
            itemName: "Harry Black",
            itemDescription: "Delightful", 
            itemPrice: 34.99,
            numberRemaining: 4,
            itemImage: "./harryblack.png",
            keyword: "round"
        }}))
    } else {
        res.send(JSON.stringify({succes: false, reason: "item not available"}))
        
    }
})

app.post('/itemsSold', (req, res) => {
    let parsed = JSON.parse(req.body.toString())
    if( parsed.userId) {
        res.send(JSON.stringify({success: true, itemsSold:[{
            itemId: "g1234",
            sellerId: "m123",
            itemName: "Harry Black",
            itemDescription: "Delightful", 
            itemPrice: 34.99,
            numberRemaining: 4,
            itemImage: "./harryblack.png",
            keyword: "round"
            }]}))
    } else {
        res.send(JSON.stringify({sucess: false, reason: "no items sold"}))
    }
})

app.post('/itemsBought', (req, res) => {
    let parsed = JSON.parse(req.body.toString())
    if(parsed.userId) {
        res.send(JSON.stringify({sucess: true, itemsBought: [{
            itemId: "g1234",
            buyerId: "r234",
            itemName: "Harry Black",
            itemDescription: "Delightful", 
            itemPrice: 34.99,
            numberRemaining: 4,
            itemImage: "./harryblack.png",
            keyword: "round"
        }]}))
    } else {
        res.send(JSON.stringify({sucess: false, reason: "no items bought"}))
    }
})

app.post('/putItemForSale', (req, res) => {
    let parsed = JSON.parse(req.body.toString())
    if(parsed.userId && parsed.sessionId && parsed.item){
        res.send(JSON.stringify({success: true, response: "item uploaded"}))
    } else {
        res.send(JSON.stringify({success: false, response: "field empty"}))
    }
}) 

app.post('/findItem', (req,res) => {
    let parsed = JSON.parse(req.body.toString())
    if(parsed.keyword) {
        res.send(JSON.stringify({sucess: true, item: {
            itemId: "g1234",
            buyerId: "r234",
            itemName: "Harry Black",
            itemDescription: "Delightful", 
            itemPrice: 34.99,
            numberRemaining: 4,
            itemImage: "./harryblack.png",
            keyword: "round"
        }}))
    } else {
        res.send(JSON.stringify({success: false, reason: "could not load results" }))
    }
})
app.listen(3000, () => console.log('Listening on port 3000!'))