import * as d3 from "d3";
import {
  HierarchyNode,
  TreeLayout,
  HierarchyPointNode,
  HierarchyPointLink,
  ZoomBehavior
} from "d3";
import { TreeOptions } from "./treeOptions.model";

export class Node {
  public id: number;

  public stringId: string;
  public name: string;

  public children: Node[] = [];

  public noParent = false;
  public hidden = false;

  public extra: any;
  public textClass: string;

  public marriageNode: Node;

  public width: number;
  public height: number;

  public parent: Node = null;

  public constructor(
    stringId: string,
    name: string,
    id: number = 0,
    hidden = false,
    noParent = false
  ) {
    this.id = id;
    this.stringId = stringId;
    this.name = name;

    this.hidden = hidden;
    this.noParent = noParent;
  }
}

export class Link {
  public source: number;
  public target: number;
  public number: number;
}

export class InitialNode {
  public id: string;
  public name: string;

  public parents: InitialNode[] = [];
  public spouses: InitialNode[] = [];
  public children: InitialNode[] = [];

  public extra: any;
  public textClass: string;

  public constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class Tree {
  public numNodes: number;
  public root: Node;
  public siblings: Link[] = [];
  public options: TreeOptions;

  public data: InitialNode[];
  public processedNodes: { [id: string]: Node } = {};

  public treeBuilder: TreeBuilder;

  public constructor(
    data: InitialNode[],
    focusId: string,
    options: TreeOptions
  ) {
    var processedData = this.preprocess(data, focusId, options);
    console.log(processedData);

    this.treeBuilder = new TreeBuilder(
      processedData.root,
      processedData.siblings,
      options
    );

    this.treeBuilder.create();
  }

  public changeFocus(id: string) {
    this.root.children = [];
    this.constructTreeFromFocus(this.data, id);

    var processedData = {
      root: d3.hierarchy(this.root),
      siblings: this.siblings
    };

    this.treeBuilder.root = processedData.root;
    this.treeBuilder.siblings = processedData.siblings;
    this.treeBuilder.recreate();
  }

  private incrementIndex() {
    return this.numNodes++;
  }

  private preprocess(
    data: InitialNode[],
    focusId: string,
    options: TreeOptions
  ) {
    this.numNodes = 0;
    this.data = data;

    this.root = new Node("root", "", this.incrementIndex());
    this.root.hidden = true;

    this.options = options;

    this.constructTreeFromFocus(data, focusId);

    return {
      root: d3.hierarchy(this.root),
      siblings: this.siblings
    };
  }

  private constructTreeFromFocus(data: InitialNode[], focusId: string) {
    let focus = data.find(t => t.id === focusId) || data[0];
    let ancestors: InitialNode[] = [];

    this.findAncestors(ancestors, focus);
    ancestors.forEach(t => this.reconstructTree(t, null));
  }

  private findAncestors(ancestors: InitialNode[], node: InitialNode) {
    if (node.parents.length === 0) {
      if (ancestors.indexOf(node) === -1) {
        for (let spouse of node.spouses) {
          if (ancestors.indexOf(spouse) > -1) {
            return;
          }
        }
        ancestors.push(node);
      }
    } else {
      for (let parent of node.parents) {
        for (let spouse of node.spouses) {
          let i = ancestors.indexOf(spouse);
          if (i > -1) {
            ancestors.splice(i, 1);
          }
        }
        this.findAncestors(ancestors, parent);
      }
    }
  }

  private reconstructTree(person: InitialNode, parent: Node) {
    let node = this.processedNodes[person.id];
    if (node) {
      if (node.parent.children.indexOf(node) === -1) {
        node.parent.children.push(node);
      }
    } else {
      node = new Node(person.id, person.name, this.incrementIndex());
      node.extra = person.extra;
      node.textClass = person.textClass || this.options.styles.text;
      node["class"] = person["class"] || this.options.styles.node;

      this.processedNodes[person.id] = node;

      node.parent = parent || this.root;
      if (node.parent == this.root) {
        node.noParent = true;
      }
      node.parent.children.push(node);

      //this.sortPersons(person.children);

      let i = 1;
      // add "direct" children
      for (let child of person.children) {
        let otherParent = child.parents.find(t => t.id !== person.id);
        if (otherParent) {
          let mId = "m_" + node.id + "_" + otherParent.id;
          let m = node.parent.children.find(t => t.stringId === mId);
          if (!m) {
            m = new Node(mId, "Marriage", this.incrementIndex(), true, true);
            m.stringId = mId;

            const spouse = new Node(
              otherParent.id,
              otherParent.name,
              this.incrementIndex()
            );
            spouse.noParent = true;
            spouse.textClass = spouse.textClass || this.options.styles.text;
            spouse["class"] = spouse["class"] || this.options.styles.node;
            spouse.marriageNode = m;

            node.parent.children.push(m);
            node.parent.children.push(spouse);

            this.siblings.push({
              source: node.id,
              target: spouse.id,
              number: i++
            });
          }
          this.reconstructTree(child, m);
        } else {
          this.reconstructTree(child, node);
        }
      }
    }
    return node;
  }

  private sortPersons(persons: Node[]) {
    if (persons) {
      persons.sort((a, b) =>
        this.options.nodeSorter(a.name, a.extra, b.name, b.extra)
      );
    }
    return persons;
  }
}

export class TreeBuilder {
  public svg: any;
  public tree: TreeLayout<Node>;

  public root: HierarchyNode<Node>;
  public links: HierarchyPointLink<Node>[];

  public siblings: Link[];
  public options: TreeOptions;

  public allNodes: HierarchyNode<Node>[];

  public nodeSize: [number, number];

  public constructor(
    root: HierarchyNode<Node>,
    siblings: Link[],
    options: TreeOptions
  ) {
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
    const opts = this.options;
    const nodeSize = this.nodeSize;

    const width = opts.width + opts.margin.left + opts.margin.right;
    const height = opts.height + opts.margin.top + opts.margin.bottom;

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", function() {
        svg.attr(
          "transform",
          d3.event.transform.translate(width / 2, opts.margin.top)
        );
      });

    //make an SVG
    const svg = (this.svg = d3
      .select(opts.target)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(zoom)
      .append("g")
      .attr(
        "transform",
        "translate(" + width / 2 + "," + opts.margin.top + ")"
      ));

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

    nodes.map(function(n) {
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

    var links = treenodes.links();

    // Create the link lines.
    this.svg
      .selectAll(".link")
      .data(links)
      .enter()
      // filter links with no parents to prevent empty nodes
      .filter(function(l) {
        return !l.target.data.noParent;
      })
      .append("path")
      .attr("class", opts.styles.linage)
      .attr("d", this.elbow);

    var nodes = this.svg
      .selectAll(".node")
      .data(treenodes.descendants())
      .enter();

    this.linkSiblings();

    // Draw siblings (marriage)
    this.svg
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
      .attr("x", function(d: any) {
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
          d.data["class"],
          d.data.textClass,
          opts.textRenderer
        )
      )
      .on("click", function(d: any) {
        if (d.data.hidden) {
          return;
        }
        opts.nodeClick(d.data.name, d.data.extra, d.data.id);
      })
      .on("contextmenu", function(d: any) {
        if (d.data.hidden) {
          return;
        }
        d3.event.preventDefault();
        opts.nodeRightClick(d.data.name, d.data.extra, d.data.id);
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
      const start = allNodes.find(
        t => +d.source === t.data.id
      ) as HierarchyPointNode<Node>;
      const end = allNodes.find(
        t => +d.target === t.data.id
      ) as HierarchyPointNode<Node>;

      const link = {
        source: { id: d.source, x: start.x, y: start.y, marriageNode: null },
        target: { id: d.target, x: end.x, y: end.y, marriageNode: null },
        number: d.number
      };

      const marriageId =
        start.data.marriageNode != null
          ? start.data.marriageNode.id
          : end.data.marriageNode.id;
      const marriageNode = allNodes.find(function(n) {
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
