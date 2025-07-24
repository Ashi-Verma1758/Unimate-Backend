// src/config/jwt.config.js
// NO dotenv.config() here!

let _ACCESS_SECRET = null; // Use null initially, clearly not undefined
let _REFRESH_SECRET = null;

export const initializeJwtSecrets = (accessSecret, refreshSecret) => {
    if (!accessSecret || !refreshSecret) {
         console.error('FATAL ERROR (Initialization): JWT secrets were not passed correctly during initialization!');
         // Consider throwing an error or exiting here if this happens
         return;
    }
    _ACCESS_SECRET = accessSecret;
    _REFRESH_SECRET = refreshSecret;
    console.log('--- JWT Secrets Initialized (jwt.config.js callback): Secrets are now set.');
};

export const getAccessSecret = () => {
    if (_ACCESS_SECRET === null) { // Check for null, not just undefined
        console.error('ERROR: ACCESS_SECRET accessed before proper initialization! Returned null.');
        // Consider throwing an error here in production to catch uninitialized access
        // throw new Error('ACCESS_SECRET not initialized.');
    }
    return _ACCESS_SECRET;
};

export const getRefreshSecret = () => {
     if (_REFRESH_SECRET === null) { // Check for null, not just undefined
        console.error('ERROR: REFRESH_SECRET accessed before proper initialization! Returned null.');
     }
    return _REFRESH_SECRET;
};

// This log will STILL show undefined on initial module load because initializeJwtSecrets hasn't run yet.
// This is expected and harmless now, as secrets are retrieved via getters later.
console.log('--- DEBUGGING: ACCESS_TOKEN_SECRET value in jwt.config.js when loaded (initial):', process.env.ACCESS_TOKEN_SECRET);