import app from './src/app.js';
import connectDB from './src/config/db.js';
import { env } from './src/config/env.js';
import { createBackup } from "./src/services/backupService.js";


const PORT = env.port || 6000;
const MONGO_URI = env.mongoUri || 'mongodb://localhost:27017/anglican-admission-system';


const startServer = async () => {
    try {
        await connectDB(MONGO_URI);
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        if (env.backupScheduleMinutes > 0) {
          const ms = env.backupScheduleMinutes * 60 * 1000;
          setInterval(() => {
            createBackup({ createdBy: null, notes: "Scheduled backup" }).catch(() => {});
          }, ms).unref?.();
        }
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
