figma.showUI(__html__, { themeColors: true, width: 300, height: 248 });

declare type MessageValues = {
  mode: 'rename' | 'delete';
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

function deleteProperty(
  node: ComponentNode | ComponentSetNode,
  { oldName }: Partial<MessageValues>
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

  // Delete the property
  node.deleteComponentProperty(propertyId);

  return true;
}

function replaceInName(node: SceneNode, { oldName, newName }: MessageValues) {
  node.name = node.name.replace(oldName, newName);
  return true;
}

function deleteInName(node: SceneNode, { oldName }: Partial<MessageValues>) {
  // TODO: use regex to remove the property and it's value
  node.name = node.name.replace(oldName!, '');
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
  const selectedAction =
    values.mode === 'rename' ? renameProperties : deleteProperty;
  const selectedRename =
    values.mode === 'rename' ? replaceInName : deleteInName;

  // Loop through the selection and rename the properties
  selection.forEach((node) => {
    if (node.type === 'COMPONENT') {
      if (selectedAction(node as ComponentNode, values))
        processedNodes.push(node.name);
      else skippedNodes.push(node.name);
    } else if (node.type === 'COMPONENT_SET') {
      if (values.isVariant) {
        const children = (node as ComponentSetNode).children;
        children.forEach((child: SceneNode) => {
          selectedRename(child, values);
        });
        processedNodes.push(node.name);
      } else {
        if (selectedAction(node as ComponentSetNode, values))
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
