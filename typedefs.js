/**
 * @template {object} ResponeObjectT Response Type
 * @typedef {object} ReactFetchResponseObjectType 
 * @property {number} status Status number of request
 * @property {string} statusText Status text of request
 * @property {boolean} isSuccess True if request was a success
 * @property {ResponeObjectT} data
 */

/**
 * @typedef {object} RequestConfigurationType
 * @property {"GET"|"POST"|"PUT"|"DELETE"} method
 * @property {object} headers
 * @property {any} body
 */

/**
 * @template ResponeObjectT Response Object Generic Type
 * 
 * Make Request
 * @callback RequestObjectType
 * @param {string} url Url of request
 * @param {RequestConfigurationType} config Configuration for request
 * @returns {Promise<ReactFetchResponseObjectType<ResponeObjectT>>}
 */

/**
 * @typedef {object} AbortionType Available reasons to abort
 * @property {string} Timeout Timeout Abort Reason
 * @property {string} UnMount UnMount Abort Reason
 * @property {string} Duplicate Duplicate Abort Reason
 * @property {string} User User Abort Reason
 */

/**
 * @callback FetchInstanceConstructor
 * 
 * Contructor for fetch instance
 * @param {object} configuration Configuration settings of Fetch Instance
 * @param {number} configuration.timeout Request timeout in ms
 * @param {boolean} configuration.allowDuplicates If true allow duplicate request to occur simoutaneously. Defaults to false, which means only one of the same request can run at a time
 */

/**
 * @template I Fetch Instance
 * @callback CreateInstance
 * Creates a fetch instance
 * @param {object} config Configuration settings of Fetch Instance
 * @param {number} config.timeout Request timeout in ms
 * @param {boolean} config.allowDuplicates If true allow duplicate request to occur simoutaneously. Defaults to false, which means only one of the same request can run at a time
 * @returns {I}
 */

/**
 * @template I Fetch Instance
 * @typedef {object} AdvancedFetch
 * @property {CreateInstance<I>} create Creates fetch instanc
 */

/**
 * @typedef {Record<keyof typedefs.AbortionType, keyof typedefs.AbortionType>}
 */

exports.unused = {};