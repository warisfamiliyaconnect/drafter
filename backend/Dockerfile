# Use a slim Python image for the backend
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for some python packages like llama-cpp-python)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir \
    --trusted-host pypi.org \
    --trusted-host files.pythonhosted.org \
    -r requirements.txt

# Copy the rest of the backend code and default ai_engine config
COPY backend/ .
COPY ai_engine/config/ ./ai_engine/config/

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose the FastAPI port
EXPOSE 8000

# Start the application
CMD ["python", "-m", "app.main"]
