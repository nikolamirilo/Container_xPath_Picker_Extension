chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchData") {
        const baseUrl = 'https://api.minexa.ai/piece_robot/';
        const data = {
            action: `show_full_json,check_valid_ufn `,
            robot_id: message.data.robot_id,
            javascript: null,
            term: null,
            ufn: message.data.ufn,
          };
        
          const headers = new Headers({
            'Content-Type': 'application/json',
            'api-key': 'RNn3gpyZ24IzuBjbt4W9kG9KuebN1mgyUUneH6wrlQmjmUAcNJ',
          });
          const options = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
          };
        fetch(baseUrl, options)
      .then(response => response.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
  
      return true; 
    }
  });
  