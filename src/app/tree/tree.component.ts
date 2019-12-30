import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, Input, ViewChild, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { hierarchy, tree, HierarchyPointNode } from 'd3-hierarchy';

import { Sim } from '../shared/sim.model';
import { Display } from '../shared/display.model';

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
    this.createTree();
  }

  public createTree() {
    d3.select("svg").remove();

    const element = this.treeElement.nativeElement;
    const rootSim = this.display.rootSim;

    const width = 720 - this.margin.right - this.margin.left;
    const height = 640 - this.margin.top - this.margin.bottom;
    const svg = d3.select(element).append("svg")
      .attr("width", width + this.margin.right + this.margin.left)
      .attr("height", height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("class", "g")
      //.attr("transform", "translate(5,5)");
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    d3.select('svg g.g')
      .append("g")
      .attr("class", "links");

    d3.select('svg g.g')
      .append("g")
      .attr("class", "nodes");
    console.log("flare inside", rootSim);
    const simTree = tree<Sim>();
    simTree.size([height, width]);

    const root = simTree(hierarchy<Sim>(rootSim));
    this.draw(root);
  }

  public closeTree() {
    this.treeClosed.emit("closeTree");
  }

  private draw(root: HierarchyPointNode<Sim>) {
    const node = d3.select("svg g.nodes")
      .selectAll("g.node")
      .data(root.descendants())
      .enter()
      .append("g")
      .classed("node", true);

    node.append("circle")
      .attr('style', "fill: steelblue;stroke: #ccc;stroke-width: 3px;")
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; })
      .attr('r', 10);

    node.append("text")
      .attr('dx', function (d) { return d.x - (d.data.name.length * 3.5); })
      .attr('dy', function (d) { return d.y - (d.children ? 15 : -25); })
      .text(d => d.data.name);

    // Links
    d3.select('svg g.links')
      .selectAll('line.link')
      .data(root.links())
      .enter()
      .append('line')
      .classed('link', true)
      .attr('style', "stroke: #ccc;stroke-width: 3px;")
      .attr('x1', function (d) { return d.source.x; })
      .attr('y1', function (d) { return d.source.y; })
      .attr('x2', function (d) { return d.target.x; })
      .attr('y2', function (d) { return d.target.y; });
  }
}
