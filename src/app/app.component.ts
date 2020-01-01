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

  public foundSims:Sim[];
  public foundIndex = 0;

  public helpVisible = false;
  public treeVisible = true;

  constructor() {
    this.display = new Display(1);
  }

  ngOnInit() {
    this.addSimFromName("Bella Goth");
    this.addSimFromName("Mortimer Goth");

    this.addSimFromName("Nathan Milan");

    this.addSimFromName("Carlton Goth");
    this.addSimFromName("Alexander Goth");
    this.addSimFromName("Cassandra Magee");

    this.addSimFromName("Brianna Talbert");

    this.addSimFromName("Carley Goth");
    this.addSimFromName("Elyse Talbert");
    this.addSimFromName("Shanice Goth");
    
    this.addSimFromName("John Palmer");

    this.addSimFromName("Gerard Collins");
    this.addSimFromName("Aurora Magee");

    const bella = this.display.findSim("Bella1");
    const mortimer = this.display.findSim("Mortimer1");

    const nathan = this.display.findSim("Nathan1");

    const carlton = this.display.findSim("Carlton1");
    const alexander = this.display.findSim("Alexander1");
    const cassandra = this.display.findSim("Cassandra1");

    const brianna = this.display.findSim("Brianna1");

    const carley = this.display.findSim("Carley1");
    const elyse = this.display.findSim("Elyse1");
    const shanice = this.display.findSim("Shanice1");
    const john = this.display.findSim("John1");
    const gerard = this.display.findSim("Gerard1");
    const aurora = this.display.findSim("Aurora1");

    alexander.parents = [ bella, mortimer ];
    cassandra.parents = [ bella, mortimer ];
    carlton.parents = [ bella, nathan ];

    carley.parents = [ alexander, brianna ];
    elyse.parents = [ alexander, brianna ];
    shanice.parents = [ alexander, brianna ];

    gerard.parents = [ cassandra, null ];
    aurora.parents = [ cassandra, null ];
    
    john.parents = [ shanice, null ];

    this.display.rootSim = alexander;
  }

  addSimKeyUp(event: KeyboardEvent) {
    if (event.keyCode === 13) {
      event.preventDefault();
      const button = document.querySelector(".add-sim") as HTMLButtonElement;
      button.click();
    } else {
      this.findSim(event.target as HTMLInputElement);
    }
  }

  findSim(findInput: HTMLInputElement) {
    const searchString = findInput.value.toLowerCase();
    if (searchString && searchString.length >= 3) {
      this.foundIndex = 0;
      this.foundSims = this.display.sims.filter(t => t.name.toLowerCase().includes(searchString));
      console.log(searchString);
      console.log(this.foundSims);
      if (this.foundSims.length > 0) {
        this.scrollToSim(this.foundSims[this.foundIndex].id);
      }
    }
  }

  findNext() {
    if (this.foundSims && this.foundSims.length > 0) {
      this.foundIndex = (this.foundSims.length + this.foundIndex + 1) % this.foundSims.length;
      this.scrollToSim(this.foundSims[this.foundIndex].id);
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

  addSim(nameElement: HTMLInputElement) {
    if (nameElement.value) {
      if (this.addSimFromName(nameElement.value)) {
        nameElement.value = "";
      }
    }
  }

  scrollToSim(id: string) {
    setTimeout(function () {
      document.getElementById(id).scrollIntoView(false);
    }, 100);
  }

  closeDialog(type: string) {
    if (type === "closeHelp") {
      this.helpVisible = false;
    } else {
      this.treeVisible = false;
    }
  }

  showDialog(type: string) {
    console.log(type);
    if (type === "showHelp") {
      this.helpVisible = true;
    } else {
      this.treeVisible = true;
    }
  }

  private createSimFromName(name: string) {
    const newSim = new Sim(null, name, this.display.currentDay);
    //console.log("Create new sim:");
    //console.log(newSim);

    let id = 1;
    while (this.display.findSim(`${newSim.id}${id}`)) {
      id++;
    }
    newSim.id += id;

    const newEvent = new SimEvent(null, EventType.Birth, newSim.birthday, [newSim]);

    return {sim: newSim, event: newEvent};
  }

  private addSimFromName(name: string) {
    const newSim = this.createSimFromName(name);

    if (this.display.sims.length === 0) {
      this.display.rootSim = newSim.sim;
      const names = newSim.sim.name.split(' ');
      this.display.familyName = names[names.length - 1];
    }

    this.display.sims.push(newSim.sim);
    this.display.sortSims();

    this.scrollToSim(newSim.sim.id);

    this.display.addEvent(newSim.event);

    return true;
  }
}
