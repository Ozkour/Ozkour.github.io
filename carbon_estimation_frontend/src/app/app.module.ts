import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatSliderModule} from '@angular/material/slider'; 


import { AppComponent } from './app.component';

import { FormsModule } from '@angular/forms';
import { LoadDataComponent } from './components/load-data/load-data.component';

@NgModule({
  declarations: [
    AppComponent,
    LoadDataComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatSliderModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
