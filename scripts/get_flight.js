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
    var settings = {
        "url": "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create",
        "method": "POST",
        "timeout": 0,
        "headers": {
          "x-api-key": "prtl6749387986743898559646983194",
          "Content-Type": "text/plain"
        },
        "data": "{\r\n  \"query\": {\r\n    \"market\": \"FR\",\r\n    \"locale\": \"fr-FR\",\r\n    \"currency\": \"EUR\",\r\n    \"queryLegs\": [\r\n      {\r\n        \"originPlaceId\": {\r\n            \"iata\": \"DEL\"\r\n          \r\n        },\r\n        \"destinationPlaceId\": {\r\n            \"iata\": \"GLA\"\r\n          \r\n        },\r\n        \"date\": {\r\n\r\n            \"year\": 2023,\r\n            \"month\": 9,\r\n            \"day\": 1\r\n\r\n}\r\n      }\r\n    ],\r\n    \"adults\": 1,\r\n    \"cabinClass\": \"CABIN_CLASS_ECONOMY\"\r\n  }\r\n}",
    };
    
    $.ajax(settings).done(function (response) {
    console.log(response);
    });
}