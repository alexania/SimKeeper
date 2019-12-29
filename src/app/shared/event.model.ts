import { EventType, Stage } from './enums';
import { Sim } from './sim.model';

export class SimEventSaveData {
  constructor(public type: EventType,
    public date: number = 0,
    public sims?: string[],
    public parents?: string[]) { }
}

export class SimEvent {

  public id: string;

  public type: EventType;
  public date: number;
  public sims: Sim[] = [];
  public parents: [Sim, Sim] = null;

  private simIds: string[];
  private parentIds: string[];

  constructor(saveData: SimEventSaveData, type?: EventType, date?: number, sims?: Sim[], parents?: [Sim, Sim]) {
    if (saveData) {
      this.type = saveData.type;
      this.date = saveData.date || 0;
      this.simIds = saveData.sims;
      this.parentIds = saveData.parents;
    } else {
      this.type = type;
      this.date = date;
      this.sims = sims;
      this.parents = parents || (type == EventType.Birth || type == EventType.Adopt ? [null, null] : null);
      this.setId();
    }
  }

  public buildConnections(sims: Sim[]) {
    if (this.simIds) {
      this.sims = [];
      for (let simId of this.simIds) {
        let sim = sims.find(t => t.id === simId);
        if (sim) {
          this.sims.push(sim);
        }
      }
      this.simIds = null;
    }
    if (this.type === EventType.Birth || this.type === EventType.Adopt) {
      this.parents = [null, null];
      if (this.parentIds) {
        for (let i = 0; i < this.parentIds.length; i++) {
          if (this.parentIds[i]) {
            let parent = sims.find(t => t.id === this.parentIds[i]);
            if (parent) {
              this.parents[i] = parent;
            }
          }
        }        
        this.parentIds = null;
      }
    }
    this.setId();
  }

  public get json() {
    const jsonObject = {};
    jsonObject["type"] = this.type;
    jsonObject["date"] = this.date;
    if (this.sims[0] || this.sims[1]) {
      jsonObject["sims"] = [];
      if (this.sims[0]) { jsonObject["sims"].push(this.sims[0].id); }
      if (this.sims[1]) { jsonObject["sims"].push(this.sims[1].id); }
    }
    if (this.parents && (this.parents[0] || this.parents[1])) {
      jsonObject["parents"] = [];
      if (this.parents[0]) { jsonObject["parents"].push(this.parents[0].id); }
      if (this.parents[1]) { jsonObject["parents"].push(this.parents[1].id); }
    }
    return jsonObject;
  }

  public setId() {
    this.id = `${this.sims.map(t => Sim.id(t)).sort().join("_")}_${this.type}`;
    if (this.type === EventType.Adopt) {
      if (this.parents[0]) {
        this.id += `_${this.parents[0].id}`;
      }
      if (this.parents[1]) {
        this.id += `_${this.parents[1].id}`;
      }
    }
  }

  public getPartner(id: string) {
    if (this.sims.length === 1) {
      return null;
    }
    return this.sims[0].id === id ? this.sims[1] : this.sims[0];
  }

  public getOtherParent(id: string) {
    if (!this.parents) {
      return null;
    }
    return this.parents[0].id === id ? this.parents[1] : this.parents[0];
  }

  getEventString(sim: Sim) {
    let partner: Sim;
    let parent1: Sim;
    let parent2: Sim;
    let stage = Stage[sim.getStage(this.date)];

    switch (this.type) {
      case EventType.Adopt:
        parent1 = this.parents[0];
        parent2 = this.parents[1];

        if (this.sims[0] === sim) {
          let r = `Adopted by ${this.linkSim(parent1)}`;
          if (parent2) {
            r += ` and ${this.linkSim(parent2)}`;
          }
          return r;
        }

        partner = this.getOtherParent(sim.id);
        let r = `( ${stage} ) Adopted ${this.linkSim(this.sims[0])}`;
        if (partner) {
          r += ` ( with ${this.linkSim(partner)} )`;
        }
        return r;
      case EventType.Birth:
        parent1 = this.parents[0];
        parent2 = this.parents[1];

        if (this.sims[0] === sim) {
          return `Born to ${this.linkSim(parent1)} and ${this.linkSim(parent2)}`;
        }
        partner = this.getOtherParent(sim.id);
        return `( ${stage} ) Gave birth to ${this.linkSim(this.sims[0])} ( with ${this.linkSim(partner)} )`;
      case EventType.BreakUp:
        return `( ${stage} ) Broke up with ${this.linkSim(this.getPartner(sim.id))}`;
      case EventType.Date:
        return `( ${stage} ) Started dating ${this.linkSim(this.getPartner(sim.id))}`;
      case EventType.Divorce:
        return `( ${stage} ) Divorced ${this.linkSim(this.getPartner(sim.id))}`;
      case EventType.Marriage:
        return `( ${stage} ) Married ${this.linkSim(this.getPartner(sim.id))}`;
    }
  }

  public linkSim(sim: Sim): string {
    if (sim) {
      return `<a ${sim.deathday ? 'class="dead" ' : ""}href="#${sim.id}">${sim.name}</a>`;
    } else {
      return "Unknown";
    }
  }
}