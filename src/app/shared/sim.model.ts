import { Place, Career, Stage } from './enums';

export class SimSaveData {
  constructor(
    public id: string,
    public name: string,
    public birthday?: number,
    public deathday?: number,
    public career?: Career,
    public parents?: [string, string],
    public adoptedParents?: [string, string],
    public traits?: string[],
    public place?: Place,
    public imageUrl?: string,
    public isComplete?: boolean,
    public isFavourite?: boolean,
    public stageOverride?: Stage,
    public ageSpansOverride?: number[]) { }
}

export class Sim {

  public id: string = null;
  public name: string;
  public birthday: number = 0;
  public deathday: number = null;

  public traits: string[] = [];
  public career: Career = Career.Unemployed;
  public place: Place = Place.NotInTheWorld;

  public parents: [Sim, Sim] = [null, null];
  public adoptedParents: [Sim, Sim] = null;

  public spouse: Sim = null;
  public dating: Sim = null;

  public children: Sim[] = [];
  public adoptedChilden: Sim[] = [];

  public imageUrl: string = "Default.png";
  public isComplete: boolean = false;
  public isFavourite: boolean = false;

  public stageOverride: Stage = null;
  public ageSpansOverride: number[] = null

  private parentIds: [string, string];
  private adoptedParentIds: [string, string];

  constructor(saveData?: SimSaveData, name?: string, birthday?: number) {
    if (saveData) {
      this.id = saveData.id;
      this.name = saveData.name;
      this.birthday = saveData.birthday || this.birthday;
      this.deathday = saveData.deathday || null;

      this.traits = saveData.traits || [];
      this.career = saveData.career || this.career;
      this.place = saveData.place || this.place;

      this.parentIds = saveData.parents || null;
      this.adoptedParentIds = saveData.adoptedParents || null;

      this.imageUrl = saveData.imageUrl || this.imageUrl;
      this.isComplete = saveData.isComplete || this.isComplete;
      this.isFavourite = saveData.isFavourite || this.isFavourite;

      this.stageOverride = saveData.stageOverride || null;
      this.ageSpansOverride = saveData.ageSpansOverride || null;

    } else if (name) {
      this.name = name;
      this.birthday = birthday || 0;
      this.id = name.split(" ")[0];
    }
  }

  public static id(sim: Sim) {
    if (sim) {
      return sim.id;
    }
    return "Unknown";
  }

  public get json() {
    const jsonObject = {};

    jsonObject["id"] = this.id;
    jsonObject["name"] = this.name;
    if (this.birthday > 0) { jsonObject["birthday"] = this.birthday; }
    if (this.deathday) { jsonObject["deathday"] = this.deathday; }

    if (this.traits.length > 0) { jsonObject["traits"] = this.traits; }
    if (this.career !== Career.Unemployed) { jsonObject["career"] = this.career; }
    if (this.place !== Place.NotInTheWorld) { jsonObject["place"] = this.place; }

    if (this.parents[0] || this.parents[1]) {
      jsonObject["parents"] = [];
      if (this.parents[0]) { jsonObject["parents"].push(this.parents[0].id); }
      if (this.parents[1]) { jsonObject["parents"].push(this.parents[1].id); }
    }    
    if (this.adoptedParents && (this.adoptedParents[0] || this.adoptedParents[1])) {
      jsonObject["adoptedParents"] = [];
      if (this.adoptedParents[0]) { jsonObject["adoptedParents"].push(this.adoptedParents[0].id); }
      if (this.adoptedParents[1]) { jsonObject["adoptedParents"].push(this.adoptedParents[1].id); }
    }

    if (this.imageUrl && this.imageUrl !== "Default.png") { jsonObject["imageUrl"] = this.imageUrl; }
    if (this.isComplete) { jsonObject["isComplete"] = true; }
    if (this.isFavourite) { jsonObject["isFavourite"] = true; }

    if (this.stageOverride) { jsonObject["stageOverride"] = this.stageOverride; }
    if (this.ageSpansOverride) { jsonObject["ageSpansOverride"] = this.ageSpansOverride; }

    return jsonObject;
  }

  public ageSpans(globalAgeSpans: number[]) {
    if (this.ageSpansOverride) {
      return this.ageSpansOverride;
    }
    return globalAgeSpans;//[2, 7, 13, 13, 24, 24];
  }

  toggleTrait(trait: string): void {
    const index = this.traits.indexOf(trait);
    if (index > -1) {
      this.traits.splice(index, 1);
    } else {
      this.traits.push(trait);
    }
  }

  getStage(date: number, globalAgeSpans: number[]) {
    if (this.deathday !== null && this.deathday < date) {
      date = this.deathday;
    }

    let ageSpans = this.ageSpans(globalAgeSpans);
    let age = this.birthday;
    let stage: number;
    for (stage = 0; stage < ageSpans.length - 1; stage++) {
      age += ageSpans[stage];
      if (date < age) {
        break;
      }
    }

    if (this.stageOverride !== null && this.stageOverride < stage) {
      stage = this.stageOverride;
    }

    return stage;
  }
}