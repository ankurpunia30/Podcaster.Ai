import { Router } from 'express';
import { login, register } from '../controllers/authController.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';

const router = Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

export default router;


