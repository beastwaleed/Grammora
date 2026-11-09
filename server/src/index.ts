import './dotenv-init.js';
import { createApp } from './app.js';
import { providerManager } from './providers/manager.js';

const PORT = Number(process.env.PORT) || 3001;
const app = createApp();

app.listen(PORT, () => {
  const status = providerManager.getProviderStatus();
  console.log(`\n==================================================`);
  console.log(`  Grammora AI Gateway running on port ${PORT}`);
  console.log(`  Active Provider : ${status.active.toUpperCase()}`);
  console.log(`  Primary (Groq)  : ${status.primary.configured ? 'Configured ✅' : 'Not configured (Ready for key)'}`);
  console.log(`  Backup (Gemini) : ${status.backup.configured ? 'Configured ✅' : 'Not configured (Ready for key)'}`);
  console.log(`  Health Endpoint : http://localhost:${PORT}/api/health`);
  console.log(`==================================================\n`);
});

