import { Component, OnInit, ViewEncapsulation, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HelpComponent implements OnInit {

  @Output() helpClosed = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  public closeHelp() {
    this.helpClosed.emit("closeHelp");
  }
}
