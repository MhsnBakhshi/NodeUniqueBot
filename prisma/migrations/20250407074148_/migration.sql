-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `chat_id` BIGINT NOT NULL,
    `gitHub` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ADMIN') NULL DEFAULT 'USER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_chat_id_key`(`chat_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ban` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chat_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stack` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fields` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Stack_fields_key`(`fields`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserStack` (
    `user_id` INTEGER NOT NULL,
    `stack_id` INTEGER NOT NULL,

    PRIMARY KEY (`user_id`, `stack_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ban` ADD CONSTRAINT `Ban_chat_id_fkey` FOREIGN KEY (`chat_id`) REFERENCES `User`(`chat_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserStack` ADD CONSTRAINT `UserStack_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserStack` ADD CONSTRAINT `UserStack_stack_id_fkey` FOREIGN KEY (`stack_id`) REFERENCES `Stack`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
