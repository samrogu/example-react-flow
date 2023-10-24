import React, { useState, useContext } from "react";
import FlowBuilder, {
  NodeContext,
  INode,
  IRegisterNode
} from "react-flow-builder";
import ConfigForm from "./ConfigForm";
import {
  DrawerComponent,
  PopconfirmComponent,
  PopoverComponent
} from "../../antd";

import "./index.css";
import { convertLarkFlowSchema } from "./converter";
import { startingNodes } from "./startingNodes";

const StartNodeDisplay: React.FC = () => {
  const node = useContext(NodeContext);
  return <div className="start-node">{node.name}</div>;
};

const EndNodeDisplay: React.FC = () => {
  const node = useContext(NodeContext);
  return <div className="end-node">{node.name}</div>;
};

const NodeDisplay: React.FC = () => {
  const node = useContext(NodeContext);
  return (
    <div
      className={`other-node ${node.configuring ? "node-configuring" : ""} ${
        node.validateStatusError ? "node-status-error" : ""
      }`}
    >
      {node.data ? node.data.name : node.name}
    </div>
  );
};

const ConditionNodeDisplay: React.FC = () => {
  const node = useContext(NodeContext);
  return (
    <div
      className={`condition-node ${
        node.configuring ? "node-configuring" : ""
      } ${node.validateStatusError ? "node-status-error" : ""}`}
    >
      {node.data ? node.data.name : node.name}
    </div>
  );
};

const registerNodes: IRegisterNode[] = [
  {
    type: "start",
    name: "开始节点",
    displayComponent: StartNodeDisplay,
    isStart: true
  },
  {
    type: "end",
    name: "结束节点",
    displayComponent: EndNodeDisplay,
    isEnd: true
  },
  {
    type: "node",
    name: "普通节点",
    displayComponent: NodeDisplay,
    configComponent: ConfigForm
  },
  {
    type: "condition",
    name: "条件节点",
    displayComponent: ConditionNodeDisplay,
    configComponent: ConfigForm
  },
  {
    type: "branch",
    name: "分支节点",
    conditionNodeType: "condition"
  },
  {
    type: "loop",
    name: "循环节点",
    displayComponent: NodeDisplay,
    isLoop: true
  }
];

console.log("starting nodes", startingNodes);
console.log("starting bpmn schema", convertLarkFlowSchema(startingNodes));

const NodeForm = () => {
  const [nodes, setNodes] = useState<INode[]>(startingNodes);

  const handleChange = (nodes: INode[]) => {
    console.log("nodes change", nodes);
    console.log("bpmn schema", convertLarkFlowSchema(nodes));
    setNodes(nodes);
  };

  return (
    <>
      <FlowBuilder
        nodes={nodes}
        onChange={handleChange}
        registerNodes={registerNodes}
        historyTool
        zoomTool
        DrawerComponent={DrawerComponent}
        PopoverComponent={PopoverComponent}
        PopconfirmComponent={PopconfirmComponent}
      />
    </>
  );
};

export default NodeForm;
