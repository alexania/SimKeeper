import { TreeLayout, HierarchyNode, HierarchyPointLink, HierarchyPointNode, ZoomBehavior } from 'd3';
import { Link, Node } from './tree.generator';
import { TreeOptions } from './treeOptions.model';
import * as d3 from 'd3';

export class TreeBuilder {
  public svg: any;
  public g: any;
  public tree: TreeLayout<Node>;

  public zoom: ZoomBehavior<Element, unknown>;

  public root: HierarchyNode<Node>;
  public links: HierarchyPointLink<Node>[];

  public siblings: Link[];
  public options: TreeOptions;

  public allNodes: HierarchyNode<Node>[];

  public nodeSize: [number, number];
  public focusId: string;

  public constructor(
    focusId: string,
    root: HierarchyNode<Node>,
    siblings: Link[],
    options: TreeOptions
  ) {
    this.focusId = focusId;
    this.root = root;
    this.links = [];

    this.siblings = siblings;
    this.options = options;

    // flatten nodes
    this.allNodes = this.flatten(this.root);

    // Calculate node size
    const visibleNodes = this.allNodes.filter(t => !t.data.hidden);
    this.nodeSize = options.getNodeSize(
      visibleNodes,
      options.nodeWidth,
      options.textRenderer
    );
  }

  public recreate() {
    console.log("Recreate", this.root);
    console.log(this.siblings);
    this.allNodes = this.flatten(this.root);

    const visibleNodes = this.allNodes.filter(t => !t.data.hidden);
    this.nodeSize = this.options.getNodeSize(
      visibleNodes,
      this.options.nodeWidth,
      this.options.textRenderer
    );

    this.update(this.root);
  }

  public create() {
    console.log("Create", this.root);
    console.log(this.siblings);

    const opts = this.options;
    const nodeSize = this.nodeSize;

    const width = opts.width + opts.margin.left + opts.margin.right;
    const height = opts.height + opts.margin.top + opts.margin.bottom;

    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", function () {
        this.g.attr("transform", d3.event.transform);
      }.bind(this));

    //make an SVG
    this.svg = d3
      .select(opts.target)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(this.zoom);

    this.g = this.svg.append("g");

    // Compute the layout.
    this.tree = d3
      .tree<Node>()
      .nodeSize([
        nodeSize[0] * 2,
        opts.nodeHeightSeperation(nodeSize[0], nodeSize[1])
      ]);

    this.tree.separation(function separation(a, b) {
      if (a.data.hidden || b.data.hidden) {
        return 0.4;
      } else {
        return 0.6;
      }
    });

    this.update(this.root);
  }

  public static nodeHeightSeperation(nodeWidth: number, nodeMaxHeight: number) {
    return nodeMaxHeight + 50;
  }

  public static getNodeSize(
    nodes: HierarchyNode<Node>[],
    width: number,
    textRenderer
  ): [number, number] {
    var maxWidth = 0;
    var maxHeight = 0;
    var tmpSvg = document.createElement("svg");
    document.body.appendChild(tmpSvg);

    nodes.map(function (n) {
      var container = document.createElement("div");
      container.setAttribute("class", n.data["class"]);
      container.style.visibility = "hidden";
      container.style.maxWidth = width + "px";

      var text = textRenderer(n.data.name, n.data.extra, n.data.textClass);
      container.innerHTML = text;

      tmpSvg.appendChild(container);
      var height = container.offsetHeight;
      tmpSvg.removeChild(container);

      maxHeight = Math.max(maxHeight, height);
      n.data.height = height;
      if (n.data.hidden) {
        n.data.width = 0;
      } else {
        n.data.width = width;
      }
    });
    document.body.removeChild(tmpSvg);

    return [width, maxHeight];
  }

  public static nodeRenderer(
    name: string,
    x: number,
    y: number,
    height: number,
    width: number,
    extra: any,
    id: number,
    nodeClass: string,
    textClass: string,
    textRenderer: any
  ) {
    var node = "";
    node += "<div ";
    node += 'style="height:100%;width:100%;" ';
    node += 'class="' + nodeClass + '" ';
    node += 'id="node' + id + '">\n';
    node += textRenderer(name, extra, textClass);
    node += "</div>";
    return node;
  }

  public static textRenderer(name: string, extra: any, textClass: string) {
    var node = "";
    node += "<p ";
    node += 'align="center" ';
    node += 'class="' + textClass + '">\n';
    node += name;
    node += "</p>\n";
    return node;
  }

  private update(source: HierarchyNode<Node>) {
    var opts = this.options;
    var nodeSize = this.nodeSize;

    var treenodes = this.tree(source);

    const focus = this.allNodes.find(t => t.data.nodeId === this.focusId) as HierarchyPointNode<Node>;
    if (focus) {
      //console.log(opts);
      //console.log(focus.x + ", "+ focus.y);
      this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity.translate(opts.width / 2 - focus.x, opts.height / 2 - focus.y));
    }

    var links = treenodes.links();

    // Create the link lines.
    this.g.selectAll("path").remove();
    this.g.selectAll("foreignObject").remove();
    
    this.g
      .selectAll(".link")
      .data(links)
      .enter()
      // filter links with no parents to prevent empty nodes
      .filter(function (l) {
        return !l.target.data.noParent;
      })
      .append("path")
      .attr("class", opts.styles.linage)
      .attr("d", this.elbow);

    var nodes = this.g
      .selectAll(".node")
      .data(treenodes.descendants())
      .enter();

    this.linkSiblings();

    // Draw siblings (marriage)
    this.g
      .selectAll(".sibling")
      .data(this.links)
      .enter()
      .append("path")
      .attr("class", opts.styles.marriage)
      .attr("d", this.siblingLine.bind(this));

    // Create the node rectangles.
    nodes
      .append("foreignObject")
      .filter((d: any) => !d.data.hidden)
      .attr("x", function (d: any) {
        let x = Math.round(d.x - d.data.width / 2);
        return x + "px";
      })
      .attr("y", (d: any) => Math.round(d.y - d.data.height / 2) + "px")
      .attr("width", (d: any) => d.data.width + "px")
      .attr("height", (d: any) => d.data.height + "px")
      .attr("class", "node")
      .attr("id", (d: any) => d.id)
      .html((d: any) =>
        opts.nodeRenderer(
          d.data.name,
          d.x,
          d.y,
          nodeSize[0],
          nodeSize[1],
          d.data.extra,
          d.data.id,
          d.data.nodeId === this.focusId ? "focused" : "",
          d.data.textClass,
          opts.textRenderer
        )
      )
      .on("click", function (d: HierarchyPointNode<Node>) {
        if (d.data.hidden) {
          return;
        }
        opts.nodeClick(d.data);
      });
  }

  private elbow(d: any) {
    if (d.target.data.noParent) {
      return "M0,0L0,0";
    }
    var ny = Math.round(d.target.y + (d.source.y - d.target.y) * 0.66);

    var linedata: [number, number][] = [
      [d.target.x, d.target.y],
      [d.target.x, ny],
      [d.source.x, d.source.y]
    ];

    var fun = d3
      .line()
      .curve(d3.curveStepAfter)
      .x((d: any) => d[0])
      .y((d: any) => d[1]);

    return fun(linedata);
  }

  private linkSiblings() {
    const allNodes = this.allNodes;
    this.links = [];

    for (let d of this.siblings) {
      const start = allNodes.find(t => +d.source === t.data.id) as HierarchyPointNode<Node>;
      const end = allNodes.find(t => +d.target === t.data.id) as HierarchyPointNode<Node>;

      const link = {
        source: { id: d.source, x: start.x, y: start.y, marriageNode: null },
        target: { id: d.target, x: end.x, y: end.y, marriageNode: null },
        number: d.number
      };

      const marriageId =
        start.data.marriageNode != null
          ? start.data.marriageNode.id
          : end.data.marriageNode.id;
      const marriageNode = allNodes.find(function (n) {
        return n.data.id == marriageId;
      });

      link.source.marriageNode = marriageNode;
      link.target.marriageNode = marriageNode;

      this.links.push((link as unknown) as HierarchyPointLink<Node>);
    }
  }

  private siblingLine(d: any) {
    var ny = Math.round(d.target.y + (d.source.y - d.target.y) * 0.5);
    var nodeWidth = this.nodeSize[0];
    var nodeHeight = this.nodeSize[1];

    // Not first marriage
    if (d.number > 1) {
      ny -= Math.round(nodeHeight);
    }

    var linedata: [number, number][] = [
      [d.source.x, d.source.y],
      [Math.round(d.source.x + (nodeWidth * 8) / 10), d.source.y],
      [Math.round(d.source.x + (nodeWidth * 8) / 10), ny],
      [d.target.marriageNode.x, ny],
      [d.target.marriageNode.x, d.target.y],
      [d.target.x, d.target.y]
    ];

    var fun = d3
      .line()
      .curve(d3.curveStepAfter)
      .x((d: any) => d[0])
      .y((d: any) => d[1]);

    return fun(linedata);
  }

  private flatten(root: HierarchyNode<Node>) {
    var n: HierarchyNode<Node>[] = [];
    var i = 0;

    this.recurse(i, n, root);
    return n;
  }

  private recurse(
    i: number,
    nodes: HierarchyNode<Node>[],
    node: HierarchyNode<Node>
  ) {
    if (node.children) {
      for (let child of node.children) {
        i = this.recurse(i, nodes, child);
      }
    }

    // if (!node.data.id) {
    //   node.data.id = ++i;
    // }

    nodes.push(node);

    return i;
  }
}