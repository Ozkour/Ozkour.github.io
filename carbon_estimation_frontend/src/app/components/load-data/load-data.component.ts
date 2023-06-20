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
trip_start: string = "";
real_date: string = "";
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
specialCases: string[] = ['United States', 'Canada', 'China'];
today: string = "";
carbon_attendee_km: number = 0.09708;
distance_correction: number = 1.09;

constructor() { 
  const date = new Date();
  const month = (date.getMonth()+1) < 10 ? '0' + (date.getMonth()+1) : (date.getMonth()+1)
  this.today = date.getFullYear() + '-' + month + '-' + date.getDate();
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
      else if(d['Country'] == 'Canada'){
        this.origins.set('Cananda1', d['y2019']/3);
        this.origins.set('Cananda2', d['y2019']/3);
        this.origins.set('Cananda3', d['y2019']/3);
        this.defaultOrigins.push(['Cananda1',""]);
        this.defaultOrigins.push(['Cananda2',""]);
        this.defaultOrigins.push(['Cananda3',""]);
      }
      else if(d['Country'] == 'China'){
        this.origins.set('China1', d['y2019']/3);
        this.origins.set('China2', d['y2019']/3);
        this.origins.set('China3', d['y2019']/3);
        this.defaultOrigins.push(['China1',""]);
        this.defaultOrigins.push(['China2',""]);
        this.defaultOrigins.push(['China3',""]);
      }
      this.origins.set(d['Country'], d['y2019']);
    });
    this.defaultOrigins.sort(function(a,b){
      if(b[1] == "") return - parseInt(a[1]);
      else if (a[1] == "") return parseInt(b[1]);
      return parseInt(b[1]) - parseInt(a[1]);
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

  handleDate(){
    const date = new Date();
    const splitDate = this.trip_start.split('-');
    if(parseInt(splitDate[1]) <= date.getMonth()+1){
      this.real_date = (date.getFullYear()+1).toString()+'-'+splitDate[1]+'-'+splitDate[2];
    }
    else{
      this.real_date = date.getFullYear().toString()+'-'+splitDate[1]+'-'+splitDate[2];
    }
  }

  deleteCity(location: any){
    this.destinations.splice(this.destinations.indexOf(location),1);
  }

  estimate(){
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
            var dist = this.haversineFormulaDistance(latOrigin, longOrigin, latDest, longDest);
            //carbon footprint is computed
            sum += this.distance_correction * dist * this.carbon_attendee_km;
          });
        });
        var nbAttendees = parseInt(this.origins.get(this.airports.get(origin)));
        // mean of routes for each origin-dest pair multiplied by the number of attendees
        var estimation = sum / flights.length;
        // add carbon footprint & time to destinations
        this.CO2est.has(dest) ? this.CO2est.set(dest, (this.CO2est.get(dest) * cptFlights.get(dest) + estimation*nbAttendees) / (cptFlights.get(dest)+nbAttendees)) : this.CO2est.set(dest, estimation);
        this.timeEst.has(dest) ? this.timeEst.set(dest, (this.timeEst.get(dest) * cptFlights.get(dest) + time*nbAttendees) / (cptFlights.get(dest)+nbAttendees)) : this.timeEst.set(dest, time);
        cptFlights.has(dest) ? cptFlights.set(dest,cptFlights.get(dest) + nbAttendees) : cptFlights.set(dest,nbAttendees);
        sum = 0;        
      });
        console.log(this.itineraries);
        console.log('CO2 :', this.CO2est);
        console.log('time :', this.timeEst);
        console.log('cpt :',cptFlights);
        this.showResults();
    });
  }

  async fetchFlight(originData: string[][], destinationData: any[], originIndex = 0, destIndex = 0, resolve: any){
    var currentOrigin = originData[originIndex];
    var currentDest = destinationData[destIndex];
    var origin = this.airports.get(currentOrigin[0]);
    var dest = this.specialCasesAirport(currentDest);
    if(this.origins.get(currentOrigin[0]) != "0" && origin != dest && (!this.specialCases.includes(currentOrigin[0]))){
      await fetch(`http://localhost:5000/flights-search?originCode=${origin}&destinationCode=${dest}&dateOfDeparture=${this.real_date}`)
        .then(response => response.json())
        .then(data => {
          if(data.data){
            this.addItineraries(data.data, currentDest.name, origin);
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

  specialCasesAirport(dest: { country: any; latitude: any; longitude: any; }){
    if(['CA','US','CN'].includes(dest.country)){
      var airport1 = this.airports.get(dest.country+'1');
      var airport2 = this.airports.get(dest.country+'2');
      var airport3 = this.airports.get(dest.country+'3');
      var airport1Loc = this.airportsLoc.get(this.airports.get(dest.country+'1'));
      var airport2Loc = this.airportsLoc.get(this.airports.get(dest.country+'2'));
      var airport3Loc = this.airportsLoc.get(this.airports.get(dest.country+'3'));
      var dist1 = this.haversineFormulaDistance(airport1Loc?.get('lat'),airport1Loc?.get('long'),dest.latitude,dest.longitude);
      var dist2 = this.haversineFormulaDistance(airport2Loc?.get('lat'),airport2Loc?.get('long'),dest.latitude,dest.longitude);
      var dist3 = this.haversineFormulaDistance(airport3Loc?.get('lat'),airport3Loc?.get('long'),dest.latitude,dest.longitude);
      var minDist = Math.min(dist1,dist2,dist3);
      if(minDist == dist1){
        return airport1;
      }
      else if(minDist == dist2){
        return airport2;
      }
      else{
        return airport3;
      }
    }
    else{
      return this.airports.get(dest.country);
    }
  }

  showResults(){

  }

  haversineFormulaDistance(lat1: any,lon1: any,lat2: any,lon2: any) {
    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
    var dLon = this.deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }
  
  deg2rad(deg: number) {
    return deg * (Math.PI/180)
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
        console.log("DONE");
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
    var val = Math.round(event.target.value);
    this.origins.set(country,val);
    if(country == 'United States'){
      this.origins.set('USA1', val/3);
      this.origins.set('USA2', val/3);
      this.origins.set('USA3', val/3);
    }
    else if(country == 'Canada'){
      this.origins.set('Canada1', val/3);
      this.origins.set('Canada2', val/3);
      this.origins.set('Canada3', val/3);
    }
    else if(country == 'China'){
      this.origins.set('China1', val/3);
      this.origins.set('China2', val/3);
      this.origins.set('China3', val/3);
    }
    
  }

}
