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

  public foundSims: Sim[];
  public foundIndex = 0;

  public helpVisible = false;
  public treeVisible = true;

  constructor() {
    this.display = new Display(1);
  }

  ngOnInit() {
    const input = '{"rootSim":"Alexander1","familyName":"Goth","currentDay":120,"globalAgeSpans":[2,7,13,13,24,24,10],"sims":[{"id":"Bella1","name":"Bella Goth","birthday":1},{"id":"Alexander1","name":"Alexander Goth","birthday":38,"parents":["Bella1","Mortimer1"]},{"id":"Aurora1","name":"Aurora Magee","birthday":78,"parents":["Cassandra1"]},{"id":"Brianna1","name":"Brianna Goth","birthday":39},{"id":"Carley1","name":"Carley Goth","birthday":86,"parents":["Alexander1","Brianna1"]},{"id":"Carlton1","name":"Carlton Milan","birthday":72,"parents":["Bella1","Nathan1"]},{"id":"Cassandra1","name":"Cassandra Magee","birthday":40,"parents":["Bella1","Mortimer1"]},{"id":"Side1","name":"Delilah Daisy","birthday":120},{"id":"Elyse1","name":"Elyse Goth","birthday":88,"parents":["Alexander1","Brianna1"]},{"id":"Gerard1","name":"Gerard Collins","birthday":76,"parents":["Cassandra1"]},{"id":"John1","name":"Joanne Milan","birthday":120,"parents":["Shanice1","John2"]},{"id":"John2","name":"John Palmer","birthday":120},{"id":"Mortimer1","name":"Mortimer Goth","birthday":1},{"id":"Nathan1","name":"Nathan Milan","birthday":1},{"id":"Cinderella1","name":"River Daisy","birthday":120,"parents":["Carlton1","Side1"]},{"id":"Shanice1","name":"Shanice Palmer","birthday":84,"parents":["Alexander1","Brianna1"]}],"events":[{"type":"Birth","date":1,"sims":["Bella1"]},{"type":"Birth","date":1,"sims":["Mortimer1"]},{"type":"Birth","date":1,"sims":["Nathan1"]},{"type":"Marriage","date":36,"sims":["Bella1","Mortimer1"]},{"type":"Birth","date":38,"sims":["Alexander1"],"parents":["Bella1","Mortimer1"]},{"type":"Birth","date":39,"sims":["Brianna1"]},{"type":"Birth","date":40,"sims":["Cassandra1"],"parents":["Bella1","Mortimer1"]},{"type":"Marriage","date":70,"sims":["Bella1","Nathan1"]},{"type":"Birth","date":72,"sims":["Carlton1"],"parents":["Bella1","Nathan1"]},{"type":"Birth","date":76,"sims":["Gerard1"],"parents":["Cassandra1"]},{"type":"Birth","date":78,"sims":["Aurora1"],"parents":["Cassandra1"]},{"type":"Marriage","date":83,"sims":["Alexander1","Brianna1"]},{"type":"Birth","date":84,"sims":["Shanice1"],"parents":["Alexander1","Brianna1"]},{"type":"Birth","date":86,"sims":["Carley1"],"parents":["Alexander1","Brianna1"]},{"type":"Birth","date":88,"sims":["Elyse1"],"parents":["Alexander1","Brianna1"]},{"type":"Birth","date":120,"sims":["John1"],"parents":["Shanice1","John2"]},{"type":"Birth","date":120,"sims":["Side1"]},{"type":"Birth","date":120,"sims":["Cinderella1"],"parents":["Carlton1","Side1"]},{"type":"Birth","date":120,"sims":["John2"]}]}';
    this.display.onLoad(JSON.parse(input));
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

    return { sim: newSim, event: newEvent };
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
