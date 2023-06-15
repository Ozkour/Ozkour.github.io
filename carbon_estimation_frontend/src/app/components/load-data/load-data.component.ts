import { Component, OnInit, resolveForwardRef } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-load-data',
  templateUrl: './load-data.component.html',
  styleUrls: ['./load-data.component.css']
})
export class LoadDataComponent implements OnInit {
airports: any = new Map();
itinAirports: any = [];
from: any = "";
fromLocation: any = [];
origins: any = [];
toLocationTemplate: boolean = true;
fromLocationTemplate: boolean = true;
inputData: boolean = true;
to: any = "";
destinations: any = [];
toLocation: any = [];
departureDateTemplate: boolean = false
date: any = "";
flights: any;
flightTemplate: boolean = false;
itineraries: any = [];
data2019: any = new Map();
defaultData2019: any = [];
value = 0;
airportsLoc: any = new Map();
CO2est: any = new Map();
constructor() { 
  d3.csv('../assets/chi-countries-counts-test.csv').then(data =>{
    data.forEach(d => {
      this.data2019.set(d['Country'], d['y2019']);
      this.defaultData2019.push([d['Country'],d['y2019']]);
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
    dataAirport.forEach(d => {
      if(d['iata'] != "\\N"){
        this.airportsLoc.set(d['iata'], new Map([['lat',d['lat']],['long',d['long']]]))
      }
    });
    
  });
  
  // var itin: any = [[["SYD","HKG"],["HKG","CDG"]], [["SYD","HND"],["HND","CDG"]], [["SYD","DOH"],["DOH","DMK"]], [["SYD","SIN"],["SIN","HEL"],["HEL","CDG"]]];
  // this.itineraries.push(new Map([['origin', "SYD"],['dest', "CDG"],['flights',itin]]));
  // var itin: any = [[["SYD","BKK"]]];
  // this.itineraries.push(new Map([['origin', "SYD"],['dest', "BKK"],['flights',itin]]));
  // var itin: any = [[["CDG","LAX"]]];
  // this.itineraries.push(new Map([['origin', "SYD"],['dest', "LAX"],['flights',itin]]));
  // console.log(this.itineraries);
  // this.itinAirports = ["SYD", "HKG", "CDG", "HND", "DOH", "DMK", "SIN", "HEL", "BKK", "LAX"]
  // var name1 = "CDG"
  // var id1, id2;
  //  var name2 = "SYD"

  //   fetch(`http://localhost:5000/flight-connections-search-flights?origin=${name1}&dest=${name2}`)
  //   .then(response => response.json())
  //   .then(data => console.log(data));
  
}
  ngOnInit(): void {
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

  findAirports2(){
    console.log("Loading...");
    var bar = new Promise(resolve => {
      this.fetchFlight2(this.defaultData2019, this.destinations, 0, 0, resolve);
    });
//faut faire la somme des segments pour chaque voyage et moyenne de chaque voyage pour chaque dest
    bar.then(() => {
      var sum = 0;
      this.itineraries.forEach((itin: any) => {
        var origin = itin.get('origin');
        var dest = itin.get('dest');
        var flights = itin.get('flights');
        flights.forEach((travel: any) =>{
          travel.forEach((seg: any) => {
            var airportOrigin = this.airportsLoc.get(seg[0]);
            var airportDest = this.airportsLoc.get(seg[1]);
            var latOrigin = airportOrigin.get('lat');
            var longOrigin = airportOrigin.get('long');
            var latDest = airportDest.get('lat');
            var longDest = airportDest.get('long');
            sum += 1
            // sum += (latOrigin+longOrigin)*(latDest+longDest)/2;
            //calculer estimation
            //ajouter a une somme
          });
          //cpt++
        });
        var estimation = sum / flights.length * this.data2019.get(this.airports.get(origin));
        this.CO2est.has(dest) ? this.CO2est.set(dest, this.CO2est.get(dest) + estimation) : this.CO2est.set(dest, estimation);
        sum = 0;
        //faire la moyenne des sommes (diviser par nombre de travel)
        
      });
      console.log(this.itineraries);
      console.log("ici", this.CO2est);
    });
    

  }

  async fetchFlight2(originData: any, destinationData: any, originIndex = 0, destIndex = 0, resolve: any){
    var currentOrigin = originData[originIndex];
    var currentDest = destinationData[destIndex];
    var origin = this.airports.get(currentOrigin[0]);
    var dest = this.airports.get(currentDest.country);
    if(this.data2019.get(currentOrigin[0]) != "0" && origin != dest){
      await fetch(`http://localhost:5000/flights-search?originCode=${origin}&destinationCode=${dest}&dateOfDeparture=2023-07-25`)
        .then(response => response.json())
        .then(data => {
          this.listItineraries(data.data, dest, origin);
          setTimeout(() =>{this.nextFetch(originData, destinationData, originIndex, destIndex, resolve)},2000);
        });
    }
    else{
      this.nextFetch(originData, destinationData, originIndex, destIndex, resolve);
    }
  }

  nextFetch(originData: any, destinationData: any, originIndex: number, destIndex: number, resolve: any){
    if(destIndex < destinationData.length - 1){
      this.fetchFlight2(originData, destinationData, originIndex, destIndex+1, resolve);
    }
    else{
      if(originIndex < originData.length -1){
        this.fetchFlight2(originData, destinationData, originIndex+1, 0, resolve);
      }
      else{
        resolve();
      }
    }
  }

  // async findAirports(){
  //   console.log("Loading...");
  //     d3.csv('../assets/busiest_airports.csv').then((data) => {
  //       // const airports = new Map();
  //       data.forEach(d => {
  //         if(d['code'] != ""){
  //           this.airports.set(d['code'], d['iata']);
  //           this.airports.set(d['country'], d['iata']);
  //         }
  //       });
  //     });
      
  //     await this.defaultData2019.forEach((dataOrigin: any) =>{
  //       if(this.data2019.get(dataOrigin[0]) != "0"){
  //         var origin = this.airports.get(dataOrigin[0]);
  //         this.destinations.forEach(async (dataDest: { country: any; }) => {
  //           var dest = this.airports.get(dataDest.country);
  //           if(origin != dest){
  //             this.addAirport(origin);
  //             this.addAirport(dest);
  //             const response = await (await fetch(`http://localhost:5000/flight-connections-search-flights?origin=${origin}&dest=${dest}`)).json();
  //               if(Object.keys(response).length == 0){
  //                 this.itineraries.push(new Map([['origin', origin],['dest', dest],['stopovers',null]]));
  //               }
  //               else{
  //                 var stopovers: any[] = [];
  //                 Object.values(response).forEach((value: any) => {
  //                   stopovers.push(value[1]);
  //                   this.addAirport(value[1]);
  //                   console.log("?????")
  //                 });
  //                 this.itineraries.push(new Map([['origin', origin],['dest', dest],['stopovers',stopovers]]));
  //               }
  //               console.log("zzfg")
  //           }
  //         });
  //       }
  //     });
  //     
      
  // }



  findAirports(){
    console.log("Loading...");
    d3.csv('../assets/busiest_airports.csv').then((data) => {
      const airports = new Map();
      data.forEach(d => {
        if(d['code'] != ""){
          airports.set(d['code'], d['iata']);
          airports.set(d['country'], d['iata']);
        }
      });
      this.defaultData2019.forEach((dataOrigin: any) =>{
        var origin = airports.get(dataOrigin[0]);
        this.destinations.forEach((dataDest: { country: any; }) => {
          var dest = airports.get(dataDest.country);
          if(this.data2019.get(dataOrigin[0]) != "0" && origin != dest){
            setTimeout(() => {
              this.fetchFlight(origin, dest);
            }, 1500);
          }
        });
      });
      
    });
    d3.csv('../assets/airports.csv').then(data => {
      data.forEach(d => {
        if(this.itinAirports.includes(d['iata'])){
          this.airports.set(d['iata'], new Map([['lat',d['lat']],['long',d['long']]]))
        }
      });
      console.log(this.airports)
    });
  }

  async fetchFlight(origin: any, dest: any, noStop = false){
    if(noStop){
      setTimeout(async () => {
        await fetch(`http://localhost:5000/flight-search?originCode=${origin}&destinationCode=${dest}&dateOfDeparture=2023-07-25`)
        .then(response => response.json())
        .then(data => {
          this.listItineraries(data.data, dest, origin);
        });
      }, 1500);
      
    }
    else{
      setTimeout(async () => {
        await fetch(`http://localhost:5000/flight-search-nonstop?originCode=${origin}&destinationCode=${dest}&dateOfDeparture=2023-07-25`)
        .then(response => response.json())
        .then(data => {
          if(!data.data){
            console.log(origin, dest)
            console.log(data);
          }
          else{
            if(data.data.length == 0){
              console.log("there is no flight without a stop here are the stops :");
              setTimeout(() => {
                this.fetchFlight(origin, dest, true);
              }, 1500);
            }
            else{
              this.itineraries.push(new Map([['origin', origin],['dest', dest],['flights',[[[origin, dest]]]]]));
              this.addAirport(origin,dest);
              console.log(this.itineraries);
            }
          }
        });
      }, 1500);
      
    }
    
  }

  listItineraries(flights: any = [], dest: any, origin: any){
    var itin: any[][][] = [];
    var step: any[][] = [];
    flights.forEach((flight: { itineraries: { segments: any; }[]; }) =>{
      (flight.itineraries[0].segments).forEach((seg: { departure: { iataCode: any; }; arrival: { iataCode: any; }; }) =>{
        step.push([seg.departure.iataCode, seg.arrival.iataCode]);
        this.addAirport(seg.departure.iataCode, seg.arrival.iataCode);
      });
      itin.push(step);
      step = [];
      
    });
    this.itineraries.push(new Map([['origin', origin],['dest', dest],['flights',itin]]));
  }

  changeVal(country: any, event: any){
    this.data2019.set(country,event.target.value);
  }

  addAirport(airport: any, airport2: any){
    if(!this.itinAirports.includes(airport)){
      this.itinAirports.push(airport);
    }
    if(!this.itinAirports.includes(airport2)){
      this.itinAirports.push(airport2);
    }
  }


}
