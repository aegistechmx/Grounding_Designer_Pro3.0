import React from 'react';

const Logo = ({ size = 'md', darkMode = false }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    xxl: 'w-32 h-32',
    xxxl: 'w-48 h-48'
  };
  
  return (
    <div className={`flex items-center justify-center ${sizes[size]}`}>
      <img src="/LOGO.png" alt="Logo" className="w-full h-full object-contain" />
    </div>
  );
};

export default Logo;