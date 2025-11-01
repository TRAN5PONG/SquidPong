import { FastifyInstance } from 'fastify';
import authplugin from './authPlugin'

// Swagger / OpenAPI
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'

export default async function registerPlugins(app:FastifyInstance) 
{
    // register existing auth helpers
    authplugin(app);

    // register OpenAPI generator (uses route schemas to build spec)
    await app.register(swagger, {
        // Use OpenAPI 3
        openapi: {
            info: {
                title: 'Auth Service API',
                version: '1.0.0',
                description: 'API documentation for the Auth service'
            }
        }
    })

    // register Swagger UI at /docs
    await app.register(swaggerUI, {
        routePrefix: '/api/auth/docs', // UI served at /docs
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false
        },
        // expose the generated OpenAPI JSON at /docs/json (used by UI)
        // by default swagger plugin exposes /documentation/json, swagger-ui will use it
        staticCSP: true
    })
}