import { Request, Response } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  private service = new AuthService();

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;
      const result = await this.service.login(username, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  };
}
