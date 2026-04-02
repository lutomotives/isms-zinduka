import bcrypt from 'bcryptjs';

import { signAccessToken } from '../utils/crypto.js';

export class AuthService {
  /**
   * @param {{ userRepo: any }} deps
   */
  constructor({ userRepo }) {
    this.userRepo = userRepo;
  }

  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  async login({ username, password }) {
    const user = this.userRepo.getByUsername(username);
    if (!user || !user.is_active) return null;

    const ok = await this.verifyPassword(password, user.password_hash);
    if (!ok) return null;

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    return {
      user: { id: user.id, username: user.username, role: user.role },
      accessToken
    };
  }
}

export default AuthService;
