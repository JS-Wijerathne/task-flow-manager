import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { globalErrorHandler } from './middleware/errorMiddleware';
import { AppError } from './utils/AppError';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 handler
app.use('*', (req, res, next) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handler (like @ControllerAdvice)
app.use(globalErrorHandler);

// Start server
const PORT = env.PORT;

app.listen(PORT, () => {
    console.log(`
🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}
📝 API available at http://localhost:${PORT}/api
❤️  Health check at http://localhost:${PORT}/health
  `);
});

export default app;
