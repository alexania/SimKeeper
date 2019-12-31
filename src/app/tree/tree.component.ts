import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, Input, ViewChild, ElementRef } from '@angular/core';

import { Display } from '../shared/display.model';
import { EventType } from '../shared/enums';

declare var dTree: any;

export class Node {
  public constructor(
    public name: string,
    public marriages: Marriage[] = [],
    public children: Node[] = []
  ) { }
}

export class Marriage {
  public constructor(
    public spouse: Node
  ) { }
}

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

  constructor() { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    const data = this.createTreeData();
    console.log(data);
    this.createTree(data);
  }

  private createTree(data: Node[]) {
    const element = this.treeElement.nativeElement;
    const width = element.offsetWidth;
    const height = 800;

    dTree.init(data, {
      target: "#tree",
      debug: true,
      height: height,
      width: width,
      nodeClick: function(name, extra) {
        console.log(name);
      },
      textRenderer: function(name, extra, textClass) {
        // THis callback is optinal but can be used to customize
        // how the text is rendered without having to rewrite the entire node
        // from screatch.
        console.log(name);
        return "<p align='center'>" + name + "</p>";
      },
      nodeRenderer: function (name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer) {
        // This callback is optional but can be used to customize the
        // node element using HTML.
        console.log(name);
        let node = '';
        node += '<div ';
        node += 'style="height:100%;width:100%;" ';
        node += 'id="' + id + '">\n';
        node += textRenderer(name, extra, textClass);
        node += '</div>';
        return node;
      }
    });
  }

  private createTreeData() {
    const nodes: { [id: string]: Node } = {};
    const data: Node[] = [];

    for (let sim of this.display.sims) {
      nodes[sim.id] = new Node(sim.name);
    }

    for (let event of this.display.events) {
      if (event.type == EventType.Birth) {

        let sim = event.sims[0];
        let simNode = nodes[sim.id];

        if (!sim.parents[0] && !sim.parents[1]) {
          if (!data.find(t => t.name === simNode.name)) {
            data.push(simNode);
          }
        } else {
          let parentNode1: Node = null;
          let parentNode2: Node = null;
          if (sim.parents[0]) {
            parentNode1 = nodes[sim.parents[0].id];
            if (!parentNode1.children.find(t => t.name === simNode.name)) {
              parentNode1.children.push(simNode);
            }
          }
          if (sim.parents[1]) {
            parentNode2 = nodes[sim.parents[1].id];
            if (parentNode1) {
              if (!parentNode1.marriages.find(t => t.spouse.name === parentNode2.name)) {
                parentNode1.marriages.push(new Marriage(parentNode2));
              }
            } else {
              if (!parentNode2.children.find(t => t.name === simNode.name)) {
                parentNode2.children.push(simNode);
              }
            }
          }
        }
      }
    }

    return data.filter(t => t.children.length > 0 || t.marriages.length > 0);
  }


  public closeTree() {
    this.treeClosed.emit("closeTree");
  }
}
