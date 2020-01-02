import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, Input, ViewChild, ElementRef } from '@angular/core';
import * as d3 from 'd3';

import { Display } from '../shared/display.model';
import { EventType } from '../shared/enums';

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TreeComponent implements OnInit {

  @ViewChild("tree", { static: false }) treeElement: ElementRef;
  @Output() treeClosed = new EventEmitter();
  @Input() display: Display;

  private margin = { top: 40, right: 20, bottom: 30, left: 40 };

  private nodes: Node[];
  private links: Link[];

  private root: Node;

  constructor() { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    if (this.display.sims.length > 0) {
      this.createNodes();
      this.createLinks();
      this.createTree();
    }
  }

  private createNodes() {
    this.root = new Node("root", "");
    this.nodes = [];
    for (let sim of this.display.sims) {
      this.nodes[sim.id] = new Node(sim.id, sim.name);
    }
  }

  private createLinks() {
    this.links = [];

    for (let event of this.display.events) {
      if (event.type == EventType.Birth) {
        let parent1:Node;
        let parent2:Node;
        let familyId = "family";

        event.parents.sort();

        let c = event.sims[0].id;
        let child = this.nodes.find(t => t.id === c);

        if (event.parents[0]) {
          let p = event.parents[0].id;
          familyId += "_" + p;

          parent1 = this.nodes.find(t => t.id === p);
          //this.links.push(new Link(event.parents[0].id, event.sims[0].id));
        }

        if (event.parents[1]) {
          let p = event.parents[1].id;
          familyId += "_" + p;

          parent2 = this.nodes.find(t => t.id === p);
          //this.links.push(new Link(event.parents[1].id, event.sims[0].id));
        }

        if (parent1 && parent2) {
          let m = this.nodes.find(t => t.id === familyId);
          if (!m) {
            m = new Node(familyId, "")
            this.nodes.push(m);
          }

          this.links.push(new Link(parent1.id, familyId));   
          this.links.push(new Link(parent2.id, familyId));
          this.links.push(new Link(familyId, child.id));   

        } else {
          if (parent1) {
            this.links.push(new Link(parent1.id, child.id));
          }
          if (parent2) {
            this.links.push(new Link(parent2.id, child.id));
          }
        }
      }
    }
  }

  private createTree() {
    const element = this.treeElement.nativeElement;
    const width = element.offsetWidth;
    const height = 800;

    //console.log(this.nodes);
    //console.log(this.links);

    const svg = d3.select(element)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const root = d3.hierarchy(this.display.rootSim);
    const tree = d3.tree();
    const a = tree(root);
    console.log(a.descendants());
  }

  public closeTree() {
    this.treeClosed.emit("closeTree");
  }
}

export class Node {
  public id: string;
  public name: string;

  public type: "person" | "family";
  public index: number = 0;

  public constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class Link {
  public source: string;
  public target: string;
  public weight: number = 1;

  public constructor(source: string, target: string) {
    this.source = source;
    this.target = target;
  }
}
