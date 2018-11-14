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
    const { title, type, properties, allOf, oneOf, anyOf } = schema
  
    let define = (props, parent, parent_type) => {
        let map = [];

        Object.getOwnPropertyNames(props).forEach(key => {
            const { $ref, type, items } = props[key]

            let deep = ['array', 'object'].includes(type);
            deep && type === 'array' && !Array.isArray(props[key].items) && (deep = false);

            if(!deep) {
                if ($ref) {
                    let schemaName = $ref.replace('#/definitions/', '');
                                        
                    entity.define(parent ? { [parent]: parent_type === 'array' ? [{ [key]: entities[schemaName] }] : { [key]: entities[schemaName] }} : parent_type === 'array' ? [{ [key]: entities[schemaName] }] : { [key]: entities[schemaName] });
                    //entity.define(parent ? { [parent]: { [key]: entities[schemaName] }} : { [key]: entities[schemaName] });
                    //entity.define(parent ? { [parent]: { [key]: parent_type === 'array' ? [entities[schemaName]] : entities[schemaName] }} : { [key]: parent_type === 'array' ? [entities[schemaName]] : entities[schemaName] });

                    map.push({
                        [title]: {
                            path: parent ? `${parent}.${key}` : `${key}`,
                            type: parent_type || 'object',
                            links: schemaName
                        }
                    });

                } else if (type === 'array' && items && items.$ref) {
                    let schemaName = items.$ref.replace('#/definitions/', '');

                    entity.define(parent ? { [parent]: { [key]: [entities[schemaName]] }} : { [key]: [entities[schemaName]] });

                    map.push({
                        [title]: {
                            path: parent ? `${parent}.${key}` : `${key}`,
                            type: 'array',
                            links: schemaName
                        }
                    });
                }
            }
            else map = [ ...map, ...define(type === 'object' ? props[key].properties : props[key].items[0].properties, key, type) ];
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
