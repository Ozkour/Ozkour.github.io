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
dateTemplate: boolean = true;
destinations: any[] = [];
toLocation: any[] = [];
departureDateTemplate: boolean = false
itineraries: Map<string, any>[] = [];
origins: Map<string, string> | any = new Map();
defaultOrigins: string[][] = [];
airportsLoc: Map<string, Map<string, string>> = new Map();
CO2est: Map<string, number> | any = new Map();
timeEst: any = new Map();

constructor() { 
  d3.csv('../assets/chi-countries-counts-test.csv').then(data =>{
    data.forEach((d: any) => {
      this.defaultOrigins.push([d['Country'],d['y2019']]);
      //case USA
      if(d['Country'] == 'United States'){
        this.origins.set('USA1', d['y2019']/3);
        this.origins.set('USA2', d['y2019']/3);
        this.origins.set('USA3', d['y2019']/3);
        this.defaultOrigins.push(['USA1',""]);
        this.defaultOrigins.push(['USA2',""]);
        this.defaultOrigins.push(['USA3',""]);
      }
      else{
        this.origins.set(d['Country'], d['y2019']);
      }
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
      var cptFlights = new Map();
      var sum = 0;
      this.itineraries.forEach((itin: Map<string, any>) => { //for each origin-dest pair
        var origin = itin.get('origin');
        var dest = itin.get('dest');
        var flights = itin.get('flights');
        var time = itin.get('time');
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
        // add carbon footprint & time to destinations
        //temps moyen doit etre par passager et pas par voyage
        var countryDest = this.airports.get(dest);
        this.CO2est.has(countryDest) ? this.CO2est.set(countryDest, this.CO2est.get(countryDest) + estimation) : this.CO2est.set(countryDest, estimation);
        this.timeEst.has(countryDest) ? this.timeEst.set(countryDest, (this.timeEst.get(countryDest) * cptFlights.get(countryDest) + time) / (cptFlights.get(countryDest)+1)) : this.timeEst.set(countryDest, time);
        cptFlights.has(countryDest) ? cptFlights.set(countryDest,cptFlights.get(countryDest) + 1) : cptFlights.set(countryDest,1);
        sum = 0;        
        
      });
      console.log('time :', this.timeEst);
      console.log('CO2 :', this.CO2est);
    });
  }

  async fetchFlight(originData: string[][], destinationData: any[], originIndex = 0, destIndex = 0, resolve: any){
    var currentOrigin = originData[originIndex];
    var currentDest = destinationData[destIndex];
    var origin = this.airports.get(currentOrigin[0]);
    var dest = this.airports.get(currentDest.country);
    if(this.origins.get(currentOrigin[0]) != "0" && origin != dest && currentOrigin[0] != 'United States'){
      await fetch(`http://localhost:5000/flights-search?originCode=${origin}&destinationCode=${dest}&dateOfDeparture=2023-07-25`)
        .then(response => response.json())
        .then(data => {
          if(data.data){
            this.addItineraries(data.data, dest, origin);
            setTimeout(() =>{this.nextFetch(originData, destinationData, originIndex, destIndex, resolve)},2000);
          }
          else{
            console.log("ERROR, start again");
            console.log(data);
            this.fetchFlight(originData, destinationData, originIndex, destIndex, resolve);
          }
          
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
        console.log("DONE")
        resolve();
      }
    }
  }


  addItineraries(flights: any, dest: any, origin: any){
    var routes: string[][][] = [];
    var stages: string[][] = [];
    var totalTime = 0;
    flights.forEach((flight: { itineraries: {duration: string; segments: any;}[]; }) =>{
      (flight.itineraries[0].segments).forEach((seg: { departure: { iataCode: any; }; arrival: { iataCode: any; }; }) =>{
        stages.push([seg.departure.iataCode, seg.arrival.iataCode]);
      });
      var currentTime = flight.itineraries[0].duration;
      if(currentTime.includes('H') && currentTime.includes('M')){// flight time > 1H
        var arrTime = currentTime.substring(2, currentTime.length-1).split('H');
        totalTime += parseInt(arrTime[0])*60 + parseInt(arrTime[1]);
      }
      else if(currentTime.includes('H')){// exactly a full hour
        totalTime += parseInt(currentTime.substring(2, currentTime.length-1)) * 60;
      }
      else{// flight time < 1H
        totalTime += parseInt(currentTime.substring(2, currentTime.length-1));
      }
      routes.push(stages);
      stages = [];
      
    });
    // all stages of route are added
    this.itineraries.push(new Map([['origin', origin],['dest', dest],['flights',routes],['time',totalTime/flights.length]]));
  }

  // set number of attendees for a country
  changeVal(country: any, event: any){
    this.origins.set(country,event.target.value);
    if(country == 'United States'){
      this.origins.set('USA1', event.target.value/3);
      this.origins.set('USA2', event.target.value/3);
      this.origins.set('USA3', event.target.value/3);
    }
  }

}
