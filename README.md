# Seekurify Project

Welcome to **Seekurify**!  

**Seekurify** is an all-in-one **cybersecurity platform** and **secure password manager** designed to empower users with advanced tools and essential knowledge to stay safe in the digital world. The platform combines robust security features with educational insights to promote better cybersecurity practices.

At its core, Seekurify provides a **secure password manager**, allowing users to store, manage, and organize their credentials in an encrypted vault. Users can generate strong, random passwords and maintain excellent password hygiene.  

In addition to password management, Seekurify offers:

- **Link Checker:** Instantly verify URLs to detect safe or malicious links.  
- **File & Malware Scanner:** Scan uploaded files for viruses and malware using trusted detection logic.  
- **System Dashboard:** Monitor system events, track logs, and gain insights into potential threats.  
- **Real-time Alerts & Educational Content:** Stay informed about the latest threats, scams, and cybersecurity best practices.

Seekurify is built using **ReactJS** for the frontend and **Node.js/Express** for the backend.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Security Features](#security-features)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [Build for Production](#build-for-production)
- [Security Policy](#security-policy)

---

## Getting Started

> **Prerequisites:**  
> Ensure [NodeJS](https://nodejs.org/en/) is installed on your system.

Install dependencies:

```bash
npm install
```````

## Environment Setup


Create a .env file in the root directory with the following variables (add others as needed):

# AI Chatbot configuration (optional)
# Provide *one* of the following keys to enable the contextual chatbot:
# - Google Gemini: GOOGLE_AI_API_KEY=<your-google-key>
# - Anthropic/Claude: ANTHROPIC_API_KEY=<your-anthropic-key>
# - Litellm (local/lightweight model): LITELLM_API_KEY=<your-litellm-key or path>
# The server will prefer Litellm if its key is present, otherwise it will fall back
to Google, then Anthropic. If no key is configured the bot runs in demo mode.

## Running the Application
Development Mode (Frontend + Backend)

Run both the React frontend and Express backend:

**Frontend Only**:
npm run dev:frontend


**Backend Only**:
npm run dev

## Features:

User authentication (signup/login)

Secure password storage with encryption

Strong password generation

Categorized password management

JWT-based authentication

Rate limiting for login attempts

Responsive, user-friendly design

Link checker and malware scanning

System dashboard with event logs


## Security Features:

Seekurify implements industry-standard security practices:

Password hashing with bcrypt

JWT token authentication for secure API access

Rate limiting on login attempts to prevent brute-force attacks

Input validation and sanitization to prevent injection attacks

CORS protection for secure cross-origin requests

Optional strong password generation

Real-time monitoring of system events

## Database

Seekurify uses MongoDB for data storage. Ensure MongoDB is installed and running locally, or update the MONGODB_URI in .env to point to your database instance.

## API Endpoints

POST /api/auth/signup – Create new user account

POST /api/auth/login – User login

GET /api/dashboard – Protected dashboard route

GET /api/passwords – Get user passwords

POST /api/passwords – Add new password

PUT /api/passwords/:id – Update password

Build for Production

Build the project for release:

npm run build
```

Seekurify is designed to protect users’ digital life with a modern, user-focused approach to cybersecurity—all in one seamless interface.
