# Anima Project

Welcome! This is Securify - a secure password manager application with React frontend and Node.js/Express backend.

## Getting started

> **Prerequisites:**
> The following steps require [NodeJS](https://nodejs.org/en/) to be installed on your system, so please
> install it beforehand if you haven't already.

To get started with your project, you'll first need to install the dependencies with:

```
npm install
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=mongodb://localhost:27017/securify
secretKey=your-super-secret-jwt-key-change-this-in-production
PORT=5000
```

## Running the Application

### Development Mode (Frontend + Backend)

To run both the React frontend and Express backend simultaneously:

```
npm run dev:full
```

This will start:
- React development server on http://localhost:5173/
- Express API server on http://localhost:5000/

### Frontend Only

Then, you'll be able to run a development version of the project with:

```
npm run dev
```

### Backend Only

To run just the Express server:

```
npm run server
```

## Features

- User authentication (signup/login)
- Secure password storage with encryption
- Password generation
- Categorized password management
- JWT-based authentication
- Rate limiting for security
- Responsive design

## Database

This application uses MongoDB for data storage. Make sure you have MongoDB installed and running locally, or update the `MONGODB_URI` in your `.env` file to point to your MongoDB instance.

## API Endpoints

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/dashboard` - Protected dashboard route
- `GET /api/passwords` - Get user's passwords
- `POST /api/passwords` - Add new password
- `PUT /api/passwords/:id` - Update password

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on login attempts
- Input validation and sanitization
- CORS protection

## Build for Production

If you are satisfied with the result, you can finally build the project for release with:

```
npm run build
```