import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-load-data',
  templateUrl: './load-data.component.html',
  styleUrls: ['./load-data.component.css']
})
export class LoadDataComponent implements OnInit {
from: any = "";
fromLocation: any = [];
origins: any = [];
toLocationTemplate: boolean = true;
inputData: boolean = true;
to: any = "";
destinations: any = [];
toLocation: any = [];
departureDateTemplate: boolean = false
date: any = "";
flights: any;
flightTemplate: boolean = false;
itineraries: any = new Map();
constructor() { }
  ngOnInit(): void {
  }
  onFindFlight() {
      if (this.date == "") {
        alert("Please choose a date")
      } else {
        fetch(`http://localhost:5000/flight-search?originCode=${this.origins.iataCode}&destinationCode=${this.destinations.iataCode}&dateOfDeparture=${this.date}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
       })
      .then(response => response.json())
      .then(data => {
        this.flights = data.data
        console.log(this.flights)
        this.departureDateTemplate = false
        this.flightTemplate = true
      })
      .catch((error) => {
        alert(error)
      });
      }
  }
  handleFromLocation() {
    if (this.from.length > 3) {
      fetch(`http://localhost:5000/city-search/${this.from}`)
      .then(response => response.json())
      .then(data => this.fromLocation = data)
    }
  }
  handleOrigin(location: any) {
    this.destinations.push(location);
    this.fromLocation = [];
    this.from = "";
  }

  deleteCity(location: any){
    this.destinations.splice(this.destinations.indexOf(location),1);
  }

  findAirports(){
    console.log("Loading...");
    d3.csv('../assets/busiest_airports.csv').then((data) => {
      const departure_iata = "GLA";
      const airports = new Map();
      data.forEach(d => {
        if(d['code'] != ""){
          airports.set(d['code'], d['iata']);
        }
      });
      this.origins.push("GLA");
      this.origins.push("DUB");
      this.origins.forEach((origin: any) =>{
        this.destinations.forEach((dest: { country: any; }) => {
          fetch(`http://localhost:5000/flight-search-nonstop?originCode=${origin}&destinationCode=${airports.get(dest.country)}&dateOfDeparture=2023-06-25`)
          .then(response => response.json())
          .then(data => {
            console.log(data.data);
            this.flights = data.data;
            if(this.flights.length == 0){
              console.log("there is no flight without a stop here are the stops :")
              fetch(`http://localhost:5000/flight-search?originCode=${origin}&destinationCode=${airports.get(dest.country)}&dateOfDeparture=2023-06-25`)
              .then(response => response.json())
              .then(data => {
                console.log(data.data);
                this.listItineraries(data.data, dest, origin);
                this.flights = data.data;
                console.log(this.itineraries);
              });
            }
          });
          // console.log(airports.get(dest.country));
        });
      });
      
    });
  }

  listItineraries(flights: any = [], dest: any, origin: any){
    var itin: any[][] = [];
    flights.forEach((flight: { itineraries: { segments: any; }[]; }) =>{
      (flight.itineraries[0].segments).forEach((seg: { departure: { iataCode: any; }; arrival: { iataCode: any; }; }) =>{
        itin.push([seg.departure.iataCode, seg.arrival.iataCode]);
      })
    })
    if(!this.itineraries.get(dest)){
      this.itineraries.set(dest,new Map());
    }
    this.itineraries.get(dest).set(origin, itin);
    itin = [];
  }


}
