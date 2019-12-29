import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { Sim } from 'src/app/shared/sim.model';

@Component({
  selector: 'app-traits',
  templateUrl: './traits.component.html',
  styleUrls: ['./traits.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TraitsComponent implements OnInit {

  @Input() public sim: Sim;

  public traitOptions = ["Active", "Alluring", "Ambitious", "Art Lover", "Bookworm", "Bro", "Business Savvy",
    "Cat Lover", "Cheerful", "Childish", "Clumsy", "Collector", "Creative", "Dastardly", "Dog Lover", "Domestic",
    "Essence of Flavor", "Evil", "Family-Oriented", "Foodie", "Geek", "Genius", "Gloomy",
    "Glutton", "Good", "Goofball", "Gregarious", "Hates Children", "High Metabolism", "Home Turf",
    "Hot-Headed", "Insane", "Jealous", "Kleptomaniac", "Lazy", "Loner", "Loves Outdoors", "Materialistic",
    "Mean", "Muser", "Music Lover", "Neat", "Noncommittal", "Outgoing", "Perfectionist",
    "Quick Learner", "Romantic", "Self-Absorbed", "Self-Assured", "Slob", "Snob", "Unflirty", "Vegetarian"];

  constructor() { }

  ngOnInit() {
  }

  focusField(fieldDisplay: HTMLSpanElement, fieldInput: HTMLDivElement) {
    fieldDisplay.style.display = "none";
    fieldInput.style.display = "inline";
    window.onmousedown = function (event: any) {
      if (!fieldInput.contains(event.target)) {
        window.onmousedown = null;
        fieldDisplay.style.display = "inline";
        fieldInput.style.display = "none";
      }
    }
  }
}
