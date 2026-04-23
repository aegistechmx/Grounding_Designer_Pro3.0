/**
 * ETAP-Style WebGL Shader Service
 * GPU-accelerated interpolation and contour generation for large grids
 * Grounding Designer Pro - Professional Engineering Visualization
 */

/**
 * Enhanced vertex shader for heatmap with IDW interpolation
 */
export const etapVertexShader = `
  attribute vec2 a_position;
  attribute vec2 a_dataPoint;
  attribute float a_dataValue;
  
  uniform vec2 u_resolution;
  uniform vec2 u_gridSize;
  uniform float u_interpolationPower;
  
  varying vec2 v_texCoord;
  varying float v_value;
  
  void main() {
    vec2 position = a_position * 2.0 - 1.0;
    gl_Position = vec4(position, 0.0, 1.0);
    v_texCoord = a_position;
    v_value = a_dataValue;
  }
`;

/**
 * Enhanced fragment shader with IDW interpolation and ETAP color mapping
 */
export const etapFragmentShader = `
  precision highp float;
  
  uniform sampler2D u_dataTexture;
  uniform sampler2D u_positionTexture;
  uniform vec2 u_resolution;
  uniform vec2 u_gridSize;
  uniform float u_interpolationPower;
  uniform float u_minValue;
  uniform float u_maxValue;
  uniform int u_numDataPoints;
  
  varying vec2 v_texCoord;
  
  // Inverse Distance Weighting interpolation
  float interpolateIDW(vec2 coord, sampler2D posTex, sampler2D valTex, int numPoints, float power) {
    float numerator = 0.0;
    float denominator = 0.0;
    
    for (int i = 0; i < 100; i++) {
      if (i >= numPoints) break;
      
      // Get data point position
      vec2 dataPos = texture2D(posTex, vec2(float(i) / 100.0, 0.5)).xy;
      float dataVal = texture2D(valTex, vec2(float(i) / 100.0, 0.5)).r;
      
      // Calculate distance
      float dist = distance(coord, dataPos);
      
      if (dist < 0.001) {
        return dataVal; // Exact match
      }
      
      float weight = 1.0 / pow(dist, power);
      numerator += weight * dataVal;
      denominator += weight;
    }
    
    return numerator / denominator;
  }
  
  // ETAP-style color mapping
  vec3 getETAPColor(float t) {
    if (t < 0.25) {
      return vec3(0.0, t * 4.0, 1.0);
    } else if (t < 0.5) {
      float localT = (t - 0.25) * 4.0;
      return vec3(0.0, 1.0, 1.0 - localT);
    } else if (t < 0.75) {
      float localT = (t - 0.5) * 4.0;
      return vec3(localT, 1.0, 0.0);
    } else {
      float localT = (t - 0.75) * 4.0;
      return vec3(1.0, 1.0 - localT, 0.0);
    }
  }
  
  void main() {
    vec2 coord = v_texCoord * u_resolution;
    
    // Interpolate value using IDW
    float value = interpolateIDW(coord, u_positionTexture, u_dataTexture, u_numDataPoints, u_interpolationPower);
    
    // Normalize to 0-1 range
    float normalizedValue = (value - u_minValue) / (u_maxValue - u_minValue);
    normalizedValue = clamp(normalizedValue, 0.0, 1.0);
    
    // Apply ETAP color mapping
    vec3 color = getETAPColor(normalizedValue);
    
    gl_FragColor = vec4(color, 0.8);
  }
`;

/**
 * Contour line generation shader
 */
export const contourVertexShader = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  
  void main() {
    vec2 position = a_position * 2.0 - 1.0;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

/**
 * Contour fragment shader with level detection
 */
export const contourFragmentShader = `
  precision highp float;
  
  uniform sampler2D u_valueTexture;
  uniform vec2 u_resolution;
  uniform float u_contourLevel;
  uniform float u_lineWidth;
  uniform vec3 u_lineColor;
  
  void main() {
    vec2 coord = gl_FragCoord.xy / u_resolution;
    
    // Sample neighboring pixels for gradient
    float center = texture2D(u_valueTexture, coord).r;
    float right = texture2D(u_valueTexture, coord + vec2(1.0 / u_resolution.x, 0.0)).r;
    float up = texture2D(u_valueTexture, coord + vec2(0.0, 1.0 / u_resolution.y)).r;
    
    // Calculate gradient magnitude
    float gradient = sqrt(pow(right - center, 2.0) + pow(up - center, 2.0));
    
    // Check if we're near the contour level
    float levelDiff = abs(center - u_contourLevel);
    
    // Draw contour line if near level and gradient is significant
    if (levelDiff < u_lineWidth && gradient > 0.01) {
      gl_FragColor = vec4(u_lineColor, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
  }
`;

/**
 * Multi-level contour shader
 */
export const multiContourFragmentShader = `
  precision highp float;
  
  uniform sampler2D u_valueTexture;
  uniform vec2 u_resolution;
  uniform float u_contourLevels[20];
  uniform int u_numLevels;
  uniform float u_lineWidth;
  
  void main() {
    vec2 coord = gl_FragCoord.xy / u_resolution;
    float center = texture2D(u_valueTexture, coord).r;
    
    // Check each contour level
    for (int i = 0; i < 20; i++) {
      if (i >= u_numLevels) break;
      
      float levelDiff = abs(center - u_contourLevels[i]);
      
      if (levelDiff < u_lineWidth) {
        // Major contours (every 5th level) are thicker
        float thickness = (i % 5 == 0) ? 1.0 : 0.5;
        gl_FragColor = vec4(0.0, 0.0, 0.0, thickness);
        return;
      }
    }
    
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
`;

/**
 * GPU-accelerated Marching Squares shader
 */
export const marchingSquaresVertexShader = `
  attribute vec2 a_position;
  attribute float a_value;
  
  uniform vec2 u_resolution;
  uniform float u_contourLevel;
  
  varying float v_value;
  varying vec2 v_position;
  
  void main() {
    vec2 position = a_position * 2.0 - 1.0;
    gl_Position = vec4(position, 0.0, 1.0);
    v_value = a_value;
    v_position = a_position;
  }
`;

export const marchingSquaresFragmentShader = `
  precision highp float;
  
  uniform float u_contourLevel;
  
  varying float v_value;
  varying vec2 v_position;
  
  void main() {
    // Determine if this cell crosses the contour level
    float diff = v_value - u_contourLevel;
    
    if (abs(diff) < 0.01) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
  }
`;

export default {
  etapVertexShader,
  etapFragmentShader,
  contourVertexShader,
  contourFragmentShader,
  multiContourFragmentShader,
  marchingSquaresVertexShader,
  marchingSquaresFragmentShader
};
