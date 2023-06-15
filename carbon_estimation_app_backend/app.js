import express from 'express';
import bodyParser from 'body-parser'
import cors from "cors";
import Amadeus from 'amadeus';
import axios from 'axios';
import 'dotenv/config';


const amadeus = new Amadeus({
    clientId: process.env.API_ID,
    clientSecret: process.env.API_SECRET,
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


const config = {
    headers:{
        'X-Api-Key': process.env.API_KEY
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

app.get(`/flights-search`, (req, res) => {
    const originCode = req.query.originCode;
    const destinationCode = req.query.destinationCode;
    const dateOfDeparture = req.query.dateOfDeparture;
    // Find the cheapest flights
    amadeus.shopping.flightOffersSearch.get({
        originLocationCode: originCode,
        destinationLocationCode: destinationCode,
        departureDate: dateOfDeparture,
        adults: '1',
        max: '20',
        nonStop: 'true'
    }).then(function (response) {
        if(response.result.data.length == 0){
            amadeus.shopping.flightOffersSearch.get({
                originLocationCode: originCode,
                destinationLocationCode: destinationCode,
                departureDate: dateOfDeparture,
                adults: '1',
                max: '20',
                nonStop: 'false'
            }).then(function (response) {
                res.send(response.result);
            })
            .catch(function (response) {
                res.send(response);
            });
        }
        else{
            res.send(response.result);
        }
    }).catch(function (response) {
        res.send(response);
    });
});

app.get(`/flight-connections-search-airport/:parameter`, (req, res) => {
    const name = req.params.parameter;
    const url = 'https://www.flightconnections.com/airports_url.php?lang=en&iata=' + name;
    axios.get(url)
    .then(response=> res.send(response.data))
    .catch(err=> console.log(err))
});

app.get(`/flight-connections-search-flights`, (req, res) => {
    const dep = req.query.origin;
    const arr = req.query.dest;
    var depID, arrID;
    // GET FIRST ID
    axios.get('https://www.flightconnections.com/airports_url.php?lang=en&iata=' + dep)
    .then(response=> {
        depID = (response.data).c;
        // GET SECOND ID
        axios.get('https://www.flightconnections.com/airports_url.php?lang=en&iata=' + arr)
        .then(response=> {
            arrID = response.data.c;
            // GET ITINERARY WITHOUT STOPS
            const url = 'https://www.flightconnections.com/ro'+depID+'_'+arrID+'.json?lang=en&f=no0&direction=from&exc=&ids=&cl=&flight_direction=from&flight_type=round'
            axios.get(url)
            .then(response=> {
                if(response.data.data.length != 0){
                    res.send(Object());
                }
                else{
                    // GET ITINERARY WITH STOPS
                    const url = 'https://www.flightconnections.com/ro235_3799_2_0_0.json?lang=en&f=no0&direction=from&exc=&ids=&cl=&flight_direction=from&flight_type=round'
                    axios.get(url)
                    .then(response=> {res.send(response.data.airports)})
                    .catch(err=> console.log(err))
                }
            })
            .catch(err=> console.log(err));
        })
        .catch(err=> console.log(err));
    })
    .catch(err=> console.log(err));
    
    
});