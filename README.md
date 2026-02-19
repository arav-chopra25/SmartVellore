# 🏙️ SmartVellore - Citizen Issue Reporting Platform

A modern, full-stack web application that empowers citizens of Vellore to report civic issues with photo evidence and location data. Built with React, FastAPI, and integrated with AI-powered features.

## ✨ Features

### 👥 Citizen Portal
- **Interactive Issue Reporting** - Submit civic issues with title, description, and photos
- **Location Mapping** - Click on map or search addresses to pinpoint issue location
- **Address Search** - Type street/area names with auto-suggestions (OpenStreetMap integration)
- **Live Feed** - View all reported issues in real-time with status updates
- **Photo Upload** - Attach visual evidence to reports
- **AI Description Enhancement** - Refine issue descriptions with Gemini AI (optional)

### 🛡️ Admin Dashboard
- **Centralized Management** - View and manage all citizen reports
- **Status Tracking** - Update issue status (Open → In Progress → Resolved)
- **Delete Issues** - Remove reports with automatic file cleanup
- **Statistics Dashboard** - Real-time metrics (Total, Pending, Resolved)
- **AI Analysis** - Get recommendations for issue resolution (optional)
- **Detailed Modal View** - See full issue details with embedded map and images
- **JWT Authentication** - Secure admin access

### 🗺️ Interactive Maps
- **Leaflet Integration** - Smooth, interactive maps for location selection
- **Real-time Markers** - Click anywhere to set issue location
- **Embedded Issue Maps** - Each issue displays its location in modal view

## 🛠️ Tech Stack

### Frontend
- **React 19.2.3** - Modern UI library
- **Tailwind CSS 3.3.6** - Utility-first styling
- **Axios 1.13.2** - HTTP client
- **Leaflet 1.9.4** - Interactive maps
- **Lucide React** - Beautiful icon library

### Backend
- **FastAPI 0.104+** - High-performance Python API framework
- **SQLAlchemy 2.0+** - ORM for database operations
- **SQLite** - Lightweight database
- **Pydantic 2.5+** - Data validation
- **Python-Jose 3.3+** - JWT authentication
- **Uvicorn 0.41+** - ASGI server

### External APIs
- **Nominatim (OpenStreetMap)** - Free geocoding service
- **Google Gemini AI** - Optional AI features (requires API key)

## 📦 Installation

### Prerequisites
- Python 3.14+ (or 3.10+)
- Node.js 18+
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps
```

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
Backend will run at: `http://127.0.0.1:8000`

### Start Frontend Development Server

```bash
cd frontend
npm start
```
Frontend will run at: `http://localhost:3000`

## 🔑 Default Credentials

**Admin Login:**
- Username: `admin`
- Password: `admin`

⚠️ **Important:** Change these in production!

## 📁 Project Structure

```
SmartVellore/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── issues.py      # Issue CRUD endpoints
│   │   │   └── admin.py       # Admin authentication
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database setup
│   │   ├── main.py            # FastAPI app
│   │   ├── models.py          # SQLAlchemy models
│   │   └── schemas.py         # Pydantic schemas
│   ├── uploads/               # User-uploaded images
│   ├── requirements.txt       # Python dependencies
│   └── smartvellore.db        # SQLite database
│
├── frontend/
│   ├── public/
│   │   └── index.html         # Leaflet CDN imports
│   ├── src/
│   │   ├── App.js             # Main application (1052 lines)
│   │   ├── App.css            # Custom styles
│   │   └── index.js           # React entry point
│   ├── package.json           # Node dependencies
│   ├── tailwind.config.js     # Tailwind configuration
│   └── postcss.config.js      # PostCSS configuration
│
└── .gitignore                 # Git exclusions
```

## 🌐 API Endpoints

### Issues
- `GET /issues` - Fetch all issues
- `POST /issues` - Create new issue (multipart/form-data)
- `PUT /issues/{id}` - Update issue status
- `DELETE /issues/{id}` - Delete issue and associated image

### Admin
- `POST /admin/login` - Admin authentication (returns JWT)

## 🎨 Features Showcase

### Modern UI Design
- Rounded corners with `rounded-[2rem]` design language
- Smooth transitions and hover effects
- Responsive layout (mobile, tablet, desktop)
- Custom scrollbars and animations
- Status badges with color coding

### Location Features
- Interactive map clicking for precise location
- Address search with dropdown suggestions
- Coordinates display in user-friendly format
- Embedded maps in issue detail modals

### Admin Features
- Real-time statistics cards
- Sortable data table
- One-click status updates
- Delete with confirmation
- AI-powered recommendations

## 🔮 Optional: Enable AI Features

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `frontend/src/App.js` line 36:
   ```javascript
   const apiKey = "YOUR_GEMINI_API_KEY_HERE";
   ```
3. AI features will activate automatically:
   - ✨ AI Refine button in report form
   - ✨ AI Analyze button in admin dashboard

## 🔒 Security Notes

- Database and uploads are excluded from Git via `.gitignore`
- JWT tokens stored in localStorage
- File upload validation on backend
- CORS configured for localhost development
- Admin credentials hardcoded (should be moved to database in production)

## 🚧 Future Enhancements

- [ ] Environment variables for configuration
- [ ] PostgreSQL for production
- [ ] User registration and profiles
- [ ] Email notifications
- [ ] Image compression
- [ ] Issue categories and filtering
- [ ] Export reports as PDF/CSV
- [ ] Mobile app version
- [ ] Multi-language support

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Arav Chopra**

GitHub: [@arav-chopra25](https://github.com/arav-chopra25)

---

Made with ❤️ for Vellore Smart City Initiative
