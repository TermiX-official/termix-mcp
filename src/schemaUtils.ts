import { z } from 'zod';

export function jsonSchemaToZod(properties: any) {
    const zodSchema: Record<string, any> = {};
    
    Object.entries(properties).forEach(([key, value]: [string, any]) => {
      switch (value.type) {
        case 'string':
          zodSchema[key] = z.string().optional();
          break;
        case 'number':
          zodSchema[key] = z.number().optional();
          break;
        case 'boolean':
          zodSchema[key] = z.boolean().optional();
          break;
        case 'object':
          zodSchema[key] = z.object(jsonSchemaToZod(value)).optional();
          break;
        case 'array':
          zodSchema[key] = z.array(z.object(jsonSchemaToZod(value.items))).optional();
          break;
        default:
          zodSchema[key] = z.any().optional();
      }
    });
    
    return zodSchema;
  }