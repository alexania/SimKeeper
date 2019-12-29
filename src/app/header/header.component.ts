import { Component, OnInit, Output, EventEmitter, ViewEncapsulation, Input } from '@angular/core';
import { Display } from '../shared/display.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit {

  @Input() public display: Display;

  public menuCollapsed = false;
  public showAgeSpanSelect = false;

  constructor() { }

  ngOnInit() {
  }

  public toggleMenu() {
    this.menuCollapsed = !this.menuCollapsed;
    this.showAgeSpanSelect = false;
  }

  public fileLoaded(event: any) {
    this.toggleMenu();
    const file = event.target.files[0];

    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = () => {
      this.display.onLoad(JSON.parse(fileReader.result.toString()));
    }
    fileReader.onerror = (error) => {
      console.log(error);
    }
  }

  public fileSaved() {
    this.toggleMenu();
    this.display.onSave();
  }

  public gedFileLoaded(event: any) {
    this.toggleMenu();
    const file = event.target.files[0];

    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = () => {
      const input = fileReader.result.toString();
      const data = input
        .split('\n')
        .map(this.mapLine)
        .filter(function (_) { return _; });
      this.display.onGedLoad(data);
    }
    fileReader.onerror = (error) => {
      console.log(error);
    }
  }

  private mapLine(data: string) {
    var match = data.match(/\s*(0|[1-9]+[0-9]*) (@[^@]+@ |)([A-Za-z0-9_]+)( [^\n\r]*|)/);
    if (!match) return null;
    return {
      level: parseInt(match[1], 10),
      pointer: match[2].trim(),
      tag: match[3].trim(),
      data: match[4].trim()
    };
  }
}
