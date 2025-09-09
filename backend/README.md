# LearnTrack MVP Backend

A FastAPI-based backend for the LearnTrack educational platform, supporting tutors, students, and parents with AI-powered question generation and progress tracking.

## Features

- **Role-based Authentication**: Auth0 integration with tutor, student, and parent roles
- **AI-Powered Question Generation**: Support for multiple AI providers (OpenAI, Anthropic, Google)
- **File Processing**: Upload and process educational documents to generate questions
- **Progress Tracking**: Monitor student performance and learning analytics
- **Subject Management**: Organize content by subjects and topics
- **Assignment System**: Create and manage assignments with automated grading

## Technology Stack

- **Framework**: FastAPI 0.104.1
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: Auth0 with JWT tokens
- **AI Integration**: OpenAI, Anthropic, Google Generative AI
- **File Storage**: UploadThing cloud storage with CDN
- **Logging**: Structured logging with structlog
- **Validation**: Pydantic models and schemas

## Project Structure

```
backend/
├── app/
│   ├── api/v1/endpoints/     # API route handlers
│   ├── core/                 # Core functionality (config, auth, database)
│   ├── models/              # Pydantic models and schemas
│   ├── services/            # Business logic services
│   │   └── ai/              # AI provider integrations
│   └── main.py              # FastAPI application entry point
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Setup Instructions

### 1. Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URL`: MongoDB connection string
- `AUTH0_DOMAIN`: Your Auth0 domain
- `AUTH0_API_AUDIENCE`: Auth0 API audience
- `UPLOADTHING_SECRET`: UploadThing secret key
- `UPLOADTHING_APP_ID`: UploadThing app ID
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `ANTHROPIC_API_KEY`: Anthropic API key (optional)
- `GOOGLE_API_KEY`: Google AI API key (optional)

### 3. Database Setup

Ensure MongoDB is running locally or configure a cloud MongoDB instance.

### 4. Run the Application

```bash
# Development mode with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the built-in runner
python app/main.py
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `GET /api/v1/auth/profile` - Get user profile

### Users
- `GET /api/v1/users/` - List users (admin)
- `GET /api/v1/users/{user_id}` - Get user details
- `PUT /api/v1/users/{user_id}` - Update user

### Subjects
- `POST /api/v1/subjects/` - Create subject (tutor)
- `GET /api/v1/subjects/` - List subjects
- `GET /api/v1/subjects/{subject_id}` - Get subject details
- `PUT /api/v1/subjects/{subject_id}` - Update subject (tutor)
- `DELETE /api/v1/subjects/{subject_id}` - Delete subject (tutor)

### Questions
- `POST /api/v1/questions/` - Create question (tutor)
- `GET /api/v1/questions/` - List questions
- `GET /api/v1/questions/{question_id}` - Get question details

### Files
- `POST /api/v1/files/register` - Register file metadata after UploadThing upload (tutor)
- `POST /api/v1/files/webhook` - UploadThing webhook endpoint
- `GET /api/v1/files/` - List uploaded files (tutor)
- `POST /api/v1/files/{file_id}/process` - Process file to generate questions
- `GET /api/v1/files/{file_id}/status` - Get processing status
- `DELETE /api/v1/files/{file_id}` - Delete file (tutor)
- `GET /api/v1/files/storage/stats` - Get storage statistics (tutor)

### Assignments
- `POST /api/v1/assignments/` - Create assignment (tutor)
- `GET /api/v1/assignments/` - List assignments
- `GET /api/v1/assignments/{assignment_id}` - Get assignment details

### Progress
- `GET /api/v1/progress/student/{student_id}` - Get student progress
- `POST /api/v1/progress/submit` - Submit assignment answers

## Testing

Run basic tests to verify the setup:

```bash
python test_basic.py
```

For comprehensive testing:

```bash
pytest
```

## AI Integration

The backend supports multiple AI providers for question generation:

### OpenAI
- Requires `OPENAI_API_KEY` environment variable
- Uses GPT-4 for question generation and text extraction

### Anthropic (Placeholder)
- Requires `ANTHROPIC_API_KEY` environment variable
- Implementation ready for Claude integration

### Google AI (Placeholder)
- Requires `GOOGLE_API_KEY` environment variable
- Implementation ready for Gemini integration

## File Processing with UploadThing

Supported file types:
- PDF documents
- Word documents (.doc, .docx)
- PowerPoint presentations (.ppt, .pptx)
- Plain text files (.txt)

Processing workflow:
1. **Frontend**: Upload file directly to UploadThing from your Next.js app
2. **Backend**: Register file metadata via `/api/v1/files/register`
3. **Backend**: Process file via `/api/v1/files/{file_id}/process`
4. **Backend**: Monitor status via `/api/v1/files/{file_id}/status`
5. Generated questions are automatically saved to the database

### UploadThing Integration

The backend integrates with UploadThing for file storage:
- Files are uploaded directly from the frontend to UploadThing
- Backend receives file URLs and metadata
- Files are downloaded from UploadThing when processing is needed
- Supports webhook notifications for automatic processing

## Development

### Code Style
- Use Black for code formatting: `black .`
- Use isort for import sorting: `isort .`
- Use flake8 for linting: `flake8 .`

### Adding New Features
1. Create models in `app/models/`
2. Implement services in `app/services/`
3. Add API endpoints in `app/api/v1/endpoints/`
4. Update the main router in `app/api/v1/api.py`

## Production Deployment

1. Set `DEBUG=False` in environment variables
2. Configure production MongoDB instance
3. Set up proper CORS origins
4. Use a production ASGI server like Gunicorn with Uvicorn workers
5. Configure proper logging and monitoring
6. Set up SSL/TLS certificates

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify MongoDB is running
   - Check `MONGODB_URL` in `.env`

2. **Auth0 Authentication Error**
   - Verify Auth0 configuration
   - Check `AUTH0_DOMAIN` and `AUTH0_API_AUDIENCE`

3. **AI Provider Error**
   - Verify API keys are set correctly
   - Check API quotas and limits

4. **File Upload Error**
   - Check file size limits (default 10MB)
   - Verify file type is supported

### Logs

The application uses structured logging. Check console output for detailed error information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is part of the LearnTrack MVP and is proprietary software.
