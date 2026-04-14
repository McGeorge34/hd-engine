import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🔮 HD Engine running at http://localhost:${PORT}`);
  console.log(`   Preview: http://localhost:${PORT}/api/chart/preview`);
  console.log(`   Data:    http://localhost:${PORT}/api/chart/data\n`);
});

export default app;
