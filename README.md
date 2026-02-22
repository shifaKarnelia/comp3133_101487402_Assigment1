
# Assignment – I (12%)
# COMP 3133 – Full Stack Development – II

This project implements a GraphQL API using Apollo Server, Express, and MongoDB Atlas.
It supports user authentication (JWT) and full CRUD operations for employees.
Employee profile images are stored on Cloudinary.

## Sample User Credentials

 "input": {
    "usernameOrEmail": "tom@gmail.com",
    "password": "tom1234"
  }

## After login, use returned token:

Authorization: Bearer <token>

## How to Run

### Install dependencies:
npm install

### Start server:
npm run dev

### Open:
http://localhost:4000/graphql

