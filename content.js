let previouslySelectedElement = null;
let currentXPath = ""; // Store the current XPath for copying
let isSelecting = false; // Flag to track if the user is drawing a selection rectangle
let startX = 0,
    startY = 0; // Coordinates for the start of the rectangle
let selectionRectangle = null; // The rectangle element
let sidebarVisible = true; // Track if the sidebar is visible

// Create a sidebar to display the XPath
const createSidebar = () => {
    const sidebar = document.createElement("div");
    sidebar.id = "xpath-sidebar";
    sidebar.style.position = "fixed";
    sidebar.style.top = "0";
    sidebar.style.right = "0";
    sidebar.style.width = "300px";
    sidebar.style.height = "100vh";
    sidebar.style.backgroundColor = "#f4f4f4";
    sidebar.style.borderLeft = "2px solid #ccc";
    sidebar.style.boxShadow = "-2px 0 5px rgba(0, 0, 0, 0.1)";
    sidebar.style.overflowY = "auto";
    sidebar.style.padding = "10px";
    sidebar.style.zIndex = "10000";
    sidebar.style.fontFamily = "Arial, sans-serif";
    document.body.appendChild(sidebar);

    // Create a row for the heading text and close button
    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.alignItems = "center";
    headerRow.style.marginBottom = "10px";

    // Sidebar title
    const title = document.createElement("h3");
    title.textContent = "Select XPath";
    title.style.fontSize = "20px";
    title.style.fontWeight = "bold";
    title.style.margin = "0";
    title.style.color = "#333";
    headerRow.appendChild(title);

    // Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.style.backgroundColor = "transparent";
    closeButton.style.color = "#ff4c4c";
    closeButton.style.border = "none";
    closeButton.style.fontSize = "16px";
    closeButton.style.cursor = "pointer";
    closeButton.onclick = () => closeSidebar(sidebar);
    headerRow.appendChild(closeButton);

    // Append the header row to the sidebar
    sidebar.appendChild(headerRow);

    // XPath display container
    const xpathContainer = document.createElement("div");
    xpathContainer.id = "xpath-container";
    xpathContainer.innerHTML = ` 
    <div style="padding: 10px; margin-bottom: 10px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px; word-break: break-word;">
        <p style="color:black;">xPath: </p>
        <button id="copy-button" style="
            display: block;
            margin-top: 10px;
            background-color: #6835F4; 
            color: white; 
            border: none; 
            padding: 5px 10px; 
            border-radius: 5px; 
            cursor: pointer;
        ">Copy</button>
    </div>
`;
    sidebar.appendChild(xpathContainer);

    // Add buttons for additional actions
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexDirection = "column";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.marginTop = "10px";

    const selectionButton = document.createElement("button");
    selectionButton.textContent = "Selection Tool";
    selectionButton.style.backgroundColor = "#6835F4";
    selectionButton.style.color = "white";
    selectionButton.style.border = "none";
    selectionButton.style.padding = "8px 12px";
    selectionButton.style.borderRadius = "5px";
    selectionButton.style.cursor = "pointer";
    selectionButton.onclick = () => toggleSelectionTool();

    const selectParentButton = document.createElement("button");
    selectParentButton.textContent = "Select Parent";
    selectParentButton.style.backgroundColor = "#6835F4";
    selectParentButton.style.color = "white";
    selectParentButton.style.border = "none";
    selectParentButton.style.padding = "8px 12px";
    selectParentButton.style.borderRadius = "5px";
    selectParentButton.style.cursor = "pointer";
    selectParentButton.onclick = () => selectParent();

    const selectChildButton = document.createElement("button");
    selectChildButton.textContent = "Select Child";
    selectChildButton.style.backgroundColor = "#6835F4";
    selectChildButton.style.color = "white";
    selectChildButton.style.border = "none";
    selectChildButton.style.padding = "8px 12px";
    selectChildButton.style.borderRadius = "5px";
    selectChildButton.style.cursor = "pointer";
    selectChildButton.onclick = () => selectChild();

    buttonContainer.appendChild(selectionButton);
    buttonContainer.appendChild(selectParentButton);
    buttonContainer.appendChild(selectChildButton);

    sidebar.appendChild(buttonContainer);

    sidebarVisible = true;
};

createSidebar(); // Ensure the sidebar is created and visible immediately

const toggleSelectionTool = () => {
    isSelecting = !isSelecting; // Toggle selection mode

    if (isSelecting) {
        document.body.style.cursor = "crosshair";
    } else {
        document.body.style.cursor = "default";
        if (selectionRectangle) {
            selectionRectangle.remove(); // Remove the rectangle if selection is canceled
            selectionRectangle = null;
        }
    }
};

// Handle mouse events for drawing the selection rectangle
document.addEventListener("mousedown", (event) => {
    if (!isSelecting) return; // If selection is not active, ignore mouse events

    // Prevent default behavior (e.g., link clicks, drag behavior)
    event.preventDefault();

    // Initialize the selection rectangle's start position
    startX = event.pageX;
    startY = event.pageY;

    // Create a rectangle for the selection area
    selectionRectangle = document.createElement("div");
    selectionRectangle.style.position = "absolute";
    selectionRectangle.style.border = "2px dashed #6835F4";
    selectionRectangle.style.backgroundColor = "rgba(104, 53, 244, 0.2)";
    selectionRectangle.style.pointerEvents = "none"; // Prevent interaction with the rectangle
    document.body.appendChild(selectionRectangle);

    // Set initial size of the rectangle to 0
    selectionRectangle.style.left = `${startX}px`;
    selectionRectangle.style.top = `${startY}px`;
    selectionRectangle.style.width = "0px";
    selectionRectangle.style.height = "0px";
});

document.addEventListener("mousemove", (event) => {
    if (!isSelecting || !selectionRectangle) return;

    // Prevent default behavior
    event.preventDefault();

    // Calculate the current width and height of the rectangle
    const width = event.pageX - startX;
    const height = event.pageY - startY;

    // Adjust the position and size of the rectangle as the mouse moves
    selectionRectangle.style.width = `${Math.abs(width)}px`;
    selectionRectangle.style.height = `${Math.abs(height)}px`;
    if (width < 0) selectionRectangle.style.left = `${event.pageX}px`;
    if (height < 0) selectionRectangle.style.top = `${event.pageY}px`;
});

document.addEventListener("mouseup", (event) => {
    if (!isSelecting || !selectionRectangle) return;

    // Stop drawing when the user releases the mouse button
    isSelecting = false;
    document.body.style.cursor = "default";

    // Get the selected area and find the element inside the rectangle
    const rect = selectionRectangle.getBoundingClientRect();
    const selectedElement = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

    // Check if the selected element is valid
    if (selectedElement) {
        selectElement(selectedElement);
    }

    // Remove the selection rectangle
    selectionRectangle.remove();
    selectionRectangle = null;
});

// Handle direct clicks to select an element
document.addEventListener("click", (event) => {
    if (isSelecting) return; // Ignore clicks when in selection mode

    const element = event.target;

    // Check if the clicked element is inside the sidebar
    if (isElementInSidebar(element)) {
        console.log("Clicked inside the sidebar, skipping selection.");
        return; // Do not process clicks inside the sidebar
    }

    // Clear the previous selection
    if (previouslySelectedElement) {
        previouslySelectedElement.style.outline = ""; // Remove the outline
    }

    selectElement(element);
});

const selectElement = (element) => {
    // Generate XPath
    const getXPath = (el) => {
        if (el.id) return el.id;
        if (el === document.body) return "/html/body";

        let ix = 0;
        const siblings = el.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === el) return `${getXPath(el.parentNode)}/${el.tagName.toLowerCase()}[${ix + 1}]`;
            if (sibling.nodeType === 1 && sibling.tagName === el.tagName) ix++;
        }
    };

    const xpath = getXPath(element);

    // If an element is already selected, remove its outline
    if (previouslySelectedElement) {
        previouslySelectedElement.style.outline = "";
    }

    // Highlight the new element with a border
    element.style.outline = "3px solid #6835F4";
    previouslySelectedElement = element; // Update the reference to the new selection
    currentXPath = xpath;

    // Update the sidebar with the XPath
    const xpathContainer = document.getElementById("xpath-container");
    xpathContainer.innerHTML = ` 
        <div style="padding: 10px; margin-bottom: 10px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px; word-break: break-word;">
            <p style="color:black;">xPath: ${currentXPath}</p>
            <button id="copy-button" style="
                display: block;
                margin-top: 10px;
                background-color: #6835F4; 
                color: white; 
                border: none; 
                padding: 5px 10px; 
                border-radius: 5px; 
                cursor: pointer;
            ">Copy</button>
        </div>
    `;
};

// Add click event for the copy button outside of the main click event to avoid resetting XPath
document.body.addEventListener("click", (event) => {
    if (event.target.id === "copy-button") {
        navigator.clipboard.writeText(currentXPath).then(() => {
            alert("XPath copied to clipboard!");
        });
    }
});

// Function to close the sidebar and exit the extension
const closeSidebar = (sidebar) => {
    // Hide the sidebar
    sidebar.style.display = "none";
    sidebarVisible = false;

    // Exit the selection mode if active
    if (isSelecting) {
        isSelecting = false;
        document.body.style.cursor = "default";
        if (selectionRectangle) {
            selectionRectangle.remove();
            selectionRectangle = null;
        }
    }
};

// Helper function to check if an element is in the sidebar
const isElementInSidebar = (element) => {
    const sidebar = document.getElementById("xpath-sidebar");
    return sidebar.contains(element);
};

const selectParent = () => {
    if (
        previouslySelectedElement &&
        previouslySelectedElement.parentElement &&
        !isElementInSidebar(previouslySelectedElement.parentElement)
    ) {
        // Select and highlight the parent element
        const parentElement = previouslySelectedElement.parentElement;

        // Clear previous selection
        if (previouslySelectedElement) {
            previouslySelectedElement.style.outline = "";
        }

        // Select the parent element
        selectElement(parentElement);
    } else {
        alert("No valid parent element found!");
    }
};

const selectChild = () => {
    if (
        previouslySelectedElement &&
        previouslySelectedElement.children.length > 0
    ) {
        // Find the first child element that is not in the sidebar
        const childElement = Array.from(previouslySelectedElement.children).find(
            (child) => !isElementInSidebar(child)
        );

        if (childElement) {
            // Clear previous selection
            if (previouslySelectedElement) {
                previouslySelectedElement.style.outline = "";
            }

            // Select the child element
            selectElement(childElement);
        } else {
            alert("No valid child element found!");
        }
    } else {
        alert("No child element found!");
    }
};
