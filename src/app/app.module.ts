import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { RecordsComponent } from './records/records.component';
import { RecordComponent } from './records/record/record.component';
import { TraitsComponent } from './records/record/traits/traits.component';
import { EventsComponent } from './records/record/events/events.component';
import { HelpComponent } from './help/help.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    RecordsComponent,
    RecordComponent,
    TraitsComponent,
    EventsComponent,
    HelpComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
