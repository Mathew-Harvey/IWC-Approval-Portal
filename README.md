# IWC Notification Package Generator

A web application for generating In-Water Cleaning (IWC) notification packages and Work Method Statements (WMS) for Franmarine Underwater Services.

## 🚀 Live Demo

**Production URL:** (Your Render URL here)

## Features

- **Auto-generates Work Method Statements (WMS)** - Complete documentation aligned with Exposure Draft 2024 and OEMP requirements
- **Notification email generation** - Ready-to-send email text for DPIRD and FPA
- **Automatic scenario determination** - Calculates capture/SAP requirements based on AFC type, fouling rating, and scope
- **Vessel database** - Saves vessel details for repeat jobs
- **Dual API integration** - Marinesia + AISStream for comprehensive vessel lookup
- **Print-friendly output** - Generate PDF via browser print function

## Deployment on Render

### Quick Deploy

1. **Fork or push this repo to GitHub**

2. **Create a new Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - New → Web Service
   - Connect your GitHub repo
   - Settings:
     - **Runtime:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

3. **Set Environment Variables (optional but recommended):**
   - `MARINESIA_API_KEY` - Your Marinesia API key
   - `AISSTREAM_API_KEY` - Your AISStream API key
   - `NODE_ENV` - `production`

4. **Deploy!** Render will build and deploy automatically.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Auto-set by Render |
| `NODE_ENV` | No | `production` for production |
| `MARINESIA_API_KEY` | No | Marinesia API key (has default) |
| `AISSTREAM_API_KEY` | No | AISStream API key (has default) |

## Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Open browser
open http://localhost:3001
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check (used by Render) |
| `GET /api/marinesia/vessel/:mmsi/profile` | Get vessel by MMSI |
| `GET /api/marinesia/vessel/profile?filters=...` | Search vessels |
| `GET /api/aisstream/search?query=...` | Search AIS cache |
| `GET /api/aisstream/status` | AISStream connection status |

## Regulatory Alignment

This tool generates documentation aligned with:

- **Australian Anti-fouling and In-water Cleaning Guidelines (Exposure Draft 2024)**
  - Section 2.2: Required Outcomes
  - Section 2.3: Application of Standards
  - Section 2.4: Decision Support Tools

- **Fremantle Port Authority OEMP**
  - Section 6.1.2: Risk Categories
  - Section 6.1.3-6.1.4: Biosecurity Assessment
  - Section 7.2: Sampling Protocols

## Scenario Logic

| Operation | Capture | SAP |
|-----------|---------|-----|
| Hull grooming (FR≤20), non-biocidal AFC | No | No |
| Hull grooming (FR≤20), biocidal AFC | Yes | Yes |
| Hull cleaning (FR 30-80) | Yes | Yes |
| Propeller polish (FR≤80, ≤5% cover) | No | No |
| Niche areas | Yes | Yes |

**High Risk Triggers:**
- FR ≥90
- Non-regional biofouling
- IMS suspected
- AFC damaged/unknown/expired

## Project Structure

```
IWC-Approval-Portal/
├── proxy-server.js         # Node.js API server
├── package.json            # Dependencies
├── render.yaml             # Render deployment config
├── index.html              # Main application
├── css/
│   └── styles.css
├── js/
│   ├── app.js              # Main application logic
│   ├── templates.js        # Handlebars templates
│   ├── services/
│   │   ├── storage.js      # LocalStorage
│   │   ├── jobNumber.js    # Job number generation
│   │   └── vesselApi.js    # API integration
│   └── utils/
│       └── scenarioLogic.js
```

## Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JS
- **Backend:** Node.js, Express
- **APIs:** Marinesia (vessel profiles), AISStream (real-time AIS)
- **Templating:** Handlebars.js
- **Hosting:** Render

## License

Proprietary - Franmarine Underwater Services

## Support

Franmarine Underwater Services
- Address: 13 Possner Way, Henderson WA 6166
- Website: www.franmarine.com.au
