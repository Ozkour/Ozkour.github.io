import { Component, OnInit, resolveForwardRef } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-load-data',
  templateUrl: './load-data.component.html',
  styleUrls: ['./load-data.component.css']
})
export class LoadDataComponent implements OnInit {

airports: Map<string, string> | any = new Map();
to: string = "";
toLocationTemplate: boolean = true;
fromLocationTemplate: boolean = true;
destinations: any[] = [];
toLocation: any[] = [];
departureDateTemplate: boolean = false
itineraries: Map<string, any>[] = [];
origins: Map<string, string> | any = new Map();
defaultOrigins: string[][] = [];
airportsLoc: Map<string, Map<string, string>> = new Map();
CO2est: Map<string, number> | any = new Map();

constructor() { 
  d3.csv('../assets/chi-countries-counts-test.csv').then(data =>{
    data.forEach((d: any) => {
      this.origins.set(d['Country'], d['y2019']);
      this.defaultOrigins.push([d['Country'],d['y2019']]);
    });
  });

  d3.csv('../assets/busiest_airports.csv').then((data) => {
    data.forEach(d => {
      if(d['code'] != ""){
        this.airports.set(d['code'], d['iata']);
        this.airports.set(d['country'], d['iata']);
        this.airports.set(d['iata'], d['country']);
      }
    });
  });

  d3.csv('../assets/airports.csv').then(dataAirport => {
    var cpt = 0;
    dataAirport.forEach((d: any) => {
      if(d['iata'] != "\\N"){
        this.airportsLoc.set(d['iata'], new Map([['lat',d['lat']],['long',d['long']]]))
      }
    });
    
  });
}

  ngOnInit(): void {
  }

  // API call to find cities
  handleToLocation() {
    if (this.to.length > 3) {
      fetch(`http://localhost:5000/city-search/${this.to}`)
      .then(response => response.json())
      .then(data => this.toLocation = data)
    }
  }

  // Add city to destinations
  handleDestination(location: any) {
    this.destinations.push(location);
    this.toLocation = [];
    this.to = "";
  }

  deleteCity(location: any){
    this.destinations.splice(this.destinations.indexOf(location),1);
  }

  findAirports(){
    console.log("Loading...");
    // wait for fetches to be done and array to be filled 
    var fetches = new Promise(resolve => {
      this.fetchFlight(this.defaultOrigins, this.destinations, 0, 0, resolve);
    });

    //compute CO2 estimation
    fetches.then(() => {
      var sum = 0;
      this.itineraries.forEach((itin: Map<string, any>) => { //for each origin-dest pair
        var origin = itin.get('origin');
        var dest = itin.get('dest');
        var flights = itin.get('flights');
        flights.forEach((route: string[][]) =>{ //for each route
          route.forEach((stage: string[]) => { //for each stage
            var airportOrigin: any = this.airportsLoc.get(stage[0]);
            var airportDest: any = this.airportsLoc.get(stage[1]);
            var latOrigin = airportOrigin.get('lat');
            var longOrigin = airportOrigin.get('long');
            var latDest = airportDest.get('lat');
            var longDest = airportDest.get('long');
            //carbon footprint is computed
            sum += 1
            // sum += (latOrigin+longOrigin)*(latDest+longDest)/2;
          });
        });
        // mean of routes for each origin-dest pair multiplied by the number of attendees
        var estimation = sum / flights.length * this.origins.get(this.airports.get(origin));
        // add carbon footprint to destinations
        this.CO2est.has(dest) ? this.CO2est.set(dest, this.CO2est.get(dest) + estimation) : this.CO2est.set(dest, estimation);
        sum = 0;        
      });
    });
  }

  async fetchFlight(originData: string[][], destinationData: any[], originIndex = 0, destIndex = 0, resolve: any){
    var currentOrigin = originData[originIndex];
    var currentDest = destinationData[destIndex];
    var origin = this.airports.get(currentOrigin[0]);
    var dest = this.airports.get(currentDest.country);
    if(this.origins.get(currentOrigin[0]) != "0" && origin != dest){
      await fetch(`http://localhost:5000/flights-search?originCode=${origin}&destinationCode=${dest}&dateOfDeparture=2023-07-25`)
        .then(response => response.json())
        .then(data => {
          this.addItineraries(data.data, dest, origin);
          setTimeout(() =>{this.nextFetch(originData, destinationData, originIndex, destIndex, resolve)},2000);
        });
    }
    else{
      this.nextFetch(originData, destinationData, originIndex, destIndex, resolve);
    }
  }

  // prepare index to the next API call
  nextFetch(originData: string[][], destinationData: any[], originIndex: number, destIndex: number, resolve: any){
    if(destIndex < destinationData.length - 1){
      this.fetchFlight(originData, destinationData, originIndex, destIndex+1, resolve);
    }
    else{
      if(originIndex < originData.length -1){
        this.fetchFlight(originData, destinationData, originIndex+1, 0, resolve);
      }
      else{
        resolve();
      }
    }
  }


  addItineraries(flights: any, dest: any, origin: any){
    var routes: string[][][] = [];
    var stages: string[][] = [];
    flights.forEach((flight: { itineraries: { segments: any; }[]; }) =>{
      (flight.itineraries[0].segments).forEach((seg: { departure: { iataCode: any; }; arrival: { iataCode: any; }; }) =>{
        stages.push([seg.departure.iataCode, seg.arrival.iataCode]);
      });
      routes.push(stages);
      stages = [];
      
    });
    // all stages of route are added
    this.itineraries.push(new Map([['origin', origin],['dest', dest],['flights',routes]]));
  }

  // set number of attendees for a country
  changeVal(country: any, event: any){
    this.origins.set(country,event.target.value);
  }

}
