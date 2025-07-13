# Securify Project

Welcome! This is Securify - a secure password manager application with all the information related to security awareness is displayed and also to secure the users and also dashboard for password manager should be there to manage user passwords. The application should also include other security features like link checker(if a link is safe or suspicious) and file checker, malware checker. The application should also contain dashboard for System Information And Event logs for events occurring. The passwords stored by the password manager should be in hashes (Can also use random password generator,but it all depends on what user wants) It is built with the help of ReactJS as frontend and Node.js/Express as backend. 

## Getting started

> **Prerequisites:**
> The following steps require [NodeJS](https://nodejs.org/en/) to be installed on your system, so please
> Install it beforehand if you haven't already.

To get started with your project, you'll first need to install the dependencies with:

```
npm install
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=mongodb://localhost:27017/securify
secretKey=342b1cccd0172c02ccaa09ddcc0b1d6bbbb205674a4d71d2702e40d12bb53e3c
PORT=5000
GMAIL_USER=test266105@gmail.com
# GMAIL_APP_PASSWORD=Testabcd@266105
secretKeyOTP=9d6a8a859449ca449654b79bca3181e6adf39970e758e170c54bbab39cfdef3f
GMAIL_CLIENT_ID=588965386958-cf77cc6tamklkkgr89dgvib5gakj9lkl.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=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
GMAIL_REFRESH_TOKEN=1//04Uqw3zze3zJoCgYIARAAGAQSNwF-L9IrrIyxAaZtJCExp3_3C_6Un3S8JZfMk_zJDBfd4e-OJSPHUA6fH1mzBh8xjlD9fhhPnwI
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
node server.js

OR

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
