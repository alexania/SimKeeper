import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  @Output() public simsLoaded = new EventEmitter();
  @Output() public simsSaved = new EventEmitter();

  public menuCollapsed = false;

  constructor() { }

  ngOnInit() {
  }

  public toggleMenu() {
    this.menuCollapsed = !this.menuCollapsed;
  }

  public fileLoaded(event:any) {
    this.toggleMenu();
    const file = event.target.files[0];
    
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = () => {
      this.simsLoaded.emit(JSON.parse(fileReader.result.toString()));
    }
    fileReader.onerror = (error) => {
      console.log(error);
    }
  }

  public fileSaved() {
    this.toggleMenu();
    this.simsSaved.emit();
  }

}
