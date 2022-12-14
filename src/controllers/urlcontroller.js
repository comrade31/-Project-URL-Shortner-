const urlModel = require("../model/urlmodel")
const mongoose = require("mongoose")
const shortid = require("shortid")
const { valid, regForUrl } = require("../validator/validation")
const redis = require('redis')
const {promisify} = require('util')


//1. Connect to the redis server
const redisClient = redis.createClient(
    18463,
    "redis-18463.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("CjjQKk33DuzQy1JciZdkfIzOteeyMdA6", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });

//2. Prepare the functions for each command

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const createUrl = async function (req, res) {
    try {
        let data = req.body
        if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, message: "data is not present" }) }
        let { longUrl } = data


        if (valid(longUrl) == false) { return res.status(400).send({ status: false, message: "invalid  longUrl" }) }

        if (regForUrl(longUrl) == false) { return res.status(400).send({ status: false, message: "invalid  longUrl fomat" }) }
        let longUrlPresent = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, __v: 0 })
        if (longUrlPresent) {

            return res.status(200).send({ status: true, message: longUrlPresent })
        }
        let code = shortid.generate().toLowerCase()
        let newurl = `http://localhost:3000/${code}`
        let obj = {}
        obj.longUrl = longUrl
        obj.shortUrl = newurl
        obj.urlCode = code
        let createData = await urlModel.create(obj)
        return res.status(201).send({ status: true, message: obj })
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

let getUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode
        const cacheUrlData = await GET_ASYNC(`${urlCode}`)
        if(cacheUrlData){
            return res.status(302).redirect(cacheUrlData)
        }else{
        let realUrl = await urlModel.findOne({ urlCode: urlCode })
        if (!realUrl) { return res.status(404).send({ status: false, message: "url is not present" }) }
        let originalUrl = realUrl.longUrl
        await SET_ASYNC(`${urlCode}`, JSON.stringify(originalUrl))
        return res.status(302).redirect(originalUrl)
    }
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { createUrl, getUrl }
