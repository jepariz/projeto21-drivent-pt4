import { cannotBooking, notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";


async function createBooking(userId: number, roomId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  
    if (ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
        throw cannotBooking();
      }

    const roomExists = await bookingRepository.findRoom(roomId)
    console.log(roomExists)

    if(roomExists === null) throw notFoundError();

    if(roomExists.capacity === 0) throw cannotBooking();
   
    const booking = await bookingRepository.insertBooking(userId,roomId )
    return booking;
  }


  async function getBooking(userId:number) {
    const bookingExists = await bookingRepository.findBooking(userId)
    console.log(bookingExists)
    if(bookingExists === null) throw notFoundError();

    const booking = {
      id: bookingExists.id,
      Room: {
        id: bookingExists.Room.id,
        name: bookingExists.Room.name,
        capacity: bookingExists.Room.capacity,
        hotelId: bookingExists.Room.hotelId,
        createdAt: bookingExists.Room.createdAt.toISOString(),
        updatedAt: bookingExists.Room.updatedAt.toISOString(),
      }
    }

    return booking
  }


async function updateBooking(userId: number, roomId: number, bookingId: number) {

  const bookingExists = await bookingRepository.findBooking(userId)
 
  if(bookingExists === null) throw cannotBooking();

  const roomExists = await bookingRepository.findRoom(roomId)

  if(!roomExists) throw notFoundError();

  if(roomExists.capacity === 0) throw cannotBooking();

  if(roomExists.capacity > 0){
    const updateBooking = await bookingRepository.updateBooking(bookingId,roomId )
    return updateBooking;
  }
  
}


  const bookingService = {
    createBooking,
    getBooking,
    updateBooking
  };



  
  export default bookingService;