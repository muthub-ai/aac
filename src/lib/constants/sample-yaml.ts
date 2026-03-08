export const SAMPLE_YAML = `actors:
  Customer:
    type: Person
    label: Customer
    description: A customer of the bank who wants to manage their accounts
    boundary: External

softwareSystems:
  InternetBanking:
    label: Internet Banking System
    description: Allows customers to view their accounts and make payments
    boundary: Internal
    containers:
      WebApp:
        label: Web Application
        technology: React, TypeScript
        description: Delivers the static content and the single page application
      ApiGateway:
        label: API Gateway
        technology: Node.js, Express
        description: Provides internet banking functionality via JSON/HTTPS API
      Database:
        label: Database
        technology: PostgreSQL
        description: Stores user information, accounts, and transactions

  EmailSystem:
    label: E-mail System
    description: The internal Microsoft Exchange email system
    boundary: External

  MainframeBanking:
    label: Mainframe Banking System
    description: Stores all of the core banking information
    boundary: External

relationships:
  - from: Customer
    to: InternetBanking.WebApp
    label: Views account balances and makes payments using
    protocol: HTTPS
  - from: InternetBanking.WebApp
    to: InternetBanking.ApiGateway
    label: API calls
    protocol: JSON/HTTPS
  - from: InternetBanking.ApiGateway
    to: InternetBanking.Database
    label: Reads from and writes to
    protocol: TCP/SQL
  - from: InternetBanking.ApiGateway
    to: MainframeBanking
    label: Gets account information from
    protocol: XML/HTTPS
  - from: InternetBanking.ApiGateway
    to: EmailSystem
    label: Sends e-mails using
    protocol: SMTP
`;
