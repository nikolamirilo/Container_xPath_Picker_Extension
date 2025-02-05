let previouslySelectedElement = null;
let currentXPath = null;
let isSelecting = false;
let startX = 0,
    startY = 0;
let selectionRectangle = null;
let sidebarVisible = true;
let urlParams = new URLSearchParams(window.location.search);
let urlXPath = "";
let currentElementIndex = -1;
let parentElements = [];

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
        ufn: urlParams.get("ufn")
    }
    localStorage.setItem("scraper", JSON.stringify(scraper))
    if (scraper.xpath) {
        const element = getElementByXPath(scraper.xpath);
        if (element) {
            selectElement(element);
        }
    }
};

window.addEventListener("load", () => {
    if (shouldOpenExtension()) {
        if(urlParams.has("ufn")){
            localStorage.setItem("ufn", urlParams.get("ufn"))
            openExtension(); 
        }else{
            alert("You don't have correct link")
        }
    }
});

const createSidebar = () => {
    const sidebar = document.createElement("div");
    sidebar.id = "xpath-sidebar";
    document.body.appendChild(sidebar);

    // Main Content Container
    const mainContentContainer = document.createElement("div");
    mainContentContainer.id = "main-content-container";

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

    // Navigation controls
    const navContainer = document.createElement("div");
    navContainer.style.display = "flex";
    navContainer.style.gap = "8px";
    navContainer.style.marginBottom = "10px";
    
    navContainer.appendChild(createToolButton("←", selectPreviousSibling));
    navContainer.appendChild(createToolButton("→", selectNextSibling));

    buttonContainer.appendChild(navContainer);
    // buttonContainer.appendChild(createToolButton("Selection Tool", toggleSelectionTool));
    buttonContainer.appendChild(createToolButton("Select Parent", selectParent));
    buttonContainer.appendChild(createToolButton("Select Child", selectChild));

    mainContentContainer.appendChild(buttonContainer);
    sidebar.appendChild(mainContentContainer);
    sidebarVisible = true;
};

const createToolButton = (text, onClick) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.id = "create-tool"
    button.onclick = () => {
        onClick();
    };
    return button;
};

// New navigation functions
const selectPreviousSibling = () => {
    if (!previouslySelectedElement?.parentElement) return;
    
    const siblings = Array.from(previouslySelectedElement.parentElement.children)
        .filter(el => !isElementInSidebar(el));
    
    const currentIndex = siblings.indexOf(previouslySelectedElement);
    if (currentIndex > 0) {
        selectElement(siblings[currentIndex - 1]);
    }
};

const selectNextSibling = () => {
    if (!previouslySelectedElement?.parentElement) return;
    
    const siblings = Array.from(previouslySelectedElement.parentElement.children)
        .filter(el => !isElementInSidebar(el));
    
    const currentIndex = siblings.indexOf(previouslySelectedElement);
    if (currentIndex < siblings.length - 1) {
        selectElement(siblings[currentIndex + 1]);
    }
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
    if (!isSelecting) return;
    event.preventDefault();
    startX = event.pageX;
    startY = event.pageY;

    selectionRectangle = document.createElement("div");
    selectionRectangle.id = "selection-rectangle";
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

    const width = event.pageX - startX;
    const height = event.pageY - startY;

    selectionRectangle.style.width = `${Math.abs(width)}px`;
    selectionRectangle.style.height = `${Math.abs(height)}px`;

    selectionRectangle.style.left = width < 0 ? `${event.pageX}px` : `${startX}px`;
    selectionRectangle.style.top = height < 0 ? `${event.pageY}px` : `${startY}px`;
});

document.addEventListener("mouseup", (event) => {
    if (!isSelecting || !selectionRectangle) return;
    isSelecting = false;
    document.body.style.cursor = "default";

    const rect = selectionRectangle.getBoundingClientRect();
    selectionRectangle.remove();
    selectionRectangle = null;

    const selectedElements = Array.from(document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2))
        .filter(el => !isElementInSidebar(el) && el !== document.body && el !== document.documentElement);

    if (selectedElements.length > 0) {
        selectElement(selectedElements[0]);
    }
});

const selectElement = (element) => {
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
    
    // Store parent and siblings information
    if (element.parentElement) {
        parentElements = Array.from(element.parentElement.children)
            .filter(el => !isElementInSidebar(el));
        currentElementIndex = parentElements.indexOf(element);
    }
    
    updateXpathDisplay(childCount);
};


const isElementInSidebar = (element) => {
    const sidebar = document.getElementById("xpath-sidebar");
    return sidebar && sidebar.contains(element);
};


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