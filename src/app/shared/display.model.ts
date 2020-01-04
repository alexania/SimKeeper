import { SimEvent, SimEventSaveData } from './event.model';
import { Sim, SimSaveData } from './sim.model';
import { EventType } from './enums';

export class Display {
  public currentDay: number;
  public rootSim: Sim;
  public familyName: string = "Sim";
  public sims: Sim[];
  public events: SimEvent[];

  public globalAgeSpans: number[] = [2, 7, 13, 13, 24, 24, 10];

  constructor(currentDay: number, rootSim?: Sim, sims?: Sim[], events?: SimEvent[]) {
    this.currentDay = currentDay;
    this.rootSim = rootSim;
    this.sims = sims || [];
    this.events = events || [];
  }

  onSave() {
    const saveDisplay = {
      "rootSim": this.rootSim.id,
      "familyName": this.familyName,
      "currentDay": this.currentDay,
      "globalAgeSpans": this.globalAgeSpans,
      "sims": this.sims.map(t => t.json),
      "events": this.events.map(t => t.json)
    };

    const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saveDisplay));
    const downloader = document.createElement('a');

    downloader.setAttribute('href', data);
    downloader.setAttribute('download', 'simData.json');
    downloader.click();
  }

  onLoad(data: { rootSim: string, familyName: string, currentDay: number, globalAgeSpans: number[], sims: SimSaveData[], events: SimEventSaveData[] }) {
    this.familyName = data.familyName;

    this.sims = [];
    this.events = [];
    this.currentDay = data.currentDay || this.currentDay;
    this.globalAgeSpans = data.globalAgeSpans || this.globalAgeSpans;

    for (let simSaveData of data.sims) {
      this.sims.push(new Sim(simSaveData));
    }

    this.rootSim = this.findSim(data.rootSim) || this.sims[0];

    this.sortSims();

    // for (let sim of this.sims) {
    //   sim.buildConnections(this.sims);
    // }

    for (let event of data.events) {
      if (Object.values(EventType).includes(event.type)) {
        let newEvent = new SimEvent(event);
        newEvent.buildConnections(this.sims);
        this.events.push(newEvent);

        if (newEvent.type === EventType.Birth) {
          newEvent.sims[0].parents = newEvent.parents;
          if (newEvent.parents[0]) {
            newEvent.parents[0].children.push(newEvent.sims[0]);
          }
          if (newEvent.parents[1]) {
            newEvent.parents[1].children.push(newEvent.sims[0]);
          }
        }

        if (newEvent.type === EventType.Adopt) {
          newEvent.sims[0].adoptedParents = newEvent.parents;
          if (newEvent.parents[0]) {
            newEvent.parents[0].adoptedChilden.push(newEvent.sims[0]);
          }
          if (newEvent.parents[1]) {
            newEvent.parents[1].adoptedChilden.push(newEvent.sims[0]);
          }
        }
      }
    }

    this.sortEvents();
  }

  onGedLoad(data: { level: number, pointer: string, tag: string, data: string }[]) {
    let rootSim: string = null;
    let rootId: string = null;

    let sims: { [id: string]: SimSaveData } = {};
    let events: SimEventSaveData[] = [];

    let currentSim: SimSaveData;
    let currentFamily: { id: string, sims: string[], children: string[], married: Boolean, divorced: Boolean };

    for (let line of data) {
      switch (line.tag) {
        case "INDI":
          currentFamily = null;
          if (!sims[line.pointer]) {
            sims[line.pointer] = new SimSaveData(line.pointer, "");
          }
          currentSim = sims[line.pointer];
          break;
        case "NAME":
          let name = line.data.replace(/\//g, "");
          if (!rootSim) {
            rootSim = name;
          } else if (currentSim) {
            if (rootSim === name) {
              rootId = currentSim.id;
            }
            currentSim.name = name;
          }
          break;
        case "DEAT":
          currentSim.deathday = 93;
          break;
        case "FAM":
          this.familyToEvents(currentFamily, events);
          currentFamily = { id: line.pointer, sims: [], children: [], married: false, divorced: false };
          break;
        case "TRLR":
          this.familyToEvents(currentFamily, events);
          break;
        case "HUSB":
        case "WIFE":
          const spouse = sims[line.data];
          if (spouse) {
            currentFamily.sims.push(spouse.id);
          }
          break;
        case "CHIL":
          const child = sims[line.data];
          if (child) {
            currentFamily.children.push(child.id);
          }
          break;
        case "MARR":
          currentFamily.married = true;
          break;
        case "DIV":
          currentFamily.married = true;
          currentFamily.divorced = true;
          break;
        case "SUBM":
          rootSim = null;
          rootId = null;
          break;
      }
    }

    const names = rootSim.split(' ');
    const familyName = names[names.length - 1];

    const loadData = { rootSim: rootId, familyName: familyName, currentDay: 1, globalAgeSpans: this.globalAgeSpans, sims: Object.keys(sims).map(t => sims[t]), events: events };
    this.onLoad(loadData);
  }

  private familyToEvents(currentFamily: { id: string; sims: string[]; children: string[]; married: Boolean; divorced: Boolean; }, events: SimEventSaveData[]) {
    if (currentFamily) {
      for (let child of currentFamily.children) {
        let event = new SimEventSaveData(EventType.Birth, 0, [child], currentFamily.sims);
        events.push(event);
      }
      if (currentFamily.married) {
        events.push(new SimEventSaveData(EventType.Marriage, 0, currentFamily.sims));
      }
      if (currentFamily.divorced) {
        events.push(new SimEventSaveData(EventType.Divorce, 0, currentFamily.sims));
      }
    }
  }

  public changeBirthday(sim: Sim, birthday: number) {
    sim.birthday = birthday;
    const birthEvent = this.events.find(t => t.type === EventType.Birth && t.sims[0] === sim);
    if (birthEvent) {
      birthEvent.date = birthday;
    }
    this.sortEvents();
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