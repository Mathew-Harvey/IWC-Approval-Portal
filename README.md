# IWC Notification Package Generator

A web application for generating In-Water Cleaning (IWC) notification packages and Work Method Statements (WMS) for Franmarine Underwater Services.

## 🚀 Live Demo

**GitHub Pages:** [https://your-username.github.io/IWC-Approval-Portal](https://your-username.github.io/IWC-Approval-Portal)

## Features

- **Auto-generates Work Method Statements (WMS)** - Complete documentation aligned with Exposure Draft 2024 and OEMP requirements
- **Notification email generation** - Ready-to-send email text for DPIRD and FPA
- **Automatic scenario determination** - Calculates capture/SAP requirements based on AFC type, fouling rating, and scope
- **Vessel database** - Saves vessel details for repeat jobs
- **Dual API integration** - Marinesia + AISStream for comprehensive vessel lookup
- **Print-friendly output** - Generate PDF via browser print function
- **Local storage** - Save and load job drafts

## Deployment Options

### Option 1: GitHub Pages (Static Hosting)

Perfect for public access without managing servers.

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: `main` / `root`
   - Save

3. **Access your app:**
   - URL: `https://YOUR-USERNAME.github.io/IWC-Approval-Portal`

4. **Configure API Keys:**
   - Click ⚙️ Settings button in the app
   - Enter your Marinesia API key ([Get one free](https://marinesia.com))
   - Keys are stored in your browser only

**Limitations on GitHub Pages:**
- ✅ Marinesia API (works via CORS proxy)
- ✅ Demo/saved vessels
- ❌ AISStream (requires backend server)

### Option 2: Local Development (Full Features)

For development or when you need AISStream real-time data.

```bash
# Install dependencies
npm install

# Start proxy server (serves app + enables both APIs)
npm start
```

Then open: http://localhost:3001

**Features with local server:**
- ✅ Marinesia API (no CORS issues)
- ✅ AISStream real-time data (WebSocket)
- ✅ All vessel types: naval, tugs, pilots, etc.

### Option 3: Vercel/Netlify (Serverless)

For a more robust deployment with full API support:

1. Connect your GitHub repo to Vercel/Netlify
2. They auto-deploy on push
3. Free tier is usually sufficient

## 🔑 API Keys

API keys are stored in your browser's localStorage - never sent to our servers.

### Getting API Keys

| API | Purpose | Get Key |
|-----|---------|---------|
| **Marinesia** | Vessel profiles, IMO/MMSI lookup | [marinesia.com](https://marinesia.com) |
| **AISStream** | Real-time AIS data (local only) | [aisstream.io](https://aisstream.io) |

### Setting API Keys

1. Click the ⚙️ button in the header
2. Enter your API keys
3. Click "Test Connection" to verify
4. Click "Save Settings"

## Regulatory Alignment

This tool generates documentation aligned with:

- **Australian Anti-fouling and In-water Cleaning Guidelines (Exposure Draft 2024)**
  - Section 2.2: Required Outcomes (Capture, Biosecurity, Chemical Contamination standards)
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

## Usage

1. **Job Details** - Auto-generated job number
2. **Vessel Details** - Search or enter manually
3. **AFC Details** - Coating type and condition
4. **Vessel History** - Port calls and operating profile
5. **Scope of Work** - Areas and location
6. **Biofouling Assessment** - FR and cover %
7. **Generate Documents** - WMS or Email

## Project Structure

```
IWC-Approval-Portal/
├── index.html              # Main application
├── proxy-server.js         # Local proxy server
├── package.json            # Dependencies
├── .nojekyll              # Disables Jekyll on GitHub Pages
├── css/
│   └── styles.css          # Styles + print styles
├── js/
│   ├── app.js              # Main application logic
│   ├── templates.js        # Handlebars templates
│   ├── services/
│   │   ├── storage.js      # LocalStorage
│   │   ├── jobNumber.js    # Job number generation
│   │   └── vesselApi.js    # API integration
│   └── utils/
│       └── scenarioLogic.js # Scenario determination
```

## Technology Stack

- **HTML5/CSS3** - No build step required
- **Handlebars.js** - Template engine (CDN)
- **LocalStorage** - Data persistence
- **Marinesia API** - Vessel profiles
- **AISStream API** - Real-time AIS (local only)
- **Express.js** - Proxy server (optional)

## Troubleshooting

### Vessel search returns no results?

1. Check your API key in ⚙️ Settings
2. Try searching by MMSI or IMO instead of name
3. Check if the vessel exists in demo data

### CORS errors in console?

- **On GitHub Pages:** Normal for AISStream (it's disabled)
- **Locally:** Make sure you're using `npm start` and accessing via `localhost:3001`

### AISStream not working?

AISStream requires a backend server due to their security policy. It only works when running locally with `npm start`.

## Future Enhancements

- [ ] Database backend (Supabase)
- [ ] User authentication
- [ ] DPIRD/FPA approval portal
- [ ] Real-time status updates
- [ ] Audit trail

## License

Proprietary - Franmarine Underwater Services

## Support

Franmarine Underwater Services
- Address: 13 Possner Way, Henderson WA 6166
- Website: www.franmarine.com.au
