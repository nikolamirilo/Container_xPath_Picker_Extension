const testList = "https://www.binance.com/en/markets/trading_data/rankings?webapp_extension=true&webapp_xpath=/html/body/div[3]/div[1]/div[1]/div[1]/main[1]/div[1]/div[3]/div[2]/div[1]/div[1]/div[1]/div[2]&ufn=232323&webapp_robot_id=2323"
const testDetail = "https://www.amazon.com/HP-Newest-Business-Numeric-Windows/dp/B0D4RH881B/ref=sr_1_1?crid=1KBEVMH02OXT3&dib=eyJ2IjoiMSJ9.fZ9KuA7HDCA06G7wv12SgBAn0MmYyoDzGZ1JO54r1rXunAWhnxWFlUP2X5vYR3tVwDpnnQer_o8uDRh4FRK2XFg5bRwKU7xTULY4gw1jy0smTedXUiPkbheaUNjglCjh0dYz6PuHNlhTLxaoZ788tzP3BfsU8PFQsZV3ew2348-npHvmi7rm58KSTU3n_iVPM6TNSw_DQ35lgZf-psvSM31a5Pipjlv-3I6kjaL5piA.zSoimGrE0-c2etDst3OsPSbQMMKDgDwXoYUkz10fNSU&dib_tag=se&keywords=laptops&qid=1723899784&refinements=p_n_condition-type%3A2224371011%2Cp_n_size_browse-bin%3A2423841011%2Cp_n_feature_thirty-three_browse-bin%3A23720422011%2Cp_n_feature_two_browse-bin%3A5446812011%2Cp_n_operating_system_browse-bin%3A23724789011%2Cp_n_feature_four_browse-bin%3A18107802011%7C21354490011%2Cp_n_feature_six_browse-bin%3A2057528011%7C3492020011%7C3492021011%2Cp_n_feature_five_browse-bin%3A24044950011&rnid=24044690011&sprefix=laptops%2Caps%2C209&sr=8-1&th=1&webapp_extension=true&webapp_xpath=%2Fhtml%2Fbody%2Fdiv%2Fdiv%2Fdiv%2Fdiv%5B4%5D%2Fdiv%5B4%5D&ufn=232323&webapp_robot_id=2323"

const baseUrl = 'https://api.minexa.ai/piece_robot/';

function handleCheckDataClick(robot_id, javascript, ufn) {
  const data = {
    action: `show_full_json,check_valid_ufn `,
    robot_id: robot_id,
    javascript: javascript,
    term: null,
    ufn: ufn,
  };

  const headers = new Headers({
    'Content-Type': 'application/json',
    'api-key': 'ruli5tfVChHuYwKzREw6BESKH5FI6rYUjZaWbe2oNQhXSmLP0C',
  });

  const options = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data),
  };
  // Perform the POST request
  return fetch(baseUrl, options)
    .then(response => {
      if (!response.ok) {
        console.log(response)
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Parse and return JSON response
    })
    .then(response => {
      console.log(response);
      return response; // Return the response for further use
    })
    .catch(error => {
      console.error('Error occurred:', error);
      return { error: error.message }; // Return error as object
    });
}

// Example usage:
handleCheckDataClick(548, null, 'ac63c21021528d66ddf115663e5dc44e');
