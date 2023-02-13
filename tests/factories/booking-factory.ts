import faker from "@faker-js/faker";
import { prisma } from "@/config";

export async function createBooking(roomId: number, userId: number) {
    return await prisma.booking.create({
      data: {
            userId: userId,
            roomId: roomId
      }
    });
  }

export async function findBooking() {
 return await prisma.booking.findMany() 
}