// Exporting the function to retrieve CSRF token from the cookie
export const getCsrfTokenFromCookie = () => {
    // Match the csrftoken cookie in the browser
    const match = document.cookie.match(/csrftoken=([\w-]+)/);
    return match ? match[1] : null;  // Return the token if found, else null
  };