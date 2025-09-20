// Logging middleware for sending app logs to evaluation service
const LOGGING_CONFIG = {
  API_URL: 'http://20.244.56.144/evaluation-service/logs',
  AUTH_TOKEN: process.env.LOGGING_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIxMDAwMDE3OTEzQGRpdC5lZHUuaW4iLCJleHAiOjE3NTgzNDc4NTAsImlhdCI6MTc1ODM0Njk1MCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjA0YzdhNDA2LTQ4MjctNDA3NC1iN2I1LWEwNzY5Nzc2ZWEwYyIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InN1am95IGJvc2UiLCJzdWIiOiJiNDk2OGMxNy1mYTVlLTQ2YTctOWQyOC04NTQzMDY5ZTNiMjkifSwiZW1haWwiOiIxMDAwMDE3OTEzQGRpdC5lZHUuaW4iLCJuYW1lIjoic3Vqb3kgYm9zZSIsInJvbGxObyI6IjIyMDEwMjExMSIsImFjY2Vzc0NvZGUiOiJTa21uZXciLCJjbGllbnRJRCI6ImI0OTY4YzE3LWZhNWUtNDZhNy05ZDI4LTg1NDMwNjllM2IyOSIsImNsaWVudFNlY3JldCI6IkpWdWpidUVwa3lGa2VHUGEifQ.yNeepM_La_z3eOkspsVfF7jmfEMhPA5pWKzu8cfDpwc'
};

const ALLOWED_STACKS = ['backend', 'frontend'];
const ALLOWED_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

// Package validation rules
const BACKEND_PACKAGES = [
  'cache', 'controller', 'cron_job', 'db', 'domain', 
  'handler', 'repository', 'route', 'service'
];

const FRONTEND_PACKAGES = ['api'];

const SHARED_PACKAGES = ['auth', 'config', 'middleware', 'utils'];

function isValidPackage(stack, packageName) {
  if (SHARED_PACKAGES.includes(packageName)) {
    return true;
  }
  
  if (stack === 'backend') {
    return BACKEND_PACKAGES.includes(packageName);
  } else if (stack === 'frontend') {
    return FRONTEND_PACKAGES.includes(packageName);
  }
  
  return false;
}

// Main logging function - sends logs to evaluation service
async function Log(stack, level, packageName, message) {
  try {
    // Validate inputs
    if (!ALLOWED_STACKS.includes(stack)) {
      console.error(`Invalid stack: ${stack}. Must be one of: ${ALLOWED_STACKS.join(', ')}`);
      return;
    }
    
    if (!ALLOWED_LEVELS.includes(level)) {
      console.error(`Invalid level: ${level}. Must be one of: ${ALLOWED_LEVELS.join(', ')}`);
      return;
    }
    
    if (!isValidPackage(stack, packageName)) {
      console.error(`Invalid package: ${packageName} for stack: ${stack}`);
      return;
    }
    
    const logPackage = {
      stack: stack.toLowerCase(),
      level: level.toLowerCase(),
      package: packageName.toLowerCase(),
      message: message
    };
    
    // Send log to evaluation service
    const response = await fetch(LOGGING_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOGGING_CONFIG.AUTH_TOKEN}`
      },
      body: JSON.stringify(logPackage)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`Log sent successfully with ID: ${result.logID}`);
    
    return result;
    
  } catch (error) {
    console.error(`Failed to send log: ${error.message}`);
  }
}

module.exports = { Log };