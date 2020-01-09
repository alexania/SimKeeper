import * as d3 from "d3";
import { TreeOptions } from "./treeOptions.model";
import { TreeBuilder } from './treeBuilder.generator';

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
    this.siblings = [];

    let focus = data.find(t => t.id === focusId) || data[0];
    let ancestors: InitialNode[] = [];

    this.findAncestors(focus, ancestors, []);
    ancestors.forEach(t => this.reconstructTree(t, null));
  }

  private findAncestors(node: InitialNode, ancestors: InitialNode[], nodes: string[]) {
    nodes.push(node.id);

    if (node.parents.length === 0) {
      if (ancestors.indexOf(node) === -1) {
        for (let spouse of node.spouses) {
          if (nodes.indexOf(spouse.id) > -1) {
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
        this.findAncestors(parent, ancestors, nodes);
      }
    }
  }

  private reconstructTree(person: InitialNode, parent: Node) {
    let node = this.processedNodes[person.id];
    if (!node) {
      node = new Node(person.id, person.name, this.incrementIndex());
      node.extra = person.extra;
      node.textClass = person.textClass || this.options.styles.text;
      node["class"] = person["class"] || this.options.styles.node;

      this.processedNodes[node.stringId] = node;
    }

    node.parent = parent || this.root;
    if (node.parent == this.root) {
      node.noParent = true;
    }
    if (!node.parent.children.find(t => t.stringId === node.stringId)) {
      node.parent.children.push(node);
    }

    //this.sortPersons(person.children);

    let i = 1;
    // add "direct" children
    for (let child of person.children) {
      let otherParent = child.parents.find(t => t.id !== person.id);
      if (otherParent) {
        let mId = person.id + "_" + otherParent.id;
        let m = this.processedNodes["m_" + mId];

        let spouse = this.processedNodes["sp_" + mId]
        if (!m) {
          m = new Node("m_" + mId, "Marriage", this.incrementIndex(), true, true);
          this.processedNodes[m.stringId] = m;

          spouse = new Node(
            "sp_" + mId,
            otherParent.name,
            this.incrementIndex()
          );
          spouse.noParent = true;
          spouse.textClass = spouse.textClass || this.options.styles.text;
          spouse["class"] = spouse["class"] || this.options.styles.node;
          this.processedNodes[spouse.stringId] = spouse;
          spouse.marriageNode = m;
        }

        if (!node.parent.children.find(t => t.stringId === m.stringId)) {
          node.parent.children.push(m);
        }
        if (!node.parent.children.find(t => t.stringId === spouse.stringId)) {
          node.parent.children.push(spouse);
        }

        if (!this.siblings.find(t => t.source === node.id && t.target === spouse.id)) {
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
