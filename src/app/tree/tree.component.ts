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

  private nodes: { [id: string]: Node };
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
    this.root.hidden = true;
    this.nodes = {};
    for (let sim of this.display.sims) {
      this.nodes[sim.id] = new Node(sim.id, sim.name);
    }
  }

  private createLinks() {
    this.links = [];

    for (let event of this.display.events) {
      if (event.type == EventType.Birth) {
        let parent1: Node;
        let parent2: Node;
        let familyId = "family";

        event.parents.sort();

        let c = event.sims[0].id;
        let child = this.nodes[c];

        if (event.parents[0]) {
          let p = event.parents[0].id;
          familyId += "_" + p;

          parent1 = this.nodes[p];
          //this.links.push(new Link(event.parents[0].id, event.sims[0].id));
        }

        if (event.parents[1]) {
          let p = event.parents[1].id;
          familyId += "_" + p;

          if (!parent1) {
            parent1 = this.nodes[p];
          } else {
            parent2 = this.nodes[p];
          }
          //this.links.push(new Link(event.parents[1].id, event.sims[0].id));
        }

        if (parent1) {
          let m = this.nodes[familyId];

          if (!m) {
            m = new Node(familyId, familyId);
            m.hidden = true;
            this.nodes[familyId] = m;
          }

          if (parent1.children.indexOf(m) === -1) {
            parent1.children.push(m);
            m.parent = parent1;
            this.links.push(new Link(parent1.id, familyId));
          }

          if (parent2) {
            parent1.depth = parent1.depth || parent2.depth || 1;
            parent2.depth = parent2.depth || parent1.depth;

            if (m.children.indexOf(parent2) === -1) {
              m.children.push(parent2);
              parent2.parent = m;
              this.links.push(new Link(parent2.id, familyId));
            }
            m.depth = Math.max(parent1.depth, parent2.depth)
            child.depth = m.depth + 1;
            
          } else {
            m.depth = parent1.depth;
            child.depth = m.depth + 1;
            parent1.depth = parent1.depth || 1;
          }

          if (m.children.indexOf(child) === -1) {
            m.children.push(child);
          }
          child.parent = m;
          this.links.push(new Link(familyId, child.id));
        }
      }
    }

    Object.keys(this.nodes).map(t => this.nodes[t]).filter(t => t.parent === null).forEach(function (t) { t.parent = this.root; this.root.children.push(t); }.bind(this));
  }

  private createTree() {
    const element = this.treeElement.nativeElement;
    const width = element.offsetWidth;
    const height = 800;

    var zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', function () {
        svg.attr('transform', d3.event.transform.translate(width / 2, this.margin.top));
      }.bind(this));

    const svg = d3.select(element)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(zoom)
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + this.margin.top + ')');

    const root = d3.hierarchy(this.root);
    const tree = d3.cluster<Node>().size([height, width]);

    tree.separation(function separation(a, b) {
      if (a.data.hidden || b.data.hidden) {
        return 0.4;
      } else {
        return 0.6;
      }
    });

    const a = tree(root);
    console.log(root);
    console.log(a.descendants().map(t => t.data.id + "-" + t.depth + "-" + t.data.depth));

    var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(a.descendants())
      .enter().append("g");

    const visibleNode = node.filter(t => !t.data.hidden);
    node.append("circle")
      .attr('style', "fill: steelblue;stroke: #ccc;stroke-width: 3px;")
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.data.depth * 200; })
      .attr('r', 10);

    node.append("text")
      .text(function (d: any) {
        return d.data.name;
      })
      .attr('x', function (d) { return d.x + 10; })
      .attr('y', function (d) { return d.data.depth * 200 - 10; });

    visibleNode.append("title")
      .text(function (d: any) { return d.data.name; });
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

  public children: Node[] = [];
  public parent: Node = null;

  public depth: number;
  public hidden = false;

  public constructor(id: string, name: string, depth: number = null) {
    this.id = id;
    this.name = name;
    this.depth = depth;
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
