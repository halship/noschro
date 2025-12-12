let theme = localStorage.getItem('theme') ?? 'light';
document.documentElement.classList.toggle('dark', theme === 'dark');
