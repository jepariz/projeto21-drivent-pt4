import { prisma } from "@/config";

async function findRoom(roomId: number){
    return prisma.room.findFirst({
        where: {
            id: roomId
        }
    })
  }


async function insertBooking(userId: number, roomId:number) {
    return prisma.booking.create({
        data: {
           userId: userId,
           roomId: roomId
        }
    })
}

async function findBooking(userId:number) {
    return prisma.booking.findFirst({
        where: {
            userId: userId
        },
        include: {
            Room: true,
        }
    })
}

async function updateBooking(bookingId:number, roomId:number) {
    return prisma.booking.update({
        where:{
            id: bookingId
        },
        data:{
            roomId: roomId
        }
    })
}


const bookingRepository = {
    insertBooking,
    findRoom,
    findBooking,
    updateBooking
  };
  
  export default bookingRepository;