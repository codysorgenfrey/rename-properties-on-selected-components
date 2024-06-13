figma.showUI(__html__, { themeColors: true, width: 300, height: 218 });

declare type MessageValues = {
  mode: 'rename' | 'delete';
  oldName: string;
  newName: string;
};

function getPropertyId(
  node: ComponentNode | ComponentSetNode,
  oldName: string
) {
  // Get the properties of the component
  const properties = node.componentPropertyDefinitions;
  if (!properties) {
    console.error('No properties found in the component.');
    return;
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
    return;
  }

  return propertyId;
}

function renameProperties(
  node: ComponentNode | ComponentSetNode,
  { oldName, newName }: MessageValues
) {
  const propertyId = getPropertyId(node, oldName);
  if (!propertyId) return false;

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
  const propertyId = getPropertyId(node, oldName!);
  if (!propertyId) return false;

  // Delete the property
  node.deleteComponentProperty(propertyId);

  return true;
}

function replaceInName(node: SceneNode, { oldName, newName }: MessageValues) {
  node.name = node.name.replace(oldName, newName);
  return true;
}

function deleteInName(node: SceneNode, { oldName }: Partial<MessageValues>) {
  const variants = node.name.split(', ');
  variants.forEach((variant, index) => {
    if (variant.includes(`${oldName}=`)) {
      variants.splice(index, 1);
    }
  });

  node.name = variants.join(', ');
  return true;
}

function isPropertyOfVariant(node: ComponentSetNode, oldName: string) {
  if (!node.children) return false;

  return node.children.some((child) => {
    if (child.name.includes(`${oldName}=`)) return true;
  });
}

function isPropertyOfComponentSet(node: ComponentSetNode, oldName: string) {
  const propertyId = getPropertyId(node, oldName);
  if (!propertyId) return false;
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
      if (isPropertyOfVariant(node, values.oldName)) {
        node.children.forEach((child) => {
          selectedRename(child, values);
        });
        processedNodes.push(node.name);
      }
      if (isPropertyOfComponentSet(node, values.oldName)) {
        if (selectedAction(node, values)) processedNodes.push(node.name);
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
