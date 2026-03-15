-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "studyStartHour" INTEGER NOT NULL DEFAULT 10,
    "studyStartMinute" INTEGER NOT NULL DEFAULT 0,
    "lateFeeAmount" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_members" ("color", "createdAt", "displayName", "id", "name") SELECT "color", "createdAt", "displayName", "id", "name" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
