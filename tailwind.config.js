// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    'bg-green-500',
    'bg-yellow-400',
    'bg-orange-400',
    'bg-red-500',
    'bg-purple-600',
    'w-1/5',
    'border-l-8',
    'border-r-8',
    'border-b-8',
    'border-transparent',
    'border-b-black',
    'animate-[rainFall_1s_linear_infinite]',
    'animate-[rainFall_0.5s_linear_infinite]',
    'animate-[rainFall_2s_linear_infinite]',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
