const axios = require('./axiosWrapper');
const { VIKEY_API_URL, VIKEY_API_KEY, GAIA_API_URL, GAIA_API_KEY, EMBEDDING_MODEL_MAP } = require('../config/config');

/**
 * Makes a chat completion request to vikey.ai
 * @param {string} model - Model name
 * @param {Array} messages - Chat messages
 * @param {boolean} stream - Whether to stream the response
 * @param {Object} otherParams - Additional parameters
 * @returns {Promise<Object>} - API response
 */
async function makeChatRequest(model, messages, stream = true, otherParams = {}) {
  return await axios.post(`${VIKEY_API_URL}/chat/completions`, {
    model,
    messages,
    stream,
    ...otherParams
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VIKEY_API_KEY}`,
    },
    responseType: stream ? 'stream' : 'json',
    timeout: stream ? 0 : 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeoutErrorMessage: 'Request timed out'
  });
}

/**
 * Makes a completion request to vikey.ai
 * @param {string} model - Model name
 * @param {string} prompt - Text prompt
 * @param {boolean} stream - Whether to stream the response
 * @param {Object} otherParams - Additional parameters
 * @returns {Promise<Object>} - API response
 */
async function makeCompletionRequest(model, prompt, stream = true, otherParams = {}) {
  const payload = {
    model,
    messages: [{ role: 'user', content: prompt }],
    stream,
    ...otherParams
  }
  console.log('Payload:', payload);
  return await axios.post(`${VIKEY_API_URL}/chat/completions`, payload, {
    headers: {
      'Authorization': `Bearer ${VIKEY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    responseType: stream ? 'stream' : 'json'
  }).then(response => {
    // console.log('Response:', response);
    return response;
  }).catch(error => {
    console.error('Error:', error.response.data);
    throw error;
  });
}

/**
 * Makes an embeddings request to intelligence.io.solutions
 * @param {string} model - Model name
 * @param {string|Array} input - Input for embedding
 * @param {Object} otherParams - Additional parameters
 * @returns {Promise<Object>} - API response
 */
async function makeEmbeddingsRequest(model, input, otherParams = {}) {
  try {
    // Map the model name to the corresponding intelligence.io model
    console.log(`Original model name: "${model}"`);
    const mappedModel = EMBEDDING_MODEL_MAP[model] || EMBEDDING_MODEL_MAP['default'] || 'mixedbread-ai/mxbai-embed-large-v1';
    console.log(`Mapped model name: "${mappedModel}"`);
    
    // Ensure input is properly formatted
    const formattedInput = Array.isArray(input) ? input : (typeof input === 'string' ? input : String(input));
    console.log('Formatted input:', formattedInput);
    
    // Build request payload
    const payload = {
      model: mappedModel,
      input: formattedInput,
      encoding_format: "float",
      ...otherParams
    };
    console.log('Payload for embedding request:', JSON.stringify(payload, null, 2));
    
    // Make the request
    const response = await axios.post(`${GAIA_API_URL}/embeddings`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GAIA_API_KEY}`
      }
    });
    
    return response;
  } catch (error) {
    // Improved error logging
    console.error('Error in makeEmbeddingsRequest:');
    console.error('- Status:', error.response?.status);
    console.error('- Message:', error.message);
    console.error('- Response data:', error.response?.data);
    console.error('- Original model:', model);
    console.error('- Input type:', typeof input);
    throw error;
  }
}

module.exports = {
  makeChatRequest,
  makeCompletionRequest,
  makeEmbeddingsRequest
}; 