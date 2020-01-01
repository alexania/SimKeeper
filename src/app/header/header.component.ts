import { Component, OnInit, Output, ViewEncapsulation, Input, EventEmitter } from '@angular/core';
import { Display } from '../shared/display.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit {

  @Output() showDialog = new EventEmitter();
  @Input() public display: Display;

  public menuCollapsed = false;
  public showAgeSpanSelect = false;

  constructor() { }

  ngOnInit() {
  }

  public toggleMenu(state: boolean) {
    this.menuCollapsed = state;
    this.showAgeSpanSelect = false;
  }

  public fileLoaded(event: any) {
    this.toggleMenu(false);
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
    this.toggleMenu(false);
    this.display.onSave();
  }

  public confirmGedLoad(event: any, gedFileInput: HTMLInputElement) {
    event.preventDefault();
    this.toggleMenu(false);
    const overwrite = window.confirm(`WARNING! This will overwrite all existing records, are you sure you want to continue?`);
    if (overwrite) {
      gedFileInput.onchange = this.gedFileLoaded.bind(this);
      gedFileInput.click();
    }
  }

  public gedFileLoaded(event: any) {
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

  public showHelp() {
    this.toggleMenu(false);
    this.showDialog.emit("showHelp");
  }

  public showTree() {
    this.toggleMenu(false);
    this.showDialog.emit("showTree");
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