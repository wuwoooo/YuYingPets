ALTER TABLE `user`
  ADD COLUMN `password_change_required` BOOLEAN NOT NULL DEFAULT false;
