# Potluck Backend (FastAPI)

This backend provides endpoints for:
- Submitting food entries (name, category, dish, quantity)
- Fetching all entries
- Admin authentication
- Downloading the Excel file (admin only)

## Setup

1. Create a virtual environment:
   python -m venv venv
2. Activate the virtual environment:
   .\venv\Scripts\activate
3. Install dependencies:
   pip install fastapi uvicorn[standard] openpyxl python-multipart
4. Run the server:
   uvicorn main:app --reload --host 0.0.0.0 --port 8000

## Docker
A Dockerfile will be provided for containerization.
