import * as d3 from 'd3';
import { HierarchyNode, TreeLayout, HierarchyPointNode, HierarchyLink, HierarchyPointLink } from 'd3';

export class Node {
  public id: number;

  public stringId: string;
  public name: string;

  public children: Node[] = [];
  public marriages: Marriage[] = [];

  public noParent = false;
  public hidden = false;

  public extra: any;
  public textClass: string;

  public marriageNode: Node;

  public constructor(name: string, id: number = 0, hidden = false, noParent = false) {
    this.id = id;
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

export class Marriage {
  public spouse: Node;
  public children: Node[] = [];

  public extra: any;

  public constructor(spouse: Node) {
    this.spouse = spouse;
  }
}

export class TreeOptions {
  public target = '#graph';
  public debug = false;
  public width = 600;
  public height = 600;

  public constructor(init?: Partial<TreeOptions>) {
    Object.assign(this, init);
  }

  public nodeClick = function nodeClick(name, extra, id) { }

  public nodeRightClick = function nodeRightClick(name, extra, id) { }

  public nodeHeightSeperation = function nodeHeightSeperation(nodeWidth, nodeMaxHeight) {
    return TreeBuilder.nodeHeightSeperation(nodeWidth, nodeMaxHeight);
  }

  public nodeRenderer = function nodeRenderer(name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer) {
    return TreeBuilder.nodeRenderer(name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer);
  }

  public getNodeSize = function getNodeSize(nodes, width, textRenderer): [number, number] {
    return TreeBuilder.getNodeSize(nodes, width, textRenderer);
  }

  public nodeSorter = function nodeSorter(aName, aExtra, bName, bExtra) {
    return 0;
  }

  public textRenderer = function textRenderer(name, extra, textClass) {
    return TreeBuilder.textRenderer(name, extra, textClass);
  }

  public margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  public nodeWidth = 150;
  public styles = {
    node: 'node',
    linage: 'linage',
    marriage: 'marriage',
    text: 'nodeText'
  }
}

export class Tree {
  public numNodes: number;
  public root: Node;
  public siblings: Link[] = [];
  public options: TreeOptions;

  public constructor(data: Node[], options: TreeOptions) {
    var processedData = this.preprocess(data, options);
    var treeBuilder = new TreeBuilder(processedData.root, processedData.siblings, options);
    treeBuilder.create();
  }

  private incrementIndex(name: string) {
    return this.numNodes++;
  }

  private preprocess(data: Node[], options: TreeOptions) {
    this.numNodes = 0;

    this.root = new Node("", this.incrementIndex("Root"));
    this.root.hidden = true;

    this.options = options;

    data.forEach(t => this.reconstructTree(t, this.root));

    return {
      root: d3.hierarchy(this.root),
      siblings: this.siblings
    };
  }

  private reconstructTree(person: Node, parent: Node) {
    const node = new Node(person.name, this.incrementIndex(person.name));
    node.extra = person.extra;
    node.textClass = person.textClass || this.options.styles.text;
    node["class"] = person["class"] || this.options.styles.node;

    // hide linages to the hidden root node
    if (parent == this.root) {
      node.noParent = true;
    }

    // apply depth offset
    // for (let i = 0; i < person.depthOffset; i++) {
    //   const pushNode = new Node("", this.numNodes++, true, person.noParent);
    //   parent.children.push(pushNode);
    //   parent = pushNode;
    // }

    // sort children
    this.sortPersons(person.children);

    // add "direct" children
    for (let child of person.children) {
      this.reconstructTree(child, node);
    }
    parent.children.push(node);

    //sort marriages
    this.sortMarriages(person.marriages);

    // go through marriage
    let i = 0;

    for (let marriage of person.marriages) {
      const m = new Node("", this.incrementIndex("Marriage"), true, true);
      m.extra = marriage.extra;

      const sp = marriage.spouse;

      const spouse = new Node(sp.name, this.incrementIndex(sp.name));
      spouse.noParent = true;
      spouse.textClass = spouse.textClass || this.options.styles.text;
      spouse["class"] = spouse["class"] || this.options.styles.node;
      spouse.marriageNode = m;

      parent.children.push(m);
      parent.children.push(spouse);

      this.sortPersons(marriage.children);

      marriage.children.forEach(t => this.reconstructTree(t, m));
      this.siblings.push({
        source: node.id,
        target: spouse.id,
        number: i++
      })
    }
  }

  private sortPersons(persons: Node[]) {
    if (persons) {
      persons.sort((a, b) => this.options.nodeSorter(a.name, a.extra, b.name, b.extra));
    }
    return persons;
  }

  private sortMarriages(marriages: Marriage[]) {
    if (marriages && Array.isArray(marriages)) {
      marriages.sort(function (marriageA, marriageB) {
        var a = marriageA.spouse;
        var b = marriageB.spouse;
        return this.options.nodeSorter(a.name, a.extra, b.name, b.extra);
      }.bind(this));
    }
    return marriages;
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

  private static DEBUG_LEVEL: number;

  public constructor(root: HierarchyNode<Node>, siblings: Link[], options: TreeOptions) {
    TreeBuilder.DEBUG_LEVEL = options.debug ? 1 : 0;

    this.root = root;
    this.links = [];

    this.siblings = siblings;
    this.options = options;

    // flatten nodes
    this.allNodes = this.flatten(this.root);

    // Calculate node size
    var visibleNodes = this.allNodes.filter(t => !t.data.hidden);
    this.nodeSize = options.getNodeSize(visibleNodes, options.nodeWidth, options.textRenderer);
  }

  public create() {
    var opts = this.options;
    var nodeSize = this.nodeSize;

    var width = opts.width + opts.margin.left + opts.margin.right;
    var height = opts.height + opts.margin.top + opts.margin.bottom;

    var zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', function () {
        svg.attr('transform', d3.event.transform.translate(width / 2, opts.margin.top));
      });

    //make an SVG
    var svg = this.svg = d3.select(opts.target)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .call(zoom)
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + opts.margin.top + ')');

    // Compute the layout.
    this.tree = d3.tree<Node>().nodeSize([nodeSize[0] * 2, opts.nodeHeightSeperation(nodeSize[0], nodeSize[1])]);

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
    return nodeMaxHeight + 25;
  }

  public static getNodeSize(nodes: HierarchyNode<Node>[], width: number, textRenderer): [number, number] {
    var maxWidth = 0;
    var maxHeight = 0;
    var tmpSvg = document.createElement('svg');
    document.body.appendChild(tmpSvg);

    nodes.map(function (n) {
      var container = document.createElement('div');
      container.setAttribute('class', n.data['class']);
      container.style.visibility = 'hidden';
      container.style.maxWidth = width + 'px';

      var text = textRenderer(n.data.name, n.data.extra, n.data.textClass);
      container.innerHTML = text;

      tmpSvg.appendChild(container);
      var height = container.offsetHeight;
      tmpSvg.removeChild(container);

      maxHeight = Math.max(maxHeight, height);
      // n.cHeight = height;
      // if (n.data.hidden) {
      //   n.cWidth = 0;
      // } else {
      //   n.cWidth = width;
      // }
    });
    document.body.removeChild(tmpSvg);

    return [width, maxHeight];
  }

  public static nodeRenderer(name: string, x: number, y: number, height: number, width: number, extra: any, id: number, nodeClass: string, textClass: string, textRenderer: any) {
    var node = '';
    node += '<div ';
    node += 'style="height:100%;width:100%;" ';
    node += 'class="' + nodeClass + '" ';
    node += 'id="node' + id + '">\n';
    node += textRenderer(name, extra, textClass);
    node += '</div>';
    return node;
  }

  public static textRenderer(name: string, extra: any, textClass: string) {
    var node = '';
    node += '<p ';
    node += 'align="center" ';
    node += 'class="' + textClass + '">\n';
    node += name;
    node += '</p>\n';
    return node;
  }

  private update(source: HierarchyNode<Node>) {

    var opts = this.options;
    var nodeSize = this.nodeSize;

    var treenodes = this.tree(source);
    
    var links = treenodes.links();

    // Create the link lines.
    this.svg.selectAll('.link').data(links).enter()
      // filter links with no parents to prevent empty nodes
      .filter(function (l) {
        return !l.target.data.noParent;
      }).append('path')
      .attr('class', opts.styles.linage)
      .attr('d', this.elbow);

    var nodes = this.svg.selectAll('.node')
      .data(treenodes.descendants())
      .enter();

    this.linkSiblings();

    // Draw siblings (marriage)
    this.svg.selectAll('.sibling')
      .data(this.links)
      .enter().append('path')
      .attr('class', opts.styles.marriage)
      .attr('d', this.siblingLine.bind(this));

    // Create the node rectangles.
    nodes.append('foreignObject').filter((d: any) => !d.data.hidden)
      .attr('x', function(d:any) { return Math.round(d.x - (9 * d.data.name.length) / 2) + 'px'; })
      .attr('y', (d: any) => Math.round(d.y - 20 / 2) + 'px')
      .attr('width', (d: any) => 9 * d.data.name.length + 'px')
      .attr('height', (d: any) => 20 + 'px')
      .attr('class', 'node')
      .attr('id', (d: any) => d.id)
      .html((d: any) => opts.nodeRenderer(d.data.name, d.x, d.y, nodeSize[0], nodeSize[1], d.data.extra, d.data.id, d.data['class'], d.data.textClass, opts.textRenderer))
      .on('click', function (d: any) {
        if (d.data.hidden) {
          return;
        }
        opts.nodeClick(d.data.name, d.data.extra, d.data.id);
      })
      .on('contextmenu', function (d: any) {
        if (d.data.hidden) {
          return;
        }
        d3.event.preventDefault();
        opts.nodeRightClick(d.data.name, d.data.extra, d.data.id);
      });
  }

  private elbow(d: any) {
    if (d.target.data.noParent) {
      return 'M0,0L0,0';
    }
    var ny = Math.round(d.target.y + (d.source.y - d.target.y) * 0.50);

    var linedata: [number, number][] = [
      [d.target.x, d.target.y],
      [d.target.x, ny],
      [d.source.x, d.source.y]
    ];

    var fun = d3.line()
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

      const marriageId = start.data.marriageNode != null ? start.data.marriageNode.id : end.data.marriageNode.id;
      const marriageNode = allNodes.find(function (n) {
        return n.data.id == marriageId;
      });

      link.source.marriageNode = marriageNode;
      link.target.marriageNode = marriageNode;

      this.links.push(link as unknown as HierarchyPointLink<Node>);
    }
  }

  private siblingLine(d: any) {

    var ny = Math.round(d.target.y + (d.source.y - d.target.y) * 0.50);
    var nodeWidth = this.nodeSize[0];
    var nodeHeight = this.nodeSize[1];

    // Not first marriage
    if (d.number > 0) {
      ny -= Math.round(nodeHeight * 8 / 10);
    }

    var linedata: [number, number][] = [
      [d.source.x, d.source.y],
      [Math.round(d.source.x + nodeWidth * 6 / 10), d.source.y],
      [Math.round(d.source.x + nodeWidth * 6 / 10), ny],
      [d.target.marriageNode.x - nodeWidth * 6 / 10, ny],
      [d.target.marriageNode.x - nodeWidth * 6 / 10, d.target.y],
      [d.target.x, d.target.y]
    ];

    var fun = d3.line()
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

  private recurse(i: number, nodes: HierarchyNode<Node>[], node: HierarchyNode<Node>) {
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