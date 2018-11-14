import Ajv from 'ajv'
import curry from './curry'

import _loadSchemas from './loadSchemas'
import _normalize from './normalize'
import _denormalize from './denormalize'

const defaultAjvConfig = {
  schemaId: 'title',
  allErrors: true,
  verbose: true,
  removeAdditional: 'all',
  useDefaults: true,
  extendRefs: true,
  $data: true,
  loadSchema: (uri) => {
      debugger
    console.log(uri);
  }
}

let store

const reset = (config = defaultAjvConfig) => {
  store = {
    ajv: new Ajv(config),
    schemas: {},
    jsonSchemas: {}
  };
  require('ajv-keywords')(store.ajv);
}

const loadSchemas = (jsonSchemas, params) => _loadSchemas(jsonSchemas, store, params)

const normalize = curry((modelName, data) => _normalize(modelName, data, store))

const denormalize = curry((schemaName, data, entities) =>
  _denormalize(schemaName, data, entities, store)
)

reset()

export { loadSchemas, normalize, denormalize, reset }
