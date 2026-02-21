const { gql } = require("graphql-tag");

const typeDefs = gql`
  scalar Date

  type User {
    _id: ID!
    username: String!
    email: String!
    created_at: Date!
    updated_at: Date!
  }

  type Employee {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    gender: String
    designation: String!
    salary: Float!
    date_of_joining: Date!
    department: String!
    employee_photo: String
    created_at: Date!
    updated_at: Date!
  }

  type AuthPayload {
    success: Boolean!
    message: String!
    token: String
    user: User
  }

  type ApiResponse {
    success: Boolean!
    message: String!
  }

  type EmployeeResponse {
    success: Boolean!
    message: String!
    employee: Employee
  }

  type EmployeesResponse {
    success: Boolean!
    message: String!
    employees: [Employee!]!
  }

  input SignupInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    usernameOrEmail: String!
    password: String!
  }

  input EmployeeInput {
    first_name: String!
    last_name: String!
    email: String!
    gender: String
    designation: String!
    salary: Float!
    date_of_joining: Date!
    department: String!
    employee_photo: String
  }

  input EmployeeUpdateInput {
    first_name: String
    last_name: String
    email: String
    gender: String
    designation: String
    salary: Float
    date_of_joining: Date
    department: String
    employee_photo: String
  }

  type Query {
    login(input: LoginInput!): AuthPayload!

    getAllEmployees: EmployeesResponse!
    getEmployeeByEid(eid: ID!): EmployeeResponse!
    searchEmployees(designation: String, department: String): EmployeesResponse!
  }

  type Mutation {
    signup(input: SignupInput!): AuthPayload!

    addEmployee(input: EmployeeInput!): EmployeeResponse!
    updateEmployee(eid: ID!, input: EmployeeUpdateInput!): EmployeeResponse!
    deleteEmployee(eid: ID!): ApiResponse!
  }
`;

module.exports = typeDefs;