import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { UsersService } from './users.service';

export class UsersController {
  private service = new UsersService();

  public getAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const users = await this.service.getAllUsers();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.service.getUserById(id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  public create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const newUser = await this.service.createUser(req.body);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedUser = await this.service.updateUser(id, req.body);
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  public delete = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id || '';
      await this.service.deleteUser(id, currentUserId);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
}
