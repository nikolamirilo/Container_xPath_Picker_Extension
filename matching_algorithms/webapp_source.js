function handleSelectRightContainerClick(selectedXPath, containersList) {
    let allContainersMatched = [];

    // Split the selected XPath into parts
    const paths = selectedXPath.split('/').filter(Boolean);

    // Iterate through the XPath parts to find matching containers
    for (let i = paths.length - 1; i >= 0; i--) {
        const shorterPath = '/' + paths.slice(0, i + 1).join('/');

        // Match the shorter XPath against all containers
        const matchToRealPageXPath = matchXpathAgainstAllOthers(shorterPath, containersList, 'from_webapp_xpath_to_container_xpath');

        if (matchToRealPageXPath !== null) {
            const colDataMatched = getContainerDataFromContainerXPath(matchToRealPageXPath, containersList);
            if (colDataMatched) {
                allContainersMatched.push(colDataMatched);
            }
        }
    }

    // Add parent containers of the smallest XPath to the matching containers
    const containersMatchedToAdd = addParentContainersOfXpathToContainersMatching(allContainersMatched, 4, containersList);
    const containersMatching = allContainersMatched.concat(containersMatchedToAdd);

    return containersMatching;
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
    const lastXpathPart = xpathBaseSplit[xpathBaseSplitLength - 1];

    if (algo === 1) {
        if (containersList.some(container => container.xpath === xpath)) {
            return xpath;
        }
    }

    if (algo === 2) {
        const containersWithSameLength = containersList.filter(container => container.xpath.split('/').length === xpathBaseSplitLength);
        for (const container of containersWithSameLength) {
            if (doXpathsAreIdentical(container.xpath, xpath)) {
                return container.xpath;
            }
        }
    }

    if (algo === 3) {
        const containersWithSameLength = containersList.filter(container => container.xpath.split('/').length === xpathBaseSplitLength);
        for (const container of containersWithSameLength) {
            if (doXpathsAreIdenticalAllowDigitDiff(container.xpath, xpath)) {
                return container.xpath;
            }
        }
    }

    return null;
}

function doXpathsAreIdentical(xpath1, xpath2) {
    if (xpath1.split('/').length !== xpath2.split('/').length) {
        return false;
    }

    for (let partId = 0; partId < xpath1.split('/').length; partId++) {
        const xpathPart = xpath1.split('/')[partId];
        const xpathPart2 = xpath2.split('/')[partId];

        if (xpathPart !== xpathPart2) {
            const resRepl1 = xpathPart.replace(xpathPart2, "");
            const resRepl2 = xpathPart2.replace(xpathPart, "");

            if (resRepl2 !== "[1]" && resRepl1 !== "[1]") {
                return false;
            }
        }
    }

    return true;
}

function doXpathsAreIdenticalAllowDigitDiff(xpath1, xpath2) {
    if (xpath1.split('/').length !== xpath2.split('/').length) {
        return false;
    }

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

            if (resRepl2 === "[1]" || resRepl1 === "[1]") {
                // Proceed if one of them is [1]
            } else if (resRepl1FirstLetters === resRepl2FirstLetters && absDigitDiff === 1) {
                cntWith1DigitDiff += 1;
            } else {
                return false;
            }
        }
    }

    if (cntWith1DigitDiff > 1) {
        return false;
    }

    return true;
}

function extractIntegerFromString(inputString) {
    const match = inputString.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

function getAbsoluteDifference(num1, num2) {
    if (isNaN(num1) || isNaN(num2)) {
        return null;
    }
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
        if (parentXpathContainer) {
            containers.push(parentXpathContainer);
        }
    }

    return containers;
}

function getXpathParentBackFromXpath(xpath, levelsBack) {
    const parts = xpath.split('/');
    parts.splice(-levelsBack);
    return parts.join('/');
}

function getContainerDataFromContainerXPath(xpath, containersList) {
    return containersList.find(container => container.xpath === xpath);
}
// Sample containersList
const containersList = [
    {
        id: 1,
        xpath: "/html/body/div[1]/div[2]/div[3]",
        mode: "list",
        scoring: { nbr_rows: 10, rows_regularity: 0.9 }
    },
    {
        id: 2,
        xpath: "/html/body/div[1]/div[2]/div[3]/div[1]",
        mode: "list",
        scoring: { nbr_rows: 5, rows_regularity: 0.8 }
    },
    {
        id: 3,
        xpath: "/html/body/div[1]/div[2]/div[4]",
        mode: "detail",
        scoring: { nbr_items: 3 }
    },
    {
        id: 4,
        xpath: "/html/body/div[1]/div[2]",
        mode: "list",
        scoring: { nbr_rows: 15, rows_regularity: 0.95 }
    }
];

// Selected XPath
const selectedXPath = "/html/body/div[1]/div[2]/div[3]/div[1]";

// Expected Output
const expectedOutput = [
    {
        id: 2,
        xpath: "/html/body/div[1]/div[2]/div[3]/div[1]",
        mode: "list",
        scoring: { nbr_rows: 5, rows_regularity: 0.8 }
    },
    {
        id: 1,
        xpath: "/html/body/div[1]/div[2]/div[3]",
        mode: "list",
        scoring: { nbr_rows: 10, rows_regularity: 0.9 }
    },
    {
        id: 4,
        xpath: "/html/body/div[1]/div[2]",
        mode: "list",
        scoring: { nbr_rows: 15, rows_regularity: 0.95 }
    }
];

// Run the function
const result = handleSelectRightContainerClick(selectedXPath, containersList);

// Verify the result
console.log("Test Result:");
console.log("Expected Output:", JSON.stringify(expectedOutput, null, 2));
console.log("Actual Output:", JSON.stringify(result, null, 2));

// Assertion
const isEqual = JSON.stringify(result) === JSON.stringify(expectedOutput);
console.log("Test Passed:", isEqual);