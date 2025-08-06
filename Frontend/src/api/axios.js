import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Function to delay execution (for retry logic)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 429 Too Many Requests error
    if (error.response?.status === 429) {
      // Get retry delay from Retry-After header or use exponential backoff
      const retryAfter = error.response.headers['Retry-After'];
      const delayMs = retryAfter 
        ? parseInt(retryAfter) * 1000 
        : Math.min(1000 * Math.pow(2, originalRequest._retryCount || 0), 30000); // Max 30 seconds
      
      // Set retry count if not exists
      originalRequest._retryCount = originalRequest._retryCount || 0;
      
      // Only retry up to 3 times
      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount += 1;
        
        console.log(`Retrying request after ${delayMs}ms (attempt ${originalRequest._retryCount})`);
        await delay(delayMs);
        
        // Retry the request
        return api(originalRequest);
      } else {
        // Show user-friendly message after max retries
        if (typeof window !== 'undefined') {
          const errorMessage = document.createElement('div');
          errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
          errorMessage.innerHTML = `
            <div class="flex items-center">
              <div class="mr-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-bold">Too Many Requests</h3>
                <p class="text-sm">Please wait a moment before trying again.</p>
              </div>
            </div>
          `;
          document.body.appendChild(errorMessage);
          
          // Remove the message after 5 seconds
          setTimeout(() => {
            document.body.removeChild(errorMessage);
          }, 5000);
        }
      }
    }
    
    // Handle 401 errors
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth state
      localStorage.removeItem('token');
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;