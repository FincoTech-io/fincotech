const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

// Define Swagger options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FincoTech API Documentation',
      version: '1.0.0',
      description: 'API documentation for the FincoTech financial services platform',
      contact: {
        name: 'FincoTech Support',
        email: 'support@fincotech.com',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'FincoTech API server',
      },
    ],
    components: {
      schemas: {
        Company: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'FincoTech',
            },
            description: {
              type: 'string',
              example: 'Innovative financial technology solutions',
            },
            founded: {
              type: 'string',
              example: '2023',
            },
            services: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Financial consulting', 'Technology integration'],
            },
            contact: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  example: 'info@fincotech.com',
                },
                phone: {
                  type: 'string',
                  example: '+1 (123) 456-7890',
                },
                address: {
                  type: 'string',
                  example: '123 Tech Street, Financial District, NY 10001',
                },
              },
            },
          },
        },
        TeamMember: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            position: {
              type: 'string',
              example: 'CEO',
            },
            bio: {
              type: 'string',
              example: 'Financial expert with 15+ years of experience',
            },
          },
        },
        Service: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Financial Consulting',
            },
            description: {
              type: 'string',
              example: 'Expert financial guidance for businesses of all sizes',
            },
            icon: {
              type: 'string',
              example: 'chart-line',
            },
          },
        },
        Status: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            message: {
              type: 'string',
              example: 'FincoTech API is running',
            },
          },
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'], // Path to the API docs
};

// Generate the Swagger specification
const specs = swaggerJsdoc(options);

// Ensure the public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the specification to a file
fs.writeFileSync(
  path.join(process.cwd(), 'public', 'swagger.json'),
  JSON.stringify(specs, null, 2)
);

console.log('Swagger documentation generated successfully!'); 