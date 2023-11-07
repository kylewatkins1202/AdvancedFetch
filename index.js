const typedefs = require("./typedefs");

/**
 * @class AdvancedFetchInstance
 * @description Instance of advanced fetch class to make request with advanced features
 */
class AdvancedFetchInstance {
    // PRIVATE:
    #timeout = false
    #allowDuplicates = false
    #abortControllers = {}
    #middlewares = {
        request: [],
        response: []
    }

    AbortTypes = {
        Timeout: "Timeout",
        Unmount: "Unmount",
        Duplicate: "Duplicate",
        User: "User",
    }

    /**
     * Executes request interceptors
     * @param {typedefs.RequestConfigurationType} requestObject 
     * @returns {any}
     */
    #executeRequestInterceptors(requestObject) {
        // For each middleware
        for (let i = 0; i < this.#middlewares.request.length; i++) {
            // Run middleware
            requestObject = this.#middlewares.request[i](requestObject)
        }
    
        return requestObject
    }
  
    /**
     * Execute response interceptors
     * @param {any} responseObject 
     * @returns {any}
     */
    #executeResponseInterceptors(responseObject) {
        // For each middleware
        for (let i = 0; i < this.#middlewares.response.length; i++) {
            // Run middleware
            responseObject = this.#middlewares.response[i](responseObject)
        }
    
        return responseObject
    }
  
    /**
     * Runs http request
     * @param {string} requestKey 
     * @param {typedefs.RequestConfigurationType} requestObject 
     * @param {string} signal 
     * @param {(value: any) => void} resolve 
     * @param {(value: any) => void} reject 
     * @returns {Promise}
     */
    #runRequest(requestKey, requestObject, signal, resolve, reject) {
        // Run request interceptors
        requestObject = this.#executeRequestInterceptors(requestObject)
        
        // Fetch
        return fetch(requestObject.url, {
            ...requestObject.options,
            signal: signal
        })
            .then((originalResponseObject) => {
                // Delete abort controllers
                delete this.#abortControllers[requestKey]
        
                // Build response object
                let responseObject = {
                    status: originalResponseObject.status,
                    statusText: originalResponseObject.statusText,
                    url: originalResponseObject.url,
                    isSuccess: originalResponseObject.status > 199 && originalResponseObject.status < 300,
                    data: originalResponseObject.data,
                }
        
                // Run response interceptors
                responseObject = this.#executeResponseInterceptors(responseObject)
        
                // Resolve result
                resolve(responseObject)
            })
            .catch((err) => {
                // Delete abort controller
                delete this.#abortControllers[requestKey]
                
                // Reject error
                reject(err)
            })
    }

    //////////////////////////////// PUBLIC ///////////////////////////////

    /**
     * Constructor
     * @type {typedefs.FetchInstanceConstructor}
     */
    constructor({ timeout, allowDuplicates = false }) {
        // Initialize Timeout
        this.#timeout = timeout

        // Initialize allow duplicates
        this.#allowDuplicates = allowDuplicates
        
        // Init interceptors
        this.interceptors = {
            request: {
                /**
                 * Use middleware
                 * @param {(request: RequestConfigurationType) => RequestConfigurationType} func 
                 */
                use: (func) => {
                    this.#middlewares.request.push(func)
                }
            },
            response: {
                /**
                 * Use middleware
                 * @param {(any) => any} func 
                 */
                use: (func) => {
                    this.#middlewares.response.push(func)
                }
            }
        }
    }

    /**
     * Abort all request
     * @param {keyof typedefs.AbortionType} reason 
     */
    abortAllRequest(reason) {
        Object.keys(this.#abortControllers).forEach(key => {
            this.abortRequest(key, reason)
        })
    }

    /**
     * Abort request by request key
     * @param {string} requestKey 
     * @param {keyof typedefs.AbortionType} reason Reason for abort
     */
    abortRequest(requestKey, reason) {
        if (requestKey in this.#abortControllers) {
            // Abort request by request key
            this.#abortControllers[requestKey].abort(reason)

            // Delete abort controller
            delete this.#abortControllers[requestKey]
        }
    }
  
    /**
     * @template {object} ResponeObjectT Response Object Generic Type
     * @type {typedefs.RequestObjectType<ResponeObjectT>}
     */
    request(url, config) {
        // Request Object
        let requestObject = {
            url: url,
            options: {
            ...config
            }
        }
    
        // Get request key
        let requestKey = `${config.method}-${url}`
    
        // If duplicate request shouldn't be allowed at the same time
        if (!this.#allowDuplicates) {
            // If current request is in abort controller
            if (requestKey in this.#abortControllers) {
                // Abort duplicate request
                this.abortRequest(requestKey, "Duplicate")
            }
        }
    
        // Create new abort controller for request
        this.#abortControllers[requestKey] = new AbortController()
    
        // Get signal
        let signal = this.#abortControllers[requestKey].signal
    
        // Create promise
        let promise = new Promise((resolve, reject) => {
        
        // If signal has already been aborted
        if (signal.aborted) {
            // Init error
            let error
    
            // If reason for abortion is timeout
            if (signal.reason === AbortTypes.Timeout) {
                // Create timeout request error
                error = new DOMException("Request Timeout", "TimeoutError")
            }
    
            // Reject promise
            reject(error)
        }
  
        // Add event listener to abort
        signal.addEventListener("abort", () => {
            console.log("Aborted")
            // Initialize error
            let error
    
            // If reason for error is timeout
            if (signal.reason === AbortTypes.Timeout) {
                console.log("timeout")
                // Create timeout error
                error = new DOMException("Request Timeout", "TimeoutError")
            } 
            else if (signal.reason === AbortTypes.Timeout) {
                console.log("duplicate")
                // Create timeout error
                error = new DOMException("Request Duplicate", "DuplicateError")
            }

            // If error is defined
            if (error) {
                // If timeout id is set
                if (timeoutId) {
                    // Clear timeout
                    clearTimeout(timeoutId)
                }
    
                // Reject request
                reject(error)
            }
        })
  
        // Initialize timeout id
        let timeoutId
  
        // If there is a timeout for request
        if (this.#timeout !== undefined) {
            // Initialize timeout
            timeoutId = setTimeout(() => {
                // If request has an abort controller
                if (requestKey in this.#abortControllers) {
                    this.abortRequest(requestKey, "Timeout")
                }
            }, this.#timeout)
        }
        
        // Run Request
        this.#runRequest(requestKey, requestObject, signal, resolve, reject)
      })
  
      return promise
    }
  
    /**
     * @template {object} ResponeObjectT Response Object Generic Type
     * @type {typedefs.RequestObjectType<ResponeObjectT>}
     */
    get(url, config) {
        return this.request(url, { ...config, method: "GET" })
    }
    
    /**
     * @template {object} ResponeObjectT Response Object Generic Type
     * @type {typedefs.RequestObjectType<ResponeObjectT>}
     */
    post(url, config) {
        return this.request(url, { ...config, method: "POST" })
    }
  
    /**
     * @template {object} ResponeObjectT Response Object Generic Type
     * @type {typedefs.RequestObjectType<ResponeObjectT>}
     */
    put(url, config) {
        return this.request(url, { ...config, method: "PUT" })
    }
  
    /**
     * @template {object} ResponeObjectT Response Object Generic Type
     * @type {typedefs.RequestObjectType<ResponeObjectT>}
     */
    delete(url, config) {
        return this.request(url, { ...config, method: "DELETE" })
    }
}

/**
 * Advanced Fetch For Making abortable and timeout Promise based HTTP Request
 * @type {typedefs.AdvancedFetch<AdvancedFetchInstance>}
 */
const AdvancedFetch = {
    create: (config) => {
        return new AdvancedFetchInstance(config)
    }
}

module.exports = AdvancedFetch