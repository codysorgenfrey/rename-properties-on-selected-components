figma.showUI(__html__, { themeColors: true, width: 300, height: 188 });

declare type MessageValues = {
  oldName: string;
  newName: string;
  isVariant: boolean;
};

function renameProperties(
  node: ComponentNode | ComponentSetNode,
  { oldName, newName }: MessageValues
) {
  // Get the properties of the component
  const properties = node.componentPropertyDefinitions;
  if (!properties) {
    console.error('No properties found in the component.');
    return false;
  }

  // Find the internal property id to rename
  let propertyId: string | undefined;
  Object.keys(properties).forEach((key) => {
    if (key.startsWith(`${oldName}#`) || key === oldName) {
      propertyId = key;
    }
  });
  if (!propertyId) {
    console.error(`Property ${oldName} not found in ${node.name}`);
    return false;
  }

  // Rename the property
  node.editComponentProperty(propertyId, {
    name: newName,
  });

  return true;
}

figma.ui.onmessage = (message) => {
  const values = JSON.parse(message) as MessageValues;

  // Get the current selection
  const selection = figma.currentPage.selection;

  // Check if there is a selection
  if (selection.length === 0) {
    figma.notify('Please select at least one master component.', {
      error: true,
    });
    return;
  }

  // Arrays to store the nodes that were skipped and processed
  const skippedNodes: string[] = [];
  const processedNodes: string[] = [];

  // Loop through the selection and rename the properties
  selection.forEach((node) => {
    if (node.type === 'COMPONENT') {
      if (renameProperties(node as ComponentNode, values))
        processedNodes.push(node.name);
      else skippedNodes.push(node.name);
    } else if (node.type === 'COMPONENT_SET') {
      if (values.isVariant) {
        const children = (node as ComponentSetNode).children;
        children.forEach((child) => {
          child.name = child.name.replace(values.oldName, values.newName);
        });
        processedNodes.push(node.name);
      } else {
        if (renameProperties(node as ComponentSetNode, values))
          processedNodes.push(node.name);
        else skippedNodes.push(node.name);
      }
    } else {
      skippedNodes.push(node.name);
    }
  });

  figma.notify(
    `Renamed properties for ${processedNodes.length} components. Skipped ${skippedNodes.length} objects.`
  );
};
