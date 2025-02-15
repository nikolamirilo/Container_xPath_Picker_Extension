let previouslySelectedElement = null;
let currentXPath = null;
let isSelecting = false;
let startX = 0,
    startY = 0;
let selectionRectangle = null;
let sidebarVisible = true;
// let urlParams = new URLSearchParams(window.location.search);
let urlXPath = "";
let currentElementIndex = -1;
let parentElements = [];

const getUrlParams = () => new URLSearchParams(window.location.search);
const urlParams = getUrlParams();

const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('styles.css');
document.head.appendChild(link);

const shouldOpenExtension = () => {
    const scraper = JSON.parse(localStorage.getItem("scraper"))
    if(urlParams.get("webapp_extension")?.toLowerCase() === "true" || scraper.extension){
        return true
    }
}

chrome.runtime.sendMessage(
    { action: "fetchData", data: { robot_id: urlParams.get("webapp_robot_id"), javascript: null, ufn: urlParams.get("ufn")} },
    res => {
        if (!res || !res.data || !res.data.robot_full) {
            console.error("Invalid response:", res);
            return;
        }

        const robotData = res.data.robot_full;
        console.log("Robot Data:", robotData);
        const mode = robotData.request?.mode || "detail"
        const containers = robotData.response.containers.filter(item => item.mode == mode)
        localStorage.setItem("containers", JSON.stringify(containers))
        const scraper = {
            robot_id: urlParams.get("webapp_robot_id"),
            xpath: urlParams.get("webapp_xpath"),
            mode: mode, 
            ufn: urlParams.get("ufn"),
            extension: true
        };
        localStorage.setItem("scraper", JSON.stringify(scraper));
    }
);


const openExtension = async () => {
    createSidebar();
    const scraper = JSON.parse(localStorage.getItem("scraper"))
    const xpath = urlParams.get("webapp_xpath") || scraper.xpath;
    console.log(xpath)
    if (xpath) {
        const element = getElementByXPath(xpath);
        if (element) {
            selectElement(element);
        }
    } else {
        console.warn("No valid XPath found in scraper data.");
    }
};


window.addEventListener("beforeunload", () => {
    localStorage.clear();
});


window.addEventListener("load", () => {
    localStorage.setItem("test", "test")
    if (shouldOpenExtension()) {
        if (urlParams.has("ufn")) {
            openExtension();
        } else {
            alert("You don't have the correct link");
        }
    }
});


const createSidebar = () => {
    const sidebar = document.createElement("div");
    sidebar.id = "xpath-sidebar";
    document.body.appendChild(sidebar);

    const mainContentContainer = document.createElement("div");
    mainContentContainer.id = "main-content-container";

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

    const xpathContainer = document.createElement("div");
    xpathContainer.id = "xpath-container";
    xpathContainer.innerHTML = `
        <div id="content">
            <p style="color:black; margin: 0 0 5px 0;">xPath: ${currentXPath || ''}</p>
            <button id="copy-button">Copy</button>
        </div>
    `;
    mainContentContainer.appendChild(xpathContainer);

    const buttonContainer = document.createElement("div");
    buttonContainer.id = "button-container"

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
    if (!element || !shouldOpenExtension()) return;
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



const updateXpathDisplay = (childCount = 0) => {
    const xpathContainer = document.getElementById("xpath-container");
    if (!xpathContainer) return;

    const scraper = JSON.parse(localStorage.getItem("scraper") || "{}");
    const containers = JSON.parse(localStorage.getItem("containers") || "[]");

    if (!currentXPath) {
        console.warn("No valid XPath found.");
        xpathContainer.innerHTML = `<p style="color:red;">No valid XPath found.</p>`;
        return;
    }

    const matchXpath = handleSelectRightContainerClick(currentXPath, containers)[0]

    let key = "N/A", value = "N/A";
    if (matchXpath && matchXpath.scoring) {
        const firstEntry = Object.entries(matchXpath.scoring)[0];
        if (firstEntry) {
            [key, value] = firstEntry;
        }
    }

    xpathContainer.innerHTML = `
    <div style="display:flex;flex-direction:column;">
        <p style="font-size: 16px;color:black;margin-bottom:4px;">Robot ID: <strong>${scraper.robot_id || "N/A"}</strong></p>
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
        <p style="font-size: 16px;color:black;">${scraper.mode === "list" ? "real_nbr_rows" : "real_nbr_items"}: <strong>${childCount}</strong></p>
        <span style="font-size: 16px;color:black;">${scraper.mode === "list" ? "robot_nbr_rows" : "robot_nbr_items"}: <strong>${value}</strong></span>
        <span style="font-size: 16px;color:black;">${matchXpath ? "Match" : "No match"}</span>
        <span style="font-size: 16px;color:red;">${(matchXpath && childCount != value) ? "Note: The extracted number of rows/items does not match the actual count.": ""}</span>
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


