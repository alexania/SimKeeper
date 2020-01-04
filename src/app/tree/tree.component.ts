import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, Input, ViewChild, ElementRef } from '@angular/core';
import * as d3 from 'd3';

import { Display } from '../shared/display.model';
import { EventType } from '../shared/enums';

export class Node {
  public index: number = 0;

  public id: string;
  public name: string;

  public type: "marriage" | "person" = "person";

  public linked = false;

  public constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class Link {
  public id: string;

  public source: string;
  public target: string;
  public weight: number;

  public type: string;

  public constructor(id: string, source: string, target: string, type: string) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.type = type;
  }
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

  private nodes: Node[] = [];
  private links: Link[] = [];

  constructor() { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.createTreeData();
    this.createTree();
  }

  private createTreeData() {
    const nodes: { [id: string]: Node } = {};

    for (let sim of this.display.sims) {
      nodes[sim.id] = new Node(sim.id, sim.name);
    }

    for (let event of this.display.events) {
      if (event.type == EventType.Birth && (event.parents[0] || event.parents[1])) {
        event.parents.sort();

        let sim = event.sims[0];
        let simNode = nodes[sim.id];
        simNode.linked = true;

        let parentNode1: Node = null;
        let parentNode2: Node = null;

        if (event.parents[0]) {
          parentNode1 = nodes[event.parents[0].id];
          if (event.parents[1]) {
            parentNode2 = nodes[event.parents[1].id];
          }
        } else {
          parentNode1 = nodes[event.parents[1].id];
        }

        parentNode1.linked = true;
        if (parentNode2) {
          parentNode2.linked = true;
        }

        if (parentNode1 && parentNode2) {
          let marriageId = `m_${parentNode1.id}` + (parentNode2 ? `_${parentNode2.id}` : '');
          let marriage = nodes[marriageId];

          if (!marriage) {
            nodes[marriageId] = marriage = new Node(marriageId, "");
            marriage.type = "marriage";
            marriage.linked = true;

            let linkId = `${parentNode1.id}_${marriage.id}`;
            if (!this.links.find(t => t.id === linkId)) {
              this.links.push(new Link(linkId, parentNode1.id, marriage.id, "parent"));
            }
            if (parentNode2) {
              linkId = `${parentNode2.id}_${marriage.id}`;
              if (!this.links.find(t => t.id === linkId)) {
                this.links.push(new Link(linkId, parentNode2.id, marriage.id, "parent"));
              }
            }
          }

          let linkId = `${marriage.id}_${simNode.id}`;
          if (!this.links.find(t => t.id === linkId)) {
            this.links.push(new Link(linkId, marriage.id, simNode.id, "child"));
          }
        } else {
          let linkId = `${parentNode1.id}_${simNode.id}`;
          if (!this.links.find(t => t.id === linkId)) {
            this.links.push(new Link(linkId, parentNode1.id, simNode.id, "child"));
          }
        }
      }
    }

    this.nodes = Object.keys(nodes).map(t => nodes[t]).filter(t => t.linked);
  }

  private createTree() {
    const element = this.treeElement.nativeElement;
    const width = element.offsetWidth;
    const height = 800;

    const nodes = this.nodes;
    const links = this.links;

    //console.log(nodes);
    //console.log(links);

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

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(0).strength(1))
      //.force("collide", d3.forceCollide((d: any) => d.r + 8).iterations(16))
      .force("charge", d3.forceManyBody().strength(-1000))
      //.force("center", d3.forceCenter(width / 2, height / 2));
      .force("y", d3.forceY())
      .force("x", d3.forceX());

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", d => d.type)
      .attr("stroke-width", 1);

    var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")

    node.filter(t => t.type === "person").append("circle")
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

  public closeTree() {
    this.treeClosed.emit("closeTree");
  }
}
