CREATE TABLE "google_connections" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "googleSubject" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "encryptedRefresh" TEXT NOT NULL,
  "refreshIv" TEXT NOT NULL,
  "scopes" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "google_connections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "google_connections_userId_googleSubject_key" ON "google_connections"("userId", "googleSubject");
CREATE INDEX "google_connections_userId_idx" ON "google_connections"("userId");
ALTER TABLE "google_connections" ADD CONSTRAINT "google_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
