import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, Input, ViewChild, ElementRef } from '@angular/core';
import * as d3 from 'd3';

import { Display } from '../shared/display.model';
import { EventType } from '../shared/enums';

export class Node {
  public constructor(
    public id: string,
    public name: string,
    public index: number = 0) {
  }
}

export class Link {
  public constructor(
    public source: string,
    public target: string,
    public weight: number) { }
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
    //this.createTreeData(this.display.sims);
    this.createTree();
  }

  private getNodeMap() {
    const nodes: { [id: string]: Node } = {};
    for (let sim of this.display.sims) {
      nodes[sim.id] = new Node(sim.id, sim.name);
    }
    return nodes;
  }

  private getLinks() {
    const links: Link[] = [];

    for (let event of this.display.events) {
      if (event.type == EventType.Birth) {
        if (event.parents[0]) {
          links.push(new Link(event.parents[0].id, event.sims[0].id, 1));
        }
        if (event.parents[1]) {
          links.push(new Link(event.parents[1].id, event.sims[0].id, 1));
        }
      }
    }

    return links;
  }

  private createTree() {
    const element = this.treeElement.nativeElement;
    const width = element.offsetWidth;
    const height = 800;

    const nodeMap = this.getNodeMap();
    const nodes = Object.keys(nodeMap).map(t => nodeMap[t]);
    const links = this.getLinks();

    console.log(nodes);
    console.log(links);

    const svg = d3.select(element)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(0).strength(1))
      .force("collide", d3.forceCollide((d: any) => d.r + 8).iterations(16))
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(width / 2, height / 2));
    //.force("y", d3.forceY(0))
    //.force("x", d3.forceX(0));

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.weight));

    var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")

    node.append("circle")
      .attr("r", 5)
      .call(d3.drag()
        .on("start", function (d: any) {
          if (!d3.event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", function (d: any) {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        })
        .on("end", function (d: any) {
          if (!d3.event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append("text")
      .text(function (d) {
        return d.name;
      })
      .attr('x', 6)
      .attr('y', 3);

    node.append("title")
      .text(function (d) { return d.name; });

    simulation
      .nodes(nodes)
      .on("tick", function () {
        link
          .attr("x1", function (d: any) { return d.source.x; })
          .attr("y1", function (d: any) { return d.source.y; })
          .attr("x2", function (d: any) { return d.target.x; })
          .attr("y2", function (d: any) { return d.target.y; });

        node.attr("transform", function (d: any) {
          return "translate(" + d.x + "," + d.y + ")";
        })
      });

    // simulation.force("link")
    //   .links(links);
  }

  // private createTreeData(sims: Sim[]) {
  //   const nodes: { [id: string]: TreeNode } = {};

  //   for (let sim of sims) {
  //     nodes[sim.id] = new TreeNode(sim.id, sim.name);
  //   }

  //   for (let sim of sims) {
  //     // Do adopted parents
  //     if (!sim.parents[0] && !sim.parents[1]) {
  //       this.treeRoot.children.push(nodes[sim.id]);
  //     } else {
  //       nodes[sim.id].no_parent = false;
  //       if (sim.parents[0]) {
  //         nodes[sim.parents[0].id].children.push(nodes[sim.id]);
  //       }
  //       if (sim.parents[1]) {
  //         nodes[sim.parents[1].id].children.push(nodes[sim.id]);
  //       }
  //     }
  //   }
  // }

  public closeTree() {
    this.treeClosed.emit("closeTree");
  }
}
