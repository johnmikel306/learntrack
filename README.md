# LearnTrack MVP

A comprehensive learning management system built with **React SPA** and **FastAPI**.

## 🚀 Architecture

This application has been **migrated from Next.js to React SPA** for improved flexibility and separation of concerns:

- **Frontend**: React SPA with Vite (port 3000)
- **Backend**: FastAPI with MongoDB (port 8000)
- **Authentication**: Clerk React integration
- **Routing**: React Router for client-side navigation

## ✨ Features

- **Multi-Role Support**: Tutors, Students, and Parents with role-specific dashboards
- **Question Generation**: AI-powered question generation using multiple LLM providers
- **Assignment Management**: Create, assign, and track student assignments
- **Progress Tracking**: Monitor student learning progress and performance
- **File Upload**: Support for document uploads using UploadThing
- **Authentication**: Secure authentication with Clerk

## 🛠 Tech Stack

### Frontend (React SPA)
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **React Router v6** - Client-side routing
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI components
- **Clerk React** - Authentication and user management

### Backend (FastAPI)
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Pydantic** - Data validation and serialization
- **Motor** - Async MongoDB driver
- **Multiple LLM Providers** - OpenAI, Anthropic, Google

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm/yarn/pnpm
- **Python 3.8+**
- **MongoDB** (local or cloud)

### 📁 Project Structure

```
learntrack-mvp/
├── frontend/              # React SPA application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API client
│   │   ├── App.tsx        # Main app with routing
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Core configuration
│   │   ├── models/        # Pydantic models
│   │   ├── services/      # Business logic
│   │   └── main.py        # FastAPI app
│   └── requirements.txt
└── docs/                  # Documentation
```

### 🔧 Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd learntrack-mvp
   ```

2. **Frontend Environment**
   Create `frontend/.env.local`:
   ```env
   # Clerk Authentication
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

   # API Configuration
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Backend Environment**
   Create `backend/.env`:
   ```env
   # Database
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=learntrack

   # Authentication
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

   # LLM Providers
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLE_API_KEY=your_google_api_key

   # UploadThing
   UPLOADTHING_SECRET=your_uploadthing_secret
   UPLOADTHING_APP_ID=your_uploadthing_app_id
   ```

### 🏃‍♂️ Installation and Running

1. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   python -m venv .venv

   # On Windows (Git Bash/WSL)
   source .venv/Scripts/activate

   # On macOS/Linux
   source .venv/bin/activate

   pip install -r requirements.txt
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on your system.

4. **Run the Application**

   **Terminal 1 - Backend (FastAPI):**
   ```bash
   cd backend
   source .venv/Scripts/activate  # Windows Git Bash
   # source .venv/bin/activate    # macOS/Linux
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   **Terminal 2 - Frontend (React):**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

## 🌐 Application URLs

### Frontend Routes (React Router)
- `/` - Homepage
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/dashboard` - Role-based dashboard
- `/assignments` - Assignment management
- `/questions` - Question generation
- `/students` - Student management

### Backend API Endpoints
- `GET /health` - Health check
- `GET /api/v1/users/me` - Get current user profile
- `GET /api/v1/students/` - List students
- `POST /api/v1/students/` - Create student
- `GET /api/v1/assignments/` - List assignments
- `POST /api/v1/assignments/` - Create assignment
- `POST /api/v1/questions/generate` - Generate questions using AI

## 🔄 Migration Notes

This application was successfully migrated from **Next.js** to **React SPA**:

### ✅ Completed Changes:
- ✅ Converted Next.js App Router to React Router v6
- ✅ Replaced Next.js specific hooks (`useRouter` → `useNavigate`)
- ✅ Updated Clerk integration (`@clerk/nextjs` → `@clerk/clerk-react`)
- ✅ Migrated from Next.js build system to Vite
- ✅ Updated environment variables (`NEXT_PUBLIC_*` → `VITE_*`)
- ✅ Preserved all UI components and styling
- ✅ Maintained FastAPI backend compatibility
- ✅ Updated API client for React environment

### 🎯 Benefits of Migration:
- **Faster Development**: Vite provides instant hot reload
- **Simpler Architecture**: Clear separation between frontend and backend
- **Better Performance**: Optimized React SPA with code splitting
- **Easier Deployment**: Independent frontend and backend deployments
- **More Flexibility**: Standard React patterns and ecosystem

## 🧪 Development

### Code Style
- **Frontend**: ESLint + Prettier
- **Backend**: Black + isort

### Testing
```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
pytest
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the React app: `cd frontend && npm run build`
2. Deploy the `dist` folder
3. Set environment variables in hosting platform

### Backend (Railway/Heroku/DigitalOcean)
1. Create a new app
2. Set environment variables
3. Deploy from `backend` directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.