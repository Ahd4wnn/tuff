export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#F5F4F0',
        ink: '#1A1A1A',
        ink2: '#3D3D3D',
        ink3: '#7A7A7A',
        border: '#E0DED8',
        accent: '#C8B89A',
        'accent-dark': '#A89878',
        glass: 'rgba(245,244,240,0.7)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}
