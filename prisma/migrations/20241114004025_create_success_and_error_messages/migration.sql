-- CreateTable
CREATE TABLE "SuccessMessage" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuccessMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorMessage" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorMessage_pkey" PRIMARY KEY ("id")
);
