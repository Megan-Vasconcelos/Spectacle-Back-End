const alibay = require('./alibay')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
let fs = require('fs');
var dateFormat = require('dateformat');

app.use(bodyParser.raw({ type: "*/*" }))
app.use(express.static('images'))
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));


let serverState = JSON.parse(fs.readFileSync('data.json').toString())

let sessionInfo = JSON.parse(fs.readFileSync('session.json').toString())

function parseCookies(str) {
    if (str) {
        let asArray = str.split('; ').map(x => x.split('='));
        let ret = {};
        asArray.forEach(lst => ret[lst[0]] = lst[1])
        return ret;
    }
}
app.get('/cookie', (req, res) => {
    let sessionId;
    if (req.headers.cookie) {
        let cookies = parseCookies(req.headers.cookie);
        sessionId = cookies.sessionId
    } else {
        sessionId = alibay.genUID();
        res.set('Set-Cookie', "sessionId=" + sessionId)
    }
    if (sessionInfo[sessionId]) {
        res.send(JSON.stringify({ success: true, hasSession: true, sessionId }))
    } else {
        res.send(JSON.stringify({ success: true, hasSession: false, sessionId }))
    }
})

function findUserId(users, username) {
    for (const user in users) {
        if (users[user].username === username)
            return users[user].userId
    }
}
app.post('/login', (req, res) => {
    //set cookies!
    let parsed = JSON.parse(req.body.toString())
    let username = parsed.username
    let password = parsed.password
    let userId = findUserId(serverState.users, username)
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {
        let sessionId = cookies.sessionId
        if (serverState.users[userId] && serverState.users[userId].password === password) {
            sessionInfo[sessionId] = userId
            fs.writeFileSync('session.json', JSON.stringify(sessionInfo))
            res.send(JSON.stringify({ success: true,  userId}))
        } else {
            res.send(JSON.stringify({ success: false, response: "invalid username or password" }))

        }
    } else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }
})

function usernameExists(users, username) {
//     return users.some(userId => users[userId].username === username)
// }
    for (const user in users) {
        if (users[user].username === username) {
            return true;
        }
    } 
    return false;
}

app.post('/createAccount', (req, res) => {
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {
        let parsed = JSON.parse(req.body.toString())
        let username = parsed.username
    
        if (usernameExists(serverState.users, username)) {
            res.send({ success: false, response: "username already exists" })
        } else {
            let password = parsed.password
            let userId = ("" + Math.floor(Math.random() * 100000000))
            
            serverState.users[userId] = {
                username,
                userId,
                password,
                shippingInfo: {
                    address1 : "",
                    address2: "",
                    city: "",
                    stateProvRegion: "",
                    zip: "",
                    country: ""
                }
            }
            fs.writeFileSync('data.json', JSON.stringify(serverState))
            res.send(JSON.stringify({ success: true, response: "account created" }))

        }

    } else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }
})

app.post('/logout', (req, res) => {
    //let parsed = JSON.parse(req.body.toString())
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {
        let sessionId = cookies.sessionId
        if (sessionInfo[sessionId]) {
            delete sessionInfo[sessionId]
            fs.writeFileSync('session.json', JSON.stringify(sessionInfo))
            res.send(JSON.stringify({ success: true }))
        } else {
            res.send(JSON.stringify({ success: true }))
        }
    } else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }
})

app.post('/changePassword', (req,res) => {
    let cookies = parseCookies(req.headers.cookie)
    if(cookies) {
     let parsed = JSON.parse(req.body.toString())
     let userId = parsed.userId
     let currentPassword = parsed.currentPassword
        if(serverState.users[userId].password === currentPassword){
            serverState.users[userId].password = parsed.newPassword
            fs.writeFileSync('data.json', JSON.stringify(serverState))
            res.send(JSON.stringify({success: true, response: "Password successfully changed"}))  
        
        } else {
            res.send(JSON.stringify({success: false, response: "Current password does not match records"}))
        }
    } else {
        res.send(JSON.stringify({ success: false, response:"gimme cookie" }))
    }
})

app.post('/accountDetails', (req,res) => {
    let cookies = parseCookies(req.headers.cookie)
    if(cookies) {

        let parsed = JSON.parse(req.body.toString())
        if(!parsed.userId) {
            res.send(JSON.stringify({success:false, response: "Missing userId"}))
        } else {
        let userId = parsed.userId
        let username = serverState.users[userId].username
        let shippingInfo = serverState.users[userId].shippingInfo
        let accountDetails = {username, shippingInfo}
        res.send(JSON.stringify({success:true, accountDetails}))
        }
    } else {
        res.send(JSON.stringify({ success: false, response:"gimme cookie" }))
    }
})
app.post('/updateShippingInfo', (req,res) => {
    let cookies = parseCookies(req.headers.cookie)
    if(cookies) {
        let parsed = JSON.parse(req.body.toString())
        if(!parsed.userId || !parsed.shippingInfo) {
            res.send(JSON.stringify({success: true, response: "Missing userId or shippingInfo"})) 
        } else {
        serverState.users[parsed.userId].shippingInfo = parsed.shippingInfo
        fs.writeFileSync('data.json', JSON.stringify(serverState))
        res.send(JSON.stringify({success: true, response: "Shipping information changed"}))
        }
    } else {
        res.send(JSON.stringify({ success: false, response:"gimme cookie" }))
    }
})


app.post('/buyItem', (req, res) => {
    let cookies = parseCookies(req.headers.cookie)
    //req.body: userId, itemId, sessionId
    if (cookies) {
        let parsed = JSON.parse(req.body.toString())

        let inventoryItem = serverState.items[parsed.itemId]
        if (inventoryItem.numberRemaining > 0) {

            //Decrease qty of item from items
            serverState.items[parsed.itemId].numberRemaining--;
            let transactionDate = new Date().toDateString()

            let buyerId = parsed.userId
            let itemId = parsed.itemId
            let sellerId = serverState.items[itemId].sellerId

            if (serverState.itemsBought[buyerId]) {
                let itemsArray = serverState.itemsBought[buyerId];
                let newBought = itemsArray.concat({ itemId: itemId, date: transactionDate })
                serverState.itemsBought[buyerId] = newBought

            } else {
                serverState.itemsBought[buyerId] = [{ itemId: itemId, date: transactionDate }]

            }
            if (serverState.itemsSold[sellerId]) {
                let itemsArray = serverState.itemsSold[sellerId];
                let newSold = itemsArray.concat({itemId: itemId, date: transactionDate})
                serverState.itemsSold[sellerId] = newSold
            } else {
                serverState.itemsSold[sellerId] = [{itemId: itemId, date: transactionDate}]
            }
            
            fs.writeFileSync('data.json', JSON.stringify(serverState))
            res.send(JSON.stringify({ success: true }))
        } else {
            res.send(JSON.stringify({ success: false, response: "item not available" }))
        }
    } else {

        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }
}
)

app.post('/itemDetails', (req, res) => {
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {
        let parsed = JSON.parse(req.body.toString())
        let itemId = parsed.itemId
        let inventoryItemId = serverState.items[itemId].itemId
        if (inventoryItemId && parsed.itemId === inventoryItemId) {
            let item = serverState.items[itemId]
            res.send(JSON.stringify({ success: true, item }))
        } else {
            res.send(JSON.stringify({ success: false, response: "item not available" }))

        }
    } else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }
})



app.post('/itemsSold', (req, res) => {
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {
        let parsed = JSON.parse(req.body.toString());
        let userId = parsed.userId;
        let sellerId = userId;
        if (serverState.itemsSold[sellerId]) {
            let itemsSold = serverState.itemsSold[sellerId]
                .map(obj => {
                    let item = serverState.items[obj.itemId]
                    let transactionDate = obj.date
                    return { item, transactionDate }
                })

            res.send(JSON.stringify({ success: true, itemsSold })) //add filtered
                  
        } else {
            res.send(JSON.stringify({ success: false, response: "No items" }))
        } 
    
        
    } else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }
})


app.post('/itemsBought', (req, res) => {
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {
        let parsed = JSON.parse(req.body.toString())
        let userId = parsed.userId
        let buyerId = userId
        if (serverState.itemsBought[userId]) {
            let itemsBought = serverState.itemsBought[buyerId]
                .map(obj => {
                    let item = serverState.items[obj.itemId]
                    let transactionDate = obj.date
                    return { item, transactionDate }
                })
            console.log(itemsBought)
            res.send(JSON.stringify({ success: true, itemsBought }))
        } else {

            res.send(JSON.stringify({ success: false, response: "no items bought" }))
        }
    } else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }
})

app.post('/upics', (req, res) => {
    let extension = req.query.ext.split('.').pop();
    let randomString = '' +  Math.floor(Math.random() * 10000000)
    let randomFilename = randomString + '.' + extension
    fs.writeFileSync('images/' +  randomFilename, req.body);
    res.send(randomFilename)
})

app.post('/putItemForSale', (req, res) => {
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {

    let parsed = JSON.parse(req.body.toString())

        let sessionId = cookies.sessionId
        let sellerId = sessionInfo[sessionId]

        let getItemId = ("" + Math.floor(Math.random() * 100000000))
        if (!parsed.item) {
            res.send(JSON.stringify({ success: false, response: "Missing item information" }))
        } else {
            let itemId = getItemId;
            serverState.items[itemId] = parsed.item
            serverState.items[itemId].itemId = itemId;
            serverState.items[itemId].sellerId = sellerId;
            fs.writeFileSync('data.json', JSON.stringify(serverState))
            console.log(serverState.items)
            res.send(JSON.stringify({ success: true, response: "item uploaded" }))
        } 
    } else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }
})

app.post('/itemsBySeller', (req, res) => {
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {
        let parsed = JSON.parse(req.body.toString())

        userId = findUserId(serverState.users, parsed.username)
      
        const { items } = serverState;
        let itemsForSale = Object.keys(items).filter(item => {
            let sellerId = items[item].sellerId
            return userId == sellerId
        }).map(itemId => items[itemId])

        console.log(itemsForSale)
        if (!userId) {
            res.send(JSON.stringify({ success: true, response: "seller doesn't exist" }))
        } else {
            res.send(JSON.stringify({ success: true, itemsForSale }))
        }
    } else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }

})

app.post('/itemsByBrand', (req, res) => {
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {
        let parsed = JSON.parse(req.body.toString())
        
        let brandName = parsed.brandName
        const { items } = serverState;

        let itemsByBrand = Object.keys(items).filter(item => {
            let brand = items[item].itemBrand;
            return brandName === brand
        }).map(itemId => items[itemId])

        if (itemsByBrand.length === 0) {
            res.send(JSON.stringify({ success: true, response: "no items available" }))
        } else {
            res.send(JSON.stringify({ success: true, itemsByBrand }))
        }

    } else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }

})

app.post('/itemsByPrice', (req, res) => {
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {
        let parsed = JSON.parse(req.body.toString())
        let lowerLimit = parseInt(parsed.lowerLimit)
        let upperLimit = parseInt(parsed.upperLimit)
        const { items } = serverState;
        let itemsByPrice = Object.keys(items).filter(item => {
            let price = items[item].itemPrice
            return (upperLimit ? price >= lowerLimit && price <= upperLimit : price >= lowerLimit)
        }).map(itemId => items[itemId])

        if (!lowerLimit) {
            res.send(JSON.stringify({ success: true, response: "Insufficient information" }))
        } else {
            res.send(JSON.stringify({ success: true, itemsByPrice }))
        }
    } else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }
})


app.post('/findItem', (req, res) => {
    let cookies = parseCookies(req.headers.cookie)
    if (cookies) {
    let parsed = JSON.parse(req.body.toString())
    let search = parsed.search.toLowerCase();
        const {items} = serverState;
        let itemsFound = (Object.keys(items)
        .filter(itemId => items[itemId].itemName.toLowerCase().includes(search) || items[itemId].keywords.toLowerCase().some(word => word.includes(search)) )
        .map(itemId => items[itemId]))
     
     if (itemsFound.length === 0) {
        res.send(JSON.stringify({ success: false, response: "no results" }))
    } else {
        res.send(JSON.stringify({ success: false, itemsFound }))
    }} else {
        res.send(JSON.stringify({ success: false, response: "gimme cookie" }))
    }
})

app.post('/save-stripe-token', (req, res) => {
    let data = JSON.parse(req.body.toString())
    
    res.send(JSON.stringify(data))
    })

app.listen(4000, () => console.log('Listening on port 4000!'))