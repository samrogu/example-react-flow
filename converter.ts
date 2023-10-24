import { INode } from "react-flow-builder";

type LarkNode = INode;

type LarkFlowSchema = Array<LarkNode>;

type BpmnEntity = {
  id: string;
  type: string;
  name: string;
  [otherProperty: string]: any;
};

function createEmptyBpmnSchema(processId: string = "process_1") {
  return {
    processes: [
      {
        id: processId,
        tasks: [],
        events: [],
        gateways: [],
        flows: []
      }
    ]
  };
}

function createEmptyBpmnGateway(id: string) {
  return {
    type: "EXCLUSIVE_GATEWAY",
    id,
    name: id
  };
}

function convertLarkNode(node: LarkNode): BpmnEntity {
  switch (node.type) {
    case "start": {
      return {
        type: "START_EVENT",
        name: node.name,
        id: node.id
      };
    }
    case "end": {
      return {
        type: "END_EVENT",
        name: node.name,
        id: node.id
      };
    }
    case "node": {
      return {
        type: "SERVICE_TASK",
        name: node.name,
        id: node.id,
        data: node.data
      };
    }
    case "branch": {
      return {
        type: "EXCLUSIVEGATEWAY",
        name: node.name,
        id: node.id
      };
    }
    case "condition": {
      return {
        type: "INTERMEDIATE_EVENT",
        name: node.name,
        id: node.id,
        data: node.data
      };
    }
  }
}

function createSequenceFlow(fromId: string, toId: string): BpmnEntity {
  return {
    id: `sequence_flow_${fromId}_${toId}`,
    type: "SEQUENCE_FLOW",
    name: `sequence_flow_${fromId}_${toId}`,
    sourceId: fromId,
    targetId: toId
  };
}

export function convertLarkFlowSchema(larkFlow: LarkFlowSchema) {
  const bpmn = createEmptyBpmnSchema();
  const {
    processes: [process]
  } = bpmn;

  function walk(
    node: LarkNode,
    previousBpmnNode: BpmnEntity | null = null
  ): BpmnEntity | null {
    // Create the equivalent bpmn entity
    const bpmnNode = convertLarkNode(node);

    // Put the newly created bpmnNode into the correct "folder"
    if (
      ["START_EVENT", "END_EVENT", "INTERMEDIATE_EVENT"].includes(bpmnNode.type)
    ) {
      process.events.push(bpmnNode);
    } else if (["SERVICE_TASK"].includes(bpmnNode.type)) {
      process.tasks.push(bpmnNode);
    } else if (["EXCLUSIVE_GATEWAY"].includes(bpmnNode.type)) {
      process.gateways.push(bpmnNode);
    }

    // create a sequence flow back to the previous node
    if (previousBpmnNode) {
      const flow = createSequenceFlow(previousBpmnNode.id, bpmnNode.id);
      process.flows.push(flow);
    }

    // handling branch
    if (node.type === "branch" && node.children && node.children.length > 0) {
      const closeGateway = createEmptyBpmnGateway(`closing_node_${node.id}`);
      node.children.forEach((child) => {
        const lastNodeInBranch = walk(child, bpmnNode);
        const edge = createSequenceFlow(lastNodeInBranch.id, closeGateway.id);
        process.flows.push(edge);
      });
      process.gateways.push(closeGateway);
      return closeGateway;
    }

    // handle condition
    if (
      node.type === "condition" &&
      node.children &&
      node.children.length > 0
    ) {
      let previousBpmnNode = bpmnNode;
      node.children.forEach((child) => {
        previousBpmnNode = walk(child, previousBpmnNode);
      });
      return previousBpmnNode;
    }

    return bpmnNode;
  }

  let previousBpmnNode = null;
  larkFlow.forEach((larkNode) => {
    previousBpmnNode = walk(larkNode, previousBpmnNode);
  });

  // Replace the INTERMEDIATE_EVENT with the single SEQUENCE_FLOW
  const intermediateEvents = process.events.filter(
    (event) => event.type === "INTERMEDIATE_EVENT"
  );
  const blackListIds = {};
  const conditionFlows = intermediateEvents.map((event) => {
    const incomingFlow = process.flows.find(
      (flow) => flow.targetId === event.id
    );
    const outgoingFlow = process.flows.find(
      (flow) => flow.sourceId === event.id
    );
    blackListIds[event.id] = true;
    blackListIds[incomingFlow.id] = true;
    blackListIds[outgoingFlow.id] = true;
    const newFlow = {
      ...createSequenceFlow(incomingFlow.sourceId, outgoingFlow.targetId),
      name: event.name,
      data: event.data // inside should have the condition
    };
    return newFlow;
  });

  process.events = process.events.filter((event) => !blackListIds[event.id]);
  process.flows = process.flows.filter((flow) => !blackListIds[flow.id]);
  process.flows.push(...conditionFlows);

  return bpmn;
}
