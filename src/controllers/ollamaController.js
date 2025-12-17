const { getModelList, transformChatResponse } = require('../utils/modelUtils');
const { makeChatRequest, makeCompletionRequest, makeEmbeddingsRequest } = require('../utils/apiUtils');

/**
 * Handler for GET /api/tags endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getModels(req, res) {
  res.json(getModelList());
}

/**
 * Handler for POST /api/chat endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function chat(req, res) {
  try {
    const { model, messages, stream = true, ...otherParams } = req.body;
    
    const response = await makeChatRequest(process.env.DEFAULT_MODEL || "llama-3.1-8b-instruct", messages, stream, otherParams);
    
    if (stream) {
      let buffer = '';
      
      response.data.on('data', chunk => {
        try {
          // Append the new chunk to our buffer
          buffer += chunk.toString();
          
          // Process any complete messages in the buffer
          while (true) {
            const messageEnd = buffer.indexOf('\n');
            if (messageEnd === -1) break; // No complete message yet
            
            const message = buffer.slice(0, messageEnd);
            buffer = buffer.slice(messageEnd + 1);
            
            // Skip empty messages
            if (!message.trim()) continue;
            
            // Remove 'data: ' prefix if present and parse the JSON
            const jsonStr = message.replace(/^data: /, '');
            
            // Skip [DONE] message
            if (jsonStr.trim() === '[DONE]') continue;
            
            const vikeyResponse = JSON.parse(jsonStr);
            const streamResponse = {
              model: model || "meta-llama/Meta-Llama-3-8B-Instruct",
              created_at: new Date().toISOString(),
              message: {
                role: "assistant",
                content: vikeyResponse.choices[0].delta.content || ""
              },
              done: false
            };
            
            // Send the JSON response
            res.header('Content-Type', 'application/json');
            res.write(JSON.stringify(streamResponse) + '\n');
          }
        } catch (error) {
          console.error('Error processing stream chunk:', error);
          console.log('Problematic chunk:', chunk.toString());
        }
      });

      response.data.on('end', () => {
        const finalResponse = {
          model: model || "qwen2.5:0.5b",
          created_at: new Date().toISOString(),
          message: {
            role: "assistant",
            content: ""
          },
          done: true,
          done_reason: "stop",
          total_duration: Math.floor(Math.random() * 20000000000),
          load_duration: Math.floor(Math.random() * 3000000000),
          prompt_eval_count: Math.floor(Math.random() * 50) + 10,
          prompt_eval_duration: Math.floor(Math.random() * 500000000),
          eval_count: Math.floor(Math.random() * 1000) + 100,
          eval_duration: Math.floor(Math.random() * 17000000000)
        };
        
        // Send the final JSON response
        res.write(JSON.stringify(finalResponse) + '\n');
        res.end();
      });
    } else {
      // For non-streaming, transform the response to match Ollama format
      const vikeyResponse = response.data;
      vikeyResponse.model = model;
      res.json(transformChatResponse(model, messages, vikeyResponse));
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error.message);
    res.status(500).json({ error: 'Failed to proxy request', details: error.message });
  }
}

/**
 * Handler for POST /api/generate endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function generate(req, res) {
  try {
    // Parse request body if necessary
    const body = parseRequestBody(req);
    
    // Extract parameters with fallbacks
    const model = body.model || 'qwen2.5:0.5b';
    const prompt = body.prompt || '';
    const stream = body.stream === false ? false : true;
    const { model: _, prompt: __, stream: ___, ...otherParams } = body;
    
    console.log('Generate with model:', model);
    console.log('Prompt:', prompt);
    
    const response = await makeCompletionRequest(process.env.DEFAULT_MODEL || "llama-3.1-8b-instruct", prompt, stream, otherParams);
    
    if (stream) {
      // For streaming response, pipe the response stream directly
      let buffer = '';
      response.data.on('data', (chunk) => {
        buffer += chunk;
        // Split by newlines to handle multiple JSON objects
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last incomplete line in buffer
        
        lines.forEach(line => {
          if (line.trim()) {
            try {
              // Handle SSE format (data: prefix)
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                
                // Skip [DONE] message
                if (jsonStr.trim() === '[DONE]') {
                  return;
                }
                
                const data = JSON.parse(jsonStr);
                // Transform to Ollama format
                const ollamaResponse = {
                  model: data.model || 'qwen2.5:0.5b',
                  created_at: new Date().toISOString(),
                  response: data.choices ? data.choices[0].delta.content : '',
                  done: data.done || false
                };
                
                if (data.done) {
                  ollamaResponse.done_reason = data.done_reason || 'stop';
                  ollamaResponse.context = data.context || [];
                  ollamaResponse.total_duration = data.total_duration || 0;
                  ollamaResponse.load_duration = data.load_duration || 0;
                  ollamaResponse.prompt_eval_count = data.prompt_eval_count || 0;
                  ollamaResponse.prompt_eval_duration = data.prompt_eval_duration || 0;
                  ollamaResponse.eval_count = data.eval_count || 0;
                  ollamaResponse.eval_duration = data.eval_duration || 0;
                }
                
                res.write(JSON.stringify(ollamaResponse) + '\n');
              } else {
                // Handle direct JSON format
                const data = JSON.parse(line);
                const ollamaResponse = {
                  model: data.model || 'qwen2.5:0.5b',
                  created_at: new Date().toISOString(),
                  response: data.response || '',
                  done: data.done || false
                };
                
                if (data.done) {
                  ollamaResponse.done_reason = data.done_reason || 'stop';
                  ollamaResponse.context = data.context || [];
                  ollamaResponse.total_duration = data.total_duration || 0;
                  ollamaResponse.load_duration = data.load_duration || 0;
                  ollamaResponse.prompt_eval_count = data.prompt_eval_count || 0;
                  ollamaResponse.prompt_eval_duration = data.prompt_eval_duration || 0;
                  ollamaResponse.eval_count = data.eval_count || 0;
                  ollamaResponse.eval_duration = data.eval_duration || 0;
                }
                
                res.write(JSON.stringify(ollamaResponse) + '\n');
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
              console.log('Problematic line:', line);
            }
          }
        });
      });

      response.data.on('end', () => {
        if (buffer.trim()) {
          try {
            // Handle SSE format in final buffer
            let jsonStr = buffer;
            if (buffer.startsWith('data: ')) {
              jsonStr = buffer.slice(6);
            }
            
            if (jsonStr.trim() !== '[DONE]') {
              const data = JSON.parse(jsonStr);
              const ollamaResponse = {
                model: data.model || 'qwen2.5:0.5b',
                created_at: new Date().toISOString(),
                response: data.response || '',
                done: true,
                done_reason: data.done_reason || 'stop',
                context: data.context || [],
                total_duration: data.total_duration || 0,
                load_duration: data.load_duration || 0,
                prompt_eval_count: data.prompt_eval_count || 0,
                prompt_eval_duration: data.prompt_eval_duration || 0,
                eval_count: data.eval_count || 0,
                eval_duration: data.eval_duration || 0
              };
              res.write(JSON.stringify(ollamaResponse) + '\n');
            }
          } catch (e) {
            console.error('Error parsing final JSON:', e);
            console.log('Problematic final buffer:', buffer);
          }
        }
        res.end();
      });

      response.data.on('error', (error) => {
        console.error('Stream error:', error);
        res.status(500).json({ error: 'Stream error occurred' });
      });
    } else {
      // For non-streaming, transform the response to match Ollama format
      const vikeyResponse = response.data;
      
      // Create a response in the specified format
      const ollamaResponse = {
        model: model,
        created_at: new Date().toISOString(),
        response: vikeyResponse.choices[0].message.content,
        done: true,
        done_reason: "stop",
        context: generateRandomContext(500), // Generate fake context tokens
        total_duration: Math.floor(Math.random() * 15000000000),
        load_duration: Math.floor(Math.random() * 60000000),
        prompt_eval_count: prompt.length > 0 ? Math.floor(prompt.length / 10) : 39,
        prompt_eval_duration: Math.floor(Math.random() * 50000000),
        eval_count: Math.floor(Math.random() * 500) + 100,
        eval_duration: Math.floor(Math.random() * 14000000000)
      };
      
      res.json(ollamaResponse);
    }
  } catch (error) {
    console.error('Error in generate endpoint:', error.message);
    res.status(500).json({ error: 'Failed request', details: error.message });
  }
}

/**
 * Generate random context tokens (fake token IDs)
 * @param {number} count - Number of tokens to generate
 * @returns {Array} - Array of token IDs
 */
function generateRandomContext(count) {
  const context = [];
  for (let i = 0; i < count; i++) {
    context.push(Math.floor(Math.random() * 100000));
  }
  return context;
}

/**
 * Parse raw request data when content-type is missing
 * @param {Object} req - Express request object
 * @returns {Object} - Parsed body
 */
function parseRequestBody(req) {
  console.log('Headers:', req.headers);
  console.log('Raw body:', req.body);
  
  let body = req.body;
  
  // If the body is a string (text/plain or no content-type), try to parse it as JSON
  if (typeof body === 'string' || body instanceof String) {
    try {
      body = JSON.parse(body);
      console.log('Successfully parsed string body as JSON:', body);
    } catch (parseError) {
      console.error('Failed to parse string body as JSON:', parseError.message);
    }
  }
  // If the body is a Buffer (raw data), try to parse it
  else if (Buffer.isBuffer(body)) {
    try {
      const jsonString = body.toString('utf8');
      console.log('Raw buffer data:', jsonString);
      body = JSON.parse(jsonString);
      console.log('Successfully parsed buffer data as JSON:', body);
    } catch (parseError) {
      console.error('Failed to parse buffer as JSON:', parseError.message);
    }
  }
  // If we have a raw body (no content-type), try to parse it
  else if (!req.headers['content-type'] && body) {
    try {
      // Try to parse as JSON if it's an object
      if (typeof body === 'object') {
        console.log('Using object body as-is:', body);
      }
      // Default case: if we have raw data but couldn't parse it
      else {
        console.log('Could not parse body, using as plain text');
      }
    } catch (error) {
      console.error('Error processing raw body:', error.message);
    }
  }
  
  return body || {};
}

/**
 * Handler for POST /api/embeddings endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function embeddings(req, res) {
  try {
    // Parse request body regardless of content-type
    const body = parseRequestBody(req);
    
    // Extract parameters with fallbacks
    const model = body.model || 'all-minilm';
    const prompt = body.prompt || body.input;
    const input = body.input || body.prompt;
    const textToEmbed = input || prompt || '';
    
    console.log('Extracted model:', model);
    console.log('Extracted text to embed:', textToEmbed);
    
    if (!model) {
      return res.status(400).json({ 
        error: 'Missing required parameter: "model"' 
      });
    }
    
    if (!textToEmbed) {
      return res.status(400).json({ 
        error: 'Missing required parameter: Either "prompt" or "input" must be provided' 
      });
    }
    
    // Remove model and input/prompt from otherParams
    const { model: _, prompt: __, input: ___, ...otherParams } = body;
    
    const response = await makeEmbeddingsRequest(model, textToEmbed, otherParams);
    
    // Transform the intelligence.io response to Ollama format
    const intelligenceResponse = response.data;
    res.json({
      embeddings: [intelligenceResponse.data[0].embedding]
    });
  } catch (error) {
    console.error('Error in embeddings endpoint:', error.message);
    res.status(500).json({ error: 'Failed request', details: error.message });
  }
}

/**
 * Handler for POST /api/embed endpoint (new endpoint alias for embeddings)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function embed(req, res) {
  try {
    // Log the request info for debugging
    console.log('Embed Request URL:', req.url);
    console.log('Embed Request Method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('All Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Raw Body:', req.body);
    
    // Parse request body regardless of content-type
    const body = parseRequestBody(req);
    
    // Extract parameters with fallbacks
    const model = body.model || 'all-minilm';
    const prompt = body.prompt || body.input;
    const input = body.input || body.prompt;
    const textToEmbed = input || prompt || '';
    
    console.log('Parsed request body:', body);
    console.log('Using model:', model);
    console.log('Text to embed:', textToEmbed);
    
    // Validate required parameters (with more forgiving validation)
    if (!textToEmbed) {
      return res.status(400).json({ 
        error: 'Missing required parameter: Either "prompt" or "input" must be provided' 
      });
    }
    
    // Remove model and input/prompt from otherParams
    const { model: _, prompt: __, input: ___, ...otherParams } = body;
    
    const response = await makeEmbeddingsRequest(model, textToEmbed, otherParams);
    
    // Transform the intelligence.io response to Ollama format
    const intelligenceResponse = response.data;
    res.json({
      embeddings: [intelligenceResponse.data[0].embedding]
    });
  } catch (error) {
    console.error('Error in embed endpoint:', error.message);
    res.status(500).json({ error: 'Failed request', details: error.message });
  }
}

module.exports = {
  getModels,
  chat,
  generate,
  embeddings,
  embed
}; 