export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 20px 50px rgba(15, 23, 42, 0.18)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top left, rgba(236,72,153,0.22), transparent 38%), radial-gradient(circle at bottom right, rgba(56,189,248,0.18), transparent 30%), linear-gradient(180deg, rgba(15,23,42,0.96), rgba(15,23,42,0.88))',
      },
    },
  },
  plugins: [],
};
