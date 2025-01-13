const fs = require('fs');

const userEndpoints = {
  info: {
    _postman_id: "3e5c9f8a-7b5d-4e1a-8f1c-9d2b3e4f5a6b",
    name: "Sales Tracking API - Users",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [
    {
      name: "Users",
      item: [
        {
          name: "Get All Users",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{BASE_URL}}/api/users",
              host: ["{{BASE_URL}}"],
              path: ["api", "users"]
            }
          }
        },
        {
          name: "Get User by ID",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{BASE_URL}}/api/users/{{userId}}",
              host: ["{{BASE_URL}}"],
              path: ["api", "users", "{{userId}}"]
            }
          }
        },
        {
          name: "Update User",
          request: {
            method: "PUT",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            body: {
              mode: "raw",
              raw: `{
                "name": "Updated User Name",
                "email": "updateduser@example.com",
                "password": "newpassword123"
              }`
            },
            url: {
              raw: "{{BASE_URL}}/api/users/{{userId}}",
              host: ["{{BASE_URL}}"],
              path: ["api", "users", "{{userId}}"]
            }
          }
        },
        {
          name: "Delete User",
          request: {
            method: "DELETE",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{BASE_URL}}/api/users/{{userId}}",
              host: ["{{BASE_URL}}"],
              path: ["api", "users", "{{userId}}"]
            }
          }
        }
      ]
    }
  ],
  variable: [
    { key: "BASE_URL", value: "http://localhost:5000", type: "string" },
    { key: "token", value: "", type: "string" },
    { key: "userId", value: "", type: "string" }
  ]
};

// Save the User endpoints as a Postman collection file
fs.writeFileSync(
  "user_endpoints.postman_collection.json",
  JSON.stringify(userEndpoints, null, 2),
  "utf-8"
);

console.log("User endpoints Postman collection created!");
