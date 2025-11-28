import CustomNode from './custom-node';

export const nodeTypes = {
  custom: CustomNode,
  // We can add specific types if needed, but 'custom' with data.category works well for now
  // to keep it simple as requested.
  trigger: CustomNode,
  logic: CustomNode,
  action: CustomNode,
  integration: CustomNode,
};
