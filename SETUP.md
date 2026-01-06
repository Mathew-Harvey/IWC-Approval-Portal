# Setup Instructions

## Environment Variables

This application requires API keys to be set in environment variables. Create a `.env` file in the root directory:

### Create `.env` file

Create a file named `.env` in the project root with the following content:

```env
# Marinesia API Key (required)
# Get your free key at: https://marinesia.com
MARINESIA_API_KEY=JlOZeHWxHmsGRViFvaVwSNiCH

# AISStream API Key (optional - for real-time AIS data)
# Get your free key at: https://aisstream.io
AISSTREAM_API_KEY=38bd336ae27761db109eec3c6d6c684c404708b0

# Node Environment
NODE_ENV=development

# Server Port (optional - defaults to 3001)
PORT=3001
```

### Important Notes

- **DO NOT commit the `.env` file** - It's already in `.gitignore`
- The `.env` file is only used in development
- For production (Render), set environment variables in the Render dashboard
- `MARINESIA_API_KEY` is required - the server will exit if it's missing
- `AISSTREAM_API_KEY` is optional - AISStream features will be disabled if not set

### Getting API Keys

1. **Marinesia API Key:**
   - Visit: https://marinesia.com
   - Sign up for a free account
   - Get your API key from the dashboard

2. **AISStream API Key:**
   - Visit: https://aisstream.io
   - Sign up for a free account
   - Get your API key from the dashboard

### Testing

After creating the `.env` file, start the server:

```bash
npm start
```

The server will:
- ✅ Load environment variables from `.env`
- ✅ Validate that `MARINESIA_API_KEY` is set
- ⚠️ Warn if `AISSTREAM_API_KEY` is missing (but continue running)

