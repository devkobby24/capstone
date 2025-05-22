# Capstone Project

This is a full-stack web application built with Next.js for the frontend and Python for the backend. The project features data visualization capabilities using Chart.js and a modern UI built with Tailwind CSS.

## Project Structure

- `app/` - Next.js frontend application
- `backend/` - Python backend server
- `public/` - Static assets
- `.venv/` - Python virtual environment

## Frontend Features

- Built with Next.js 15.3.2
- React 19
- Chart.js for data visualization
- Tailwind CSS for styling
- TypeScript support

## Backend Features

- Python-based backend server
- RESTful API endpoints
- Virtual environment for dependency management

## Getting Started

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

### Backend Setup

1. Activate the virtual environment:
```bash
# Windows
.venv\Scripts\activate
# Unix/MacOS
source .venv/bin/activate
```

2. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Run the backend server:
```bash
python run.py
```

## Development

- Frontend development server runs on port 3000
- Backend server runs on port 8000
- The frontend is configured to proxy API requests to the backend

## Building for Production

1. Build the frontend:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Technologies Used

- **Frontend:**
  - Next.js
  - React
  - Chart.js
  - Tailwind CSS
  - TypeScript

- **Backend:**
  - Python
  - FastAPI (based on the project structure)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
