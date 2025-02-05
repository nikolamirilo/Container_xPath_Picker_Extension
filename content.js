let previouslySelectedElement = null;
let currentXPath = null;
let isSelecting = false;
let startX = 0,
    startY = 0;
let selectionRectangle = null;
let sidebarVisible = true;
let apiKey = localStorage.getItem("apiKey");
let urlParams = new URLSearchParams(window.location.search);
let urlXPath = ""

const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('styles.css');
document.head.appendChild(link);

const shouldOpenExtension = () => {
    return urlParams.has("extension") && urlParams.get("extension") === "true";
};

const openExtension = () => {
    createSidebar();
    const scraper = {
        robot_id: urlParams.get("robot_id"),
        mode: urlParams.get("mode"),
        xpath: urlParams.get("xpath"),

    }
    localStorage.setItem("scraper", JSON.stringify(scraper))
    if (scraper.xpath && apiKey) {
        const element = getElementByXPath(scraper.xpath);
        if (element) {
            selectElement(element);
        }
    }
};

window.addEventListener("load", () => {
    if (shouldOpenExtension()) {
        // if (urlParams.has("xpath")) {
        //     localStorage.setItem("xpath", urlParams.get("xpath"));
        // }
        openExtension();
    }
});

const createSidebar = () => {
    const sidebar = document.createElement("div");
    sidebar.id = "xpath-sidebar";
    document.body.appendChild(sidebar);

    // API Key Section
    const apiKeyContainer = document.createElement("div");
    apiKeyContainer.id = "api-key-container";
    apiKeyContainer.style.display = apiKey ? "none" : "block";

    const apiKeyInput = document.createElement("input");
    apiKeyInput.id = "api-key-input"
    apiKeyInput.type = "password";
    apiKeyInput.placeholder = "Enter API Key";

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save API Key";
    saveButton.id = "save-button"
    saveButton.onclick = () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem("apiKey", key);
            apiKey = key;
            apiKeyContainer.style.display = "none";
            mainContentContainer.style.display = "block";
            
            // Check for saved XPath after API key entry
            const scraper = JSON.parse(localStorage.getItem("scraper"));
            if (scraper.xpath) {
                const element = getElementByXPath(scraper.xpath);
                if (element) selectElement(element);
            }
        }
    };

    apiKeyContainer.appendChild(apiKeyInput);
    apiKeyContainer.appendChild(saveButton);
    sidebar.appendChild(apiKeyContainer);

    // Main Content Container
    const mainContentContainer = document.createElement("div");
    mainContentContainer.id = "main-content-container";
    mainContentContainer.style.display = apiKey ? "block" : "none";

    // Header Row
    const headerRow = document.createElement("div");
    headerRow.id = "header-row"

    const title = document.createElement("h3");
    title.textContent = "Select XPath";
    headerRow.appendChild(title);

    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.id = "close-button"
    closeButton.onclick = () => closeSidebar(sidebar);
    headerRow.appendChild(closeButton);

    mainContentContainer.appendChild(headerRow);

    // XPath Container
    const xpathContainer = document.createElement("div");
    xpathContainer.id = "xpath-container";
    xpathContainer.innerHTML = `
        <div id="content">
            <p style="color:black; margin: 0 0 5px 0;">xPath: ${currentXPath || ''}</p>
            <button id="copy-button">Copy</button>
        </div>
    `;
    mainContentContainer.appendChild(xpathContainer);

    // Button Container
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "button-container"

    // Add Tools
    buttonContainer.appendChild(createToolButton("Selection Tool", toggleSelectionTool));
    buttonContainer.appendChild(createToolButton("Select Parent", selectParent));
    buttonContainer.appendChild(createToolButton("Select Child", selectChild));

    // Reset API Key Button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset API Key";
    resetButton.id = "reset-button"
    resetButton.onclick = () => {
        localStorage.removeItem("apiKey");
        apiKey = null;
        mainContentContainer.style.display = "none";
        apiKeyContainer.style.display = "block";
        currentXPath = null;
        if (previouslySelectedElement) {
            const existingOverlay = document.getElementById("selection-border-overlay");
            if (existingOverlay) existingOverlay.remove();
            previouslySelectedElement = null;
        }
        updateXpathDisplay();
    };
    buttonContainer.appendChild(resetButton);

    mainContentContainer.appendChild(buttonContainer);
    sidebar.appendChild(mainContentContainer);
    sidebarVisible = true;
};

const createToolButton = (text, onClick) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.id = "create-tool"
    button.onclick = () => {
        if (!apiKey) {
            console.log("Please enter an API key first!");
            return;
        }
        onClick();
    };
    return button;
};

const toggleSelectionTool = () => {
    isSelecting = !isSelecting;
    if (isSelecting) {
        document.body.style.cursor = "crosshair";
    } else {
        document.body.style.cursor = "default";
        if (selectionRectangle) {
            selectionRectangle.remove();
            selectionRectangle = null;
        }
    }
};

document.addEventListener("mousedown", (event) => {
    if (!isSelecting || !apiKey) {
        if (!apiKey) console.log("Please enter an API key first!");
        return;
    }
    event.preventDefault();
    startX = event.pageX;
    startY = event.pageY;
    selectionRectangle = document.createElement("div");
    selectionRectangle.style.position = "absolute";
    selectionRectangle.style.border = "2px dashed #6835F4";
    selectionRectangle.style.backgroundColor = "rgba(104, 53, 244, 0.2)";
    selectionRectangle.style.pointerEvents = "none";
    document.body.appendChild(selectionRectangle);
    selectionRectangle.style.left = `${startX}px`;
    selectionRectangle.style.top = `${startY}px`;
    selectionRectangle.style.width = "0px";
    selectionRectangle.style.height = "0px";
});

document.addEventListener("mousemove", (event) => {
    if (!isSelecting || !selectionRectangle) return;
    event.preventDefault();

    // Consider scroll position
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    const width = event.pageX - startX;
    const height = event.pageY - startY;

    selectionRectangle.style.width = `${Math.abs(width)}px`;
    selectionRectangle.style.height = `${Math.abs(height)}px`;
    
    // Adjust positions with scroll offset
    if (width < 0) {
        selectionRectangle.style.left = `${event.pageX - scrollX}px`;
    }
    if (height < 0) {
        selectionRectangle.style.top = `${event.pageY - scrollY}px`;
    }
});

document.addEventListener("mouseup", (event) => {
    if (!isSelecting || !selectionRectangle) return;
    isSelecting = false;
    document.body.style.cursor = "default";

    // Get the selection rectangle coordinates
    const rect = selectionRectangle.getBoundingClientRect();
    const elements = [];
    
    // Check multiple points in a grid pattern
    const steps = 5;
    const stepX = rect.width / steps;
    const stepY = rect.height / steps;

    for (let i = 0; i < steps; i++) {
        for (let j = 0; j < steps; j++) {
            const x = rect.left + (i * stepX) + (stepX/2);
            const y = rect.top + (j * stepY) + (stepY/2);
            const el = document.elementFromPoint(x, y);
            if (el && !isElementInSidebar(el)) {
                elements.push(el);
            }
        }
    }

    // Find the deepest common element
    let selectedElement = null;
    if (elements.length > 0) {
        // Sort elements by depth in DOM tree
        const sortedElements = elements.sort((a, b) => {
            return getElementDepth(b) - getElementDepth(a);
        });
        
        // Find the most common deep element
        selectedElement = sortedElements[0];
    }

    if (selectedElement) {
        selectElement(selectedElement);
    }

    selectionRectangle.remove();
    selectionRectangle = null;
});

// Helper function to calculate DOM depth
const getElementDepth = (el) => {
    let depth = 0;
    while (el.parentElement) {
        depth++;
        el = el.parentElement;
    }
    return depth;
};

document.addEventListener("click", (event) => {
    if (isSelecting || !apiKey) {
        if (!apiKey) console.log("Please enter an API key first!");
        return;
    }
    const element = event.target;
    if (isElementInSidebar(element)) {
        console.log("Clicked inside the sidebar, skipping selection.");
        return;
    }
    if (previouslySelectedElement) {
        previouslySelectedElement.style.outline = "";
    }
    selectElement(element);
});

document.body.addEventListener("click", (event) => {
    if (event.target.id === "copy-button") {
        if (!currentXPath) {
            alert("No XPath to copy!");
            return;
        }
        navigator.clipboard.writeText(currentXPath).then(() => {
            alert("XPath copied to clipboard!");
        });
    }
});

const closeSidebar = (sidebar) => {
    sidebar.style.display = "none";
    sidebarVisible = false;
    if (isSelecting) {
        isSelecting = false;
        document.body.style.cursor = "default";
        if (selectionRectangle) {
            selectionRectangle.remove();
            selectionRectangle = null;
        }
    }
};

const isElementInSidebar = (element) => {
    const sidebar = document.getElementById("xpath-sidebar");
    return sidebar && sidebar.contains(element);
};

const getXPath = (el) => {
    if (!el || el.nodeType !== 1) return "";
    if (el === document.body) return "/html/body";

    let index = 1;
    let sibling = el.previousElementSibling;
    
    // Count only elements with the same tag name
    while (sibling) {
        if (sibling.nodeName === el.nodeName) {
            index++;
        }
        sibling = sibling.previousElementSibling;
    }

    const parentXPath = getXPath(el.parentElement);
    const tagName = el.tagName.toLowerCase();
    
    // Use more specific indexing
    return index > 1 
        ? `${parentXPath}/${tagName}[${index}]`
        : `${parentXPath}/${tagName}`;
};

const selectElement = (element) => {
    if (!apiKey) {
        console.log("Please enter an API key first!");
        return;
    }
    if (!element) return;
    
    const xpath = getXPath(element);
    const childCount = element.children.length;

    if (previouslySelectedElement) {
        const existingOverlay = document.getElementById("selection-border-overlay");
        if (existingOverlay) existingOverlay.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "selection-border-overlay";
    const rect = element.getBoundingClientRect();
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    document.body.appendChild(overlay);

    previouslySelectedElement = element;
    currentXPath = xpath;
    updateXpathDisplay(childCount);
};

const updateXpathDisplay = (childCount = 0) => {
    const xpathContainer = document.getElementById("xpath-container");
    const scraper = JSON.parse(localStorage.getItem("scraper"))
    if (!xpathContainer) return;
    xpathContainer.innerHTML = `
    <div style="display:flex;flex-direction:column;">
    <p style="font-size: 16px;color:black;margin-bottom:4px;">Robot ID: <strong>${scraper.robot_id}</strong></p>
        <div style="padding: 10px; margin-bottom: 10px; background-color: #fff; 
            border: 1px solid #ddd; border-radius: 4px; word-break: break-word;">
            <code style="color: #6835F4; font-family: monospace;">${currentXPath || 'No selection'}</code>
            <button id="copy-button" style="
                display: block;
                margin-top: 10px;
                background-color: ${currentXPath ? '#6835F4' : '#999'}; 
                color: white; 
                border: none; 
                padding: 5px 10px; 
                border-radius: 5px; 
                cursor: ${currentXPath ? 'pointer' : 'not-allowed'};
            " ${!currentXPath ? 'disabled' : ''}>Copy XPath</button>
        </div>
        <p style="font-size: 16px;color:black;">${scraper.mode == "list" ? "nbr_rows" : "nbr_items"}: <strong>${childCount}</strong></p>
    </div>`;
};

const selectParent = () => {
    if (!apiKey) {
        console.log("Please enter an API key first!");
        return;
    }
    if (previouslySelectedElement?.parentElement && !isElementInSidebar(previouslySelectedElement.parentElement)) {
        const parentElement = previouslySelectedElement.parentElement;
        if (previouslySelectedElement) {
            previouslySelectedElement.style.outline = "";
        }
        selectElement(parentElement);
    } else {
        alert("No valid parent element found!");
    }
};

const selectChild = () => {
    if (!apiKey) {
        console.log("Please enter an API key first!");
        return;
    }
    if (previouslySelectedElement?.children?.length > 0) {
        const childElement = Array.from(previouslySelectedElement.children).find(
            (child) => !isElementInSidebar(child)
        );
        if (childElement) {
            previouslySelectedElement.style.outline = "";
            selectElement(childElement);
        } else {
            alert("No valid child element found!");
        }
    } else {
        alert("No child element found!");
    }
};

const getElementByXPath = (xPath) => {
    try {
        return document.evaluate(
            xPath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
    } catch (error) {
        console.error("Invalid XPath:", xPath, error);
        return null;
    }
};