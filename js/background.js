chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('../main.html', {
    id: "GContactExample",
    bounds: {
      width: 500,
      height: 600
    },
    minWidth: 500,
    minHeight: 600,
    frame: 'none'
  });
});

chrome.runtime.onInstalled.addListener(function() {
  console.log('installed');
});

chrome.runtime.onSuspend.addListener(function() { 
  // Effectuer des taches simple de nétoyage
});
