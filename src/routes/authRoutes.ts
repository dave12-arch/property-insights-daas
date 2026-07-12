import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { z } from 'zod';

const router = Router();

// Define strict schemas. Zod naturally sanitizes by stripping unknown fields.
const authSchema = z.object({
  email: z.string().email('Invalid email format').transform(str => str.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

router.post('/register', validate(authSchema), register);
router.post('/login', validate(authSchema), login);

export default router;