// backend/models/__tests__/User.test.js
// Unit tests for User model

const User = require('../User');

// Mock pg Pool
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    on: jest.fn()
  }))
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed_password')),
  compare: jest.fn(() => Promise.resolve(true))
}));

describe('User Model', () => {
  const mockUserData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashed_password',
    name: 'Test User',
    company: 'Test Company',
    professionalLicense: 'LIC-12345',
    subscription_tier: 'free',
    created_at: new Date(),
    updated_at: new Date()
  };

  describe('Constructor', () => {
    it('should create a User instance with correct properties', () => {
      const user = new User(mockUserData);
      
      expect(user.id).toBe(mockUserData.id);
      expect(user.email).toBe(mockUserData.email);
      expect(user.password).toBe(mockUserData.password);
      expect(user.name).toBe(mockUserData.name);
      expect(user.company).toBe(mockUserData.company);
      expect(user.professionalLicense).toBe(mockUserData.professionalLicense);
      expect(user.subscriptionTier).toBe(mockUserData.subscription_tier);
      expect(user.createdAt).toBe(mockUserData.created_at);
      expect(user.updatedAt).toBe(mockUserData.updated_at);
    });
  });

  describe('toJSON', () => {
    it('should return user data without password', () => {
      const user = new User(mockUserData);
      const json = user.toJSON();
      
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('email');
      expect(json).toHaveProperty('name');
      expect(json).not.toHaveProperty('password');
    });

    it('should include all non-sensitive fields', () => {
      const user = new User(mockUserData);
      const json = user.toJSON();
      
      expect(json).toEqual({
        id: mockUserData.id,
        email: mockUserData.email,
        name: mockUserData.name,
        company: mockUserData.company,
        professionalLicense: mockUserData.professionalLicense,
        subscriptionTier: mockUserData.subscription_tier,
        createdAt: mockUserData.created_at,
        updatedAt: mockUserData.updated_at
      });
    });
  });

  describe('comparePassword', () => {
    it('should compare password correctly', async () => {
      const user = new User(mockUserData);
      const result = await user.comparePassword('password');
      
      expect(result).toBe(true);
    });
  });

  describe('Static methods', () => {
    it('should have findByEmail method', () => {
      expect(User.findByEmail).toBeDefined();
      expect(typeof User.findByEmail).toBe('function');
    });

    it('should have findById method', () => {
      expect(User.findById).toBeDefined();
      expect(typeof User.findById).toBe('function');
    });

    it('should have create method', () => {
      expect(User.create).toBeDefined();
      expect(typeof User.create).toBe('function');
    });
  });
});
