import {
  Component,
  OnInit,
  ViewEncapsulation,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef
} from "@angular/core";

import { Display } from "../shared/display.model";
import { EventType } from "../shared/enums";
import { Tree, Node, InitialNode } from "./tree.generator";
import { TreeOptions } from "./treeOptions.model";

@Component({
  selector: "app-tree",
  templateUrl: "./tree.component.html",
  styleUrls: ["./tree.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class TreeComponent implements OnInit {
  @ViewChild("tree", { static: false }) treeElement: ElementRef;
  @Output() treeClosed = new EventEmitter();
  @Input() display: Display;
  
  public focusId: string;

  private margin = { top: 40, right: 20, bottom: 30, left: 40 };
  private focusId: string;
  private tree: Tree;

  constructor() {}

  ngOnInit() {
    this.focusId = this.display.rootSim.id;
  }

  ngAfterViewInit() {
    const data = this.createTreeData();
    this.createTree(data);
  }

  public changeFocus(element: HTMLSelectElement) {
    this.focusId = element.value;
    this.tree.changeFocus(this.focusId);
  }

  private createTree(data: InitialNode[]) {
    const element = this.treeElement.nativeElement;
    const width = element.offsetWidth;
    const height = 800;

    const options = new TreeOptions({
      target: "#tree",
      debug: true,
      height: height,
      width: width,
      nodeClick: function(node: Node) {
        this.focusId = node.simId;
        this.tree.changeFocus(node.simId);
      }.bind(this),
      textRenderer: function(name, extra, textClass) {
        // THis callback is optinal but can be used to customize
        // how the text is rendered without having to rewrite the entire node
        // from screatch.
        return "<p align='center'>" + name + "</p>";
      },
      nodeRenderer: function(
        name,
        x,
        y,
        height,
        width,
        extra,
        id,
        nodeClass,
        textClass,
        textRenderer
      ) {
        // This callback is optional but can be used to customize the
        // node element using HTML.
        let node = "";
        node += "<div ";
        node += 'style="height:100%;width:100%;" ';
        node += 'class="' + nodeClass + '" id="' + id + '">\n';
        node += textRenderer(name, extra, textClass);
        node += "</div>";
        return node;
      }
    });
    this.tree = new Tree(data, this.focusId, options);
  }

  private createTreeData() {
    const nodes: { [id: string]: InitialNode } = {};

    for (let sim of this.display.sims) {
      nodes[sim.id] = new InitialNode(sim.id, sim.name);
    }

    for (let event of this.display.events) {
      if (event.type == EventType.Birth) {
        event.parents.sort();

        let sim = event.sims[0];
        let simNode = nodes[sim.id];

        let parent1 = event.parents[0] || event.parents[1];
        let parent2 = parent1 ? event.parents[1] : null;

        if (parent1) {
          let parent1Node = nodes[parent1.id];
          if (parent1Node.children.indexOf(simNode) === -1) {
            parent1Node.children.push(simNode);
            simNode.parents.push(parent1Node);
          }
          if (parent2) {
            let parent2Node = nodes[parent2.id];
            if (parent2Node.children.indexOf(simNode) === -1) {
              parent2Node.children.push(simNode);
              simNode.parents.push(parent2Node);
            }
            if (parent1Node.spouses.indexOf(parent2Node) === -1) {
              parent1Node.spouses.push(parent2Node);
              parent2Node.spouses.push(parent1Node);
            }
          }
        }
      } else if (event.type === EventType.Marriage) {
        const spouse1 = event.sims[0];
        const spouse2 = event.sims.length > 1 ? event.sims[1] : null;

        if (spouse1 && spouse2) {
          const spouse1Node = nodes[spouse1.id];
          const spouse2Node = nodes[spouse2.id];

          if (spouse1Node.spouses.indexOf(spouse2Node) === -1) {
            spouse1Node.spouses.push(spouse2Node);
            spouse2Node.spouses.push(spouse1Node);
          }
        }
      }
    }

    return Object.keys(nodes).map(t => nodes[t]);
  }

  public closeTree() {
    this.treeClosed.emit("closeTree");
  }
}
