import { SimEvent } from './event.model';
import { Sim } from './sim.model';
import { EventType } from './enums';

export class Display {
  public currentDay: number;
  public rootSim: Sim;
  public sims: Sim[];
  public events: SimEvent[];

  constructor(currentDay: number, rootSim?: Sim, sims?: Sim[], events?: SimEvent[]) {
    this.currentDay = currentDay;
    this.rootSim = rootSim;
    this.sims = sims || [];
    this.events = events || [];
  }

  public linkSim(sim: Sim): string {
    if (sim) {
      return `<a ${sim.deathday ? 'class="dead" ' : ""}href="#${sim.id}">${sim.name}</a>`;
    } else {
      return "Unknown";
    }
  }

  public addEvent(newEvent: SimEvent) {
    if (!this.events.find(t => t.id === newEvent.id)) {
      this.events.push(newEvent);
      this.sortEvents();
    }
  }

  public sortEvents() {
    this.events.sort((a, b) => a.date - b.date);
  }

  public findEvents(sim: Sim, includeParents = false) {
    if (includeParents) {
      return this.events.filter(t => t.sims.indexOf(sim) > -1 || (t.parents && t.parents.indexOf(sim) > -1));
    }
    return this.events.filter(t => t.sims.indexOf(sim) > -1);
  }

  public findSim(id: string) {
    if (id === "Unknown") {
      return null;
    }
    return this.sims.find(t => t.id === id) || null;
  }

  public sortSims() {
    this.sims.sort((a, b) => {
      if ((a === this.rootSim) < (b === this.rootSim)) { return 1; }
      if ((a === this.rootSim) > (b === this.rootSim)) { return -1; }

      //if (a.isComplete < b.isComplete) { return 1; }
      //if (a.isComplete > b.isComplete) { return -1; }

      //if ((a.birthday == 0) < (b.birthday == 0)) { return -1; }
      //if ((a.birthday == 0) > (b.birthday == 0)) { return 1; }

      // if (a.birthday < b.birthday) { return -1; }
      // if (a.birthday > b.birthday) { return 1; }

      if (a.name < b.name) { return -1; }
      if (a.name > b.name) { return 1; }
      return 0;
    });
  }

  lastEvent(events: SimEvent[]): SimEvent {
    const len = events.length;
    return len > 0 ? events[len - 1] : null;
  }

  setSpouseFromEvents(sim: Sim) {
    const events = this.findEvents(sim);
    const lastMarriage = this.lastEvent(events.filter(t => t.type === EventType.Marriage));
    if (!lastMarriage) {
      sim.spouse = null;
      return;
    }
    const divorce = new SimEvent(null, EventType.Divorce, -1, lastMarriage.sims);
    const lastDivorce = events.find(t => t.id === divorce.id);
    if (!lastDivorce) {
      sim.spouse = lastMarriage.getPartner(sim.id);
      return;
    }
    sim.spouse = null;
    return;
  }

  setDatingFromEvents(sim: Sim) {
    const events = this.findEvents(sim);
    const lastDate = this.lastEvent(events.filter(t => t.type === EventType.Date));
    if (!lastDate) {
      sim.dating = null;
      return;
    }
    const breakUp = new SimEvent(null, EventType.BreakUp, -1, lastDate.sims);
    const lastBreakUp = events.find(t => t.id === breakUp.id);
    if (!lastBreakUp) {
      sim.dating = lastDate.getPartner(sim.id);
      return;
    }
    sim.dating = null;
    return;
  }
}