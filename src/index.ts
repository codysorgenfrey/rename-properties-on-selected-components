figma.showUI(__html__, { themeColors: true });

declare type MessageValues = {
  oldName: string;
  newName: string;
};

figma.ui.onmessage = (message) => {
  const values: MessageValues = JSON.parse(message);

  // Get the current selection
  const selection = figma.currentPage.selection;

  // Check if there is a selection
  if (selection.length === 0) {
    figma.closePlugin('Please select at least one master component.');
  }

  // Check if the selection contains only master components
  const hasMasterComponents = selection.every(
    (node) => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET'
  );
  if (!hasMasterComponents) {
    figma.closePlugin('Please select only master components.');
  }
};
