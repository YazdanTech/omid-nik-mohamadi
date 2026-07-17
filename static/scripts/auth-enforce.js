function enforceAuth(actionCallback) {
  if (window.isUserAuthenticated) {
    // User is signed in -> execute the next step (booking or checkout)
    actionCallback();
  } else {
    // User is a guest -> open your auth overlay module
    if (window.AuthModule && typeof window.AuthModule.open === 'function') {
      window.AuthModule.open();
    } else if (typeof openAuthOverlay === 'function') {
      openAuthOverlay(); // Fallback to your overlay's global initialization function
    } else {
      console.error("Auth overlay function not found.");
    }
  }
}