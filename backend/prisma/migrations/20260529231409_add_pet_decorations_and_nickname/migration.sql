-- AlterTable
ALTER TABLE `student_pet` ADD COLUMN `last_rename_at` DATETIME(3) NULL,
    ADD COLUMN `nickname` VARCHAR(32) NULL;

-- CreateTable
CREATE TABLE `pet_decoration` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `preview_url` VARCHAR(255) NULL,
    `unlock_level` INTEGER NOT NULL,
    `sort_order` INTEGER NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pet_decoration_school_id_type_idx`(`school_id`, `type`),
    UNIQUE INDEX `pet_decoration_school_id_code_key`(`school_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_pet_decoration` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_pet_id` BIGINT NOT NULL,
    `decoration_id` BIGINT NOT NULL,
    `is_equipped` BOOLEAN NOT NULL DEFAULT false,
    `unlocked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `student_pet_decoration_student_pet_id_decoration_id_key`(`student_pet_id`, `decoration_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pet_decoration` ADD CONSTRAINT `pet_decoration_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_pet_decoration` ADD CONSTRAINT `student_pet_decoration_student_pet_id_fkey` FOREIGN KEY (`student_pet_id`) REFERENCES `student_pet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_pet_decoration` ADD CONSTRAINT `student_pet_decoration_decoration_id_fkey` FOREIGN KEY (`decoration_id`) REFERENCES `pet_decoration`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
