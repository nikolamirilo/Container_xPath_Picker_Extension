function handleSelectRightContainerClick(selectedXPath, containersList) {
    let allContainersMatched = [];
    const paths = selectedXPath.split('/').filter(Boolean);

    for (let i = paths.length - 1; i >= 0; i--) {
        const shorterPath = '/' + paths.slice(0, i + 1).join('/');
        const matchToRealPageXPath = matchXpathAgainstAllOthers(shorterPath, containersList, 'from_webapp_xpath_to_container_xpath');
        if (matchToRealPageXPath !== null) {
            const colDataMatched = getContainerDataFromContainerXPath(matchToRealPageXPath, containersList);
            if (colDataMatched) allContainersMatched.push(colDataMatched);
        }
    }

    const containersMatchedToAdd = addParentContainersOfXpathToContainersMatching(allContainersMatched, 4, containersList);
    const containersMatching = allContainersMatched.concat(containersMatchedToAdd);

    containersMatching.sort((a, b) => {
        const scoreA = getSimilarityScore(selectedXPath, a.xpath);
        const scoreB = getSimilarityScore(selectedXPath, b.xpath);
        return scoreB - scoreA;
    });

    return containersMatching;
}

function getSimilarityScore(xpath1, xpath2) {
    const parts1 = xpath1.split('/');
    const parts2 = xpath2.split('/');
    let score = 0;
    const minLength = Math.min(parts1.length, parts2.length);
    for (let i = 0; i < minLength; i++) {
        if (parts1[i] === parts2[i]) score++;
    }
    return score;
}

function matchXpathAgainstAllOthers(xpath, containersList, sense) {
    if (sense === 'from_webapp_xpath_to_container_xpath') {
        const m1 = matchXpathClickedToContainerXpath(xpath, containersList, 1);
        if (m1 !== null) return m1;
        const m2 = matchXpathClickedToContainerXpath(xpath, containersList, 2);
        if (m2 !== null) return m2;
        const m3 = matchXpathClickedToContainerXpath(xpath, containersList, 3);
        if (m3 !== null) return m3;
    }
    return null;
}

function matchXpathClickedToContainerXpath(xpath, containersList, algo) {
    const xpathBaseSplit = xpath.split('/');
    const xpathBaseSplitLength = xpathBaseSplit.length;
    if (algo === 1) {
        if (containersList.some(container => container.xpath === xpath)) return xpath;
    }
    if (algo === 2) {
        const containersWithSameLength = containersList.filter(container => container.xpath.split('/').length === xpathBaseSplitLength);
        for (const container of containersWithSameLength) {
            if (doXpathsAreIdentical(container.xpath, xpath)) return container.xpath;
        }
    }
    if (algo === 3) {
        const containersWithSameLength = containersList.filter(container => container.xpath.split('/').length === xpathBaseSplitLength);
        for (const container of containersWithSameLength) {
            if (doXpathsAreIdenticalAllowDigitDiff(container.xpath, xpath)) return container.xpath;
        }
    }
    return null;
}

function doXpathsAreIdentical(xpath1, xpath2) {
    if (xpath1.split('/').length !== xpath2.split('/').length) return false;
    for (let partId = 0; partId < xpath1.split('/').length; partId++) {
        const xpathPart = xpath1.split('/')[partId];
        const xpathPart2 = xpath2.split('/')[partId];
        if (xpathPart !== xpathPart2) {
            const resRepl1 = xpathPart.replace(xpathPart2, "");
            const resRepl2 = xpathPart2.replace(xpathPart, "");
            if (resRepl2 !== "[1]" && resRepl1 !== "[1]") return false;
        }
    }
    return true;
}

function doXpathsAreIdenticalAllowDigitDiff(xpath1, xpath2) {
    if (xpath1.split('/').length !== xpath2.split('/').length) return false;
    let cntWith1DigitDiff = 0;
    for (let partId = 0; partId < xpath1.split('/').length; partId++) {
        const xpathPart = xpath1.split('/')[partId];
        const xpathPart2 = xpath2.split('/')[partId];
        if (xpathPart !== xpathPart2) {
            const resRepl1 = xpathPart.replace(xpathPart2, "");
            const resRepl2 = xpathPart2.replace(xpathPart, "");
            const intFromRepl1 = extractIntegerFromString(xpathPart);
            const intFromRepl2 = extractIntegerFromString(xpathPart2);
            const resRepl1FirstLetters = xpathPart.split('[')[0];
            const resRepl2FirstLetters = xpathPart2.split('[')[0];
            const absDigitDiff = getAbsoluteDifference(intFromRepl1, intFromRepl2);
            if (resRepl2 === "[1]" || resRepl1 === "[1]") continue;
            else if (resRepl1FirstLetters === resRepl2FirstLetters && absDigitDiff === 1) {
                cntWith1DigitDiff += 1;
            } else return false;
        }
    }
    if (cntWith1DigitDiff > 1) return false;
    return true;
}

function extractIntegerFromString(inputString) {
    const match = inputString.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

function getAbsoluteDifference(num1, num2) {
    if (isNaN(num1) || isNaN(num2)) return null;
    return Math.abs(num1 - num2);
}

function addParentContainersOfXpathToContainersMatching(containersMatching, levelsBack, containersList) {
    let lastLengthXpathRec = 10000;
    let smallestLengthXpath = null;

    for (const colData of containersMatching) {
        if (colData.xpath.length < lastLengthXpathRec) {
            lastLengthXpathRec = colData.xpath.length;
            smallestLengthXpath = colData.xpath;
        }
    }

    const containers = [];
    for (let lb = 1; lb <= levelsBack; lb++) {
        const parentXpath = getXpathParentBackFromXpath(smallestLengthXpath, lb);
        const parentXpathContainer = containersList.find(container => container.xpath === parentXpath);
        if (parentXpathContainer) containers.push(parentXpathContainer);
    }

    return containers;
}

function getXpathParentBackFromXpath(xpath, levelsBack) {
    if(xpath){
        const parts = xpath.split('/');
        parts.splice(-levelsBack);
        return parts.join('/');
    }
}

function getContainerDataFromContainerXPath(xpath, containersList) {
    return containersList.find(container => container.xpath === xpath);
}

//xPath Handling Basic

const getXPath = (el) => {
    if (!el || el.nodeType !== 1) return "";
    if (el === document.body) return "/html/body";

    let index = 1;
    let sibling = el.previousElementSibling;
    
    while (sibling) {
        if (sibling.nodeName === el.nodeName) {
            index++;
        }
        sibling = sibling.previousElementSibling;
    }

    const parentXPath = getXPath(el.parentElement);
    const tagName = el.tagName.toLowerCase();
    
    return index > 1 
        ? `${parentXPath}/${tagName}[${index}]`
        : `${parentXPath}/${tagName}`;
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

const isElementInSidebar = (element) => {
    const sidebar = document.getElementById("xpath-sidebar");
    return sidebar && sidebar.contains(element);
};

const getElementDepth = (el) => {
    let depth = 0;
    while (el.parentElement) {
        depth++;
        el = el.parentElement;
    }
    return depth;
};