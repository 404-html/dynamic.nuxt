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
    });

    let map = [];

    jsonSchemas.forEach(schema => {
        const { title } = schema
        debug(`Adding ${title} to AJV & Schemas`)
        map = [ ...map, ...parseRefs(schema, jsonSchemas, store.schemas[title], store.schemas) ]
    });

    return map;
}

const parseRefs = (schema, jsonSchemas, entity, entities) => {
    const { title, properties, allOf, oneOf, anyOf } = schema
  
    let define = (props, parent) => {
        let map = [];

        Object.getOwnPropertyNames(props).forEach(key => {
            const { $ref, type, items } = props[key]

            if(type !== 'object') {
                if ($ref) {
                    let schemaName = $ref.replace('#/definitions/', '');
                                        
                    entity.define(parent ? { [parent]: { [key]: entities[schemaName] }} : { [key]: entities[schemaName] });

                    map.push({
                        [title]: {
                            [schemaName]: {
                                path: parent ? `${parent}.${key}` : `${key}`,
                                type: 'object'
                            }
                        }
                    });

                } else if (type === 'array' && items && items.$ref) {
                    let schemaName = items.$ref.replace('#/definitions/', '');

                    entity.define(parent ? { [parent]: { [key]: [entities[schemaName]] }} : { [key]: [entities[schemaName]] });

                    map.push({
                        [title]: {
                            [schemaName]: {
                                path: parent ? `${parent}.${key}` : `${key}`,
                                type: 'array'
                            }
                        }
                    });
                }
            }
            else map = [ ...map, ...define(props[key].properties, key) ];
        });

        return map;
    };

    let map = define(properties);

    return map;
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

export default loadSchemas
