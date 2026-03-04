# LocalLink - System Documentation

## Executive Summary

LocalLink is a comprehensive service marketplace platform that connects service consumers with local service providers. The platform features secure payment processing with M-Pesa integration, an intelligent recommendation system, real-time chat functionality, and a robust escrow-based payment protection system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Technology Stack](#technology-stack)
5. [System Components](#system-components)
6. [Data Models](#data-models)
7. [Payment & Escrow System](#payment--escrow-system)
8. [Security & Authentication](#security--authentication)
9. [Deployment](#deployment)
10. [API Reference](#api-reference)

---

## System Overview

### Purpose
LocalLink facilitates trusted transactions between service consumers and providers through a secure, escrow-based marketplace with intelligent service recommendations and real-time communication.

### Key Capabilities
- Multi-role user management (Consumer, Provider, Admin)
- Service listing and discovery
- AI-powered recommendation engine
- Secure payment processing with M-Pesa
- Escrow-based fund protection
- Real-time chat communication
- Automated payout system
- Comprehensive admin dashboard

### User Roles

**Consumer**
- Browse and search services
- Receive personalized recommendations
- Book services and make payments
- Chat with providers
- Review and rate services

**Provider**
- Create and manage service listings
- Receive booking requests
- Track earnings and payouts
- Communicate with consumers
- Build portfolio and profile

**Admin**
- Monitor platform operations
- Manage users and services
- Oversee escrow operations
- Handle disputes
- View analytics and reports

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   React Frontend (Vite + TypeScript)                 │  │
│  │   - Consumer Dashboard                                │  │
│  │   - Provider Dashboard                                │  │
│  │   - Admin Dashboard                                   │  │
│  │   - Real-time Chat Interface                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Node.js Backend (Express.js)                       │  │
│  │   ┌────────────┐  ┌────────────┐  ┌──────────────┐ │  │
│  │   │   REST API │  │ Socket.IO  │  │ Cron Jobs    │ │  │
│  │   │            │  │            │  │              │ │  │
│  │   │ - Auth     │  │ - Chat     │  │ - Escrow     │ │  │
│  │   │ - Services │  │ - Notif.   │  │   Release    │ │  │
│  │   │ - Bookings │  │            │  │ - Payout     │ │  │
│  │   │ - Payments │  │            │  │   Queue      │ │  │
│  │   └────────────┘  └────────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
┌──────────────────┐ ┌──────────────┐ ┌─────────────────────┐
│   MongoDB        │ │  M-Pesa API  │ │ Recommendation      │
│                  │ │              │ │ Service (Python)    │
│ - Users          │ │ - STK Push   │ │                     │
│ - Services       │ │ - B2C Payout │ │ - FastAPI           │
│ - Bookings       │ │              │ │ - ML Models         │
│ - Escrows        │ │              │ │   • Content-based   │
│ - Transactions   │ │              │ │   • Collaborative   │
│ - Payouts        │ │              │ │   • Hybrid          │
│ - Reviews        │ │              │ │                     │
└──────────────────┘ └──────────────┘ └─────────────────────┘
```

### Microservices Architecture

The system follows a microservices pattern with three main services:

1. **Backend API Service** (Node.js/Express)
   - RESTful API endpoints
   - WebSocket server for real-time features
   - Business logic and data management
   - Payment processing orchestration

2. **Recommendation Service** (Python/FastAPI)
   - Machine learning inference
   - Personalized recommendations
   - Similar service suggestions
   - Independent scaling capability

3. **Database Service** (MongoDB)
   - Persistent data storage
   - Document-based data model
   - Indexed queries for performance

---

## Core Features

### 1. User Management
- Secure registration and authentication
- Role-based access control (RBAC)
- Profile management with portfolio support
- Email verification system
- Account status management (Active/Suspended)

### 2. Service Marketplace
- Service listing creation and management
- Category-based organization
- Image upload and gallery
- Pricing and availability management
- Search and filtering capabilities

### 3. Booking System
- Service request workflow
- Status tracking (Pending → In Progress → Completed)
- Booking history and management
- Cancellation handling with reason tracking
- Status history audit trail

### 4. Payment Processing
- M-Pesa STK Push integration for consumer payments
- Automated B2C payouts to providers
- Multi-currency support (KES primary)
- Transaction history and receipts
- Payment status tracking and notifications

### 5. Escrow System
- Automatic fund holding on booking creation
- Configurable commission structure (10% default)
- Time-based auto-release mechanism
- Manual release controls for admins
- Dispute resolution support
- Comprehensive audit trail via ledger entries

### 6. Recommendation Engine
- Content-based filtering using service attributes
- Collaborative filtering based on user behavior
- Hybrid model combining multiple approaches
- Personalized service suggestions
- Similar service recommendations
- Real-time recommendation updates

### 7. Real-time Communication
- WebSocket-based chat system
- One-on-one messaging between users
- Message history persistence
- Online status indicators
- Typing indicators
- Unread message counters

### 8. Review & Rating System
- Post-service review submission
- 5-star rating system
- Review moderation capabilities
- Provider rating aggregation
- Review display on service listings

---

## Technology Stack

### Frontend
- **Framework**: React 19.2.3
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.8.2
- **Styling**: Tailwind CSS (via tailwind-merge)
- **UI Components**: Custom components with Lucide React icons
- **Charts**: Recharts 3.6.0
- **HTTP Client**: Axios 1.13.5
- **Real-time**: Socket.IO Client 4.8.3

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Language**: JavaScript (ES Modules)
- **Database**: MongoDB with Mongoose 9.1.5
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **Password Hashing**: bcryptjs 3.0.3
- **Real-time**: Socket.IO 4.8.3
- **HTTP Client**: Axios 1.13.5

### Recommendation Service
- **Framework**: FastAPI
- **Language**: Python 3.x
- **ML Libraries**: scikit-learn, pandas, numpy
- **Model Storage**: Pickle (.pkl files)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (frontend)
- **Database**: MongoDB 7
- **Payment Gateway**: M-Pesa Daraja API

---

## System Components

### Backend Controllers

1. **auth.controller.js** - User authentication and registration
2. **user.controller.js** - User profile management
3. **service.controller.js** - Service CRUD operations
4. **booking.controller.js** - Booking lifecycle management
5. **payment.controller.js** - Payment processing and escrow
6. **transaction.controller.js** - Transaction history
7. **chat.controller.js** - Chat message handling
8. **review.controller.js** - Review and rating management
9. **recommendation.controller.js** - Recommendation proxy
10. **admin.controller.js** - Admin operations
11. **order.controller.js** - Order management
12. **settings.controller.js** - Platform settings

### Backend Services

- **escrow.service.js** - Escrow business logic and state management
- **recommendationClient.js** - HTTP client for recommendation service
- **recommendationMonitor.js** - Health monitoring for ML service

### Background Jobs

- **escrow.jobs.js**
  - Auto-release job (every 30 seconds)
  - Release queue processor (every 45 seconds)
  - Automatic payout initiation

### Middleware

- **auth.middleware.js** - JWT token verification
- **role.middleware.js** - Role-based access control
- **webhookAuth.middleware.js** - M-Pesa webhook authentication
- **error.middleware.js** - Global error handling

### Frontend Components

**Consumer Dashboard**
- DashboardHome.tsx - Overview and quick actions
- ExploreServices.tsx - Service browsing with recommendations
- ServiceRequests.tsx - Booking management
- Payments.tsx - Payment history
- ProviderProfile.tsx - View provider details

**Provider Dashboard**
- DashboardHome.tsx - Earnings and job overview
- MyServices.tsx - Service management
- CreateService.tsx - Service creation form
- ServiceRequests.tsx - Job requests
- Earnings.tsx - Financial dashboard
- EditProfile.tsx - Profile editing
- Onboarding.tsx - Initial profile setup

**Admin Dashboard**
- overview.tsx - Platform statistics
- users.tsx - User management
- transactions.tsx - Transaction monitoring
- escrowOps.tsx - Escrow operations
- moderation.tsx - Content moderation
- settings.tsx - Platform configuration

**Shared Components**
- Chat.tsx - Real-time messaging interface
- Layout.tsx - Main application layout
- LandingPage.tsx - Public homepage

---

## Data Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: Enum ["CONSUMER", "PROVIDER", "ADMIN"],
  avatar: String,
  verified: Boolean,
  status: Enum ["ACTIVE", "SUSPENDED"],
  location: String,
  // Provider-specific fields
  tagline: String,
  bio: String,
  phone: String,
  address: String,
  category: String,
  website: String,
  coverImage: String,
  portfolio: [String],
  timestamps: true
}
```

### Service Model
```javascript
{
  provider: ObjectId (ref: User),
  title: String (required),
  description: String (required),
  category: String (required),
  price: Number (required),
  rating: Number (default: 0),
  reviews: Number (default: 0),
  image: String (required),
  timestamps: true
}
```

### Booking Model
```javascript
{
  service: ObjectId (ref: Service),
  order: ObjectId (ref: Order),
  consumer: ObjectId (ref: User),
  provider: ObjectId (ref: User),
  date: Date (required),
  status: Enum ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  price: Number (required),
  currency: String (default: "KES"),
  serviceTitleSnapshot: String,
  unitPriceSnapshot: Number,
  requestedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: ObjectId (ref: User),
  cancellationReason: String,
  statusHistory: [{
    from: String,
    to: String,
    actor: ObjectId (ref: User),
    actorRole: String,
    reason: String,
    at: Date
  }],
  timestamps: true
}
```

### Escrow Model
```javascript
{
  booking: ObjectId (ref: Booking),
  order: ObjectId (ref: Order),
  consumer: ObjectId (ref: User),
  provider: ObjectId (ref: User),
  consumerPaymentTransaction: ObjectId (ref: Transaction),
  providerEscrowTransaction: ObjectId (ref: Transaction),
  grossAmount: Number (required),
  commissionAmount: Number (required),
  netAmount: Number (required),
  commissionType: Enum ["PERCENTAGE", "FIXED"],
  commissionValue: Number,
  holdUntil: Date (required),
  releasedAt: Date,
  state: Enum [
    "HELD", "RELEASE_APPROVED", "RELEASING", 
    "RELEASED", "DISPUTED", "CANCELLED", 
    "REFUNDED", "PAYOUT_FAILED"
  ],
  metadata: Mixed,
  timestamps: true
}
```

### Transaction Model
```javascript
{
  user: ObjectId (ref: User),
  type: Enum ["PAYMENT", "PAYOUT", "REFUND", "COMMISSION"],
  amount: Number (required),
  currency: String (default: "KES"),
  status: Enum ["PENDING", "COMPLETED", "FAILED"],
  booking: ObjectId (ref: Booking),
  escrow: ObjectId (ref: Escrow),
  paymentMethod: String,
  externalReference: String,
  metadata: Mixed,
  timestamps: true
}
```

### Payout Model
```javascript
{
  escrow: ObjectId (ref: Escrow),
  provider: ObjectId (ref: User),
  amount: Number (required),
  currency: String (default: "KES"),
  phoneNumber: String (required),
  status: Enum ["PENDING", "PROCESSING", "SUCCESS", "FAILED"],
  mpesaConversationID: String,
  mpesaOriginatorConversationID: String,
  mpesaTransactionID: String,
  resultCode: String,
  resultDesc: String,
  initiatedAt: Date,
  completedAt: Date,
  failedAt: Date,
  retryCount: Number (default: 0),
  timestamps: true
}
```

---

## Payment & Escrow System

### Payment Flow

```
1. Consumer initiates payment
   ↓
2. STK Push sent to consumer's phone
   ↓
3. Consumer enters M-Pesa PIN
   ↓
4. Payment confirmed via callback
   ↓
5. Booking created with status PENDING
   ↓
6. Escrow created in HELD state
   ↓
7. Funds held with commission calculated
```

### Escrow Lifecycle

```
HELD (Initial State)
  ↓
  Service completion + Hold period elapsed
  ↓
RELEASE_APPROVED (Auto-release job)
  ↓
  Payout initiated
  ↓
RELEASING (B2C payout in progress)
  ↓
  Payout successful
  ↓
RELEASED (Final state)
```

### Commission Structure

- **Default Rate**: 10% of gross amount
- **Calculation**: `netAmount = grossAmount - (grossAmount * 0.10)`
- **Configurable**: Via `DEFAULT_PLATFORM_FEE_PERCENT` environment variable
- **Types**: Percentage or Fixed amount

### Auto-Release Configuration

```env
ESCROW_AUTO_RELEASE_HOURS=0.1          # 6 minutes (testing)
ESCROW_JOBS_ENABLED=true
ESCROW_AUTO_RELEASE_JOB_INTERVAL_SECONDS=30
ESCROW_RELEASE_QUEUE_JOB_INTERVAL_SECONDS=45
```

### Payout Process

1. **Auto-Release Job** scans for eligible escrows
2. Escrow state changed to `RELEASE_APPROVED`
3. **Release Queue Job** picks up approved escrows
4. B2C payout initiated to provider's phone
5. M-Pesa processes payment
6. Result callback updates payout status
7. Escrow state updated to `RELEASED`

---

## Security & Authentication

### Authentication Flow

1. User submits credentials (email/password)
2. Backend validates credentials
3. JWT token generated with user ID and role
4. Token returned to client
5. Client stores token in localStorage
6. Token included in Authorization header for subsequent requests

### JWT Token Structure

```javascript
{
  id: user._id,
  role: user.role,
  exp: expirationTimestamp
}
```

### Role-Based Access Control

- **Public Routes**: Landing page, login, registration
- **Consumer Routes**: Service browsing, booking, payments
- **Provider Routes**: Service management, earnings, job requests
- **Admin Routes**: User management, escrow operations, platform settings

### Webhook Security

M-Pesa webhooks authenticated using:
- Request signature verification
- IP whitelisting (production)
- Timestamp validation
- Replay attack prevention

### Password Security

- Passwords hashed using bcryptjs
- Salt rounds: 10
- Never stored in plain text
- Password comparison via secure methods

---

## Deployment

### Docker Compose Architecture

The application uses Docker Compose with 4 services:

1. **mongodb** - MongoDB 7 database
   - Port: 27017
   - Volume: mongodb_data

2. **backend** - Node.js API server
   - Port: 5000
   - Depends on: mongodb
   - Health check enabled

3. **frontend** - React application (Nginx)
   - Port: 3000 (mapped to 80)
   - Depends on: backend

4. **recommendation** - Python ML service
   - Port: 8001
   - Independent service

### Environment Variables

**Backend (.env)**
```env
PORT=5000
MONGO_URI=mongodb://mongodb:27017/localLink
JWT_SECRET=your_jwt_secret
MPESA_ENV=sandbox
RECOMMENDATION_SERVICE_URL=http://recommendation:8001
ESCROW_AUTO_RELEASE_HOURS=0.1
ESCROW_JOBS_ENABLED=true
DEFAULT_PLATFORM_FEE_PERCENT=10
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000
```

### Deployment Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Rebuild specific service
docker-compose up --build [service_name]
```

### Helper Scripts

- `rebuild-all.sh` / `rebuild-all.ps1` - Rebuild all services
- `rebuild-backend.sh` / `rebuild-backend.ps1` - Rebuild backend only
- `rebuild-frontend.sh` / `rebuild-frontend.ps1` - Rebuild frontend only

---

## API Reference

### Authentication Endpoints

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             User login
GET    /api/auth/profile           Get current user profile
```

### User Endpoints

```
GET    /api/users/:id              Get user by ID
PUT    /api/users/:id              Update user profile
GET    /api/users/providers        Get all providers
```

### Service Endpoints

```
GET    /api/services               Get all services
GET    /api/services/:id           Get service by ID
POST   /api/services               Create new service (Provider)
PUT    /api/services/:id           Update service (Provider)
DELETE /api/services/:id           Delete service (Provider)
GET    /api/services/provider/:id  Get services by provider
```

### Booking Endpoints

```
POST   /api/bookings               Create booking
GET    /api/bookings/:id           Get booking details
PUT    /api/bookings/:id/status    Update booking status
GET    /api/bookings/my-bookings   Get consumer bookings
GET    /api/bookings/my-jobs       Get provider jobs
```

### Payment Endpoints

```
POST   /api/payments/mpesa/stk-push              Initiate STK Push
POST   /api/payments/mpesa/callback              M-Pesa callback
POST   /api/payments/mpesa/b2c/result            B2C result callback
POST   /api/payments/mpesa/b2c/timeout           B2C timeout callback
```

### Escrow Endpoints (Admin)

```
POST   /api/payments/escrow/process-auto-release      Auto-release job
POST   /api/payments/escrow/process-release-queue     Process payouts
POST   /api/payments/escrow/:escrowId/release         Manual release
GET    /api/payments/escrow/ops-summary               Operations summary
GET    /api/payments/escrow/reconciliation            Reconciliation data
```

### Recommendation Endpoints

```
GET    /api/recommendations/services/:userId          Get recommendations
GET    /api/recommendations/similar/:serviceId        Similar services
GET    /api/recommendations/personalized/:userId      Personalized recs
```

### Review Endpoints

```
POST   /api/reviews                Create review
GET    /api/reviews/service/:id    Get service reviews
GET    /api/reviews/user/:id       Get user reviews
PUT    /api/reviews/:id            Update review
DELETE /api/reviews/:id            Delete review
```

### Chat Endpoints

```
GET    /api/chat/conversations     Get user conversations
GET    /api/chat/messages/:userId  Get messages with user
POST   /api/chat/messages          Send message
```

### Admin Endpoints

```
GET    /api/admin/users            Get all users
PUT    /api/admin/users/:id/status Update user status
GET    /api/admin/statistics       Platform statistics
GET    /api/admin/transactions     All transactions
```

---

## Performance Considerations

### Database Indexing

Key indexes for optimal performance:
- User: email (unique)
- Service: provider, category
- Booking: consumer, provider, status, order
- Escrow: booking, provider, state, holdUntil
- Transaction: user, booking, escrow

### Caching Strategy

- Recommendation results cached in ML service
- User sessions cached via JWT
- Static assets cached via Nginx

### Scalability

- Microservices architecture allows independent scaling
- MongoDB supports horizontal scaling via sharding
- Recommendation service can be replicated
- WebSocket connections can be load-balanced

---

## Monitoring & Maintenance

### Health Checks

- Backend: `/health` endpoint
- Recommendation Service: `/health` endpoint
- Database: Connection status monitoring

### Logging

- Server logs via console
- Escrow job execution logs
- Payment transaction logs
- Error tracking and reporting

### Backup Strategy

- MongoDB data volume persistence
- Regular database backups recommended
- Transaction logs for audit trail

---

## Future Enhancements

1. **Mobile Applications** - Native iOS and Android apps
2. **Advanced Analytics** - Business intelligence dashboard
3. **Multi-language Support** - Internationalization
4. **Push Notifications** - Real-time alerts
5. **Video Consultations** - Integrated video calls
6. **Advanced Search** - Elasticsearch integration
7. **Geolocation** - Location-based service discovery
8. **Subscription Plans** - Premium provider tiers
9. **Dispute Resolution** - Automated mediation system
10. **API Rate Limiting** - DDoS protection

---

## Support & Documentation

### Additional Resources

- `PAYMENT_SYSTEM_STATUS.md` - Payment system overview
- `B2C_PAYOUT_TESTING_GUIDE.md` - Payout testing guide
- `DOCKER_GUIDE.md` - Docker deployment guide
- `DOCKER_QUICK_START.md` - Quick start guide
- `RECOMMENDATION_INTEGRATION.md` - ML service integration
- `backend/MPESA_TROUBLESHOOTING.md` - M-Pesa debugging

### Contact Information

For technical support or questions about the system, refer to the project repository or contact the development team.

---

**Document Version**: 1.0  
**Last Updated**: March 4, 2026  
**System Status**: Production Ready (Dev Mode)
