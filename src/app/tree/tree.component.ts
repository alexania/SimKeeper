import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, Input, ViewChild, ElementRef } from '@angular/core';

import { Display } from '../shared/display.model';
import { EventType } from '../shared/enums';
import { Node, Marriage, Tree, TreeOptions } from './tree.generator';

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
    console.log("Data", data);
    this.createTree(data);
  }

  private createTree(data: Node[]) {
    const element = this.treeElement.nativeElement;
    const width = element.offsetWidth;
    const height = 800;

    const options = new TreeOptions({
      target: "#tree",
      debug: true,
      height: height,
      width: width,
      nodeClick: function (name, extra, id) {
        console.log(name);
      },
      textRenderer: function (name, extra, textClass) {
        // THis callback is optinal but can be used to customize
        // how the text is rendered without having to rewrite the entire node
        // from screatch.
        return "<p align='center'>" + name + "</p>";
      },
      nodeRenderer: function (name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer) {
        // This callback is optional but can be used to customize the
        // node element using HTML.
        let node = '';
        node += '<div ';
        node += 'style="height:100%;width:100%;" ';
        node += 'id="' + id + '">\n';
        node += textRenderer(name, extra, textClass);
        node += '</div>';
        return node;
      }
    });
    const tree = new Tree(data, options);
  }

  private createTreeData() {
    const nodes: { [id: string]: Node } = {};
    const data: Node[] = [];

    for (let sim of this.display.sims) {
      nodes[sim.id] = new Node(sim.name);
      nodes[sim.id].stringId = sim.id;
      nodes[sim.id].noParent = true;
    }

    for (let event of this.display.events) {
      if (event.type == EventType.Birth) {
        event.parents.sort();

        let sim = event.sims[0];
        let simNode = nodes[sim.id];

        if (!sim.parents[0] && !sim.parents[1]) {
          if (!data.find(t => t.stringId === simNode.stringId)) {
            data.push(simNode);
          }
        } else {
          let parentNode1: Node = null;
          let parentNode2: Node = null;

          if (sim.parents[0]) {
            parentNode1 = nodes[sim.parents[0].id];
            if (sim.parents[1]) {
              parentNode2 = nodes[sim.parents[1].id];
            }
          } else {
            parentNode1 = nodes[sim.parents[1].id];
          }

          if (parentNode2) {
            if (parentNode1.noParent && !parentNode2.noParent)
            {
              let p = parentNode1;
              parentNode1 = parentNode2;
              parentNode2 = p;
            }

            let marriage = parentNode1.marriages.find(t => t.spouse.stringId === parentNode2.stringId);
            if (!marriage) {
              marriage = parentNode2.marriages.find(t => t.spouse.stringId === parentNode1.stringId);
            }
            if (!marriage) {
              parentNode2.noParent = false;
              marriage = new Marriage(parentNode2);
              parentNode1.marriages.push(marriage);
            }
            if (!marriage.children.find(t => t.stringId === simNode.stringId)) {
              simNode.noParent = false;
              marriage.children.push(simNode);
            }
          } else {
            if (!parentNode1.children.find(t => t.stringId === simNode.stringId)) {
              simNode.noParent = false;
              parentNode1.children.push(simNode);
            }
          }
        }
      }
    }

    return data.filter(t => t.noParent);
  }


  public closeTree() {
    this.treeClosed.emit("closeTree");
  }
}
