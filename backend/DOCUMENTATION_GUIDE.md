# FastAPI Documentation Guide

## 🚀 Quick Start

### 1. Start the Server
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Access Documentation
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc
- **OpenAPI JSON**: http://127.0.0.1:8000/openapi.json

### 3. Test the Setup
```bash
# Run comprehensive tests
python setup_and_test_docs.py

# Or run quick access test
python test_docs_access.py
```

## 📚 Documentation Features

### Enhanced API Documentation
✅ **Comprehensive Endpoint Documentation**
- Detailed descriptions for all endpoints
- Request/response examples
- Parameter descriptions with examples
- HTTP status code documentation

✅ **Improved Pydantic Models**
- Field descriptions with examples
- Model configuration with JSON schema examples
- Validation rules clearly documented

✅ **Better Error Handling**
- Standardized error response models
- Clear error messages and codes
- Proper HTTP status codes

✅ **Authentication Documentation**
- Clear authentication requirements
- Development mode instructions
- Bearer token examples

## 🧪 Testing Your API

### Using Swagger UI (Recommended)

1. **Navigate to** http://127.0.0.1:8000/docs
2. **Authorize**: Click "Authorize" and enter any token (e.g., "test-token")
3. **Test Endpoints**: 
   - Click any endpoint to expand
   - Click "Try it out"
   - Fill in parameters
   - Click "Execute"

### Key Endpoints to Test

#### 1. Health Check
```
GET /health
```
- No authentication required
- Returns API status

#### 2. Student Management
```
GET /api/v1/students/
POST /api/v1/students/
GET /api/v1/students/{student_id}
PUT /api/v1/students/{student_id}
DELETE /api/v1/students/{student_id}
```

**Example Student Creation:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+1-555-0789",
  "grade": "11th",
  "subjects": ["Physics", "Chemistry"],
  "parentEmail": "parent.doe@example.com",
  "parentPhone": "+1-555-0987",
  "notes": "Interested in STEM subjects"
}
```

#### 3. AI Question Generation
```
POST /api/v1/questions/generate
```

**Example Request:**
```json
{
  "text_content": "Photosynthesis is the process by which plants convert light energy into chemical energy...",
  "subject": "Biology",
  "topic": "Photosynthesis",
  "question_count": 3,
  "question_types": ["multiple-choice"],
  "difficulty_levels": ["medium"],
  "ai_provider": "openai",
  "custom_prompt": "Create questions that test understanding of the basic process"
}
```

#### 4. Settings Management
```
GET /api/v1/settings/
PUT /api/v1/settings/
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Documentation Not Loading
- **Check server status**: Visit http://127.0.0.1:8000/health
- **Verify port**: Ensure server is running on port 8000
- **Check logs**: Look for startup errors in terminal

#### 2. Authentication Errors
- **Use any token**: In development mode, any bearer token works
- **Click Authorize**: Make sure to authorize in Swagger UI
- **Format**: Use "Bearer your-token-here" format

#### 3. CORS Issues
- **Frontend access**: CORS is configured to allow all origins
- **Browser cache**: Clear browser cache if issues persist

#### 4. Database Connection
- **MongoDB**: Ensure MongoDB is running on localhost:27017
- **Connection string**: Check MONGODB_URL in settings

### Testing Scripts

#### Comprehensive Test
```bash
python setup_and_test_docs.py
```
- Starts server automatically
- Tests all documentation endpoints
- Opens browser with docs
- Provides usage instructions

#### Quick Test
```bash
python test_docs_access.py
```
- Tests documentation accessibility
- Analyzes OpenAPI schema
- Checks endpoint availability

## 📖 API Documentation Structure

### Organized by Tags
- **Health**: System health and status
- **Students**: Student management operations
- **Subjects**: Subject and topic management
- **Questions**: Question generation and management
- **Assignments**: Assignment tracking
- **Files**: File upload and processing
- **Settings**: System configuration

### Response Models
- **Success responses**: Standardized success format
- **Error responses**: Consistent error structure
- **Validation errors**: Detailed validation feedback

### Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

## 🎯 Best Practices

### When Testing Endpoints
1. **Start simple**: Begin with GET endpoints
2. **Use examples**: Copy provided JSON examples
3. **Check responses**: Verify response format and data
4. **Test edge cases**: Try invalid data to see error handling
5. **Monitor logs**: Watch server logs for debugging

### For Development
1. **Use Swagger UI**: Best for interactive testing
2. **Check ReDoc**: Better for reading documentation
3. **Validate schemas**: Use OpenAPI JSON for validation
4. **Test regularly**: Run test scripts after changes

## 🔗 Useful Links

- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc
- **OpenAPI Schema**: http://127.0.0.1:8000/openapi.json
- **Health Check**: http://127.0.0.1:8000/health

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Run the test scripts
3. Check server logs
4. Verify MongoDB is running
5. Ensure all dependencies are installed
