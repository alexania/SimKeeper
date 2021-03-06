import { Component, OnInit, Input, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { Sim } from 'src/app/shared/sim.model';
import { Stage, Career, Place, EventType } from 'src/app/shared/enums';
import { Display } from 'src/app/shared/display.model';

@Component({
  selector: 'app-record',
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class RecordComponent implements OnInit {

  @Input() public display: Display;
  @Input() public sim: Sim;

  public collapsed = true;
  public ageSpans: number[] = null;

  public stageOptions = Object.keys(Stage).filter(t => t === "0" || +t).map(t => { return { key: t, value: Stage[t] }; });
  public careerOptions = Object.keys(Career).map(t => { return { key: t, value: Career[t] } });
  public placeOptions = Object.keys(Place).map(t => { return { key: t, value: Place[t] } });

  constructor() { }

  ngOnInit() {
    this.display.setDatingFromEvents(this.sim);
    this.display.setSpouseFromEvents(this.sim);
  }

  uploadNewImage(input: HTMLInputElement) {
    if (input.value) {
      const parts = input.value.split("\\");
      console.log(parts);
      this.sim.imageUrl = parts[parts.length - 1];
    } else {
      this.sim.imageUrl = "Default.png";
    }
  }

  onClickAgeSpans() {
    if (this.ageSpans) {
      this.ageSpans = null;
    } else {
      this.ageSpans = this.sim.ageSpans(this.display.globalAgeSpans);
    }
  }

  getSimStage() {
    return this.sim.getStage(this.display.currentDay, this.display.globalAgeSpans);
  }

  getShortString() {
    let r = `<img src="./assets/img/stages/Transparent_${this.getCurrentStageString()}.png" class="stage-image" height="30px" title="${this.getCurrentStageString()}" />`;
    r += `Born on Day ${this.sim.birthday} to `;
    if (this.sim.adoptedParents) {
      r += `${this.display.linkSim(this.sim.adoptedParents[0])} & ${this.display.linkSim(this.sim.adoptedParents[1])}`;
    } else {
      r += `${this.display.linkSim(this.sim.parents[0])} & ${this.display.linkSim(this.sim.parents[1])}`;
    }
    if (this.sim.deathday !== null) {
      const stage = this.getCurrentStageString();
      r += `<br/>Died on Day ${this.sim.deathday} at stage ${stage}`;
    }
    return r;
  }

  private getCurrentStageString() {
    return Stage[this.getSimStage()];
  }

  deleteSim() {
    const id = this.display.sims.indexOf(this.sim);
    if (id > -1) {
      const deleteSim = window.confirm(`Are you sure you want to permanently delete ${this.sim.name}?`);
      if (deleteSim) {
        for (let event of this.display.events) {
          let eventSimId = event.sims.indexOf(this.sim);
          if (eventSimId > -1) {
            if (event.sims.length === 1) {
              const eventId = this.display.events.indexOf(event);
              if (eventId > -1) {
                this.display.events.splice(eventId, 1);
              }
            } else {
              event.sims.splice(eventSimId, 1);
              event.setId();
            }
          } else if (event.parents) {
            let parentId = event.parents.indexOf(this.sim);
            if (parentId > -1) {
              event.parents.splice(parentId, 1);
              event.setId();

              const childSim = event.sims[0];
              console.log(childSim);
              parentId = childSim.parents.indexOf(this.sim);
              if (parentId > -1) {
                console.log("Id: " + parentId);
                childSim.parents[parentId] = null;
              } else {
                parentId = childSim.adoptedParents.indexOf(this.sim);
                childSim.adoptedParents[parentId] = null;
              }
            }
          }
        }
        this.display.sims.splice(id, 1);
      }
    }
  }

  changeId(input: HTMLInputElement) {
    const newId = input.value;
    if (newId !== this.sim.id) {
      // Check for duplicates
      const duplicateSim = this.display.findSim(newId);
      if (duplicateSim) {
        window.alert(`A sim with an Id of ${newId} (${duplicateSim.name}) already exists.`);
        return;
      }
      // Id
      this.sim.id = newId;
    }
  }

  changeRootSim(checkbox: HTMLInputElement) {
    if (checkbox.checked) {
      this.display.rootSim = this.sim;
    }
  }

  changeStage(stageInput: HTMLSelectElement) {
    const newStage = stageInput.value;
    if (newStage === "") {
      this.sim.stageOverride = null;
    } else {
      this.sim.stageOverride = +newStage;
    }
  }

  changeAgeSpan(spanIndex: number, event: any) {
    const newSpan = +event.target.value;
    let ageSpans = this.sim.ageSpans(this.display.globalAgeSpans);
    if (ageSpans[spanIndex] !== newSpan) {
      this.sim.ageSpansOverride = ageSpans;
      this.sim.ageSpansOverride[spanIndex] = newSpan;

      if (this.sim.ageSpansOverride[0] === this.display.globalAgeSpans[0] &&
        this.sim.ageSpansOverride[1] === this.display.globalAgeSpans[1] &&
        this.sim.ageSpansOverride[2] === this.display.globalAgeSpans[2] &&
        this.sim.ageSpansOverride[3] === this.display.globalAgeSpans[3] &&
        this.sim.ageSpansOverride[4] === this.display.globalAgeSpans[4] &&
        this.sim.ageSpansOverride[5] === this.display.globalAgeSpans[5]) {
        this.sim.ageSpansOverride = null;
      }
    }
  }

  changeBirthday(birthdayInput: HTMLInputElement) {
    const newBirthday = +birthdayInput.value;
    if (this.sim.birthday !== newBirthday) {
      this.display.changeBirthday(this.sim, newBirthday);
    }
  }
}
