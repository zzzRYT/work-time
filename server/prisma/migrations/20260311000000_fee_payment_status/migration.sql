-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_monthly_fees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    CONSTRAINT "monthly_fees_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_monthly_fees" ("id", "memberId", "month", "paymentStatus")
    SELECT "id", "memberId", "month", CASE WHEN "isPaid" = 1 THEN 'PAID' ELSE 'UNPAID' END
    FROM "monthly_fees";
DROP TABLE "monthly_fees";
ALTER TABLE "new_monthly_fees" RENAME TO "monthly_fees";
CREATE UNIQUE INDEX "monthly_fees_memberId_month_key" ON "monthly_fees"("memberId", "month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
