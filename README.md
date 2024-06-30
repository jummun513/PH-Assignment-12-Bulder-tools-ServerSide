# Builder-Tools-Project-Backend: [Live Link](https://ph-assignment-12-bulder-tools-serverside.onrender.com)

## Project Installation In Local Server:

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Rename `.env.example` to `.env`.
4. Run the server using `npm run start:dev`.

## Configuration:

- Environment Variables:
  - `PORT`: Port number the server listens on. Default: 8080
  - `DB_USER`: User for MongoDB database.
  - `DB_PASS`: Password for MongoDB database.
  - `COOKIE_SECRET`: For JWT sign In.
  - `IMAGEKIT_PUBLIC_KEY`: [Imagekit](https://imagekit.io) a image hosting side public key.
  - `IMAGEKIT_PRIVATE_KEY`: [Imagekit](https://imagekit.io) a image hosting side private key.
  - `IMAGEKIT_URL_ENDPOINTS`: [Imagekit](https://imagekit.io) a image hosting side url endpoints key.
  - `SSL_STORE_ID`: [SSLCOMMERZ](https://sslcommerz.com) Payment gateway website store id.
  - `SSL_STORE_PASSWORD`: [SSLCOMMERZ](https://sslcommerz.com) Payment gateway website store password.
  - `CLIENT_SIDE_URL`: Your website client side link. Default: http://localhost:5173.
  - `SERVER_SIDE_URL`: Your website server side link. Default: http://localhost:8080.

## Usage:

- **API Endpoints:**

  - **POST** `/api/v1/users`

    - **Description:** Create a new user.
    - **Request Body:**

      ```json
      {
        "email": "example@gmail.com",
        "fullName": "John Doe",
        "gender": "Male",
        "imageUrl": "https://..."
      }
      ```

    - **Response Body:**

      ```json
      {
        "success": true,
        "message": "Successfully added user"
      }
      ```

  - **POST** `/api/v1/jwt`

    - **Description:** JWT token create.
    - **Request Body:**

      ```json
      {
        "email": "example@gmail.com"
      }
      ```

    - **Response Body:**

      ```json
      {
        "success": true,
        "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1bW11bmlzbGFtNTE2QGdtYWlsLmNvbSIsImlhdCI6MTcxOTc2MDg3NywiZXhwIjoxNzIyMzUyODc3fQ.N0vsRZebvRIYMUDTOtDZp-Gz4d5NG4nDtSs11pTJEnQ"
      }
      ```

  - **GET** `/api/v1/users/:email`

    - **Description:** User login via firebase and get stored user data.
    - **Request Headers:**

      ```markdown
          Authorization: Bearer <JWT_TOKEN>
      ```

    - **Response Body:**

      ```json
      {
        "success": true,
        "data": {
            "_id": "656b66c2e36f0c77c88a8fs2",
            "email": "example@gmail.com",
            "fullName": "John Doe",
            "gender": "Male",
            "imageUrl": "https://...",
            "role": "user" | "admin" | "super-admin",
        }
      }
      ```

## Dependencies:

- `cors`: Express middleware for enabling CORS with frontend.
- `dotenv`: Loads environment variables from .env file.
- `express`: Web framework for Node.js.
- `mongodb`: MongoDB driver for Node.js.
- `nodemon`: Utility for automatically restarting the server during development.
- `multer`: A node.js middleware for handling multipart/form-data.
- `sslcommerz-lts`: Payment gateway system.
- `imagekit`: For image free hosting.
- `jsonwebtoken`: For creating data with optional signature or optional encryption.

### Before Pushing Your Code into Github:

1. Before pushing your code to the remote repository, ensure that you have run the following command in your terminal (Git Bash):

   ```bash
   rm -rf .git
   ```
