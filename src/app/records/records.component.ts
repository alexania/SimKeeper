import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { Sim } from '../shared/sim.model';
import { Display } from '../shared/display.model';

@Component({
  selector: 'app-records',
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class RecordsComponent implements OnInit {

  @Input() public display: Display;

  constructor() { 
  }

  ngOnInit() {
  }

  deleteSim(sim:Sim):void {
    if (sim) {
      const id = this.display.sims.indexOf(sim);
      if (id > -1) {
        const deleteEvent = window.confirm(`Delete ${sim.name} forever?`);
        if (deleteEvent) {
          this.display.sims.splice(id, 1);
        }
      }
    }
  }

}
