import { TreeBuilder } from './treeBuilder.generator';
import { Node } from './tree.generator';

export class TreeOptions {
  public target = "#graph";
  public debug = false;
  public width = 600;
  public height = 600;

  public constructor(init?: Partial<TreeOptions>) {
    Object.assign(this, init);
  }

  public nodeClick = function nodeClick(node: Node) {};

  public nodeHeightSeperation = function nodeHeightSeperation(
    nodeWidth,
    nodeMaxHeight
  ) {
    return TreeBuilder.nodeHeightSeperation(nodeWidth, nodeMaxHeight);
  };

  public nodeRenderer = function nodeRenderer(
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
    return TreeBuilder.nodeRenderer(
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
    );
  };

  public getNodeSize = function getNodeSize(
    nodes,
    width,
    textRenderer
  ): [number, number] {
    return TreeBuilder.getNodeSize(nodes, width, textRenderer);
  };

  public nodeSorter = function nodeSorter(aName, aExtra, bName, bExtra) {
    return 0;
  };

  public textRenderer = function textRenderer(name, extra, textClass) {
    return TreeBuilder.textRenderer(name, extra, textClass);
  };

  public margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  public nodeWidth = 150;
  public styles = {
    node: "node",
    linage: "linage",
    marriage: "marriage",
    text: "nodeText"
  };
}