# Wine Inventory Management Application

A comprehensive web application for managing a 400-bottle wine collection with SVG rack visualization, image management, and advanced search capabilities.

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install server dependencies:**
   ```bash
   cd server && npm install
   ```

2. **Install client dependencies:**
   ```bash
   cd client && npm install
   ```

### Development

1. **Start the backend server:**
   ```bash
   cd server && npm run dev
   ```
   Server runs on http://localhost:3001

2. **Start the frontend (in another terminal):**
   ```bash
   cd client && npm run dev
   ```
   Client runs on http://localhost:5173

3. **Database is already set up** at `database/wine_inventory.db`

## Project Structure

```
wine-inventory/
├── client/                 # React frontend
├── server/                # Node.js backend  
├── database/              # SQLite database and schema
├── PROJECT_PLAN.md        # Implementation roadmap
└── README.md              # This file
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/wines` - Get all wines (with filters)
- `GET /api/wines/:id` - Get specific wine
- `POST /api/wines` - Create new wine
- `PUT /api/wines/:id` - Update wine
- `DELETE /api/wines/:id` - Delete wine
- `GET /api/wines/statistics` - Get collection statistics

## Features Implemented

### ✅ Completed
- Project setup with React + TypeScript + Vite
- Express.js API server with TypeScript
- SQLite database with comprehensive schema
- Wine CRUD operations
- Basic wine list view with filtering
- Responsive dashboard with statistics
- Navigation and routing

### 🚧 In Progress
- Wine add/edit forms
- Image upload system
- SVG rack visualization

### 📋 Planned
- Memory tracking
- Food pairing system
- Archive management
- PWA features

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite with Knex.js
- **Icons**: Heroicons
- **Routing**: React Router

## Development Commands

### Server
```bash
npm run dev      # Start development server
npm run build    # Build TypeScript
npm run start    # Start production server
npm run migrate  # Run database migrations
```

### Client  
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```