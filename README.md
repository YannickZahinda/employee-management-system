# Employee Management System

A comprehensive employee management system built with NestJS, PostgreSQL, and TypeORM. Features include authentication, employee CRUD, attendance tracking, email notifications, and report generation.

## Features

- ✅ **Authentication System**
  - Register, Login, Logout
  - Forgot Password, Password Reset
  - JWT-based authentication with refresh tokens
  - Role-based access control (Admin, Manager, Employee)

- ✅ **Employee Management**
  - CRUD operations for employees
  - Fields: names, email, employee identifier, phone number
  - Profile management

- ✅ **Attendance Management**
  - Clock in/out system
  - Daily attendance tracking
  - Status tracking (present, absent, late, leave)

- ✅ **Email Notifications**
  - Queue-based email processing
  - Attendance confirmation emails
  - Password reset emails
  - Welcome emails

- ✅ **Report Generation**
  - PDF reports using jsPDF
  - Excel reports using ExcelJS
  - Daily attendance reports

- ✅ **Production Ready**
  - Logging with Winston
  - Health checks
  - Rate limiting
  - Request validation
  - Comprehensive error handling
  - Docker support

## Tech Stack

- **Framework:** NestJS v11
- **Language:** TypeScript
- **Database:** PostgreSQL with TypeORM
- **Authentication:** PassportJS (JWT, Local)
- **Queues:** Bull with Redis
- **Email:** Nodemailer
- **Reports:** jsPDF, ExcelJS
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest
- **Container:** Docker & Docker Compose

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YannickZahinda/employee-management-system.git
cd employee-management-system