import { normalize as libNormalize } from 'normalizr'
import debug from './debug'

const normalizeSchemaName = name =>
  name.indexOf('#/definitions/') === -1 ? `#/definitions/${name}` : name

const normalize = (schemaName, data, store) => {
  const schema = store.schemas[schemaName]
  const isArray = Array.isArray(data)

  data = isArray ? [...data] : { ...data } // AJV will mutate it, we'll do a copy

  if (!schema) {
    throw new Error(`Schema "${schemaName}" is not defined!`)
  }

  debug(`Normalizing "${schemaName}":`)
  debug(data)

  if (isArray) {
    data.forEach(item => {
      const isValid = store.ajv.validate(normalizeSchemaName(schemaName), item)
      if (!isValid) {
        throw new Error(store.ajv.errorsText())
      }
    })
  } else {
    const isValid = store.ajv.validate(normalizeSchemaName(schemaName), data)
    // debug('GET SCHEMA:', store.ajv._schemas)
    if (!isValid) {
      throw new Error(store.ajv.errorsText())
    }
  }

  let normalized = libNormalize(data, isArray ? [schema] : schema)

  let _objects_map_ = {};

  for(let key in normalized.entities) {
      let entity = normalized.entities[key];
      
      for(let id in entity) {
          _objects_map_[id] = entity[id];
      }
  }

  normalized = { ...normalized, _objects_map_ };
  
  return normalized;
}

export default normalize
