import { Router, Request, Response } from 'express';

const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'chess-online-server',
  });
});

export { healthRouter };
