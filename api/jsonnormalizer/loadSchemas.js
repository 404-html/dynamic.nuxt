import debug from './debug'
import { schema as Schema } from 'normalizr'

const normalizeSchemaName = name => name.indexOf('#/definitions/') === -1 ? `#/definitions/${name}` : name;

const loadSchemas = (jsonSchemas, store, params) => {
    let { id_attribute } = params;

  jsonSchemas.forEach(schema => {
    const { title } = schema
    debug(`Adding ${title} to AJV & Schemas`)
    store.ajv.addSchema(schema, normalizeSchemaName(title))
    store.schemas[title] = parseJsonSchema(schema, id_attribute)
  })

  jsonSchemas.forEach(schema => {
    const { title } = schema
    debug(`Adding ${title} to AJV & Schemas`)
    parseRefs(schema, jsonSchemas, store.schemas[title], store.schemas)
  })
}

const parseRefs = (schema, jsonSchemas, entity, entities) => {
    const { title, properties, allOf, oneOf, anyOf } = schema
  
    let define = (props, parent) => {
        Object.getOwnPropertyNames(props).forEach(key => {
            const { $ref, type, items } = props[key]
    
            if(type !== 'object') {
                if ($ref) {
                    let schemaName = $ref.replace('#/definitions/', '');

                    if(parent) {
                        entity.define({
                            [parent]: {
                                [key]: entities[schemaName]
                            }
                        })
                    }
                    else {
                        entity.define({
                            [key]: entities[schemaName]
                        })
                    }
                } else if (type === 'array' && items && items.$ref) {
                    let schemaName = items.$ref.replace('#/definitions/', '');

                    if(parent) {
                        entity.define({
                            [parent]: {
                                [key]: [entities[schemaName]]
                            }
                        })
                    }
                    else {
                        entity.define({
                            [key]: [entities[schemaName]]
                        })
                    }
                }
            }
            else define(props[key].properties, key);
        })
    };

    define(properties);
}

const parseJsonSchema = (schema, id_attribute) => {
    id_attribute = id_attribute || 'id';

  const { title, properties, allOf, oneOf, anyOf } = schema

  if (allOf) {
    console.warn(
      `Schema '${title}' has 'allOf' property. It's not yet implemented. '${title}' will be defined as plain Entity.`
    )
    return new Schema.Entity(title, {}, { 
        idAttribute: id_attribute
    })
  }

  if (anyOf || oneOf) {
    console.warn(
      `Schema '${title}' has 'anyOf' or 'oneOf' property. It's not supported. '${title}' will be defined as plain Entity.`
    )
    return new Schema.Entity(title, {}, { 
        idAttribute: id_attribute
    })
  }

  return new Schema.Entity(
    title,
    Object.getOwnPropertyNames(properties).reduce((definitions, key) => {
 
      return definitions
    }, {}),
    { 
        idAttribute: id_attribute
    })
}

/* const resolveSchema = (schemaName, jsonSchemas, store) => {
  schemaName = schemaName.replace('#/definitions/', '')

  if(resolved[schemaName]) return {};

  if (store.schemas[schemaName]) {
    return store.schemas[schemaName]
  } else {
    debug(
      `Schema '${schemaName}' is not defined yet. Trying to find it in raw schemas array and define it.`
    )

    const foundSchema = jsonSchemas.find(schema => schema.title === schemaName && schema);

    if (!foundSchema) {
      throw new Error(
        `Schema ${schemaName} cannot be defined! Some other schema referenced it, but it was not defined.`
      )
    }

    const schema = parseJsonSchema(foundSchema, jsonSchemas, store)
    store.schemas[schemaName] = schema

    debug(`Schema '${schemaName}' was found and added to collection.`)

    return schema
  }
} */

export default loadSchemas
