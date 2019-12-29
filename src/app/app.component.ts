import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { Sim, SimSaveData } from './shared/sim.model';
import { SimEvent, SimEventSaveData } from './shared/event.model';
import { EventType } from './shared/enums';
import { Display } from './shared/display.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

  public display: Display;
  public familyName: string = "Sim";

  constructor() {
    this.display = new Display(1);
  }

  ngOnInit() {    
  }

  onSave() {
    var data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      "rootSim": this.display.rootSim.id,
      "familyName": this.familyName,
      "currentDay": this.display.currentDay,
      "sims": this.display.sims.map(t => t.json),
      "events": this.display.events.map(t => t.json)
    }));
    var downloader = document.createElement('a');

    downloader.setAttribute('href', data);
    downloader.setAttribute('download', 'simData.json');
    downloader.click();
  }

  onLoad(data: { rootSim: string, familyName: string, currentDay: number, sims: SimSaveData[], events: SimEventSaveData[] }) {
    this.familyName = data.familyName;

    this.display.sims = [];
    this.display.events = [];
    this.display.currentDay = data.currentDay;

    for (let simSaveData of data.sims) {
      this.display.sims.push(new Sim(simSaveData));
    }

    this.display.rootSim = this.display.findSim(data.rootSim) || this.display.sims[0];

    this.display.sortSims();

    for (let sim of this.display.sims) {
      sim.buildConnections(this.display.sims);
    }

    for (let event of data.events) {
      if (Object.values(EventType).includes(event.type)) {
        let newEvent = new SimEvent(event);
        newEvent.buildConnections(this.display.sims);
        this.display.events.push(newEvent);
      }
    }
    this.display.sortEvents();
  }

  findSim(findInput: HTMLInputElement) {
    const searchString = findInput.value.toLowerCase();
    if (searchString && searchString.length > 2) {
      const foundSims = this.display.sims.filter(t => t.name.toLowerCase().includes(searchString));
      if (foundSims.length > 0) {
        document.getElementById(foundSims[0].id).scrollIntoView(false);
      }
    }
  }

  incrementDay() {
    this.display.currentDay++;
  }

  collapseAll() {
    const allButtons = document.querySelectorAll<HTMLButtonElement>("button.btn-collapse");
    allButtons.forEach(button => {
      button.click();
    });
  }

  expandAll() {
    const allButtons = document.querySelectorAll<HTMLButtonElement>("button.btn-expand");
    allButtons.forEach(button => {
      button.click();
    });
  }

  addSimEnterKey(event: KeyboardEvent) {
    if (event.keyCode === 13) {
      event.preventDefault();
      const button = document.querySelector(".add-sim") as HTMLButtonElement;
      button.click();
    }
  }

  addSim(nameElement: HTMLInputElement) {
    if (nameElement.value) {
      if (this.addSimFromName(nameElement.value)) {
        nameElement.value = "";
      }
    }
  }

  scrollToSim(id:string) {
    setTimeout(function () {
      document.getElementById(id).scrollIntoView(false);
    }, 100);
  }

  private addSimFromName(name: string) {
    const newSim = new Sim(null, name, this.display.currentDay);
    //console.log("Create new sim:");
    //console.log(newSim);

    let id = 1;
    while (this.display.findSim(`${newSim.id}${id}`)) {
      id++;
    }
    newSim.id += id;

    if (this.display.sims.length === 0) {
      this.display.rootSim = newSim;
      const names = newSim.name.split(' ');
      this.familyName = names[names.length - 1];
    }

    this.display.sims.push(newSim);
    this.display.sortSims();

    this.scrollToSim(newSim.id);

    const newEvent = new SimEvent(null, EventType.Birth, newSim.birthday, [newSim]);
    this.display.addEvent(newEvent);

    return true;
  }
}
