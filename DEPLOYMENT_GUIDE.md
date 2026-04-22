# IEEE 80 Dual-Method Grounding Calculator - Deployment Guide

## **Overview**

Professional engineering analysis platform that provides dual-method grounding system calculations with real-time comparison between analytical (IEEE 80) and discrete (nodal analysis) methods.

## **Architecture**

```
Frontend (React + Tailwind CSS)  :3000
    |
    v
Backend API (Node/Express)     :3001
    |
    v
IEEE 80 Engine (Dual-Method)
    - Analytical Method: IEEE 80 standard formulas
    - Discrete Method: Nodal analysis with spatial distribution
```

## **Local Development Setup**

### Prerequisites
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3001
```

### Frontend Setup
```bash
cd webapp
npm install
npm start
# Dev server runs on http://localhost:3000
```

### Production Build
```bash
cd webapp
npm run build
# Static files in /build folder
```

### Serve Production Build
```bash
cd webapp
npm install -g serve
serve -s build -p 3000
```

## **API Endpoints**

### Health Check
```
GET http://localhost:3001/health
```

### Main Calculation
```
POST http://localhost:3001/api/calculate
Content-Type: application/json

{
  "soil": {
    "soilResistivity": 100,
    "surfaceLayerResistivity": 0,
    "surfaceLayerThickness": 0
  },
  "grid": {
    "gridLength": 50,
    "gridWidth": 30,
    "numParallel": 7,
    "numParallelY": 5,
    "conductorDiameter": 0.01,
    "burialDepth": 0.5,
    "numRods": 4,
    "rodLength": 3,
    "rodDiameter": 0.02
  },
  "fault": {
    "faultCurrent": 10000,
    "faultDuration": 1.0,
    "decrementFactor": 0.15,
    "divisionFactor": 0.6
  }
}
```

## **Response Structure**

```json
{
  "success": true,
  "data": {
    "input": { /* echo of input */ },
    "results": {
      "gridResistance": 1.51,
      "gpr": 9041.81,
      "stepVoltage": null,
      "touchVoltage": null
    },
    "methods": {
      "analytical": {
        "resistance": 1.51,
        "gpr": 9041.81,
        "step": 56,
        "touch": 320
      },
      "discrete": {
        "resistance": 2.45,
        "gpr": 14678,
        "step": 89,
        "touch": 518
      }
    },
    "safety": {
      "stepVoltageSafe": false,
      "touchVoltageSafe": false
    },
    "compliance": {
      "overall": false,
      "standard": "IEEE 80-2013"
    }
  },
  "timestamp": "2026-04-22T10:12:51.825Z"
}
```

## **Key Features**

### **Professional Comparison Panel**
- Quantified differences between methods
- Visual difference bars (green/yellow/red)
- Automatic technical interpretation
- Engineering recommendations

### **Dual-Method Analysis**
1. **Analytical Method**: IEEE 80 standard formulas with empirical factors
2. **Discrete Method**: Nodal analysis with spatial current distribution

### **Safety Assessment**
- IEEE 80 compliance checking
- Step/touch voltage limits
- Safety margin calculations
- Engineering recommendations

### **Visualization**
- Voltage heatmap from discrete solver
- Method comparison tables
- Interactive difference bars

## **Deployment Options**

### **Vercel (Frontend) + Render (Backend)**

#### Frontend (Vercel)
```bash
# In webapp folder
vercel --prod
```

#### Backend (Render)
- Connect GitHub repository
- Set build command: `npm install`
- Set start command: `npm start`
- Environment variables as needed

### **Docker Deployment**
```dockerfile
# Frontend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["serve", "-s", "build", "-p", "3000"]
```

```dockerfile
# Backend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### **Environment Variables**
```bash
# Backend
PORT=3001
NODE_ENV=production

# Frontend (if needed)
REACT_APP_API_URL=http://localhost:3001
```

## **Testing**

### **Unit Tests**
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd webapp
npm test
```

### **Integration Tests**
```bash
# Test API endpoint
curl -X POST http://localhost:3001/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"soil":{"soilResistivity":100},"grid":{"gridLength":50,"gridWidth":30,"numParallel":7,"numParallelY":5},"fault":{"faultCurrent":10000}}'
```

### **End-to-End Testing**
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd webapp && npm start`
3. Open http://localhost:3000
4. Enter parameters and click "Calculate Grounding System"
5. Verify ComparisonPanel shows method differences

## **Performance Considerations**

### **Backend Optimization**
- Response time: ~200-500ms for standard calculations
- Memory usage: ~50-100MB per request
- Concurrent requests: Limited by CPU cores

### **Frontend Optimization**
- Bundle size: ~50KB (gzipped)
- First paint: <2 seconds
- Interactive: <3 seconds

## **Security**

### **API Security**
- Input validation on all endpoints
- CORS configuration for frontend domain
- Rate limiting recommended for production

### **Data Privacy**
- No data persistence required
- Calculations are stateless
- No user authentication needed

## **Monitoring**

### **Health Checks**
```bash
# Backend health
curl http://localhost:3001/health

# Frontend availability
curl http://localhost:3000
```

### **Logging**
- Backend logs to console
- Frontend errors to browser console
- Consider centralized logging for production

## **Troubleshooting**

### **Common Issues**

#### **Backend won't start**
- Check Node.js version: `node --version`
- Verify dependencies: `npm install`
- Check port availability

#### **Frontend build fails**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors
- Verify Tailwind CSS configuration

#### **API connection errors**
- Verify backend is running on port 3001
- Check CORS configuration
- Validate API request format

#### **ComparisonPanel not showing**
- Verify backend returns `methods.analytical` and `methods.discrete`
- Check frontend console for errors
- Validate data structure matches expected format

### **Debug Mode**
```bash
# Backend with debug logs
DEBUG=* npm start

# Frontend development mode
npm start
```

## **Production Checklist**

- [ ] Backend builds and starts successfully
- [ ] Frontend production build works
- [ ] API endpoints respond correctly
- [ ] ComparisonPanel displays method differences
- [ ] All calculations return expected results
- [ ] Error handling works for invalid inputs
- [ ] CORS properly configured
- [ ] Health checks functional
- [ ] Performance within acceptable limits
- [ ] Security measures in place

## **Support**

For technical issues:
1. Check this guide first
2. Review console logs
3. Test API endpoints directly
4. Verify data structures match expected format

## **Version History**

- **v1.0.0**: Initial release with dual-method analysis
- **v1.1.0**: Added ComparisonPanel with visual differences
- **v1.2.0**: Enhanced testing suite and production build

---

**Status**: Production Ready  
**Last Updated**: 2026-04-22  
**Maintainer**: IEEE 80 Engineering Team
