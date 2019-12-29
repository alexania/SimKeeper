import { Component, OnInit, Input, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { EventType, Place, Stage } from 'src/app/shared/enums';
import { SimEvent } from 'src/app/shared/event.model';
import { Sim } from 'src/app/shared/sim.model';
import { Display } from 'src/app/shared/display.model';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EventsComponent implements OnInit {

  @Input() public display: Display;
  @Input() public sim: Sim;

  public eventOptions = Object.keys(EventType).map(key => EventType[key]);
  public placeOptions = Object.keys(Place).map(key => Place[key]);

  constructor() {
  }

  ngOnInit() {
  }

  getId(sim: Sim) {
    return Sim.id(sim);
  }

  simEvents() {
    return this.display.findEvents(this.sim, true);
  }

  getStageString(date: number) {
    return Stage[this.sim.getStage(date, this.display.globalAgeSpans)];
  }

  getEventString(event: SimEvent) {
    return event.getEventString(this.sim, this.display.globalAgeSpans);
  }

  focusField(event: SimEvent, fieldDisplay: HTMLElement, fieldInput: HTMLElement) {
    fieldDisplay.style.display = "none";
    fieldInput.style.display = "inline";
    fieldInput.focus();

    window.onmousedown = (function (e: any) {
      if (!fieldInput.contains(e.target)) {
        window.onmousedown = null;
        fieldDisplay.style.display = "inline";
        fieldInput.style.display = "none";

        this.blurField(event, fieldInput);
      }
    }).bind(this);
  }

  blurField(event: SimEvent, fieldInput: HTMLElement) {
    switch (event.type) {
      case EventType.Adopt:
        this.changeParents("adoptedParents", event, fieldInput);
        break;
      case EventType.Birth:
        this.changeParents("parents", event, fieldInput);
        break;
      case EventType.BreakUp:
        break;
      case EventType.Date:
        this.changePartner("dating", fieldInput, event);
        break;
      case EventType.Divorce:
        break;
      case EventType.Marriage:
        this.changePartner("spouse", fieldInput, event);
        break;
      default:
        break;
    }
  }

  private changePartner(field: string, fieldInput: HTMLElement, event: SimEvent) {
    const partnerInput = fieldInput.querySelector('.partner') as HTMLSelectElement;
    if (partnerInput) {
      let i = 0;

      if (event.sims.length === 1) {
        event.sims.push(null);
        i = 1;
      }
      else {
        i = event.sims[0] === this.sim ? 1 : 0;
      }

      const oldPartner = event.sims[i];
      const newPartner = this.display.findSim(partnerInput.value);

      if (newPartner !== oldPartner && newPartner !== this.sim) {
        event.sims[i] = newPartner;
        event.setId();
        if (field === "dating") {
          this.display.setDatingFromEvents(this.sim);
          if (oldPartner) { this.display.setDatingFromEvents(oldPartner); }
          if (newPartner) { this.display.setDatingFromEvents(newPartner); }
        } else {
          this.display.setSpouseFromEvents(this.sim);
          if (oldPartner) { this.display.setSpouseFromEvents(oldPartner); }
          if (newPartner) { this.display.setSpouseFromEvents(newPartner); }
        }
      }
    }

    console.log(event);
  }

  private changeParents(field: string, event: SimEvent, fieldInput: HTMLElement) {
    const childSim = event.sims[0];
    const parent1Id = fieldInput.querySelector(".parent1") as HTMLSelectElement;
    const parent2Id = fieldInput.querySelector(".parent2") as HTMLSelectElement;
    if (childSim && parent1Id && parent2Id) {
      if (!childSim[field]) {
        childSim[field] = [null, null];
      }

      if (parent1Id.value !== childSim.id) {
        childSim[field][0] = this.display.findSim(parent1Id.value);
      }
      else {
        childSim[field][0] = null;
      }

      if (parent2Id.value !== childSim.id && parent2Id.value !== parent1Id.value) {
        childSim[field][1] = this.display.findSim(parent2Id.value);
      }
      else {
        childSim[field][1] = null;
      }
      event.setId();

      event.parents = childSim[field];
    }
  }

  killSim() {
    this.sim.deathday = this.sim.birthday + this.sim.ageSpans(this.display.globalAgeSpans).reduce((total, val) => { return total + val; });
  }

  addEvent(eventString: string): void {
    const eventType = eventString as EventType;
    console.log("Add SimEvent: " + eventType + " to " + this.sim.name);
    switch (eventType) {
      case EventType.Adopt:
        this.addNewEvent(EventType.Adopt, [this.sim], [null, null]);
        break;
      case EventType.BreakUp:
        this.addNewEvent(EventType.BreakUp, [this.sim, this.sim.dating]);
        this.display.setDatingFromEvents(this.sim.dating);
        this.display.setDatingFromEvents(this.sim);
        break;
      case EventType.Date:
        this.addNewEvent(EventType.Date, [this.sim, null]);
        this.display.setDatingFromEvents(this.sim);
        break;
      case EventType.Divorce:
        this.addNewEvent(EventType.Divorce, [this.sim, this.sim.spouse]);
        this.display.setSpouseFromEvents(this.sim.spouse);
        this.display.setSpouseFromEvents(this.sim);
        break;
        break;
      case EventType.Marriage:
        this.addNewEvent(EventType.Marriage, [this.sim, null]);
        this.display.setSpouseFromEvents(this.sim);
        break;
    }
  }

  private addNewEvent(eventType: EventType, sims: Sim[], parents: [Sim, Sim] = null) {
    const event = new SimEvent(null, eventType, this.display.currentDay, sims, parents);
    this.display.addEvent(event);
  }

  changeEventDate(event: SimEvent, date: number) {
    if (event.type === EventType.Birth) {
      event.sims[0].birthday = +date;
    }
    event.date = +date;
    this.display.sortEvents();
  }

  deleteEvent(event: SimEvent): void {
    if (event && event.type !== EventType.Birth) {
      const id = this.display.events.indexOf(event);
      if (id > -1) {
        const deleteEvent = window.confirm(`Delete ${event.type} on day ${event.date} for ${this.sim.name}?`);
        if (deleteEvent) {
          let sims = event.sims;
          switch (event.type) {
            case EventType.Adopt:
              sims[0].adoptedParents = null;
              this.display.events.splice(id, 1);
              break;
            case EventType.Date:
            case EventType.BreakUp:
              this.display.events.splice(id, 1);
              for (let sim of sims) {
                if (sim) {
                  this.display.setDatingFromEvents(sim);
                }
              }
              break;
            case EventType.Marriage:
            case EventType.Divorce:
              this.display.events.splice(id, 1);
              for (let sim of sims) {
                if (sim) {
                  this.display.setSpouseFromEvents(sim);
                }
              }
              break;
          }
        }
      }
    }
  }
}
