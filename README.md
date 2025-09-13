# Vaultence Project

Welcome to **Vaultence**!  

**Vaultence** is an all-in-one **cybersecurity platform** and **secure password manager** designed to empower users with advanced tools and essential knowledge to stay safe in the digital world. The platform combines robust security features with educational insights to promote better cybersecurity practices.

At its core, Vaultence provides a **secure password manager**, allowing users to store, manage, and organize their credentials in an encrypted vault. Users can generate strong, random passwords and maintain excellent password hygiene.  

In addition to password management, Vaultence offers:

- **Link Checker:** Instantly verify URLs to detect safe or malicious links.  
- **File & Malware Scanner:** Scan uploaded files for viruses and malware using trusted detection logic.  
- **System Dashboard:** Monitor system events, track logs, and gain insights into potential threats.  
- **Real-time Alerts & Educational Content:** Stay informed about the latest threats, scams, and cybersecurity best practices.

Vaultence is built using **ReactJS** for the frontend and **Node.js/Express** for the backend.

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

**Environment Setup
**

Create a .env file in the root directory with the following variables:

MONGODB_URI=mongodb://localhost:27017/Vaultence
secretKey=342b1cccd0172c02ccaa09ddcc0b1d6bbbb205674a4d71d2702e40d12bb53e3c
PORT=5000
GMAIL_USER=test266105@gmail.com
# GMAIL_APP_PASSWORD=Testabcd@266105
secretKeyOTP=9d6a8a859449ca449654b79bca3181e6adf39970e758e170c54bbab39cfdef3f
GMAIL_CLIENT_ID=588965386958-cf77cc6tamklkkgr89dgvib5gakj9lkl.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=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
GMAIL_REFRESH_TOKEN=1//04Uqw3zze3zJoCgYIARAAGAQSNwF-L9IrrIyxAaZtJCExp3_3C_6Un3S8JZfMk_zJDBfd4e-OJSPHUA6fH1mzBh8xjlD9fhhPnwI


Running the Application
Development Mode (Frontend + Backend)

Run both the React frontend and Express backend:

**
Frontend Only**:
npm run dev:frontend


**Backend Only**:
npm run dev

**Features**:

User authentication (signup/login)

Secure password storage with encryption

Strong password generation

Categorized password management

JWT-based authentication

Rate limiting for login attempts

Responsive, user-friendly design

Link checker and malware scanning

System dashboard with event logs


**Security Features
**
Vaultence implements industry-standard security practices:

Password hashing with bcrypt

JWT token authentication for secure API access

Rate limiting on login attempts to prevent brute-force attacks

Input validation and sanitization to prevent injection attacks

CORS protection for secure cross-origin requests

Optional strong password generation

Real-time monitoring of system events

**Database
**
Vaultence uses MongoDB for data storage. Ensure MongoDB is installed and running locally, or update the MONGODB_URI in .env to point to your database instance.

**API Endpoints
**
POST /api/auth/signup – Create new user account

POST /api/auth/login – User login

GET /api/dashboard – Protected dashboard route

GET /api/passwords – Get user passwords

POST /api/passwords – Add new password

PUT /api/passwords/:id – Update password

Build for Production

Build the project for release:

npm run build

**Security Policy
**
Please see our SECURITY.md for guidelines on reporting vulnerabilities, supported versions, and best security practices.

Vaultence is designed to protect users’ digital life with a modern, user-focused approach to cybersecurity—all in one seamless interface.

