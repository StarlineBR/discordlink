const express = require("express")
const rateLimit = require("express-rate-limit")
const fetch = require("node-fetch")
const { token } = require("./token.json")
const CronJob = require('cron').CronJob
const app = express()
app.set('trust proxy', 1)
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 1,
    message: "Então... só gero um link por Hora!\nNota: o link que você gerou só dura 10 mins!!",
})
app.use(limiter)

async function inviter() {
    try {
        return await fetch("https://discord.com/api/v8/channels/743496401043980328/invites", {
            method: 'post',
            body: JSON.stringify({
                "max_age": 600,
                "max_uses": 1,
                "unique": true
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bot ${token}`
            }
        }).then(async data => {
            let header = await data.headers.raw()
            let body = await data.json()

            return {
                header: header,
                body: body
            }
        })
    } catch (error) {
        console.error(error)
        return undefined
    }
}

let rateValid = 25000
let rateHour = 1000
let rateSec = 45

function timerRate(left) {
    setTimeout(() => rateValid = 25000, left * 1000)
}

app.get("/", async (req, res) => {
    if (rateHour === 0 || rateSec === 0 || rateValid === 0) return res.status(429).send("Infelizmente não posso gerar mais links por agora, volte daqui a 1 hora!!")
    rateHour -= 1
    rateSec -= 1
    const invite = await inviter()
    if (invite === undefined) return res.status(500).send("Infelizmente não consegui gerar 1 link por agora, volte daqui a 1 hora!!")
    rateValid = parseInt(invite.header['x-ratelimit-remaining'][0])
    if (rateValid === 0) timerRate(parseFloat(invite.header['x-ratelimit-reset-after'][0]))
    res.redirect(`https://discord.gg/${invite.body.code}`)
})

app.use(function (req, res) {
    res.status(404).redirect("/");
})

const rH = new CronJob('0 0 * * * *', function () {
    rateHour = 1000
}, null)
const rS = new CronJob('0 0 * * * *', function () {
    rateSec = 45
}, null)

app.listen(3001, () => {
    console.log("Servidor Online e Pronto para gerar codigo!!")
    rH.start()
    rS.start()
})
