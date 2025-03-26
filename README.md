# GiftLink Backend

## Project Overview
The **GiftLink** backend is responsible for handling user authentication, managing listings, storing user data, and serving API endpoints for the frontend. It is built using **Node.js, Express.js, and MongoDB** to provide a secure and scalable solution for connecting users who want to give away or receive free household items.

## Technologies Used
- **Node.js** – JavaScript runtime environment
- **Express.js** – Backend framework for handling API requests
- **MongoDB** – NoSQL database for data storage
- **Mongoose** – ODM (Object Data Modeling) for MongoDB
- **JWT (JSON Web Token)** – Authentication and authorization

## Directory Structure
```plaintext
 giftlink-backend/
 ├── util/                # Configuration files (DB, authentication, etc.)
 ├── models/                # Mongoose schemas/models
 ├── routes/                # Express route handlers
 ├── .env                   # Environment variables
 ├── index.js              # Main entry point of the backend server
 ├── package.json           # Dependencies and project metadata
 ├── README.md              # Documentation (this file)
```

## API Endpoints

### Authentication APIs
- `POST /api/auth/register` – Register a new user
- `POST /api/auth/login` – User login and JWT token generation

### User APIs
- `PUT /api/user/update` – Update user profile

### Listings APIs
- `GET /api/gifts` – Retrieve all available listings
- `GET /api/gifts/:id` – Fetch details of a specific listing
- `POST /api/gifts` – Create a new listing (Authenticated users only)

### Search APIs
- `GET /api/search` – Search listings with multiple filters

## Setup and Installation
### Prerequisites
Ensure you have the following installed:
- **Node.js** (v18+ recommended)
- **MongoDB** (local or cloud instance)

### Installation Steps
```sh
# Clone the repository
git clone https://github.com/your-username/giftlink-backend.git

# Navigate to the backend directory
cd giftlink-backend

# Install dependencies
npm install

# Create a .env file and configure environment variables
cp .env.example .env

# Start the development server
npm run dev
```

## Contributing
Contributions are welcome! Follow these steps to contribute:
1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Make changes and commit (`git commit -m "Added new feature"`)
4. Push to your branch (`git push origin feature-branch`)
5. Open a Pull Request

## License
This project is licensed under the **MIT License**.

---
💡 *Happy coding!* 🚀