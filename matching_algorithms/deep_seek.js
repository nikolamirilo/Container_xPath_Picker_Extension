function normalizeXPath(xpath) {
    const parts = xpath.split('/').filter(p => p !== ''); // Split into parts and remove empty strings
    const normalizedParts = parts.map(part => {
      const match = part.match(/^([^\[]+)(?:\[(\d+)\])?$/);
      if (!match) return part; // Fallback for unexpected formats
      const tag = match[1];
      const index = match[2] ? parseInt(match[2], 10) : 1;
      return index === 1 ? tag : `${tag}[${index}]`;
    });
    return '/' + normalizedParts.join('/');
  }
  
  function handleSelectRightContainerClick(
    xpath_of_clicked_el,
    all_containers_matched = []
  ) {
    const paths = xpath_of_clicked_el.split('/').filter(Boolean);
    for (let i = paths.length - 1; i >= 0; i--) {
      const shorterPath = '/' + paths.slice(0, i + 1).join('/');
      const normalizedShorter = normalizeXPath(shorterPath);
      for (const container of all_containers_matched) {
        const containerNormalized = normalizeXPath(container.xpath);
        if (containerNormalized === normalizedShorter) {
          console.log('Matching container found:', container);
          return container;
        }
      }
    }
    console.log('No matching container found.');
    return null;
  }
  
  const containers = [
    // Original test cases
    {
      xpath: '/html/body/div[2]/div/header/div[1]/div[7]/div/ul[2]',
      id: 'container-1',
    },
    {
      xpath: '/html/body/div/div/span[2]',
      id: 'container-2',
    },
  
    // New edge cases
    {
      xpath: '/html/body/div[1]/section[1]/main/div[3]',
      id: 'container-3',
    },
    {
      xpath: '/html/body/div/section/main/div[3]',
      id: 'container-4',
    },
    {
      xpath: '/html/body/div[2]/div[2]/span',
      id: 'container-5',
    },
    {
      xpath: '/html/body/div/div[2]/span[1]',
      id: 'container-6',
    },
    {
      xpath: '/html/body/div[1]/div[2]/span',
      id: 'container-7',
    },
    {
      xpath: '/html/body/div/header/div/ul/li[5]',
      id: 'container-8',
    },
    {
      xpath: '/html/body/div/div/div/div',
      id: 'container-9',
    },
    {
      xpath: '/html/body/div[1]/div[1]/div[1]/div[1]',
      id: 'container-10',
    },
  ];
  
  // Test scenarios
  const testCases = [
    {
      input: '/html/body/div[1]/div/span[2]',
      expected: 'container-2',
      description: 'Basic [1] index vs no index',
    },
    {
      input: '/html/body/div[2]/div[2]/span[1]',
      expected: 'container-5',
      description: 'Matching multiple indices',
    },
    {
      input: '/html/body/div/section[1]/main/div[3]',
      expected: 'container-3',
      description: 'Mixed index positions',
    },
    {
      input: '/html/body/div/div[2]/span',
      expected: 'container-7',
      description: 'Different index positions in path',
    },
    {
      input: '/html/body/div[1]/div[1]/div[1]/div[1]',
      expected: 'container-10',
      description: 'All indices explicit',
    },
    {
      input: '/html/body/div/div/div/div',
      expected: 'container-9',
      description: 'No indices at all',
    },
    {
      input: '/html/body/div/header/div/ul/li[5]',
      expected: 'container-8',
      description: 'Deep nesting with index',
    },
    {
      input: '/html/body/div[2]/div/header/div[1]/div[7]/div/ul[2]/li',
      expected: 'container-1',
      description: 'Longer path than container',
    },
    {
      input: '/html/body/div[3]/div',
      expected: null,
      description: 'Non-existing path',
    },
  ];
  
  // Run tests
  testCases.forEach(({ input, expected, description }) => {
    console.log(`Testing: ${description}`);
    console.log(`Input: ${input}`);
    const result = handleSelectRightContainerClick(input, containers);
  
    if (result?.id === expected || (result === null && expected === null)) {
      console.log('✅ Test passed');
    } else {
      console.log('❌ Test failed');
      console.log(`Expected: ${expected}`);
      console.log(`Received: ${result?.id || null}`);
    }
    console.log('\n');
  });
  