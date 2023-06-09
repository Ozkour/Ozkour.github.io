import express from 'express';
import bodyParser from 'body-parser'
import cors from "cors";
import Amadeus from 'amadeus';
import axios from 'axios';

const amadeus = new Amadeus({
    clientId: 'oRIGGVBKwA5QFAtH34Bo7H3GX95HqSRZ',
    clientSecret: 'TJrs6f8MIf2yjE9N',
});

const app = express();
const PORT = 5000;
app.use(bodyParser.json())
app.use(cors({
    origin: 'http://localhost:4200'
}));
app.listen(PORT, () =>
    console.log(`Server is running on port: http://localhost:${PORT}`)
);

// const request = require('request');

// var name = 'San Francisco'
// request.get({
//   url: 'https://api.api-ninjas.com/v1/city?name=' + name,
//   headers: {
//     'X-Api-Key': 'YOUR_API_KEY'
//   },
// }, function(error, response, body) {
//   if(error) return console.error('Request failed:', error);
//   else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
//   else console.log(body)
// });
const config = {
    headers:{
        'X-Api-Key': '6zOd4Cia3qk2A0edQ1Utow==momXUz1Eu5Bv2X0h'
    }
  };

app.get(`/city-search/:parameter`, (req, res) => {
    const name = req.params.parameter;
    const url = 'https://api.api-ninjas.com/v1/city?limit=3&name=' + name;
    axios.get(url, config)
    .then(response=> res.send(response.data))
    .catch(err=> console.log(err))
})


app.get(`/flight-search`, (req, res) => {
    const originCode = req.query.originCode;
    const destinationCode = req.query.destinationCode;
    const dateOfDeparture = req.query.dateOfDeparture
    // Find the cheapest flights
    amadeus.shopping.flightOffersSearch.get({
        originLocationCode: originCode,
        destinationLocationCode: destinationCode,
        departureDate: dateOfDeparture,
        adults: '1',
        max: '10'
    }).then(function (response) {
        res.send(response.result);
    }).catch(function (response) {
        res.send(response);
    });
});

app.get(`/flight-search-nonstop`, (req, res) => {
    const originCode = req.query.originCode;
    const destinationCode = req.query.destinationCode;
    const dateOfDeparture = req.query.dateOfDeparture
    // Find the cheapest flights
    amadeus.shopping.flightOffersSearch.get({
        originLocationCode: originCode,
        destinationLocationCode: destinationCode,
        departureDate: dateOfDeparture,
        adults: '1',
        max: '20',
        nonStop: 'true'
    }).then(function (response) {
        res.send(response.result);
    }).catch(function (response) {
        res.send(response);
    });
});