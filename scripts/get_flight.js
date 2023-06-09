//On a une liste de pays => nombre de participants
//On peut récupérer les aéroports de départ

//1ere requete
//https://www.flightconnections.com/airports_url.php?lang=en&iata=aaa
//pour avoir ID aéroport
//2e requête
//https://www.flightconnections.com/roNUMBER1_NUMBER2.json?v=1070&lang=en&f=no0&direction=from&exc=&ids=&cl=&flight_direction=from&flight_type=round
//on remplacea NUMBER1 et NUMBER2 par les id reçus. si réponse.data est vide
//3e requête
//https://www.flightconnections.com/roNUMBER1_NUMBER2_2_0_0.json?v=1069&lang=en&f=no0&direction=to&exc=&ids=&cl=&flight_direction=to&flight_type=round 
//qui va donner la liste des escales

async function getAirports(origin, destination) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer ANkJGSXwXHrfyO4Uru3KNHRbm11S");
    myHeaders.append("accept", "application/vnd.amadeus+json");
    // myHeaders.append("Access-Control-Allow-Origin", "http://127.0.0.1:3000")

    // // var raw = "{\r\n  \"query\": {\r\n    \"market\": \"FR\",\r\n    \"locale\": \"fr-FR\",\r\n    \"currency\": \"EUR\",\r\n    \"queryLegs\": [\r\n      {\r\n        \"originPlaceId\": {\r\n            \"iata\": \"DEL\"\r\n          \r\n        },\r\n        \"destinationPlaceId\": {\r\n            \"iata\": \"GLA\"\r\n          \r\n        },\r\n        \"date\": {\r\n\r\n            \"year\": 2023,\r\n            \"month\": 9,\r\n            \"day\": 1\r\n\r\n}\r\n      }\r\n    ],\r\n    \"adults\": 1,\r\n    \"cabinClass\": \"CABIN_CLASS_ECONOMY\"\r\n  }\r\n}";

    // var requestOptions = {
    // method: 'GET',
    // headers: myHeaders
    // };

    // fetch("https://www.flightconnections.com/airports_url.php?lang=en&iata=cdg", requestOptions)
    // .then(response => response.text())
    // .then(result => console.log(result))
    // .catch(error => console.log('error', error));
    const response = await fetch("https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=DEL&destinationLocationCode=GLA&departureDate=2023-05-02&adults=1&nonStop=true&max=250");
    const jsonData = await response.json();
    console.log(jsonData);
}