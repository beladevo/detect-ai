-- Alter user table to add first name and IP tracking
ALTER TABLE "User"
ADD COLUMN "firstName" TEXT;

ALTER TABLE "User"
ADD COLUMN "registerIp" TEXT;

ALTER TABLE "User"
ADD COLUMN "lastLoginIp" TEXT;
