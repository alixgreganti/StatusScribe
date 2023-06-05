// Function to parse the Retry-After header
function parseRetryAfterHeader(retryAfter) {
    const value = parseInt(retryAfter);
    if (isNaN(value)) {
      // It's a date
      const retryDate = new Date(retryAfter);
      return (retryDate.getTime() - Date.now()) / 1000;
    } else {
      // It's a delay in seconds
      return value;
    }
  }
  
  // Modify pingURL to accept a URL parameter and return a promise
  function pingURL(URL) {
    return new Promise((resolve, reject) => {
      var settings = {
        cache: false,
        dataType: "jsonp",
        async: true,
        crossDomain: true,
        url: URL,
        method: "GET",
        headers: {
          accept: "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        complete: function (xhr) {
          if (xhr.status === 429) {
            const retryAfter = xhr.getResponseHeader('Retry-After');
            if (retryAfter) {
              const delayInSeconds = parseRetryAfterHeader(retryAfter);
              console.log(`Too Many Requests. Retrying in ${delayInSeconds} seconds.`);
              setTimeout(() => pingURL(URL).then(resolve).catch(reject), delayInSeconds * 1000);
            } else {
              resolve(429);
            }
          } else {
            resolve(xhr.status);
          }
        },
      };
  
      // Send the request and resolve the promise with the status code
      $.ajax(settings);
    });
  }
  
  // Call pingURL for each URL when the page loads
  $(document).ready(function() {
    const services = [
      { name: 'otr', url: 'http://ourtrainingroom.com' },
      { name: 'datalynk', url: 'http://sandbox.auxiliumgroup.com' },
      { name: 'api', url: 'http://api.datalynk.ca' },
    ];
  
    services.forEach(service => {
      pingURL(service.url).then(status => {
        // Update the status text
        $(`#${service.name}_status`).text(status === 200 ? 'ONLINE' : status === 429 ? 'PENDING' : 'OFFLINE');
  
        // Update the blinker color
        const blinker = $(`#${service.name}_status`).next().children();
        blinker.removeClass('status_online status_offline status_pending');
        blinker.addClass(status === 200 ? 'status_online' : status === 429 ? 'status_pending' : 'status_offline');
      });
    });
  });
  